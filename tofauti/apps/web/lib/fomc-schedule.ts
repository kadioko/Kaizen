import type { OfficialMacroEvent } from './official-macro';

export const FEDERAL_RESERVE_FOMC_URL = 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm';

const MONTHS: Record<string, string> = {
  January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
  July: '07', August: '08', September: '09', October: '10', November: '11', December: '12',
};

export function nextUpcomingFomcEvents(html: string, now = new Date()): OfficialMacroEvent[] {
  const sections = [...html.matchAll(/<h4><a id="[^"]+">(\d{4}) FOMC Meetings<\/a><\/h4>/g)];
  const events: OfficialMacroEvent[] = [];
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const section = sections[sectionIndex];
    const year = section[1];
    const start = (section.index ?? 0) + section[0].length;
    const end = sectionIndex + 1 < sections.length ? (sections[sectionIndex + 1].index ?? html.length) : html.length;
    const content = html.slice(start, end);
    const rows = content.matchAll(/fomc-meeting__month[^>]*><strong>([A-Za-z]+)<\/strong>[\s\S]{0,600}?fomc-meeting__date[^>]*>(\d{1,2})-(\d{1,2})(\*)?<\/div>/g);
    for (const row of rows) {
      const month = MONTHS[row[1]];
      if (!month) continue;
      const day = row[2].padStart(2, '0');
      const date = `${year}-${month}-${day}`;
      if (Date.parse(`${date}T23:59:59.999Z`) < now.getTime()) continue;
      const endDay = Number(row[3]);
      events.push({
        id: `fomc-${date}`,
        title: row[4] ? 'FOMC meeting and projections' : 'FOMC meeting',
        date,
        duration_days: Math.max(1, endDay - Number(row[2]) + 1),
        severity: 'HIGH',
        source_name: 'Federal Reserve',
        source_url: FEDERAL_RESERVE_FOMC_URL,
        timing_note: 'Meeting dates are published by the Federal Reserve. Check the official release schedule for statement and press-conference times.',
      });
    }
  }
  return events.sort((left, right) => left.date.localeCompare(right.date)).slice(0, 6);
}
