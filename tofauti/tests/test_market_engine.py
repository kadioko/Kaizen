from datetime import UTC, datetime

import asyncio
import pytest
from datetime import timedelta

from tofauti_market_engine.engines import AlignmentEngine, LiquidityEngine, MacroEngine, OrderFlowEngine, StructureEngine
from tofauti_market_engine.models import DemoScenario, Direction, LayerState, Setup, Strength, WarRoomState
from tofauti_market_engine.outcomes import evaluate_setup_outcome
from tofauti_market_engine.providers import MockMacroDataProvider, MockMarketDataProvider
from tofauti_market_engine.runtime import WarRoomRuntime


def build_ticks(scenario=DemoScenario.BEARISH_LIQUIDITY_SWEEP, count=8):
    provider = MockMarketDataProvider(scenario)
    return [provider.next_tick() for _ in range(count)]


def test_delta_calculation_retains_raw_components():
    buckets, state = OrderFlowEngine().build(build_ticks())
    latest = buckets[-1]
    assert latest.delta == latest.buy_volume - latest.sell_volume
    assert latest.buy_percentage + latest.sell_percentage == 100
    assert state.evidence["latest_delta"] == latest.delta


def test_macro_score_is_explainable():
    factors = asyncio.run(MockMacroDataProvider().current_factors(DemoScenario.BEARISH_LIQUIDITY_SWEEP))
    macro = MacroEngine().build(factors)
    assert macro.direction == Direction.BEARISH
    assert set(macro.evidence["factor_scores"]) == {"USD", "Real yields", "Risk sentiment", "Inflation", "Central-bank demand"}


def test_alignment_reports_macro_divergence():
    ticks = build_ticks(DemoScenario.MACRO_DIVERGENCE)
    _, flow = OrderFlowEngine().build(ticks)
    structure, _, _ = StructureEngine().build(ticks)
    liquidity, _ = LiquidityEngine().build(ticks, flow)
    macro = MacroEngine().build(asyncio.run(MockMacroDataProvider().current_factors(DemoScenario.MACRO_DIVERGENCE)))
    alignment = AlignmentEngine().build(macro, structure, flow, liquidity)
    assert alignment.state in {"MACRO_DIVERGENCE", "PARTIAL_BULLISH_ALIGNMENT", "MIXED"}
    assert "macro" in alignment.evidence


def test_alignment_flags_price_layers_against_bearish_macro_as_divergence():
    macro = LayerState(direction=Direction.BEARISH, score=-32, strength=Strength.MODERATE, summary="Mock macro")
    structure = LayerState(direction=Direction.BULLISH, score=58, strength=Strength.MODERATE, summary="Bullish structure")
    flow = LayerState(direction=Direction.BULLISH, score=66, strength=Strength.STRONG, summary="Bullish flow")
    liquidity = LayerState(direction=Direction.NEUTRAL, score=0, strength=Strength.WEAK, summary="No sweep")

    alignment = AlignmentEngine().build(macro, structure, flow, liquidity)

    assert alignment.state == "MACRO_DIVERGENCE"
    assert alignment.direction == Direction.BULLISH
    assert alignment.strength == Strength.WEAK


def test_liquidity_engine_detects_bearish_sweep_with_evidence():
    ticks = build_ticks(count=7)
    _, flow = OrderFlowEngine().build(ticks)
    state, events = LiquidityEngine().build(ticks, flow)
    assert state.direction == Direction.BEARISH
    assert events[0].kind == "BUY_SIDE_LIQUIDITY_SWEPT"
    assert events[0].evidence["returned_inside"] is True


def test_state_machine_reaches_confirmed_in_bearish_demo():
    runtime = WarRoomRuntime()
    async def run_steps():
        for _ in range(11):
            latest = await runtime.step()
        return latest
    snapshot = asyncio.run(run_steps())
    assert snapshot.war_room_state in {WarRoomState.CONFIRMED, WarRoomState.IN_PLAY}
    assert snapshot.setup is not None


def test_runtime_serializes_demo_reset_and_snapshot_updates():
    runtime = WarRoomRuntime()

    async def run_updates():
        await asyncio.gather(runtime.set_scenario(DemoScenario.BEARISH_LIQUIDITY_SWEEP), runtime.step())
        for _ in range(11):
            snapshot = await runtime.step()
        return snapshot

    snapshot = asyncio.run(run_updates())
    assert snapshot.war_room_state in {WarRoomState.CONFIRMED, WarRoomState.IN_PLAY}
    assert snapshot.setup is not None
    assert runtime.setup_records == [snapshot.setup]


def test_bullish_reversal_can_confirm_and_complete():
    runtime = WarRoomRuntime(DemoScenario.BULLISH_REVERSAL)

    async def run_steps():
        for _ in range(20):
            snapshot = await runtime.step()
        return snapshot

    snapshot = asyncio.run(run_steps())
    assert snapshot.setup is not None
    assert snapshot.setup.direction == Direction.BULLISH
    assert snapshot.war_room_state in {WarRoomState.IN_PLAY, WarRoomState.COMPLETED}


def test_in_play_setup_can_be_invalidated():
    machine = WarRoomRuntime().state_machine
    machine.state = WarRoomState.IN_PLAY
    setup = Setup(
        id="GC-invalid", instrument="GC", direction=Direction.BEARISH, timestamp=datetime.now(UTC),
        entry_reference=3350, invalidation=3352, target1=3345, target2=3342,
        alignment_state="FULL_BEARISH_ALIGNMENT", macro_score=-40, structure_score=-50,
        orderflow_score=-70, liquidity_score=-72, snapshot={},
    )
    event = machine.resolve_setup(setup, 3352.1, datetime.now(UTC))
    assert event is not None
    assert event.state_after == WarRoomState.INVALIDATED


def test_runtime_sends_complete_snapshot_record_to_repository():
    class RecordingRepository:
        def __init__(self):
            self.instruments = []
            self.records = []

        async def initialize(self, instruments):
            self.instruments = instruments

        async def persist(self, **record):
            self.records.append(record)

    repository = RecordingRepository()
    runtime = WarRoomRuntime(repository=repository)

    async def run_runtime():
        await runtime.start()
        await runtime.step()
        await runtime.stop()

    asyncio.run(run_runtime())
    assert [instrument.symbol for instrument in repository.instruments] == ["GC", "MGC"]
    assert repository.records
    stored = repository.records[-1]
    assert stored["tick"].symbol == "GC"
    assert stored["snapshot"].instrument.symbol == "GC"
    assert "bars" in stored and "buckets" in stored and "macro" in stored


def test_setup_outcome_uses_observed_prices_not_probability():
    setup = Setup(
        id="GC-test", instrument="GC", direction=Direction.BEARISH, timestamp=datetime.now(UTC),
        entry_reference=3350, invalidation=3353, target1=3345, target2=3342,
        alignment_state="FULL_BEARISH_ALIGNMENT", macro_score=-40, structure_score=-50,
        orderflow_score=-70, liquidity_score=-72, snapshot={},
    )
    outcome = evaluate_setup_outcome(setup, [3349.5, 3346.0, 3344.8], 15, datetime.now(UTC))
    assert outcome.target_hit is True
    assert outcome.invalidation_hit is False
    assert outcome.maximum_favorable_excursion == 5.2
    assert outcome.maximum_adverse_excursion == 0


def test_five_minute_buckets_group_by_timestamp_and_keep_session_cumulative():
    ticks = build_ticks(count=12)
    start = datetime(2026, 1, 5, 13, tzinfo=UTC)
    for index, tick in enumerate(ticks):
        tick.timestamp = start + timedelta(minutes=index)
    buckets, _ = OrderFlowEngine().build(ticks, timeframe_minutes=5)
    assert len(buckets) == 3
    assert buckets[0].total_volume == sum(t.volume for t in ticks[:5])
    assert buckets[1].start - buckets[0].start == timedelta(minutes=5)
    assert buckets[-1].cumulative_delta == sum(t.buy_volume - t.sell_volume for t in ticks)
    with pytest.raises(ValueError):
        OrderFlowEngine().build(ticks, timeframe_minutes=3)


def test_full_alignment_requires_all_layers():
    bearish = LayerState(direction=Direction.BEARISH, score=-50, strength=Strength.MODERATE, summary="bearish")
    neutral = LayerState(direction=Direction.NEUTRAL, score=0, strength=Strength.WEAK, summary="unknown")
    engine = AlignmentEngine()
    assert engine.build(bearish, bearish, bearish, neutral).state == "PARTIAL_BEARISH_ALIGNMENT"
    assert engine.build(neutral, bearish, bearish, bearish).state == "MACRO_DIVERGENCE"
    assert engine.build(bearish, bearish, bearish, bearish).state == "FULL_BEARISH_ALIGNMENT"


def test_bars_enclose_open_and_close_and_vwap_matches_evidence():
    state, levels, bars = StructureEngine().build(build_ticks(count=11))
    assert all(bar.low <= min(bar.open, bar.close) <= max(bar.open, bar.close) <= bar.high for bar in bars)
    assert next(level.price for level in levels if level.type == "VWAP") == state.evidence["vwap"]


def test_empty_macro_and_zero_volume_are_safe():
    assert MacroEngine().build([]).direction == Direction.NEUTRAL
    tick = build_ticks(count=1)[0].model_copy(update={"volume": 0, "buy_volume": 0, "sell_volume": 0})
    buckets, state = OrderFlowEngine().build([tick])
    assert buckets[0].delta == 0 and state.score == 0


def test_historical_mock_range_terminates_and_is_reproducible():
    provider = MockMarketDataProvider()
    start = datetime(2020, 1, 1, tzinfo=UTC)
    end = start + timedelta(minutes=100)
    first = asyncio.run(provider.historical("GC", start, end))
    second = asyncio.run(provider.historical("GC", start, end))
    assert first == second
    assert len(first) == 101
    assert all(start <= tick.timestamp <= end for tick in first)
    assert len({tick.timestamp for tick in first}) == len(first)


def test_confirmed_setup_checks_invalidation_without_waiting_for_continuation():
    machine = WarRoomRuntime().state_machine
    machine.state = WarRoomState.CONFIRMED
    setup = Setup(id="test", instrument="GC", direction=Direction.BEARISH, timestamp=datetime.now(UTC),
        entry_reference=3350, invalidation=3352, target1=3348, target2=3345,
        alignment_state="FULL_BEARISH_ALIGNMENT", macro_score=-20, structure_score=-50,
        orderflow_score=-50, liquidity_score=-50, snapshot={})
    assert machine.resolve_setup(setup, 3353, datetime.now(UTC)).state_after == WarRoomState.INVALIDATED


def test_persistence_failure_reports_degraded_and_does_not_stop_stream():
    class BrokenRepository:
        async def persist(self, **kwargs):
            raise RuntimeError("Test failure")
    runtime = WarRoomRuntime(repository=BrokenRepository())
    snapshot = asyncio.run(runtime.step())
    assert snapshot.source["mode"] == "simulated"
    assert runtime.persistence_status == "degraded"
