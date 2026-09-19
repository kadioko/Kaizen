'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CircleAlert, RefreshCw } from 'lucide-react';
import { getGoldSpotReference, type GoldSpotReference } from '@/lib/gold-spot-reference';

const formatPrice = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function GoldSpotReference() {
  const [reference, setReference] = useState<GoldSpotReference | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const next = await getGoldSpotReference();
        if (active) { setReference(next); setError(false); }
      } catch {
        if (active) setError(true);
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  if (error) return <section className="panel rounded-3xl border-amber-300/20 p-5"><div className="flex items-center gap-2 text-amber-300"><CircleAlert size={17} /><p className="text-[10px] font-black uppercase tracking-[.18em]">External gold reference</p></div><p className="mt-3 text-sm font-bold text-zinc-100">Temporarily unavailable</p><p className="mt-2 text-xs leading-5 text-zinc-400">The replay remains separate. No quote is substituted or fabricated while the external reference is unavailable.</p></section>;
  if (!reference) return <section className="panel rounded-3xl p-5"><div className="flex items-center gap-2 text-violet-200"><RefreshCw className="animate-spin" size={16} /><p className="text-[10px] font-black uppercase tracking-[.18em]">Loading gold spot reference</p></div></section>;

  const asOf = new Date(reference.as_of).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return <section className="panel rounded-3xl border-cyan-300/15 p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-cyan-200"><Activity size={17} /><p className="text-[10px] font-black uppercase tracking-[.18em]">External gold reference</p></div><p className="mt-3 text-lg font-black text-white">XAU/USD spot</p><p className="mt-1 text-xs text-zinc-400">{reference.provider} · provider-supplied reference</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black tracking-[.12em] ${reference.freshness === 'CURRENT' ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200' : 'border-amber-300/25 bg-amber-300/10 text-amber-200'}`}>{reference.freshness}</span></div><p className="mt-5 font-mono text-3xl font-black tabular-nums text-cyan-100">{formatPrice.format(reference.price)}</p><p className="mt-2 text-xs text-zinc-500">Source bar: {asOf} · {reference.freshness_seconds}s old</p><div className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-zinc-400"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={14} /><p>{reference.limitations[0]} It never feeds TOFAUTI’s replay order-flow, score, or setup logic.</p></div></div></section>;
}
