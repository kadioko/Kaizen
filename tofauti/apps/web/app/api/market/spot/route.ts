import { NextRequest, NextResponse } from 'next/server';
import { isLiveSpotSymbol, parseLiveSpotSeries, liveSpotAge, type LiveSpotMarket, type LiveSpotSymbol } from '@/lib/live-spot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_MS = 300_000;
const records = new Map<LiveSpotSymbol, LiveSpotMarket>();
const retryAfter = new Map<LiveSpotSymbol, number>();
const pending = new Map<LiveSpotSymbol, Promise<LiveSpotMarket>>();

async function fetchSpotMarket(apiKey: string, market: LiveSpotSymbol) {
  const query = new URLSearchParams({ symbol: market, apikey: apiKey, interval: '1min', outputsize: '60', timezone: 'UTC' });
  const response = await fetch(`https://api.twelvedata.com/time_series?${query}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  const payload = await response.json().catch(() => null);
  if (response.status === 429 || payload?.code === 429) {
    const quotaError = new Error('Provider quota exhausted.');
    quotaError.name = 'ProviderQuotaError';
    throw quotaError;
  }
  if (!response.ok) throw new Error('Spot reference unavailable.');
  return parseLiveSpotSeries(payload, market);
}

export async function GET(request: NextRequest) {
  const requestedMarket = request.nextUrl.searchParams.get('symbol') ?? '';
  if (!isLiveSpotSymbol(requestedMarket)) {
    return NextResponse.json({ error: 'Unsupported spot market.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Live spot data is not configured.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  const cached = records.get(requestedMarket);
  try {
    if (!cached || Date.now() - Date.parse(cached.fetched_at) >= CACHE_MS) {
      if (Date.now() < (retryAfter.get(requestedMarket) ?? 0)) throw new Error('Spot reference cooling down.');
      let requestInFlight = pending.get(requestedMarket);
      if (!requestInFlight) {
        requestInFlight = fetchSpotMarket(apiKey, requestedMarket)
          .then((value) => {
            records.set(requestedMarket, value);
            retryAfter.delete(requestedMarket);
            return value;
          })
          .catch((error: Error) => {
            retryAfter.set(requestedMarket, Date.now() + (error.name === 'ProviderQuotaError' ? 30 * 60_000 : CACHE_MS));
            throw error;
          })
          .finally(() => pending.delete(requestedMarket));
        pending.set(requestedMarket, requestInFlight);
      }
      await requestInFlight;
    }

    const market = records.get(requestedMarket)!;
    const freshnessSeconds = liveSpotAge(market.as_of);
    return NextResponse.json({ ...market, freshness_seconds: freshnessSeconds, freshness: freshnessSeconds <= 360 ? 'RECENT_BAR' : 'STALE' }, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300' },
    });
  } catch (error) {
    const quotaLimited = error instanceof Error && error.name === 'ProviderQuotaError';
    return NextResponse.json({
      error: quotaLimited ? 'The spot-data provider has exhausted its API allowance. Waiting for credits to reset.' : 'Live spot data is temporarily unavailable.',
      code: quotaLimited ? 'PROVIDER_QUOTA' : 'UNAVAILABLE',
    }, {
      status: 503,
      headers: { 'Cache-Control': quotaLimited ? 'public, max-age=0, s-maxage=1800' : 'no-store', 'Retry-After': quotaLimited ? '1800' : '300' },
    });
  }
}
