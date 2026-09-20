import type { Direction, LayerState, MarketSnapshot, OrderFlowBucket, Strength, WarRoomEvent, WarRoomState } from './types';

export type Scenario = 'bearish_liquidity_sweep' | 'bullish_reversal' | 'mixed' | 'macro_divergence' | 'full_alignment' | 'invalidation';
const bearish = [3347.8, 3348.9, 3350.2, 3352.3, 3351.4, 3349.8, 3348.4, 3347, 3345.8, 3344.7, 3343.9];
const paths: Record<Scenario, number[]> = {
  bearish_liquidity_sweep: bearish, full_alignment: bearish,
  bullish_reversal: [3347, 3345.9, 3344.7, 3343.2, 3344.9, 3346.1, 3347.5, 3348.8, 3350],
  mixed: [3348, 3348.1, 3348, 3348.1, 3348, 3348.1],
  macro_divergence: [3348, 3349, 3350, 3351, 3351.5, 3350.8],
  invalidation: [...bearish, 3345, 3347, 3350, 3353],
};
const START = Date.UTC(2026, 0, 5, 13);
const round = (value: number) => Math.sign(value) * Math.round(Math.abs(value));
export const strengthFor = (score: number): Strength => Math.abs(score) >= 60 ? 'STRONG' : Math.abs(score) >= 30 ? 'MODERATE' : 'WEAK';
export const directionFor = (score: number): Direction => score >= 12 ? 'BULLISH' : score <= -12 ? 'BEARISH' : 'NEUTRAL';

function layer(raw: number, summary: string, evidence: Record<string, unknown> = {}): LayerState {
  const score = round(Math.max(-100, Math.min(100, raw)));
  return { direction: directionFor(score), score, strength: strengthFor(score), summary, evidence };
}

export function alignmentFor(macro: LayerState, structure: LayerState, flow: LayerState, liquidity: LayerState): LayerState & { state: string } {
  const layers = [macro, structure, flow, liquidity];
  const bearish = layers.filter((value) => value.direction === 'BEARISH').length;
  const bullish = layers.filter((value) => value.direction === 'BULLISH').length;
  const priceAgrees = structure.direction !== 'NEUTRAL' && structure.direction === flow.direction;
  const state = bearish === 4 ? 'FULL_BEARISH_ALIGNMENT' : bullish === 4 ? 'FULL_BULLISH_ALIGNMENT'
    : priceAgrees && macro.direction !== structure.direction ? 'MACRO_DIVERGENCE'
    : structure.direction !== 'NEUTRAL' && macro.direction === structure.direction && flow.direction !== structure.direction ? 'ORDERFLOW_DIVERGENCE'
    : bearish >= 2 && bullish >= 2 ? 'MIXED'
    : bearish >= 2 ? 'PARTIAL_BEARISH_ALIGNMENT' : bullish >= 2 ? 'PARTIAL_BULLISH_ALIGNMENT'
    : layers.every((value) => value.direction === 'NEUTRAL') ? 'NEUTRAL' : 'MIXED';
  return { ...layer(layers.reduce((sum, value) => sum + value.score, 0) / 4,
    state.replaceAll('_', ' ') + ' from four simulated layers; strength is not a win probability.',
    { macro: macro.score, structure: structure.score, order_flow: flow.score, liquidity: liquidity.score }), state };
}

export function browserDemoSnapshot(scenario: Scenario, frame: number, symbol: 'GC' | 'MGC' = 'GC'): MarketSnapshot {
  const step = Math.max(0, Math.floor(frame)) % 75;
  const cycle = Math.floor(Math.max(0, frame) / 75);
  const start = START + cycle * 75 * 60_000;
  const path = paths[scenario];
  const trend = scenario === 'bullish_reversal' ? 1 : ['bearish_liquidity_sweep', 'full_alignment'].includes(scenario) ? -1 : 0;
  const bars: MarketSnapshot['bars'] = [];
  const minutes: OrderFlowBucket[] = [];
  const events: WarRoomEvent[] = [];
  let state = 'SCANNING' as WarRoomState;
  let setup: MarketSnapshot['setup'];
  let sweepDirection: Direction = 'NEUTRAL';
  let sweepExtreme = 0;
  let cumulative = 0;
  let snapshot!: MarketSnapshot;

  const macroSign = scenario === 'mixed' ? 0 : scenario === 'bullish_reversal' ? 1 : -1;
  const factors = ['USD', 'Real yields', 'Risk sentiment', 'Inflation', 'Central-bank demand'].map((name, i) => {
    const score = macroSign * [42, 35, 18, 5, 8][i];
    return { name, current_state: 'SIMULATED', directional_effect: directionFor(score), score, updated_at: new Date(start).toISOString(), source: 'Scripted demo factor' };
  });
  const macro = { ...layer(factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length, 'Equal-weight average of scripted macro factors.', { factor_scores: Object.fromEntries(factors.map((factor) => [factor.name, factor.score])) }), factors };

  for (let index = 0; index <= step; index++) {
    const price = Number((path[index] ?? path[path.length - 1] + trend * (index - path.length + 1) * 0.15).toFixed(1));
    const previous = bars.at(-1)?.close ?? price;
    const time = start + index * 60_000;
    // Synthetic volume inputs are deterministic. All reported metrics derive from them.
    const move = price - previous;
    const buy = scenario === 'mixed' ? 500 : move > 0 ? 800 + index * 7 : 320;
    const sell = scenario === 'mixed' ? 500 : move < 0 ? 850 + index * 7 : 320;
    const volume = buy + sell;
    const delta = buy - sell;
    cumulative += delta;
    const last = minutes.at(-1);
    minutes.push({ start: new Date(time).toISOString(), timeframe: '1m', buy_volume: buy, sell_volume: sell, total_volume: volume,
      delta, delta_change: last ? delta - last.delta : 0, cumulative_delta: cumulative,
      buy_percentage: Number((buy / volume * 100).toFixed(1)), sell_percentage: Number((sell / volume * 100).toFixed(1)),
      volume_acceleration: last ? Number(((volume / last.total_volume - 1) * 100).toFixed(1)) : 0 });
    bars.push({ time: time / 1000, open: previous, high: Math.max(price, previous), low: Math.min(price, previous), close: price, volume });
    const vwap = bars.reduce((sum, bar) => sum + bar.close * bar.volume, 0) / bars.reduce((sum, bar) => sum + bar.volume, 0);
    const structure = layer((price - path[0]) * 22 + (price - vwap) * 18, 'Move from replay open and distance from replay VWAP.', { vwap, recent_change: price - path[0] });
    const recent = minutes.slice(-8);
    const averageDelta = recent.reduce((sum, bucket) => sum + Math.abs(bucket.delta), 0) / recent.length;
    const flow = layer(delta / Math.max(averageDelta, 1) * 35 + recent.reduce((sum, bucket) => sum + bucket.delta, 0) / recent.reduce((sum, bucket) => sum + bucket.total_volume, 0) * 70,
      'Pressure from observed synthetic delta and recent net volume.', { latest_delta: delta, cumulative_delta: cumulative, recent_deltas: recent.slice(-3).map((bucket) => bucket.delta) });
    const high = Math.max(...bars.map((bar) => bar.close));
    const low = Math.min(...bars.map((bar) => bar.close));
    if (sweepDirection === 'NEUTRAL' && high > 3351 && price < 3351 && flow.direction === 'BEARISH') { sweepDirection = 'BEARISH'; sweepExtreme = high; }
    if (sweepDirection === 'NEUTRAL' && low < 3343.5 && price > 3343.5 && flow.direction === 'BULLISH') { sweepDirection = 'BULLISH'; sweepExtreme = low; }
    const sweepValid = sweepDirection === 'BEARISH' ? price < 3351 : sweepDirection === 'BULLISH' ? price > 3343.5 : false;
    const liquidity = layer(sweepValid ? sweepDirection === 'BEARISH' ? -72 : 72 : 0,
      sweepValid ? 'Prior sweep remains inside its reclaimed level.' : 'No active, completed sweep and reclaim.',
      sweepValid ? { level: sweepDirection === 'BEARISH' ? 3351 : 3343.5, max_excursion: Math.abs(sweepExtreme - (sweepDirection === 'BEARISH' ? 3351 : 3343.5)), returned_inside: true, delta_after_sweep: delta } : {});
    const alignment = alignmentFor(macro, structure, flow, liquidity);
    const transition = (next: WarRoomState, title: string, description: string) => {
      events.unshift({ id: symbol + '-' + scenario + '-' + cycle + '-' + index, timestamp: new Date(time).toISOString(), instrument: symbol,
        category: 'SIMULATION', severity: next === 'CONFIRMED' || next === 'INVALIDATED' ? 'HIGH' : 'WATCH',
        title, description, evidence: { price, delta, alignment: alignment.state, ...liquidity.evidence }, state_before: state, state_after: next });
      state = next;
    };
    if (setup && !['COMPLETED', 'INVALIDATED'].includes(state)) {
      const sign = setup.direction === 'BULLISH' ? 1 : -1;
      if ((price - setup.invalidation) * sign <= 0) transition('INVALIDATED', 'Setup invalidated', 'Simulated price crossed the recorded invalidation.');
      else if ((price - setup.target2) * sign >= 0) transition('COMPLETED', 'Second target reached', 'Simulated price reached the second reference target.');
      else if (state === 'CONFIRMED' && (price - setup.entry_reference) * sign > 0) transition('IN_PLAY', 'Continuation in progress', 'Observed replay price moved beyond the confirmation reference.');
      setup.status = state;
    } else if (!setup) {
      const full = alignment.state === 'FULL_' + sweepDirection + '_ALIGNMENT';
      if (['SETUP_FORMING', 'CONFIRMING'].includes(state) && !full) transition('PRESSURE_SHIFT', 'Alignment lost', 'Confirmation paused because the four layers no longer agree.');
      else if (state === 'CONFIRMING' && full) {
        transition('CONFIRMED', sweepDirection === 'BULLISH' ? 'Bullish setup confirmed' : 'Bearish setup confirmed', 'Four simulated layers agree after a sweep and reclaim.');
        const sign = sweepDirection === 'BULLISH' ? 1 : -1;
        setup = { id: symbol + '-' + scenario + '-' + cycle, direction: sweepDirection, entry_reference: price, invalidation: Number((sweepExtreme - sign * 0.1).toFixed(1)), target1: Number((price + sign * 2).toFixed(1)), target2: Number((price + sign * 5).toFixed(1)), status: state };
      } else if (state === 'SETUP_FORMING' && full) transition('CONFIRMING', 'Awaiting confirmation', 'The four layers still agree at the next replay observation.');
      else if (state === 'PRESSURE_SHIFT' && full) transition('SETUP_FORMING', 'Full ' + sweepDirection.toLowerCase() + ' alignment', 'All four simulated layers agree.');
      else if (state === 'LIQUIDITY_EVENT' && flow.direction === sweepDirection) transition('PRESSURE_SHIFT', 'Directional pressure increasing', 'Delta agrees with the completed sweep direction.');
      else if (['SCANNING', 'LEVEL_APPROACHING'].includes(state) && sweepValid) transition('LIQUIDITY_EVENT', sweepDirection === 'BEARISH' ? 'Buy-side liquidity swept' : 'Sell-side liquidity swept', 'Price crossed the level and returned inside with matching delta.');
      else if (state === 'SCANNING' && (price >= 3349.5 || price <= 3345)) transition('LEVEL_APPROACHING', price >= 3349.5 ? 'Approaching supply' : 'Approaching demand', 'Replay price is nearing a fixed scenario reference.');
    }
    const buckets: OrderFlowBucket[] = [];
    let totalDelta = 0;
    for (let offset = 0; offset < minutes.length; offset += 5) {
      const group = minutes.slice(offset, offset + 5);
      const buyVolume = group.reduce((sum, bucket) => sum + bucket.buy_volume, 0);
      const sellVolume = group.reduce((sum, bucket) => sum + bucket.sell_volume, 0);
      const total = buyVolume + sellVolume;
      const net = buyVolume - sellVolume;
      totalDelta += net;
      const prior = buckets.at(-1);
      buckets.push({ start: group[0].start, timeframe: '5m', buy_volume: buyVolume, sell_volume: sellVolume, total_volume: total, delta: net,
        delta_change: prior ? net - prior.delta : 0, cumulative_delta: totalDelta, buy_percentage: Number((buyVolume / total * 100).toFixed(1)), sell_percentage: Number((sellVolume / total * 100).toFixed(1)),
        volume_acceleration: prior ? Number(((total / prior.total_volume - 1) * 100).toFixed(1)) : 0 });
    }
    const levels = [
      { id: 'supply', type: 'Supply', price: 3351 }, { id: 'demand', type: 'Demand', price: 3343.5 },
      { id: 'vwap', type: 'VWAP', price: Number(vwap.toFixed(1)) }, { id: 'pdh', type: 'Previous day high (fixture)', price: 3350.5 },
      { id: 'pdl', type: 'Previous day low (fixture)', price: 3338 }, { id: 'round', type: 'Round number', price: 3350 },
    ].map((level) => {
      const touches = bars.filter((bar) => bar.low <= level.price && bar.high >= level.price);
      return { ...level, strength: 'WEAK' as Strength, touches: touches.length, last_interaction: touches.length ? new Date(touches[touches.length - 1].time * 1000).toISOString() : undefined };
    });
    snapshot = { instrument: { symbol, name: symbol === 'GC' ? 'Gold Futures' : 'Micro Gold Futures', tick_size: 0.1, point_value: symbol === 'GC' ? 100 : 10, exchange: 'COMEX' },
      source: { mode: 'simulated', provider: 'Deterministic browser replay', clock: 'simulated' },
      timestamp: new Date(time).toISOString(), price, change: Number((price - path[0]).toFixed(1)), scenario, war_room_state: state,
      macro, structure, order_flow: flow, liquidity, alignment, bars: [...bars], order_flow_buckets: buckets, levels, events: [...events], setup: setup ? { ...setup } : undefined };
  }
  return snapshot;
}
