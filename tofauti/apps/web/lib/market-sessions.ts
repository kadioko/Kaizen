export interface MarketSessionDefinition {
  id: 'sydney' | 'tokyo' | 'london' | 'new-york';
  label: string;
  city: string;
  timeZone: string;
  startHour: number;
  endHour: number;
}

export interface MarketSessionStatus extends MarketSessionDefinition {
  active: boolean;
  localTime: string;
  localWeekday: string;
  windowLabel: string;
  transitionAt: Date;
  transitionLabel: 'Opens in' | 'Closes in';
  transitionCountdown: string;
}

export const MARKET_SESSIONS: MarketSessionDefinition[] = [
  { id: 'sydney', label: 'Sydney', city: 'Sydney', timeZone: 'Australia/Sydney', startHour: 8, endHour: 17 },
  { id: 'tokyo', label: 'Tokyo', city: 'Tokyo', timeZone: 'Asia/Tokyo', startHour: 9, endHour: 18 },
  { id: 'london', label: 'London', city: 'London', timeZone: 'Europe/London', startHour: 8, endHour: 17 },
  { id: 'new-york', label: 'New York', city: 'New York', timeZone: 'America/New_York', startHour: 8, endHour: 17 },
];

const weekendDays = new Set(['Sat', 'Sun']);

interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  weekday: string;
  hour: number;
  minute: number;
  zoneName: string;
}

function partsAt(date: Date, timeZone: string): LocalDateTimeParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    weekday: value('weekday'),
    hour: Number(value('hour')),
    minute: Number(value('minute')),
    zoneName: value('timeZoneName'),
  };
}

function isWithinWindow(hour: number, startHour: number, endHour: number) {
  return startHour < endHour
    ? hour >= startHour && hour < endHour
    : hour >= startHour || hour < endHour;
}

function offsetMinutesAt(date: Date, timeZone: string) {
  const value = new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  if (value === 'GMT') return 0;
  const match = value.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!match) throw new Error(`Could not determine the UTC offset for ${timeZone}.`);
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '+' ? minutes : -minutes;
}

function calendarDateAfter(local: LocalDateTimeParts, days: number) {
  const date = new Date(Date.UTC(local.year, local.month - 1, local.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function weekdayAt(date: { year: number; month: number; day: number }) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short' })
    .format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
}

function localWallTimeToUtc(date: { year: number; month: number; day: number }, hour: number, timeZone: string) {
  // Session boundaries occur at 08:00 or 17:00 local time, outside ordinary DST switch hours.
  const wallClock = new Date(Date.UTC(date.year, date.month - 1, date.day, hour));
  return new Date(wallClock.getTime() - offsetMinutesAt(wallClock, timeZone) * 60_000);
}

function formatCountdown(now: Date, transitionAt: Date) {
  const totalMinutes = Math.max(0, Math.ceil((transitionAt.getTime() - now.getTime()) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function nextTransition(session: MarketSessionDefinition, local: LocalDateTimeParts, now: Date, active: boolean) {
  const today = { year: local.year, month: local.month, day: local.day };
  if (active) {
    const transitionAt = localWallTimeToUtc(today, session.endHour, session.timeZone);
    return { transitionAt, transitionLabel: 'Closes in' as const, transitionCountdown: formatCountdown(now, transitionAt) };
  }

  const canOpenToday = !weekendDays.has(local.weekday) && local.hour < session.startHour;
  if (canOpenToday) {
    const transitionAt = localWallTimeToUtc(today, session.startHour, session.timeZone);
    return { transitionAt, transitionLabel: 'Opens in' as const, transitionCountdown: formatCountdown(now, transitionAt) };
  }

  for (let days = 1; days <= 7; days += 1) {
    const candidate = calendarDateAfter(local, days);
    if (!weekendDays.has(weekdayAt(candidate))) {
      const transitionAt = localWallTimeToUtc(candidate, session.startHour, session.timeZone);
      return { transitionAt, transitionLabel: 'Opens in' as const, transitionCountdown: formatCountdown(now, transitionAt) };
    }
  }
  throw new Error(`Could not find the next opening for ${session.label}.`);
}

export function getMarketSessionStatuses(now = new Date()): MarketSessionStatus[] {
  return MARKET_SESSIONS.map((session) => {
    const local = partsAt(now, session.timeZone);
    const active = !weekendDays.has(local.weekday) && isWithinWindow(local.hour, session.startHour, session.endHour);
    return {
      ...session,
      active,
      localTime: `${String(local.hour).padStart(2, '0')}:${String(local.minute).padStart(2, '0')} ${local.zoneName}`,
      localWeekday: local.weekday,
      windowLabel: `${String(session.startHour).padStart(2, '0')}:00-${String(session.endHour).padStart(2, '0')}:00 local`,
      ...nextTransition(session, local, now, active),
    };
  });
}

export function describeActiveSessions(statuses: MarketSessionStatus[]) {
  const active = statuses.filter((status) => status.active).map((status) => status.label);
  if (!active.length) return 'No defined regional session windows are active';
  if (active.length === 1) return `${active[0]} session active`;
  return `${active.join(' / ')} overlap active`;
}
