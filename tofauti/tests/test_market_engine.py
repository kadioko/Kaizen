from datetime import UTC, datetime

import asyncio

from tofauti_market_engine.engines import AlignmentEngine, LiquidityEngine, MacroEngine, OrderFlowEngine, StructureEngine
from tofauti_market_engine.models import DemoScenario, Direction, Setup, WarRoomState
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
