from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class Direction(StrEnum):
    BULLISH = "BULLISH"
    BEARISH = "BEARISH"
    NEUTRAL = "NEUTRAL"


class Strength(StrEnum):
    WEAK = "WEAK"
    MODERATE = "MODERATE"
    STRONG = "STRONG"


class WarRoomState(StrEnum):
    SCANNING = "SCANNING"
    LEVEL_APPROACHING = "LEVEL_APPROACHING"
    LIQUIDITY_EVENT = "LIQUIDITY_EVENT"
    PRESSURE_SHIFT = "PRESSURE_SHIFT"
    SETUP_FORMING = "SETUP_FORMING"
    CONFIRMING = "CONFIRMING"
    CONFIRMED = "CONFIRMED"
    IN_PLAY = "IN_PLAY"
    INVALIDATED = "INVALIDATED"
    COMPLETED = "COMPLETED"


class DemoScenario(StrEnum):
    BEARISH_LIQUIDITY_SWEEP = "bearish_liquidity_sweep"
    BULLISH_REVERSAL = "bullish_reversal"
    MIXED = "mixed"
    MACRO_DIVERGENCE = "macro_divergence"
    FULL_ALIGNMENT = "full_alignment"


class Instrument(BaseModel):
    symbol: str
    name: str
    asset_class: str = "future"
    tick_size: float
    point_value: float
    exchange: str
    enabled: bool = True


class MarketTick(BaseModel):
    timestamp: datetime
    symbol: str
    price: float
    bid: float
    ask: float
    volume: int
    aggressive_side: Direction
    buy_volume: int
    sell_volume: int


class Trade(BaseModel):
    timestamp: datetime
    symbol: str
    price: float
    size: int
    aggressive_side: Direction


class OHLCVBar(BaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: int


class OrderFlowBucket(BaseModel):
    start: datetime
    timeframe: str
    buy_volume: int
    sell_volume: int
    total_volume: int
    delta: int
    delta_change: int
    cumulative_delta: int
    buy_percentage: float
    sell_percentage: float
    volume_acceleration: float


class MarketLevel(BaseModel):
    id: str
    type: str
    price: float
    strength: Strength
    touches: int = 0
    last_interaction: datetime | None = None


class LiquidityEvent(BaseModel):
    id: str
    timestamp: datetime
    kind: str
    direction: Direction
    level: float
    evidence: dict[str, Any]


class MacroFactor(BaseModel):
    name: str
    current_state: str
    directional_effect: Direction
    score: int = Field(ge=-100, le=100)
    updated_at: datetime
    source: str


class LayerState(BaseModel):
    direction: Direction
    score: int = Field(ge=-100, le=100)
    strength: Strength
    summary: str
    evidence: dict[str, Any] = Field(default_factory=dict)


class StructureState(LayerState):
    pass


class OrderFlowState(LayerState):
    pass


class LiquidityState(LayerState):
    pass


class MacroState(LayerState):
    factors: list[MacroFactor]


class AlignmentState(LayerState):
    state: str


class WarRoomEvent(BaseModel):
    id: str
    timestamp: datetime
    instrument: str
    category: str
    severity: str
    title: str
    description: str
    evidence: dict[str, Any]
    state_before: WarRoomState
    state_after: WarRoomState


class Setup(BaseModel):
    id: str
    instrument: str
    direction: Direction
    timestamp: datetime
    entry_reference: float
    invalidation: float
    target1: float
    target2: float
    alignment_state: str
    macro_score: int
    structure_score: int
    orderflow_score: int
    liquidity_score: int
    snapshot: dict[str, Any]
    status: str = "CONFIRMED"


class SetupOutcome(BaseModel):
    setup_id: str
    evaluated_at: datetime
    horizon_minutes: int
    maximum_favorable_excursion: float
    maximum_adverse_excursion: float
    target_hit: bool
    invalidation_hit: bool
    price_at_horizon: float


class MarketSnapshot(BaseModel):
    instrument: Instrument
    timestamp: datetime
    price: float
    change: float
    scenario: DemoScenario
    war_room_state: WarRoomState
    macro: MacroState
    structure: LayerState
    order_flow: LayerState
    liquidity: LayerState
    alignment: AlignmentState
    order_flow_buckets: list[OrderFlowBucket]
    levels: list[MarketLevel]
    events: list[WarRoomEvent]
    bars: list[OHLCVBar]
    setup: Setup | None = None
