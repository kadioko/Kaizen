'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, CircleAlert, ExternalLink, RefreshCw } from 'lucide-react';
import { getOfficialMacroSchedule, OfficialMacroUnavailable, type OfficialMacroSchedule } from '@/lib/official-macro';

function daysUntil(date: string) {
  const start = new Date(`${date}T00:00:00Z`).getTime();
  return Math.max(0, Math.ceil((start - Date.now()) / 86_400_000));
}

export function OfficialMacroRisk() {
  const [schedule, setSchedule] = useState<OfficialMacroSchedule | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    getOfficialMacroSchedule(AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]))
      .then((value) => { if (active) setSchedule(value); })
      .catch((failure) => { if (active) setError(failure instanceof OfficialMacroUnavailable ? failure.message : 'The official macro schedule is temporarily unavailable.'); });
    return () => { active = false; controller.abort(); };
  }, []);

  return <section className="panel rounded-3xl border-violet-300/15 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-violet-200"><CalendarClock size={18} /><p className="text-[10px] font-black uppercase tracking-[.18em]">Official macro risk</p></div><p className="mt-3 text-lg font-black text-white">Upcoming FOMC schedule</p></div>{schedule && <a href={schedule.source_url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white" aria-label="Open Federal Reserve schedule"><ExternalLink size={15} /></a>}</div>
    {error ? <div role="alert" className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/5 p-4 text-sm text-amber-100"><div className="flex gap-2"><CircleAlert className="mt-0.5 shrink-0" size={16} />{error}</div></div> : !schedule ? <div className="mt-8 flex items-center gap-2 text-sm text-zinc-400"><RefreshCw className="animate-spin text-violet-200" size={16} />Loading Federal Reserve schedule...</div> : <><div className="mt-5 space-y-3">{schedule.events.slice(0, 4).map((event) => <article key={event.id} className="rounded-xl border border-white/[.08] bg-white/[.025] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-zinc-100">{event.title}</p><p className="mt-1 text-xs text-zinc-400">{new Date(`${event.date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} · {event.duration_days} {event.duration_days === 1 ? 'day' : 'days'}</p></div><div className="flex flex-col items-end gap-2"><span className="rounded-full border border-rose-300/25 bg-rose-300/10 px-2 py-1 text-[9px] font-black tracking-[.12em] text-rose-200">{event.expected_volatility_impact} VOLATILITY RISK</span><span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[9px] font-black tracking-[.12em] text-amber-200">IN {daysUntil(event.date)}D</span></div></div><p className="mt-3 text-xs leading-5 text-zinc-400">{event.impact_basis}</p></article>)}</div><div className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-zinc-400"><p>{schedule.coverage_note}</p><p className="mt-2 text-zinc-500">{schedule.impact_boundary}</p></div></>}</section>;
}
