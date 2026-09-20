// Deployment-local mirror of the public market snapshot contract. The canonical
// cross-client package remains in packages/shared-types for API integrations.
export type Direction = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type Strength = 'WEAK' | 'MODERATE' | 'STRONG';
export type WarRoomState = 'SCANNING' | 'LEVEL_APPROACHING' | 'LIQUIDITY_EVENT' | 'PRESSURE_SHIFT' | 'SETUP_FORMING' | 'CONFIRMING' | 'CONFIRMED' | 'IN_PLAY' | 'INVALIDATED' | 'COMPLETED';

export interface LayerState {
  direction: Direction;
  score: number;
  strength: Strength;
  summary: string;
  evidence: Record<string, unknown>;
}

export interface OrderFlowBucket {
  start: string;
  timeframe: '1m' | '5m';
  buy_volume: number;
  sell_volume: number;
  total_volume: number;
  delta: number;
  delta_change: number;
  cumulative_delta: number;
  buy_percentage: number;
  sell_percentage: number;
  volume_acceleration: number;
}

export interface MarketLevel {
  id: string;
  type: string;
  price: number;
  strength: Strength;
  touches: number;
  last_interaction?: string;
}

export interface WarRoomEvent {
  id: string;
  timestamp: string;
  instrument: string;
  category: string;
  severity: 'INFO' | 'WATCH' | 'HIGH';
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  state_before: WarRoomState;
  state_after: WarRoomState;
}

export interface MacroFactor {
  name: string;
  current_state: string;
  directional_effect: Direction;
  score: number;
  updated_at: string;
  source: string;
}

export interface MarketSnapshot {
  source?: { mode: 'simulated' | 'live' | 'delayed' | 'unknown'; provider: string; clock: 'simulated' | 'wall' };
  instrument: { symbol: string; name: string; tick_size: number; point_value: number; exchange: string };
  timestamp: string;
  price: number;
  change: number;
  scenario: string;
  war_room_state: WarRoomState;
  macro: LayerState & { factors?: MacroFactor[] };
  structure: LayerState;
  order_flow: LayerState;
  liquidity: LayerState;
  alignment: LayerState & { state: string };
  order_flow_buckets: OrderFlowBucket[];
  levels: MarketLevel[];
  events: WarRoomEvent[];
  bars: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>;
  setup?: { id: string; direction: Direction; entry_reference: number; invalidation: number; target1: number; target2: number; status: string };
}
