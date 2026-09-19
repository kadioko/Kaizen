import { NextResponse } from 'next/server';
import type { GoldSpotBar, GoldSpotReference } from '@/lib/gold-spot-reference';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_MS = 25_000;
const UPSTREAM_TIMEOUT_MS = 8_000;
let cachedReference: GoldSpotReference | null = null;
let cachedAt = 0;

interface TwelveDataBar {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
}

interface TwelveDataSeries {
  status?: string;
  values?: TwelveDataBar[];
}

interface TwelveDataPrice {
  status?: string;
  price?: string;
}

function numeric(value: string, field: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${field} from price reference provider.`);
  return parsed;
}

function parseUtcTimestamp(value: string) {
  const timestamp = Date.parse(`${value.replace(' ', 'T')}Z`);
  if (!Number.isFinite(timestamp)) throw new Error('Invalid timestamp from price reference provider.');
  return timestamp;
}

function cacheHeaders() {
  return { 'Cache-Control': 'public, s-maxage=25, stale-while-revalidate=30' };
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: cacheHeaders() });
}

export async function GET() {
  if (cachedReference && Date.now() - cachedAt < CACHE_MS) {
    return NextResponse.json(cachedReference, { headers: cacheHeaders() });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return errorResponse('Gold spot reference is not configured.', 503);

  const query = new URLSearchParams({ symbol: 'XAU/USD', apikey: apiKey });
  const barsQuery = new URLSearchParams({ ...Object.fromEntries(query), interval: '1min', outputsize: '30', timezone: 'UTC' });

  try {
    const [priceResponse, barsResponse] = await Promise.all([
      fetch(`https://api.twelvedata.com/price?${query}`, { cache: 'no-store', signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) }),
      fetch(`https://api.twelvedata.com/time_series?${barsQuery}`, { cache: 'no-store', signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) }),
    ]);
    if (!barsResponse.ok) return errorResponse('Gold spot reference is temporarily unavailable.', 502);

    const emptyPrice: TwelveDataPrice = {};
    const [pricePayload, barsPayload] = await Promise.all([
      priceResponse.ok ? priceResponse.json() as Promise<TwelveDataPrice> : Promise.resolve(emptyPrice),
      barsResponse.json() as Promise<TwelveDataSeries>,
    ]);
    if (barsPayload.status === 'error' || !barsPayload.values?.length) return errorResponse('Gold spot reference did not return usable bars.', 502);

    const bars: GoldSpotBar[] = barsPayload.values.map((bar) => ({
      time: Math.floor(parseUtcTimestamp(bar.datetime) / 1_000),
      open: numeric(bar.open, 'open'), high: numeric(bar.high, 'high'), low: numeric(bar.low, 'low'), close: numeric(bar.close, 'close'),
    })).sort((left, right) => left.time - right.time);
    const latest = bars.at(-1);
    if (!latest) return errorResponse('Gold spot reference did not return usable bars.', 502);

    const asOf = new Date(latest.time * 1_000).toISOString();
    const price = pricePayload.status !== 'error' && pricePayload.price ? numeric(pricePayload.price, 'price') : latest.close;
    const reference: GoldSpotReference = {
      provider: 'Twelve Data', market: 'XAU/USD', asset_class: 'spot_reference', price, as_of: asOf,
      fetched_at: new Date().toISOString(), freshness_seconds: Math.max(0, Math.floor((Date.now() - latest.time * 1_000) / 1_000)),
      freshness: Date.now() - latest.time * 1_000 <= 120_000 ? 'CURRENT' : 'STALE', bars,
      limitations: [
        'XAU/USD spot reference only; it is not a COMEX GC or MGC futures quote.',
        'No exchange order flow, bid/ask depth, aggressive-volume classification, or setup confirmation is inferred from this reference.',
        'Provider plan and market hours determine availability and delay. Always inspect the shown source timestamp.',
      ],
    };
    cachedReference = reference;
    cachedAt = Date.now();
    return NextResponse.json(reference, { headers: cacheHeaders() });
  } catch {
    return errorResponse('Gold spot reference is temporarily unavailable.', 502);
  }
}
