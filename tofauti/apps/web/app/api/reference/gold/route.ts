import { NextResponse } from 'next/server';
import { parseGoldSeries, referenceAge, type GoldSpotReference } from '@/lib/gold-spot-reference';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_MS = 120_000;
let cached: GoldSpotReference | null = null;
let retryAfter = 0;
let quotaLimited = false;
let pending: Promise<GoldSpotReference> | null = null;

async function fetchReference(apiKey: string) {
  const query = new URLSearchParams({ symbol: 'XAU/USD', apikey: apiKey, interval: '1min', outputsize: '30', timezone: 'UTC' });
  const response = await fetch(`https://api.twelvedata.com/time_series?${query}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  const payload = await response.json();
  if (response.status === 429 || payload?.code === 429) {
    quotaLimited = true;
    throw new Error('Provider quota exhausted.');
  }
  if (!response.ok) throw new Error('Reference unavailable.');
  const reference = parseGoldSeries(payload);
  quotaLimited = false;
  return reference;
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Gold spot reference is not configured.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  try {
    if (!cached || Date.now() - Date.parse(cached.fetched_at) >= CACHE_MS) {
      if (Date.now() < retryAfter) throw new Error('Reference cooling down.');
      // Coalesce requests in this instance; the CDN also shares successful responses.
      pending ??= fetchReference(apiKey).then((value) => { cached = value; return value; }).catch(() => {
        retryAfter = Date.now() + (quotaLimited ? 30 * 60_000 : CACHE_MS);
        throw new Error('Reference unavailable.');
      }).finally(() => { pending = null; });
      await pending;
    }
    const age = referenceAge(cached!.as_of);
    return NextResponse.json({ ...cached, freshness_seconds: age, freshness: age <= 180 ? 'RECENT_BAR' : 'STALE' }, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=120' },
    });
  } catch {
    return NextResponse.json({ error: quotaLimited ? 'The market-data provider has exhausted its API allowance. Waiting for credits to reset.' : 'Gold spot reference is temporarily unavailable.', code: quotaLimited ? 'PROVIDER_QUOTA' : 'UNAVAILABLE' }, {
      status: 503, headers: { 'Cache-Control': quotaLimited ? 'public, max-age=0, s-maxage=1800' : 'no-store', 'Retry-After': quotaLimited ? '1800' : '120' },
    });
  }
}
