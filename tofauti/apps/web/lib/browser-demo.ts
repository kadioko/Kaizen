import type { Direction, LayerState, MarketSnapshot, Strength, WarRoomEvent, WarRoomState } from '@/lib/types';

type Scenario = 'bearish_liquidity_sweep' | 'bullish_reversal' | 'mixed' | 'macro_divergence' | 'full_alignment';

const levels = [
  { id: 'supply', type: 'Supply', price: 3351, strength: 'STRONG' as Strength, touches: 3 },
  { id: 'vwap', type: 'VWAP', price: 3347.5, strength: 'MODERATE' as Strength, touches: 6 },
  { id: 'demand', type: 'Demand', price: 3343.5, strength: 'STRONG' as Strength, touches: 2 },
  { id: 'pdh', type: 'Previous day high', price: 3350.5, strength: 'MODERATE' as Strength, touches: 1 },
  { id: 'pdl', type: 'Previous day low', price: 3338, strength: 'MODERATE' as Strength, touches: 1 },
  { id: 'round', type: 'Round number', price: 3350, strength: 'MODERATE' as Strength, touches: 4 },
];

const paths: Record<Scenario, number[]> = {
  bearish_liquidity_sweep: [3347.8, 3348.9, 3350.2, 3352.3, 3351.4, 3349.8, 3348.4, 3347, 3345.8, 3344.7, 3343.9],
  bullish_reversal: [3347, 3345.9, 3344.7, 3343.8, 3344.9, 3346.1, 3347.5, 3348.8, 3350],
  mixed: [3348, 3348.4, 3347.9, 3348.2, 3348.1, 3348.3],
  macro_divergence: [3348, 3349, 3350, 3351, 3351.5, 3350.8],
  full_alignment: [3348, 3347, 3346, 3345, 3344.2, 3343.5],
};

function macroFactors(direction: Direction, now: number) {
  const bearish = direction === 'BEARISH';
  const score = (negative: number, positive: number) => bearish ? negative : direction === 'BULLISH' ? positive : 0;
  return [
    { name: 'USD', current_state: bearish ? 'STRENGTHENING' : direction === 'BULLISH' ? 'SOFTENING' : 'STABLE', directional_effect: score(-42, 30) < 0 ? 'BEARISH' as const : score(-42, 30) > 0 ? 'BULLISH' as const : 'NEUTRAL' as const, score: score(-42, 30), updated_at: new Date(now).toISOString(), source: 'Browser mock macro' },
    { name: 'Real yields', current_state: bearish ? 'RISING' : direction === 'BULLISH' ? 'EASING' : 'STABLE', directional_effect: score(-35, 26) < 0 ? 'BEARISH' as const : score(-35, 26) > 0 ? 'BULLISH' as const : 'NEUTRAL' as const, score: score(-35, 26), updated_at: new Date(now).toISOString(), source: 'Browser mock macro' },
    { name: 'Risk sentiment', current_state: bearish ? 'RISK-ON' : direction === 'BULLISH' ? 'CAUTIOUS' : 'MIXED', directional_effect: score(-18, 18) < 0 ? 'BEARISH' as const : score(-18, 18) > 0 ? 'BULLISH' as const : 'NEUTRAL' as const, score: score(-18, 18), updated_at: new Date(now).toISOString(), source: 'Browser mock macro' },
    { name: 'Inflation', current_state: 'STABLE', directional_effect: 'BULLISH' as const, score: 5, updated_at: new Date(now).toISOString(), source: 'Browser mock macro' },
    { name: 'Central-bank demand', current_state: 'STEADY', directional_effect: 'BULLISH' as const, score: 8, updated_at: new Date(now).toISOString(), source: 'Browser mock macro' },
  ];
}

function layer(direction: Direction, score: number, strength: Strength, summary: string): LayerState {
  return { direction, score, strength, summary, evidence: { source: 'Browser deterministic demo' } };
}

function stateFor(scenario: Scenario, step: number): WarRoomState {
  if (scenario === 'mixed') return 'SCANNING';
  if (scenario === 'bullish_reversal') return step < 4 ? 'LEVEL_APPROACHING' : 'PRESSURE_SHIFT';
  if (scenario === 'macro_divergence') return step < 4 ? 'LEVEL_APPROACHING' : 'SETUP_FORMING';
  if (step < 2) return 'SCANNING';
  if (step < 4) return 'LEVEL_APPROACHING';
  if (step === 4) return 'LIQUIDITY_EVENT';
  if (step === 5) return 'PRESSURE_SHIFT';
  if (step === 6) return 'SETUP_FORMING';
  if (step === 7) return 'CONFIRMED';
  return 'IN_PLAY';
}

function event(id: string, offset: number, title: string, description: string, stateBefore: WarRoomState, stateAfter: WarRoomState, now: number, symbol: string): WarRoomEvent {
  return {
    id, timestamp: new Date(now - offset * 60_000).toISOString(), instrument: symbol, category: 'DEMO', severity: offset < 2 ? 'HIGH' : 'WATCH',
    title, description, evidence: { provider: 'Browser deterministic demo' }, state_before: stateBefore, state_after: stateAfter,
  };
}

function eventsFor(scenario: Scenario, step: number, now: number, symbol: string): WarRoomEvent[] {
  if (scenario === 'mixed') return [];
  if (scenario === 'bullish_reversal') return [event('reversal', 1, 'Buyer response building', 'Simulated sell pressure has faded after demand interaction.', 'LEVEL_APPROACHING', 'PRESSURE_SHIFT', now, symbol)];
  if (scenario === 'macro_divergence') return [event('divergence', 1, 'Macro divergence visible', 'Price layers are constructive while mock macro factors remain negative for gold.', 'LEVEL_APPROACHING', 'SETUP_FORMING', now, symbol)];
  const sequence: Array<[number, string, string, WarRoomState, WarRoomState]> = [
    [1, 'Approaching supply', 'GC is moving into the marked 3351.0 supply and round-number area.', 'SCANNING', 'LEVEL_APPROACHING'],
    [3, 'Buy-side liquidity swept', 'Price traded beyond supply then returned beneath the level with simulated selling pressure.', 'LEVEL_APPROACHING', 'LIQUIDITY_EVENT'],
    [4, 'Seller aggression increasing', 'Negative delta and the recent order-flow sequence show simulated seller pressure.', 'LIQUIDITY_EVENT', 'PRESSURE_SHIFT'],
    [5, 'Full bearish alignment', 'Macro, structure, order flow, and liquidity are aligned bearish in this replay.', 'PRESSURE_SHIFT', 'SETUP_FORMING'],
    [6, 'Bearish setup confirmed', 'Price returned below supply while calculated bearish alignment remained in place.', 'SETUP_FORMING', 'CONFIRMED'],
    [7, 'Continuation in progress', 'The simulated price is continuing away from the confirmed supply rejection.', 'CONFIRMED', 'IN_PLAY'],
  ];
  return sequence.filter(([minimum]) => step >= minimum).map(([minimum, title, description, before, after]) => event(`${symbol.toLowerCase()}-bearish-${minimum}`, step - minimum, title, description, before, after, now, symbol)).reverse();
}

export function browserDemoSnapshot(scenario: Scenario, frame: number, symbol: 'GC' | 'MGC' = 'GC'): MarketSnapshot {
  const path = paths[scenario];
  const step = frame % 75;
  const index = Math.min(step, path.length - 1);
  const terminal = path[path.length - 1];
  const trend = scenario === 'bearish_liquidity_sweep' || scenario === 'full_alignment' ? -0.15 : scenario === 'bullish_reversal' ? 0.15 : 0;
  const price = step > index ? Number((terminal + trend * (step - index)).toFixed(1)) : path[index];
  const isBearish = scenario === 'bearish_liquidity_sweep' || scenario === 'full_alignment';
  const isBullish = scenario === 'bullish_reversal';
  const macroDirection: Direction = scenario === 'macro_divergence' || isBearish ? 'BEARISH' : isBullish ? 'BULLISH' : 'NEUTRAL';
  const marketDirection: Direction = isBullish || scenario === 'macro_divergence' ? 'BULLISH' : isBearish ? 'BEARISH' : 'NEUTRAL';
  const flowDirection: Direction = step < 4 ? 'NEUTRAL' : marketDirection;
  const now = Date.now();
  const recent = path.slice(Math.max(0, index - 4), index + 1);
  const bars = recent.map((close, i) => ({ time: Math.floor((now - (recent.length - i) * 60_000) / 1000), open: i === 0 ? close - 0.2 : recent[i - 1], high: Math.max(close, i === 0 ? close : recent[i - 1]) + 0.3, low: Math.min(close, i === 0 ? close : recent[i - 1]) - 0.3, close, volume: 800 + i * 120 }));
  const buckets = recent.map((close, i) => {
    const delta = flowDirection === 'BEARISH' ? -280 - i * 90 : flowDirection === 'BULLISH' ? 260 + i * 80 : i % 2 ? 20 : -15;
    const buy = flowDirection === 'BEARISH' ? 330 : flowDirection === 'BULLISH' ? 780 : 510;
    const sell = flowDirection === 'BEARISH' ? 920 : flowDirection === 'BULLISH' ? 380 : 500;
    return { start: new Date(now - (recent.length - i) * 300_000).toISOString(), timeframe: '5m' as const, buy_volume: buy, sell_volume: sell, total_volume: buy + sell, delta, delta_change: i === 0 ? 0 : delta - (flowDirection === 'BEARISH' ? -280 - (i - 1) * 90 : flowDirection === 'BULLISH' ? 260 + (i - 1) * 80 : 0), cumulative_delta: delta * (i + 1), buy_percentage: Math.round(buy / (buy + sell) * 100), sell_percentage: Math.round(sell / (buy + sell) * 100), volume_acceleration: i * 8 };
  });
  const state = stateFor(scenario, step);
  const alignmentDirection: Direction = scenario === 'macro_divergence' ? 'NEUTRAL' : marketDirection;
  const alignmentState = scenario === 'macro_divergence' ? 'MACRO_DIVERGENCE' : marketDirection === 'BEARISH' && step >= 6 ? 'FULL_BEARISH_ALIGNMENT' : marketDirection === 'BULLISH' ? 'PARTIAL_BULLISH_ALIGNMENT' : 'MIXED';
  const setup = state === 'CONFIRMED' || state === 'IN_PLAY' ? { id: `${symbol}-DEMO-001`, direction: 'BEARISH' as Direction, entry_reference: 3347, invalidation: 3352.4, target1: 3345, target2: 3342, status: 'CONFIRMED' } : undefined;
  return {
    instrument: { symbol, name: symbol === 'GC' ? 'Gold Futures' : 'Micro Gold Futures', tick_size: 0.1, point_value: symbol === 'GC' ? 100 : 10, exchange: 'COMEX' }, timestamp: new Date(now).toISOString(), price, change: Number((price - path[0]).toFixed(1)), scenario, war_room_state: state,
    macro: { ...layer(macroDirection, macroDirection === 'BEARISH' ? -32 : macroDirection === 'BULLISH' ? 28 : 0, macroDirection === 'NEUTRAL' ? 'WEAK' : 'MODERATE', 'Mock gold macro factors are a transparent demo input.'), factors: macroFactors(macroDirection, now) },
    structure: layer(marketDirection, marketDirection === 'BEARISH' ? -64 : marketDirection === 'BULLISH' ? 58 : 0, marketDirection === 'NEUTRAL' ? 'WEAK' : 'STRONG', 'Price location is measured against marked supply, demand, and VWAP.'),
    order_flow: layer(flowDirection, flowDirection === 'BEARISH' ? -72 : flowDirection === 'BULLISH' ? 66 : 0, flowDirection === 'NEUTRAL' ? 'WEAK' : 'STRONG', 'Simulated aggressive buy/sell volume is aggregated into delta buckets.'),
    liquidity: layer(step >= 4 && isBearish ? 'BEARISH' : 'NEUTRAL', step >= 4 && isBearish ? -70 : 0, step >= 4 && isBearish ? 'STRONG' : 'WEAK', step >= 4 && isBearish ? 'A supply sweep and rejection are visible in the replay.' : 'No completed liquidity event is calculated yet.'),
    alignment: { ...layer(alignmentDirection, alignmentDirection === 'BEARISH' ? -72 : alignmentDirection === 'BULLISH' ? 58 : 0, alignmentDirection === 'NEUTRAL' ? 'MODERATE' : 'STRONG', 'Layer agreement is displayed without probability claims.'), state: alignmentState },
    order_flow_buckets: buckets, levels, events: eventsFor(scenario, step, now, symbol), bars, setup,
  };
}
