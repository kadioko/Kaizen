'use client';

import { Clock3, Globe2, Layers3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { describeActiveSessions, getMarketSessionStatuses } from '@/lib/market-sessions';
import { formatTimeInZone, useUserTimezone } from './use-user-timezone';

export function GlobalSessionClock() {
  const [now, setNow] = useState<Date | null>(null);
  const { timeZone } = useUserTimezone();
  const sessions = now ? getMarketSessionStatuses(now) : [];
  const active = sessions.filter((session) => session.active);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!now) return <section className="panel rounded-3xl border-violet-300/20 p-5 sm:p-6"><div className="flex items-center gap-2 text-sm text-zinc-400"><Clock3 className="animate-pulse text-violet-200" size={16} />Checking regional session windows...</div></section>;

  return <section className="panel rounded-3xl border-violet-300/20 p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-violet-200"><Globe2 size={18} /><p className="text-[10px] font-black uppercase tracking-[.18em]">Global session clock</p></div><p className="mt-3 text-lg font-black text-white">{describeActiveSessions(sessions)}</p></div><span className={`rounded-full border px-2.5 py-1 text-[9px] font-black tracking-[.12em] ${active.length > 1 ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : active.length ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100' : 'border-zinc-400/25 bg-zinc-400/10 text-zinc-300'}`}>{active.length > 1 ? 'OVERLAP' : active.length ? 'ACTIVE' : 'QUIET WINDOW'}</span></div>
    <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.025] px-3 py-2 text-xs text-zinc-300"><Clock3 size={14} className="text-violet-200" /><span>Your clock: <strong className="font-mono text-white">{formatTimeInZone(now, timeZone, { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</strong></span></div>
    <div className="mt-4 grid grid-cols-2 gap-2">{sessions.map((session) => <article key={session.id} className={`rounded-xl border p-3 ${session.active ? 'border-emerald-300/20 bg-emerald-300/[.07]' : 'border-white/[.07] bg-white/[.02]'}`}><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-zinc-100">{session.label}</p><span className={`text-[9px] font-black tracking-[.12em] ${session.active ? 'text-emerald-200' : 'text-zinc-500'}`}>{session.active ? 'ACTIVE' : 'CLOSED'}</span></div><p className="mt-2 font-mono text-xs text-zinc-300">{session.localTime}</p><p className="mt-1 text-[10px] text-zinc-500">{session.windowLabel}</p></article>)}</div>
    <div className="mt-4 flex items-start gap-2 border-t border-white/10 pt-4 text-xs leading-5 text-zinc-500"><Layers3 size={14} className="mt-0.5 shrink-0 text-violet-300" /><p>Regional time windows use local IANA time zones, so daylight saving adjusts automatically. They describe timing only, not volume, liquidity, or a trade signal.</p></div></section>;
}
