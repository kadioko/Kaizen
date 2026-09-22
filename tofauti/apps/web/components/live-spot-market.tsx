'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CircleAlert, RefreshCw } from 'lucide-react';
import { getLiveSpotMarket, liveSpotAge, LIVE_SPOT_SYMBOLS, LiveSpotUnavailable, type LiveSpotMarket, type LiveSpotSymbol } from '@/lib/live-spot';
import { LiveSpotChart } from './live-spot-chart';

function precisionFor(market: LiveSpotSymbol) {
  return market === 'USD/JPY' ? 3 : market === 'XAU/USD' ? 2 : 5;
}

export function LiveSpotMarket() {
  const [selectedMarket, setSelectedMarket] = useState<LiveSpotSymbol>('XAU/USD');
  const [market, setMarket] = useState<LiveSpotMarket | null>(null);
  const [error, setError] = useState('');
  const [errorMarket, setErrorMarket] = useState<LiveSpotSymbol | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    const controller = new AbortController();
    const refresh = async () => {
      let retryMs = 300_000;
      try {
        if (document.visibilityState === 'hidden') return;
        const next = await getLiveSpotMarket(selectedMarket, AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]));
        if (active) { setMarket(next); setError(''); setErrorMarket(selectedMarket); setNow(Date.now()); }
      } catch (failure) {
        if (failure instanceof LiveSpotUnavailable) retryMs = failure.retrySeconds * 1000;
        if (active) { setError(failure instanceof LiveSpotUnavailable ? failure.message : 'This live spot reference is temporarily unavailable.'); setErrorMarket(selectedMarket); }
      } finally {
        if (active) timer = window.setTimeout(() => void refresh(), retryMs);
      }
    };
    void refresh();
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { active = false; controller.abort(); if (timer) window.clearTimeout(timer); window.clearInterval(clock); };
  }, [selectedMarket]);

  const digits = precisionFor(selectedMarket);
  const formatter = new Intl.NumberFormat(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const displayedMarket = market?.market === selectedMarket ? market : null;
  const displayedError = errorMarket === selectedMarket ? error : '';
  const first = displayedMarket?.bars[0];
  const change = displayedMarket && first ? displayedMarket.price - first.open : 0;
  const percentage = displayedMarket && first ? (change / first.open) * 100 : 0;
  const age = displayedMarket ? liveSpotAge(displayedMarket.as_of, now) : 0;

  return <section className="panel rounded-3xl border-cyan-300/20 p-5 sm:p-6"><div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-cyan-200"><Activity size={18} /><p className="text-[10px] font-black uppercase tracking-[.18em]">Live spot market reference</p></div><p className="mt-2 text-sm leading-6 text-zinc-400">Provider-reported spot bars, kept separate from the GC/MGC simulation below.</p></div><label className="inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.06] px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-cyan-100">Market<select value={selectedMarket} onChange={(event) => setSelectedMarket(event.target.value as LiveSpotSymbol)} className="bg-transparent text-cyan-100 outline-none">{LIVE_SPOT_SYMBOLS.map((symbol) => <option key={symbol} value={symbol}>{symbol}</option>)}</select></label></div>
    {displayedError ? <div role="alert" className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-300/5 p-4"><div className="flex items-center gap-2 text-amber-200"><CircleAlert size={16} /><p className="text-sm font-bold">{displayedError}</p></div><p className="mt-2 text-xs leading-5 text-zinc-400">No simulated value is substituted. Try again after the displayed provider backoff.</p></div> : !displayedMarket ? <div className="flex h-[340px] items-center gap-2 text-sm text-zinc-400"><RefreshCw className="animate-spin text-cyan-200" size={16} />Loading provider-reported market bars...</div> : <><div className="mt-5 flex flex-wrap items-end justify-between gap-5"><div><div className="flex items-center gap-3"><p className="font-mono text-4xl font-black tabular-nums text-cyan-50">{formatter.format(displayedMarket.price)}</p><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black tracking-[.12em] ${age <= 360 ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200' : 'border-amber-300/25 bg-amber-300/10 text-amber-200'}`}>{age <= 360 ? 'RECENT BAR' : 'STALE'}</span></div><p className={`mt-2 text-xs font-bold ${change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{change >= 0 ? '+' : ''}{formatter.format(change)} ({percentage >= 0 ? '+' : ''}{percentage.toFixed(3)}%) across returned bars</p></div><div className="text-sm text-zinc-400 sm:text-right"><p>{displayedMarket.provider} · {displayedMarket.interval} bars · refreshed every 5 minutes</p><p className="mt-1 text-xs text-zinc-500">Latest bar start: {new Date(displayedMarket.as_of).toISOString().replace('T', ' ').replace('.000Z', ' UTC')} · {age}s old</p></div></div><div className="mt-5"><LiveSpotChart market={displayedMarket} /></div><div className="mt-4 flex items-start gap-2 border-t border-white/10 pt-4 text-xs leading-5 text-zinc-400"><AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={14} /><p>{displayedMarket.limitations[0]} {displayedMarket.limitations[1]}</p></div></>}</section>;
}
