import { liveSpotAge, type LiveSpotMarket } from './live-spot.ts';

export type SpotDataState = 'LOADING' | 'RECENT' | 'STALE' | 'OUTSIDE_STANDARD_WEEK' | 'INSUFFICIENT_HISTORY' | 'UNAVAILABLE';

export function isStandardSpotWeek(now: number): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'short', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(now));
  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  if (weekday === 'Sun') return hour >= 17;
  if (weekday === 'Sat') return false;
  if (weekday === 'Fri') return hour < 17;
  return true;
}

export function spotDataState(market: LiveSpotMarket | null, error: string, now: number): SpotDataState {
  if (error) return 'UNAVAILABLE';
  if (!market) return 'LOADING';
  if (liveSpotAge(market.as_of, now) <= 360) return market.bars.length >= 20 ? 'RECENT' : 'INSUFFICIENT_HISTORY';
  return isStandardSpotWeek(now) ? 'STALE' : 'OUTSIDE_STANDARD_WEEK';
}

export function canCalculateCurrentState(market: LiveSpotMarket | null, error: string, now: number) {
  return spotDataState(market, error, now) === 'RECENT';
}
