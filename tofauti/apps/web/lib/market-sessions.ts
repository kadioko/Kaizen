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
}

export const MARKET_SESSIONS: MarketSessionDefinition[] = [
  { id: 'sydney', label: 'Sydney', city: 'Sydney', timeZone: 'Australia/Sydney', startHour: 8, endHour: 17 },
  { id: 'tokyo', label: 'Tokyo', city: 'Tokyo', timeZone: 'Asia/Tokyo', startHour: 9, endHour: 18 },
  { id: 'london', label: 'London', city: 'London', timeZone: 'Europe/London', startHour: 8, endHour: 17 },
  { id: 'new-york', label: 'New York', city: 'New York', timeZone: 'America/New_York', startHour: 8, endHour: 17 },
];

const weekendDays = new Set(['Sat', 'Sun']);

function partsAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return { weekday: value('weekday'), hour: Number(value('hour')), minute: Number(value('minute')), zoneName: value('timeZoneName') };
}

function isWithinWindow(hour: number, startHour: number, endHour: number) {
  return startHour < endHour
    ? hour >= startHour && hour < endHour
    : hour >= startHour || hour < endHour;
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
    };
  });
}

export function describeActiveSessions(statuses: MarketSessionStatus[]) {
  const active = statuses.filter((status) => status.active).map((status) => status.label);
  if (!active.length) return 'No defined regional session windows are active';
  if (active.length === 1) return `${active[0]} session active`;
  return `${active.join(' / ')} overlap active`;
}
