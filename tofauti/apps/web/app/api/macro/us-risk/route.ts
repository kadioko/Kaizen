import { NextResponse } from 'next/server';
import type { OfficialMacroSchedule } from '@/lib/official-macro';
import { FEDERAL_RESERVE_FOMC_URL, nextUpcomingFomcEvents } from '@/lib/fomc-schedule';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_MS = 6 * 60 * 60_000;
let cached: OfficialMacroSchedule | null = null;
let pending: Promise<OfficialMacroSchedule> | null = null;

async function fetchSchedule(): Promise<OfficialMacroSchedule> {
  const response = await fetch(FEDERAL_RESERVE_FOMC_URL, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'TOFAUTI official macro schedule monitor' },
  });
  if (!response.ok) throw new Error('Federal Reserve calendar unavailable.');
  const events = nextUpcomingFomcEvents(await response.text());
  if (!events.length) throw new Error('No upcoming Federal Reserve events parsed.');
  return {
    source_name: 'Federal Reserve',
    source_url: FEDERAL_RESERVE_FOMC_URL,
    fetched_at: new Date().toISOString(),
    events,
    coverage_note: 'Official FOMC meeting dates only. A licensed economic-calendar provider is required for global events, consensus, and released values.',
    impact_boundary: 'High, medium, and low describe expected volatility sensitivity from the event category or licensed provider importance. They are not a price-direction forecast, trade signal, or probability.',
  };
}

export async function GET() {
  try {
    if (!cached || Date.now() - Date.parse(cached.fetched_at) >= CACHE_MS) {
      pending ??= fetchSchedule().then((value) => { cached = value; return value; }).finally(() => { pending = null; });
      await pending;
    }
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600' } });
  } catch {
    return NextResponse.json({ error: 'Official macro schedule is temporarily unavailable.', code: 'UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '900' } });
  }
}
