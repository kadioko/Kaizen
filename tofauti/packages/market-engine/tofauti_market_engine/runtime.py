from __future__ import annotations

import asyncio
from collections import deque
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from typing import Any

from .engines import AlignmentEngine, LiquidityEngine, MacroEngine, OrderFlowEngine, StructureEngine
from .models import (
    AlignmentState,
    DemoScenario,
    Direction,
    Instrument,
    MarketSnapshot,
    Setup,
    Strength,
    WarRoomEvent,
    WarRoomState,
)
from .outcomes import evaluate_setup_outcome
from .providers import MockMacroDataProvider, MockMarketDataProvider

SnapshotCallback = Callable[[MarketSnapshot], Awaitable[None]]


class WarRoomStateMachine:
    """Maps calculated evidence to operational states; it never creates a signal by itself."""

    def __init__(self, instrument: str) -> None:
        self.instrument = instrument
        self.state = WarRoomState.SCANNING
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

    def advance(self, price: float, flow_score: int, liquidity, alignment: AlignmentState, timestamp: datetime) -> WarRoomEvent | None:
        if self.state == WarRoomState.SCANNING and price >= 3349.5:
            return self.transition(WarRoomState.LEVEL_APPROACHING, "Approaching supply", "GC is moving into the marked 3351.0 supply and round-number area.", "STRUCTURE", "WATCH", {"supply": 3351.0, "price": price}, timestamp)
        if liquidity.direction != Direction.NEUTRAL and self.state in {WarRoomState.SCANNING, WarRoomState.LEVEL_APPROACHING}:
            return self.transition(WarRoomState.LIQUIDITY_EVENT, "Buy-side liquidity swept" if liquidity.direction == Direction.BEARISH else "Sell-side liquidity swept", liquidity.summary, "LIQUIDITY", "HIGH", liquidity.evidence, timestamp)
        if flow_score <= -35 and self.state == WarRoomState.LIQUIDITY_EVENT:
            return self.transition(WarRoomState.PRESSURE_SHIFT, "Seller aggression increasing", "Negative delta and the recent order-flow sequence now show seller pressure.", "ORDER_FLOW", "HIGH", {"orderflow_score": flow_score}, timestamp)
        if alignment.state == "FULL_BEARISH_ALIGNMENT" and self.state == WarRoomState.PRESSURE_SHIFT:
            return self.transition(WarRoomState.SETUP_FORMING, "Full bearish alignment", "Macro, structure, order flow, and liquidity are aligned bearish in this simulation.", "ALIGNMENT", "HIGH", alignment.evidence, timestamp)
        if alignment.state == "FULL_BEARISH_ALIGNMENT" and self.state == WarRoomState.SETUP_FORMING and price < 3349.0:
            return self.transition(WarRoomState.CONFIRMED, "Bearish setup confirmed", "Price has returned below supply while calculated bearish alignment remains in place.", "SETUP", "HIGH", {"price": price, **alignment.evidence}, timestamp)
        if self.state == WarRoomState.CONFIRMED and price < 3346.0:
            return self.transition(WarRoomState.IN_PLAY, "Continuation in progress", "The simulated price is continuing away from the confirmed supply rejection.", "SETUP", "WATCH", {"price": price}, timestamp)
        return None


class WarRoomRuntime:
    def __init__(self, scenario: DemoScenario = DemoScenario.BEARISH_LIQUIDITY_SWEEP) -> None:
        self.instrument = Instrument(symbol="GC", name="Gold Futures", tick_size=0.1, point_value=100, exchange="COMEX")
        self.micro_instrument = Instrument(symbol="MGC", name="Micro Gold Futures", tick_size=0.1, point_value=10, exchange="COMEX")
        self.provider = MockMarketDataProvider(scenario)
        self.macro_provider = MockMacroDataProvider()
        self.flow_engine = OrderFlowEngine()
        self.structure_engine = StructureEngine()
        self.liquidity_engine = LiquidityEngine()
        self.macro_engine = MacroEngine()
        self.alignment_engine = AlignmentEngine()
        self.state_machine = WarRoomStateMachine("GC")
        self.ticks = deque(maxlen=48)
        self.snapshot: MarketSnapshot | None = None
        self.setup: Setup | None = None
        self.setup_outcomes = []
        self.setup_records: list[Setup] = []
        self.setup_outcomes_by_id: dict[str, list] = {}
        self._setup_prices: list[float] = []
        self._subscribers: set[SnapshotCallback] = set()
        self._task: asyncio.Task | None = None
        # HTTP demo resets, the worker loop, and WebSocket subscribers share this
        # state. One update at a time keeps a snapshot and its setup consistent.
        self._step_lock = asyncio.Lock()
        self._running = False

    async def start(self) -> None:
        await self.provider.connect()
        await self.provider.subscribe("GC")
        self._running = True
        self._task = asyncio.create_task(self._run(), name="tofauti-demo-worker")

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
        async with self._step_lock:
            self.provider.set_scenario(scenario)
            self.ticks.clear()
            self.setup = None
            self.setup_outcomes = []
            self.setup_records = []
            self.setup_outcomes_by_id = {}
            self._setup_prices = []
            self.state_machine = WarRoomStateMachine("GC")
            await self._step_locked()

    async def _run(self) -> None:
        while self._running:
            await self.step()
            await asyncio.sleep(0.85)

    async def step(self) -> MarketSnapshot:
        async with self._step_lock:
            return await self._step_locked()

    async def _step_locked(self) -> MarketSnapshot:
        tick = self.provider.next_tick("GC")
        if self.provider.cycle_started:
            # Preserve stored setups while beginning a clean simulated session.
            self.ticks.clear()
            self.setup = None
            self.setup_outcomes = []
            self._setup_prices = []
            self.state_machine = WarRoomStateMachine("GC")
        self.ticks.append(tick)
        ticks = list(self.ticks)
        buckets, flow = self.flow_engine.build(ticks)
        structure, levels, bars = self.structure_engine.build(ticks)
        liquidity, _liquidity_events = self.liquidity_engine.build(ticks, flow)
        macro = self.macro_engine.build(await self.macro_provider.current_factors(self.provider.scenario))
        alignment = self.alignment_engine.build(macro, structure, flow, liquidity)
        self.state_machine.advance(tick.price, flow.score, liquidity, alignment, tick.timestamp)

        if self.state_machine.state == WarRoomState.CONFIRMED and self.setup is None:
            self.setup = Setup(
                id=f"GC-{tick.timestamp:%Y%m%d-%H%M}", instrument="GC", direction=Direction.BEARISH,
                timestamp=tick.timestamp, entry_reference=tick.price, invalidation=3352.4, target1=3345.0, target2=3342.0,
                alignment_state=alignment.state, macro_score=macro.score, structure_score=structure.score,
                orderflow_score=flow.score, liquidity_score=liquidity.score,
                snapshot={"price": tick.price, "alignment": alignment.model_dump(), "liquidity": liquidity.model_dump()},
            )
            self.setup_records.append(self.setup)
            self.setup_outcomes_by_id[self.setup.id] = self.setup_outcomes
        elif self.setup is not None:
            # Each demo tick represents a simulated minute. Production will use
            # persisted time-series prices for the same 5/15/30/60m evaluator.
            self._setup_prices.append(tick.price)
            if len(self._setup_prices) in {5, 15, 30, 60}:
                self.setup_outcomes.append(evaluate_setup_outcome(self.setup, self._setup_prices, len(self._setup_prices), tick.timestamp))
        self.snapshot = MarketSnapshot(
            instrument=self.instrument, timestamp=tick.timestamp, price=tick.price,
            change=round(tick.price - ticks[0].price, 2), scenario=self.provider.scenario,
            war_room_state=self.state_machine.state, macro=macro, structure=structure,
            order_flow=flow, liquidity=liquidity, alignment=alignment,
            order_flow_buckets=buckets[-5:], levels=levels, events=list(self.state_machine.events), bars=bars[-30:], setup=self.setup,
        )
        for callback in tuple(self._subscribers):
            await callback(self.snapshot)
        return self.snapshot
