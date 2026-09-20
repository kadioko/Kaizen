export interface GoldSpotBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface GoldSpotReference {
  provider: 'Twelve Data';
  market: 'XAU/USD';
  asset_class: 'spot_reference';
  price: number;
  as_of: string;
  fetched_at: string;
  freshness_seconds: number;
  freshness: 'RECENT_BAR' | 'STALE';
  bars: GoldSpotBar[];
  limitations: string[];
}

export function referenceAge(asOf: string, now = Date.now()) {
  const age = (now - Date.parse(asOf)) / 1000;
  return Number.isFinite(age) && age >= -5 ? Math.max(0, Math.floor(age)) : Infinity;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid reference data.');
  return value as Record<string, unknown>;
}

export function parseGoldSeries(payload: unknown, now = Date.now()): GoldSpotReference {
  const data = record(payload);
  const meta = record(data.meta);
  // The request fixes output timestamps to UTC. exchange_timezone describes the venue, not necessarily the output zone.
  if (data.status !== 'ok' || meta.symbol !== 'XAU/USD' || meta.interval !== '1min') throw new Error('Unexpected reference source.');
  if (!Array.isArray(data.values) || !data.values.length || data.values.length > 30) throw new Error('Missing reference bars.');
  const bars = data.values.map((value): GoldSpotBar => {
    const raw = record(value);
    if (typeof raw.datetime !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw.datetime)) throw new Error('Invalid reference time.');
    const iso = raw.datetime.replace(' ', 'T') + 'Z';
    const time = Date.parse(iso);
    if (!Number.isFinite(time) || new Date(time).toISOString() !== iso.replace('Z', '.000Z') || time > now + 5000) throw new Error('Invalid or future reference time.');
    const number = (key: string) => {
      const value = raw[key];
      if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') throw new Error('Invalid reference price.');
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) throw new Error('Invalid reference price.');
      return parsed;
    };
    const bar = { time: time / 1000, open: number('open'), high: number('high'), low: number('low'), close: number('close') };
    if (bar.low > Math.min(bar.open, bar.close) || bar.high < Math.max(bar.open, bar.close) || bar.low > bar.high) throw new Error('Inconsistent reference OHLC.');
    return bar;
  }).sort((a, b) => a.time - b.time);
  if (new Set(bars.map((bar) => bar.time)).size !== bars.length) throw new Error('Duplicate reference timestamps.');
  const latest = bars[bars.length - 1];
  const asOf = new Date(latest.time * 1000).toISOString();
  const age = referenceAge(asOf, now);
  return {
    provider: 'Twelve Data', market: 'XAU/USD', asset_class: 'spot_reference',
    price: latest.close, as_of: asOf, fetched_at: new Date(now).toISOString(),
    freshness_seconds: age, freshness: age <= 180 ? 'RECENT_BAR' : 'STALE', bars,
    limitations: [
      'Latest provider-reported one-minute bar close. This is XAU/USD spot, not a GC/MGC futures quote.',
      'The timestamp is the bar start; the bar may still be forming. A recent timestamp does not verify exchange activity or an executable price.',
      'Market hours, provider delay and plan limits affect availability. No order flow or setup is derived from this reference.',
    ],
  };
}

export class ReferenceUnavailable extends Error {
  retrySeconds: number;
  constructor(message: string, retrySeconds = 120) { super(message); this.retrySeconds = retrySeconds; }
}

export async function getGoldSpotReference(signal?: AbortSignal): Promise<GoldSpotReference> {
  const response = await fetch('/api/reference/gold', { cache: 'no-store', signal });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ReferenceUnavailable(data.code === 'PROVIDER_QUOTA' ? 'Provider API allowance exhausted. Waiting for credits to reset.' : 'Gold spot reference is temporarily unavailable.', data.code === 'PROVIDER_QUOTA' ? 1800 : 120);
  }
  return response.json() as Promise<GoldSpotReference>;
}
