'use client';

import { Activity, AlertTriangle, Clock3, Database } from 'lucide-react';
import { liveSpotAge, type LiveSpotMarket } from '@/lib/live-spot';
import { spotDataState } from '@/lib/data-status';
import { formatTimeInZone, useUserTimezone } from './use-user-timezone';

export function DataStatus({ market, error, now, retry }: { market: LiveSpotMarket | null; error: string; now: number; retry?: () => void }) {
  const { timeZone } = useUserTimezone();
  const state = spotDataState(market, error, now);
  const barAge = market ? liveSpotAge(market.as_of, now) : null;
  const cacheAge = market ? liveSpotAge(market.fetched_at, now) : null;
  const alert = state !== 'RECENT' && state !== 'LOADING';
  const label = state === 'RECENT' ? 'Recent source bar' : state === 'OUTSIDE_STANDARD_WEEK' ? 'Outside standard spot week' : state === 'STALE' ? 'Stale source bar' : state === 'INSUFFICIENT_HISTORY' ? 'Building bar history' : state === 'UNAVAILABLE' ? 'Provider unavailable' : 'Checking provider';

  return <section aria-label="Data status" className={`panel rounded-3xl p-5 sm:p-6 ${alert ? 'border-amber-300/25' : 'border-cyan-300/15'}`}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-cyan-200">{alert ? <AlertTriangle size={17} className="text-amber-200" /> : <Activity size={17} />}<p className="text-[10px] font-black uppercase tracking-[.18em]">Data status</p></div><span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] ${alert ? 'border-amber-300/25 bg-amber-300/10 text-amber-100' : 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100'}`}>{label}</span></div>
    <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4"><div><p className="text-zinc-500">Source and coverage</p><p className="mt-1 font-bold text-zinc-100">{market?.provider ?? 'Twelve Data'} · {market?.market ?? 'selected spot market'} · 1m OHLC</p></div><div><p className="text-zinc-500">Latest bar start</p><p className="mt-1 font-bold text-zinc-100">{market ? formatTimeInZone(market.as_of, timeZone, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : 'Unavailable'}</p></div><div><p className="text-zinc-500">Bar age</p><p className="mt-1 font-bold text-zinc-100">{barAge === null || !Number.isFinite(barAge) ? 'Unavailable' : `${Math.floor(barAge / 60)}m ${barAge % 60}s`}</p></div><div><p className="text-zinc-500">Server fetch age</p><p className="mt-1 font-bold text-zinc-100">{cacheAge === null || !Number.isFinite(cacheAge) ? 'Unavailable' : `${Math.floor(cacheAge / 60)}m ${cacheAge % 60}s`}</p></div></div>
    <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-white/10 pt-4"><p className="max-w-4xl text-xs leading-5 text-zinc-400"><Database className="mr-1 inline text-violet-200" size={13} /> Coverage is spot price bars only. Exchange delta, depth, futures liquidity, directional macro, and forecast probabilities are unavailable. {state === 'OUTSIDE_STANDARD_WEEK' ? 'The weekend label describes standard FX hours, not a provider-confirmed holiday schedule.' : state === 'STALE' ? 'Current state calculations are paused until a recent bar arrives.' : state === 'INSUFFICIENT_HISTORY' ? 'Current state calculations need at least 20 provider bars.' : state === 'UNAVAILABLE' ? 'Current state calculations are paused until the source recovers.' : ''}</p>{retry && <button type="button" onClick={retry} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:border-cyan-200/40"><Clock3 size={13} /> Retry now</button>}</div>
  </section>;
}
