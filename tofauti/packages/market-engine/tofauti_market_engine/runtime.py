from __future__ import annotations

import asyncio
import logging
from collections import deque
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Any, Protocol

from .engines import AlignmentEngine, LiquidityEngine, MacroEngine, OrderFlowEngine, StructureEngine, VolumeProfileEngine
from .models import AlignmentState, DemoScenario, Direction, Instrument, LayerState, LiquidityState, MarketSnapshot, MarketTick, Setup, WarRoomEvent, WarRoomState
from .outcomes import evaluate_setup_outcome
from .providers import MacroDataProvider, MarketDataProvider, MockMacroDataProvider, MockMarketDataProvider

SnapshotCallback = Callable[[MarketSnapshot], Awaitable[None]]
logger = logging.getLogger(__name__)


class MarketRepository(Protocol):
    async def initialize(self, instruments: list[Instrument]) -> None: ...

    async def persist(self, *, tick, snapshot, bars, buckets, levels, liquidity_events, macro, volume_profile, events, setup, outcomes) -> None: ...


class WarRoomStateMachine:
    """Maps calculated evidence to state; it never manufactures a market signal."""

    def __init__(self, instrument: str) -> None:
        self.instrument = instrument
        self.state = WarRoomState.SCANNING
        self.direction = Direction.NEUTRAL
        self.events: deque[WarRoomEvent] = deque(maxlen=30)

    def transition(self, target: WarRoomState, title: str, description: str, category: str, severity: str, evidence: dict[str, Any], timestamp: datetime) -> WarRoomEvent | None:
        if target == self.state:
            return None
        event = WarRoomEvent(
            id=f"{self.instrument}-{int(timestamp.timestamp())}-{target.value}",
            timestamp=timestamp,
            instrument=self.instrument,
            category=category,
            severity=severity,
            title=title,
            description=description,
            evidence=evidence,
            state_before=self.state,
            state_after=target,
        )
        self.state = target
        self.events.appendleft(event)
        return event

    def advance(self, price: float, flow: LayerState, liquidity: LiquidityState, alignment: AlignmentState, timestamp: datetime, *, levels=None, live_mode: bool = False) -> WarRoomEvent | None:
        if self.state == WarRoomState.SCANNING:
            if live_mode and levels:
                nearest = min(levels, key=lambda level: abs(level.price - price))
                recent_range = max(level.price for level in levels) - min(level.price for level in levels)
                approach_distance = max(recent_range * 0.08, 0.1)
                if abs(nearest.price - price) <= approach_distance:
                    return self.transition(
                        WarRoomState.LEVEL_APPROACHING,
                        f"Approaching {nearest.type.lower()}",
                        f"Price is within the calculated approach distance of {nearest.type} at {nearest.price}.",
                        "STRUCTURE",
                        "WATCH",
                        {"level": nearest.price, "level_type": nearest.type, "price": price},
                        timestamp,
                    )
            elif price >= 3349.5:
                return self.transition(WarRoomState.LEVEL_APPROACHING, "Approaching supply", "GC is moving into the marked 3351.0 supply and round-number area.", "STRUCTURE", "WATCH", {"supply": 3351.0, "price": price}, timestamp)
            elif price <= 3345.0:
                return self.transition(WarRoomState.LEVEL_APPROACHING, "Approaching demand", "GC is moving into the marked 3343.5 demand area.", "STRUCTURE", "WATCH", {"demand": 3343.5, "price": price}, timestamp)
        if liquidity.direction != Direction.NEUTRAL and self.state in {WarRoomState.SCANNING, WarRoomState.LEVEL_APPROACHING}:
            self.direction = liquidity.direction
            return self.transition(WarRoomState.LIQUIDITY_EVENT, "Buy-side liquidity swept" if liquidity.direction == Direction.BEARISH else "Sell-side liquidity swept", liquidity.summary, "LIQUIDITY", "HIGH", liquidity.evidence, timestamp)
        if self.state == WarRoomState.LIQUIDITY_EVENT and flow.direction == self.direction and abs(flow.score) >= 35:
            title = "Seller aggression increasing" if self.direction == Direction.BEARISH else "Buyer aggression increasing"
            return self.transition(
                WarRoomState.PRESSURE_SHIFT,
                title,
                "Classified trade volume and the recent order-flow sequence support the liquidity event.",
                "ORDER_FLOW",
                "HIGH",
                {"orderflow_score": flow.score, "direction": self.direction.value, "unknown_volume": flow.evidence.get("unknown_volume", 0)},
                timestamp,
            )
        expected_alignment = f"FULL_{self.direction.value}_ALIGNMENT"
        if self.state == WarRoomState.PRESSURE_SHIFT and self.direction != Direction.NEUTRAL and alignment.state == expected_alignment:
            return self.transition(WarRoomState.SETUP_FORMING, f"Full {self.direction.value.lower()} alignment", "All four verified quantitative layers agree. This is a calculated condition, not an instruction to trade.", "ALIGNMENT", "HIGH", alignment.evidence, timestamp)
        if self.state == WarRoomState.SETUP_FORMING and alignment.state == expected_alignment:
            return self.transition(WarRoomState.CONFIRMING, "Awaiting confirmation close", "Alignment is intact; the state machine is waiting for price to hold beyond the calculated rejection reference.", "SETUP", "WATCH", {"price": price, **alignment.evidence}, timestamp)
        reference = liquidity.evidence.get("level")
        confirms_direction = (
            self.direction == Direction.BEARISH and ((live_mode and reference is not None and price < reference) or (not live_mode and price < 3349.0))
        ) or (
            self.direction == Direction.BULLISH and ((live_mode and reference is not None and price > reference) or (not live_mode and price > 3345.0))
        )
        if self.state == WarRoomState.CONFIRMING and confirms_direction and alignment.state == expected_alignment:
            title = "Bearish setup confirmed" if self.direction == Direction.BEARISH else "Bullish setup confirmed"
            return self.transition(WarRoomState.CONFIRMED, title, "Price confirmed beyond the calculated sweep reference while every verified layer remained aligned.", "SETUP", "HIGH", {"price": price, **alignment.evidence}, timestamp)
        if self.state == WarRoomState.CONFIRMED and flow.direction == self.direction:
            return self.transition(WarRoomState.IN_PLAY, "Continuation in progress", "The observed provider price remains in the confirmed calculated direction.", "SETUP", "WATCH", {"price": price, "direction": self.direction.value}, timestamp)
        return None

    def resolve_setup(self, setup: Setup, price: float, timestamp: datetime) -> WarRoomEvent | None:
        if self.state not in {WarRoomState.CONFIRMED, WarRoomState.IN_PLAY}:
            return None
        invalidated = (setup.direction == Direction.BEARISH and price >= setup.invalidation) or (setup.direction == Direction.BULLISH and price <= setup.invalidation)
        completed = (setup.direction == Direction.BEARISH and price <= setup.target2) or (setup.direction == Direction.BULLISH and price >= setup.target2)
        if invalidated:
            return self.transition(WarRoomState.INVALIDATED, "Setup invalidated", "Observed price crossed the recorded invalidation level before the second target was reached.", "SETUP", "HIGH", {"price": price, "invalidation": setup.invalidation}, timestamp)
        if completed:
            return self.transition(WarRoomState.COMPLETED, "Second target reached", "Observed price reached the recorded second target.", "SETUP", "INFO", {"price": price, "target2": setup.target2}, timestamp)
        return None


class WarRoomRuntime:
    """One isolated runtime per contract with a provider-neutral calculation path."""

    def __init__(
        self,
        scenario: DemoScenario = DemoScenario.BEARISH_LIQUIDITY_SWEEP,
        repository: MarketRepository | None = None,
        *,
        instrument: Instrument | None = None,
        provider: MarketDataProvider | None = None,
        macro_provider: MacroDataProvider | None = None,
    ) -> None:
        self.instrument = instrument or Instrument(symbol="GC", name="Gold Futures", tick_size=0.1, point_value=100, exchange="COMEX")
        self.micro_instrument = Instrument(symbol="MGC", name="Micro Gold Futures", tick_size=0.1, point_value=10, exchange="COMEX")
        self.provider = provider or MockMarketDataProvider(scenario)
        self.macro_provider = macro_provider or MockMacroDataProvider(scenario)
        self.flow_engine = OrderFlowEngine()
        self.volume_profile_engine = VolumeProfileEngine()
        self.structure_engine = StructureEngine()
        self.liquidity_engine = LiquidityEngine()
        self.macro_engine = MacroEngine()
        self.alignment_engine = AlignmentEngine()
        self.state_machine = WarRoomStateMachine(self.instrument.symbol)
        self.ticks: deque[MarketTick] = deque(maxlen=500)
        self.snapshot: MarketSnapshot | None = None
        self.setup: Setup | None = None
        self.setup_outcomes = []
        self.setup_records: list[Setup] = []
        self.setup_outcomes_by_id: dict[str, list] = {}
        self._setup_ticks: list[MarketTick] = []
        self._evaluated_outcome_horizons: set[int] = set()
        self._last_persisted_profile_minute: datetime | None = None
        self._subscribers: set[SnapshotCallback] = set()
        self._task: asyncio.Task | None = None
        self.repository = repository
        self.persistence_status = "pending" if repository else "in_memory"
        self._step_lock = asyncio.Lock()
        self._running = False

    @property
    def live_mode(self) -> bool:
        return self.provider.source_metadata().get("mode") == "live"

    async def start(self) -> None:
        await self.provider.connect()
        await self.provider.subscribe(self.instrument.symbol)
        if self.repository:
            await self.repository.initialize([self.instrument])
        self._running = True
        self._task = asyncio.create_task(self._run(), name=f"tofauti-{self.instrument.symbol.lower()}-worker")

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        await self.provider.disconnect()

    def add_subscriber(self, callback: SnapshotCallback) -> None:
        self._subscribers.add(callback)

    def remove_subscriber(self, callback: SnapshotCallback) -> None:
        self._subscribers.discard(callback)

    async def set_scenario(self, scenario: DemoScenario) -> None:
        setter = getattr(self.provider, "set_scenario", None)
        if setter is None:
            raise RuntimeError("Scenario controls are unavailable for live market data.")
        async with self._step_lock:
            setter(scenario)
            macro_setter = getattr(self.macro_provider, "set_scenario", None)
            if macro_setter:
                macro_setter(scenario)
            self.ticks.clear()
            self.setup = None
            self.setup_outcomes = []
            self._setup_ticks = []
            self._evaluated_outcome_horizons.clear()
            self._last_persisted_profile_minute = None
            self.state_machine = WarRoomStateMachine(self.instrument.symbol)
            await self._step_locked(self.provider.next_tick(self.instrument.symbol))

    async def _run(self) -> None:
        try:
            async for tick in self.provider.trades(self.instrument.symbol):
                if not self._running:
                    return
                await self.ingest(tick)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Market stream failed for %s", self.instrument.symbol)

    async def step(self) -> MarketSnapshot:
        """Advance deterministic harnesses once; live providers stream via _run."""
        next_tick = getattr(self.provider, "next_tick", None)
        if next_tick is None:
            raise RuntimeError("Manual stepping is unavailable for live market data.")
        return await self.ingest(next_tick(self.instrument.symbol))

    async def ingest(self, tick: MarketTick) -> MarketSnapshot:
        if tick.symbol != self.instrument.symbol:
            raise ValueError(f"Expected {self.instrument.symbol} tick, received {tick.symbol}.")
        async with self._step_lock:
            return await self._step_locked(tick)

    async def _step_locked(self, tick: MarketTick) -> MarketSnapshot:
        if bool(getattr(self.provider, "cycle_started", False)):
            self.ticks.clear()
            self.setup = None
            self.setup_outcomes = []
            self._setup_ticks = []
            self._evaluated_outcome_horizons.clear()
            self._last_persisted_profile_minute = None
            self.state_machine = WarRoomStateMachine(self.instrument.symbol)
        self.ticks.append(tick)
        ticks = list(self.ticks)
        _, flow = self.flow_engine.build(ticks)
        buckets, _ = self.flow_engine.build(ticks, timeframe_minutes=5)
        volume_profile = self.volume_profile_engine.build(ticks, self.instrument.tick_size)
        structure, levels, bars = self.structure_engine.build(ticks)
        liquidity, liquidity_events = self.liquidity_engine.build(ticks, flow, levels if self.live_mode else None)
        macro = self.macro_engine.build(await self.macro_provider.current_factors())
        alignment = self.alignment_engine.build(macro, structure, flow, liquidity)
        self.state_machine.advance(tick.price, flow, liquidity, alignment, tick.timestamp, levels=levels, live_mode=self.live_mode)

        if self.state_machine.state == WarRoomState.CONFIRMED and self.setup is None:
            self.setup = self._create_setup(tick, ticks, liquidity, alignment, macro, structure, flow)
            self.setup_records.append(self.setup)
            self.setup_outcomes_by_id[self.setup.id] = self.setup_outcomes
            self._setup_ticks = [tick]
            self._evaluated_outcome_horizons.clear()
        elif self.setup is not None:
            self._setup_ticks.append(tick)
            self._record_due_outcomes(tick)
        if self.setup:
            resolution = self.state_machine.resolve_setup(self.setup, tick.price, tick.timestamp)
            if resolution:
                self.setup.status = "INVALIDATED" if resolution.state_after == WarRoomState.INVALIDATED else "COMPLETED"
        source = {**self.provider.source_metadata(), "clock": "provider" if self.live_mode else "simulated"}
        self.snapshot = MarketSnapshot(
            instrument=self.instrument,
            timestamp=tick.timestamp,
            price=tick.price,
            change=round(tick.price - ticks[0].price, 2),
            scenario=getattr(self.provider, "scenario", None),
            source=source,
            war_room_state=self.state_machine.state,
            macro=macro,
            structure=structure,
            order_flow=flow,
            liquidity=liquidity,
            alignment=alignment,
            order_flow_buckets=buckets[-5:],
            levels=levels,
            events=list(self.state_machine.events),
            bars=bars[-30:],
            volume_profile=volume_profile,
            depth_levels=tick.depth_levels,
            setup=self.setup,
        )
        await self._persist(tick, bars, buckets, levels, liquidity_events, macro, volume_profile)
        for callback in tuple(self._subscribers):
            try:
                await callback(self.snapshot)
            except Exception:
                logger.exception("Market subscriber failed")
        return self.snapshot

    def _create_setup(self, tick: MarketTick, ticks: list[MarketTick], liquidity: LiquidityState, alignment: AlignmentState, macro: LayerState, structure: LayerState, flow: LayerState) -> Setup:
        direction = self.state_machine.direction
        is_bullish = direction == Direction.BULLISH
        if self.live_mode:
            average_move = sum(abs(current.price - previous.price) for previous, current in zip(ticks, ticks[1:])) / max(len(ticks) - 1, 1)
            risk = max(average_move * 2, self.instrument.tick_size * 2)
            reference = float(liquidity.evidence.get("level", tick.price))
            invalidation = reference - risk if is_bullish else reference + risk
            target1 = tick.price + risk * 1.5 if is_bullish else tick.price - risk * 1.5
            target2 = tick.price + risk * 3 if is_bullish else tick.price - risk * 3
        else:
            invalidation = 3343.0 if is_bullish else 3352.4
            target1 = tick.price + (2 if is_bullish else -2)
            target2 = tick.price + (5 if is_bullish else -5)
        return Setup(
            id=f"{self.instrument.symbol}-{tick.timestamp:%Y%m%d-%H%M}-{direction.value}-{len(self.setup_records) + 1}",
            instrument=self.instrument.symbol,
            direction=direction,
            timestamp=tick.timestamp,
            entry_reference=tick.price,
            invalidation=round(invalidation, 4),
            target1=round(target1, 4),
            target2=round(target2, 4),
            alignment_state=alignment.state,
            macro_score=macro.score,
            structure_score=structure.score,
            orderflow_score=flow.score,
            liquidity_score=liquidity.score,
            snapshot={"price": tick.price, "alignment": alignment.model_dump(), "liquidity": liquidity.model_dump(), "source": self.provider.source_metadata()},
        )

    def _record_due_outcomes(self, current_tick: MarketTick) -> None:
        """Evaluate on elapsed market time, not on a provider's tick count."""
        if self.setup is None:
            return
        elapsed = current_tick.timestamp - self.setup.timestamp
        for horizon in (5, 15, 30, 60):
            if horizon in self._evaluated_outcome_horizons or elapsed < timedelta(minutes=horizon):
                continue
            prices = [tick.price for tick in self._setup_ticks]
            self.setup_outcomes.append(evaluate_setup_outcome(self.setup, prices, horizon, current_tick.timestamp))
            self._evaluated_outcome_horizons.add(horizon)

    async def _persist(self, tick, bars, buckets, levels, liquidity_events, macro, volume_profile) -> None:
        if not self.repository or not self.snapshot:
            return
        profile_minute = tick.timestamp.replace(second=0, microsecond=0)
        persist_profile = profile_minute != self._last_persisted_profile_minute
        try:
            await self.repository.persist(
                tick=tick,
                snapshot=self.snapshot,
                bars=bars,
                buckets=buckets,
                levels=levels,
                liquidity_events=liquidity_events,
                macro=macro,
                # The raw tick store is the historical source of truth. Profile
                # snapshots are sampled once per minute to avoid N-squared writes.
                volume_profile=volume_profile if persist_profile else [],
                events=list(self.state_machine.events),
                setup=self.setup,
                outcomes=self.setup_outcomes,
            )
            if persist_profile:
                self._last_persisted_profile_minute = profile_minute
            self.persistence_status = "healthy"
        except Exception:
            self.persistence_status = "degraded"
            logger.exception("Could not persist TOFAUTI market snapshot")
