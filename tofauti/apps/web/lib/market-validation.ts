import type { MarketSnapshot } from './types';

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const date = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const directions = ['BULLISH', 'BEARISH', 'NEUTRAL'];
const states = ['SCANNING', 'LEVEL_APPROACHING', 'LIQUIDITY_EVENT', 'PRESSURE_SHIFT', 'SETUP_FORMING', 'CONFIRMING', 'CONFIRMED', 'IN_PLAY', 'INVALIDATED', 'COMPLETED'];

export function parseSnapshot(value: unknown, symbol: string): MarketSnapshot {
  const fail = () => { throw new Error('Market service returned an invalid snapshot.'); };
  if (!object(value) || !object(value.instrument)) return fail();
  if (value.instrument.symbol !== symbol || !['name', 'exchange'].every((key) => typeof value.instrument![key as never] === 'string') || !finite(value.price) || value.price <= 0 || !finite(value.change) || !date(value.timestamp) || typeof value.scenario !== 'string' || !states.includes(String(value.war_room_state))) return fail();
  for (const key of ['macro', 'structure', 'order_flow', 'liquidity', 'alignment']) {
    const layer = value[key];
    if (!object(layer) || !directions.includes(String(layer.direction)) || !finite(layer.score) || Math.abs(layer.score) > 100 || !['WEAK', 'MODERATE', 'STRONG'].includes(String(layer.strength)) || typeof layer.summary !== 'string') return fail();
  }
  if (!object(value.alignment) || typeof value.alignment.state !== 'string') return fail();
  if (!Array.isArray(value.bars) || !Array.isArray(value.levels) || !Array.isArray(value.events) || !Array.isArray(value.order_flow_buckets)) return fail();
  let prior = -Infinity;
  for (const bar of value.bars) {
    if (!object(bar) || !['time', 'open', 'high', 'low', 'close', 'volume'].every((key) => finite(bar[key]))) return fail();
    const b = bar as Record<string, number>;
    if (b.time <= prior || b.low <= 0 || b.volume < 0 || b.low > Math.min(b.open, b.close) || b.high < Math.max(b.open, b.close)) return fail();
    prior = b.time;
  }
  for (const bucket of value.order_flow_buckets) {
    if (!object(bucket) || !date(bucket.start) || !['1m', '5m'].includes(String(bucket.timeframe)) || !['delta', 'delta_change', 'cumulative_delta', 'total_volume', 'buy_volume', 'sell_volume', 'buy_percentage', 'sell_percentage', 'volume_acceleration'].every((key) => finite(bucket[key]))) return fail();
    const b = bucket as Record<string, number>;
    if (b.buy_volume < 0 || b.sell_volume < 0 || b.total_volume !== b.buy_volume + b.sell_volume || b.delta !== b.buy_volume - b.sell_volume) return fail();
  }
  for (const level of value.levels) if (!object(level) || typeof level.id !== 'string' || typeof level.type !== 'string' || !finite(level.price) || !finite(level.touches)) return fail();
  for (const event of value.events) if (!object(event) || !date(event.timestamp) || !['id', 'title', 'description'].every((key) => typeof event[key] === 'string')) return fail();
  if (value.setup != null && (!object(value.setup) || !['entry_reference', 'invalidation', 'target1', 'target2'].every((key) => finite((value.setup as Record<string, unknown>)[key])) || !directions.includes(String(value.setup.direction)))) return fail();
  if (object(value.macro) && value.macro.factors != null && (!Array.isArray(value.macro.factors) || !value.macro.factors.every((factor) => object(factor) && typeof factor.name === 'string' && finite(factor.score)))) return fail();
  return value as unknown as MarketSnapshot;
}

export function sourceLabel(snapshot: MarketSnapshot) {
  if (snapshot.source?.mode === 'simulated') return 'SIMULATED DATA';
  if (snapshot.source?.mode === 'live') return 'PROVIDER-REPORTED LIVE';
  if (snapshot.source?.mode === 'delayed') return 'DELAYED DATA';
  return 'SOURCE UNVERIFIED';
}
