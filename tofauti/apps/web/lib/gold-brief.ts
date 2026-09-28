import { liveSpotAge, type LiveSpotBar, type LiveSpotMarket } from './live-spot.ts';
import type { LivePriceActionAnalysis, LivePriceLevel } from './live-price-action.ts';
import { describeActiveSessions, getMarketSessionStatuses } from './market-sessions.ts';
import type { OfficialMacroSchedule } from './official-macro.ts';

export interface GoldBriefSnapshot {
  version: 1;
  instrument: 'XAU/USD';
  asset_class: 'spot_metal';
  captured_at: string;
  source: { provider: 'Twelve Data'; interval: '1min'; as_of: string; fetched_at: string; bar_count: number };
  price: number;
  latest_bar: LiveSpotBar;
  structure: { direction: string; strength: string; summary: string };
  range: { direction: string; strength: string; summary: string };
  levels: LivePriceLevel[];
  sessions: string;
  scheduled_risk: { title: string; date: string; impact: string; source: string; timing_note: string } | null;
  scheduled_risk_status: 'AVAILABLE' | 'UNAVAILABLE';
  summary: string;
}

export interface GoldBriefRecord {
  id: string;
  user_id: string;
  created_at: string;
  source_as_of: string;
  snapshot: GoldBriefSnapshot;
  scenario: string;
  invalidation_price: number | null;
  post_session_note: string | null;
  review_outcome: 'FOLLOWED_PLAN' | 'CHANGED_PLAN' | 'NO_ACTION' | null;
  reviewed_at: string | null;
}

export function buildGoldBriefSnapshot(market: LiveSpotMarket, analysis: LivePriceActionAnalysis, schedule: OfficialMacroSchedule | null, now = Date.now()): GoldBriefSnapshot {
  if (market.market !== 'XAU/USD' || liveSpotAge(market.as_of, now) > 360) throw new Error('A recent XAU/USD spot bar is required to capture a Gold Brief.');
  const nextEvent = schedule?.events.find((event) => Date.parse(`${event.date}T23:59:59Z`) >= now);
  const levels = [...analysis.levels].sort((left, right) => Math.abs(left.distance) - Math.abs(right.distance)).slice(0, 4);
  return {
    version: 1,
    instrument: 'XAU/USD',
    asset_class: 'spot_metal',
    captured_at: new Date(now).toISOString(),
    source: { provider: market.provider, interval: market.interval, as_of: market.as_of, fetched_at: market.fetched_at, bar_count: market.bars.length },
    price: market.price,
    latest_bar: market.bars.at(-1)!,
    structure: { direction: analysis.structure.direction, strength: analysis.structure.strength, summary: analysis.structure.summary },
    range: { direction: analysis.range_interaction.direction, strength: analysis.range_interaction.strength, summary: analysis.range_interaction.summary },
    levels,
    sessions: describeActiveSessions(getMarketSessionStatuses(new Date(now))),
    scheduled_risk: nextEvent ? { title: nextEvent.title, date: nextEvent.date, impact: nextEvent.expected_volatility_impact, source: nextEvent.source_name, timing_note: nextEvent.timing_note } : null,
    scheduled_risk_status: schedule ? 'AVAILABLE' : 'UNAVAILABLE',
    summary: `${analysis.structure.summary} ${analysis.range_interaction.summary}`,
  };
}
