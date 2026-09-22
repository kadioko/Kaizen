export const LIVE_SPOT_SYMBOLS = ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY'] as const;

export type LiveSpotSymbol = (typeof LIVE_SPOT_SYMBOLS)[number];

export interface LiveSpotBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LiveSpotMarket {
  provider: 'Twelve Data';
  market: LiveSpotSymbol;
  asset_class: 'spot_metal' | 'spot_fx';
  interval: '1min';
  price: number;
  as_of: string;
  fetched_at: string;
  freshness_seconds: number;
  freshness: 'RECENT_BAR' | 'STALE';
  bars: LiveSpotBar[];
  limitations: string[];
}

export class LiveSpotUnavailable extends Error {
  retrySeconds: number;

  constructor(message: string, retrySeconds = 300) {
    super(message);
    this.retrySeconds = retrySeconds;
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid market-data response.');
  return value as Record<string, unknown>;
}

export function isLiveSpotSymbol(value: string): value is LiveSpotSymbol {
  return (LIVE_SPOT_SYMBOLS as readonly string[]).includes(value);
}

export function liveSpotAge(asOf: string, now = Date.now()) {
  const age = (now - Date.parse(asOf)) / 1000;
  return Number.isFinite(age) && age >= -5 ? Math.max(0, Math.floor(age)) : Infinity;
}

export function parseLiveSpotSeries(payload: unknown, market: LiveSpotSymbol, now = Date.now()): LiveSpotMarket {
  const data = record(payload);
  const meta = record(data.meta);
  if (data.status !== 'ok' || meta.symbol !== market || meta.interval !== '1min') throw new Error('Unexpected market-data response.');
  if (!Array.isArray(data.values) || data.values.length < 2 || data.values.length > 60) throw new Error('Missing market bars.');

  const bars = data.values.map((value): LiveSpotBar => {
    const raw = record(value);
    if (typeof raw.datetime !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw.datetime)) throw new Error('Invalid market timestamp.');
    const iso = `${raw.datetime.replace(' ', 'T')}Z`;
    const time = Date.parse(iso);
    if (!Number.isFinite(time) || new Date(time).toISOString() !== iso.replace('Z', '.000Z') || time > now + 5000) throw new Error('Invalid or future market timestamp.');
    const number = (key: string) => {
      const rawValue = raw[key];
      if ((typeof rawValue !== 'string' && typeof rawValue !== 'number') || String(rawValue).trim() === '') throw new Error('Invalid market price.');
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed) || parsed <= 0) throw new Error('Invalid market price.');
      return parsed;
    };
    const bar = { time: time / 1000, open: number('open'), high: number('high'), low: number('low'), close: number('close') };
    if (bar.low > Math.min(bar.open, bar.close) || bar.high < Math.max(bar.open, bar.close) || bar.low > bar.high) throw new Error('Inconsistent market OHLC.');
    return bar;
  }).sort((left, right) => left.time - right.time);

  if (new Set(bars.map((bar) => bar.time)).size !== bars.length) throw new Error('Duplicate market timestamps.');
  const latest = bars[bars.length - 1];
  const asOf = new Date(latest.time * 1000).toISOString();
  const freshnessSeconds = liveSpotAge(asOf, now);
  return {
    provider: 'Twelve Data',
    market,
    asset_class: market === 'XAU/USD' ? 'spot_metal' : 'spot_fx',
    interval: '1min',
    price: latest.close,
    as_of: asOf,
    fetched_at: new Date(now).toISOString(),
    freshness_seconds: freshnessSeconds,
    freshness: freshnessSeconds <= 360 ? 'RECENT_BAR' : 'STALE',
    bars,
    limitations: [
      'Provider-reported one-minute spot bar close. It is not an executable quote and the latest bar may still be forming.',
      'This feed does not contain COMEX futures prices, exchange depth, trade aggressor data, delta, or order flow.',
      'The feed can support transparent spot price-action calculations, but cannot create a probability, a true order-flow conclusion, or a trade instruction.',
    ],
  };
}

export async function getLiveSpotMarket(market: LiveSpotSymbol, signal?: AbortSignal): Promise<LiveSpotMarket> {
  const response = await fetch(`/api/market/spot?symbol=${encodeURIComponent(market)}`, { cache: 'no-store', signal });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const quotaLimited = data.code === 'PROVIDER_QUOTA';
    throw new LiveSpotUnavailable(quotaLimited ? 'The spot-data provider has exhausted its allowance. The last known value is not substituted.' : 'This live spot reference is temporarily unavailable.', quotaLimited ? 1800 : 300);
  }
  return response.json() as Promise<LiveSpotMarket>;
}
