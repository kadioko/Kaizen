'use client';

import { useEffect, useState } from 'react';
import { Activity, BarChart3, DatabaseZap, Layers3, RefreshCw, Waves } from 'lucide-react';

type Bucket = {
  start: string;
  delta: number;
  delta_change: number;
  cumulative_delta: number;
  total_volume: number;
  buy_percentage: number;
  sell_percentage: number;
};

type ProfileLevel = {
  price: number;
  total_volume: number;
  buy_volume: number;
  sell_volume: number;
  unknown_volume: number;
  delta: number;
  share_of_profile: number;
};

type DepthLevel = {
  level: number;
  bid_price: number | null;
  bid_size: number;
  ask_price: number | null;
  ask_size: number;
};

type Snapshot = {
  instrument: { symbol: string; name: string };
  timestamp: string;
  price: number;
  source: Record<string, string>;
  order_flow_buckets: Bucket[];
  volume_profile: ProfileLevel[];
  depth_levels: DepthLevel[];
};

type Capability = {
  market_data: { availability: string; provider: string; schema: string | null; boundary: string };
  volume_profile: { availability: string; boundary: string };
  market_depth: { availability: string; boundary: string };
  instruments: { active: string[] };
};

type EngineState = {
  baseUrl: string | null;
  capability: Capability | null;
  snapshot: Snapshot | null;
  selectedSymbol: string;
  message: string | null;
};

function apiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  return value ? value.replace(/\/$/, '') : null;
}

function number(value: number, digits = 0) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

function time(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value));
}

function tone(value: number) {
  return value > 0 ? 'text-emerald-300' : value < 0 ? 'text-rose-300' : 'text-zinc-300';
}

function DeltaHistogram({ buckets }: { buckets: Bucket[] }) {
  const maximum = Math.max(1, ...buckets.map((bucket) => Math.abs(bucket.delta)));
  return <section className="rounded-2xl border border-white/[.07] bg-black/20 p-4"><div className="flex items-center gap-2 text-violet-200"><BarChart3 size={16} /><p className="text-[10px] font-black uppercase tracking-[.16em]">Delta histogram</p></div><div className="mt-4 space-y-2">{buckets.slice(-8).map((bucket) => <div key={bucket.start} className="grid grid-cols-[58px_1fr_58px] items-center gap-3 text-xs"><span className="font-mono text-zinc-500">{time(bucket.start)}</span><div className="relative h-5 overflow-hidden rounded bg-white/[.035]"><span className="absolute left-1/2 top-0 h-full w-px bg-white/15" /><span className={`absolute top-1/2 h-2 -translate-y-1/2 rounded ${bucket.delta >= 0 ? 'left-1/2 bg-emerald-400/75' : 'right-1/2 bg-rose-400/75'}`} style={{ width: `${Math.max(2, Math.abs(bucket.delta) / maximum * 50)}%` }} /></div><span className={`text-right font-mono font-bold ${tone(bucket.delta)}`}>{bucket.delta > 0 ? '+' : ''}{number(bucket.delta)}</span></div>)}</div><p className="mt-4 text-xs leading-5 text-zinc-500">Bars represent only exchange trades that the engine classified against a current BBO. Unknown volume stays outside delta.</p></section>;
}

function VolumeProfile({ profile }: { profile: ProfileLevel[] }) {
  const maximum = Math.max(1, ...profile.map((level) => level.total_volume));
  return <section className="rounded-2xl border border-white/[.07] bg-black/20 p-4"><div className="flex items-center gap-2 text-cyan-200"><DatabaseZap size={16} /><p className="text-[10px] font-black uppercase tracking-[.16em]">Traded-volume profile</p></div><div className="mt-4 space-y-2">{profile.slice(0, 8).map((level) => <div key={level.price} className="grid grid-cols-[76px_1fr_76px] items-center gap-3 text-xs"><span className="font-mono text-zinc-300">{number(level.price, 2)}</span><div className="relative h-5 overflow-hidden rounded bg-white/[.035]"><span className="absolute inset-y-0 left-0 rounded bg-cyan-400/25" style={{ width: `${Math.max(2, level.total_volume / maximum * 100)}%` }} /><span className={`absolute inset-y-1 left-0 rounded ${level.delta >= 0 ? 'bg-emerald-400/60' : 'bg-rose-400/60'}`} style={{ width: `${Math.max(2, Math.abs(level.delta) / maximum * 100)}%` }} /></div><span className="text-right font-mono text-zinc-400">{number(level.total_volume)}</span></div>)}</div><p className="mt-4 text-xs leading-5 text-zinc-500">Profile is calculated from the active engine session&apos;s normalized exchange trade volume, not inferred from OHLC candles.</p></section>;
}

function DepthLadder({ levels, availability }: { levels: DepthLevel[]; availability: string }) {
  if (availability !== 'AVAILABLE') return <section className="rounded-2xl border border-amber-300/20 bg-amber-300/[.04] p-4"><div className="flex items-center gap-2 text-amber-200"><Layers3 size={16} /><p className="text-[10px] font-black uppercase tracking-[.16em]">Market depth</p></div><p className="mt-3 text-sm font-bold text-zinc-100">WITHHELD</p><p className="mt-2 text-xs leading-5 text-zinc-400">The active feed is not entitled for MBP-10 depth. TOFAUTI will not draw a liquidity heatmap from price bars or top-of-book data.</p></section>;
  return <section className="rounded-2xl border border-white/[.07] bg-black/20 p-4"><div className="flex items-center gap-2 text-violet-200"><Layers3 size={16} /><p className="text-[10px] font-black uppercase tracking-[.16em]">Market-by-price depth</p></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[330px] text-xs"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[.14em] text-zinc-500"><tr><th className="pb-2 text-left">Bid size</th><th className="pb-2 text-left">Bid</th><th className="pb-2 text-right">Ask</th><th className="pb-2 text-right">Ask size</th></tr></thead><tbody>{levels.slice(0, 10).map((level) => <tr key={level.level} className="border-b border-white/[.05] font-mono"><td className="py-2 text-emerald-300">{number(level.bid_size)}</td><td className="py-2 text-zinc-300">{level.bid_price === null ? '—' : number(level.bid_price, 2)}</td><td className="py-2 text-right text-zinc-300">{level.ask_price === null ? '—' : number(level.ask_price, 2)}</td><td className="py-2 text-right text-rose-300">{number(level.ask_size)}</td></tr>)}</tbody></table></div><p className="mt-4 text-xs leading-5 text-zinc-500">This is an MBP-10 ladder, not a market-by-order heatmap. Cancellation and queue-position analysis are not claimed.</p></section>;
}

export function ExchangeOrderFlow() {
  const [state, setState] = useState<EngineState>({ baseUrl: apiBaseUrl(), capability: null, snapshot: null, selectedSymbol: 'GC', message: null });
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    if (!state.baseUrl) return;
    let active = true;
    const load = async () => {
      try {
        const capabilityResponse = await fetch(`${state.baseUrl}/api/capabilities`, { cache: 'no-store' });
        if (!capabilityResponse.ok) throw new Error('The hosted engine did not return its capability report.');
        const capability = await capabilityResponse.json() as Capability;
        const selectedSymbol = capability.instruments.active.includes(state.selectedSymbol) ? state.selectedSymbol : capability.instruments.active[0] ?? 'GC';
        if (capability.market_data.availability !== 'AVAILABLE') {
          if (active) setState((current) => ({ ...current, capability, selectedSymbol, snapshot: null, message: 'The hosted engine has not reported an entitled live exchange feed.' }));
          return;
        }
        const snapshotResponse = await fetch(`${state.baseUrl}/api/snapshot/${selectedSymbol}`, { cache: 'no-store' });
        if (!snapshotResponse.ok) throw new Error('The hosted engine has not received a current exchange snapshot yet.');
        const snapshot = await snapshotResponse.json() as Snapshot;
        if (active) setState((current) => ({ ...current, capability, selectedSymbol, snapshot, message: null }));
      } catch (error) {
        if (active) setState((current) => ({ ...current, snapshot: null, message: error instanceof Error ? error.message : 'The exchange engine is temporarily unavailable.' }));
      }
    };
    void load();
    const interval = window.setInterval(load, 10_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [refreshVersion, state.baseUrl, state.selectedSymbol]);

  useEffect(() => {
    if (!state.baseUrl || state.capability?.market_data.availability !== 'AVAILABLE') return;
    const socketUrl = `${state.baseUrl.replace(/^http/, 'ws')}/ws/market/${state.selectedSymbol}`;
    const socket = new WebSocket(socketUrl);
    socket.onmessage = (event) => {
      try {
        const snapshot = JSON.parse(event.data) as Snapshot;
        if (snapshot.instrument?.symbol === state.selectedSymbol) {
          setState((current) => ({ ...current, snapshot, message: null }));
        }
      } catch {
        // Polling remains the fallback when a malformed socket frame is rejected.
      }
    };
    socket.onerror = () => {
      setState((current) => ({ ...current, message: 'The live exchange socket is unavailable; retrying through the health poll.' }));
    };
    return () => socket.close();
  }, [state.baseUrl, state.capability?.market_data.availability, state.selectedSymbol]);

  if (!state.baseUrl || !state.snapshot) return <section className="panel mt-5 rounded-3xl border-amber-300/20 p-6"><div className="flex items-start gap-3"><div className="rounded-xl bg-amber-300/10 p-2 text-amber-200"><Waves size={18} /></div><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200">Exchange order-flow workspace</p><p className="mt-3 text-xl font-black text-white">{state.baseUrl ? 'WITHHELD' : 'ENGINE NOT CONFIGURED'}</p><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{state.message ?? 'Set NEXT_PUBLIC_API_URL only after the hosted FastAPI service reports an entitled exchange feed. The public spot-bar chart will never be reused as delta, volume profile, cumulative delta, or depth.'}</p></div></div></section>;

  const latest = state.snapshot.order_flow_buckets.at(-1);
  return <section className="panel mt-5 rounded-3xl border-violet-300/20 p-5 sm:p-6"><div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-violet-200"><Activity size={17} /><p className="text-[10px] font-black uppercase tracking-[.18em]">Exchange order-flow workspace</p></div><p className="mt-2 text-xl font-black">{state.snapshot.instrument.name} <span className="font-mono text-violet-200">{state.snapshot.instrument.symbol}</span></p><p className="mt-2 text-xs text-zinc-500">{state.snapshot.source.provider} · {state.snapshot.source.dataset} · {state.snapshot.source.schema} · received {time(state.snapshot.timestamp)}</p></div><div className="flex flex-wrap gap-2">{state.capability?.instruments.active.map((symbol) => <button key={symbol} type="button" onClick={() => setState((current) => ({ ...current, selectedSymbol: symbol }))} className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${state.selectedSymbol === symbol ? 'border-violet-300/50 bg-violet-300/15 text-violet-100' : 'border-white/10 bg-white/[.03] text-zinc-400 hover:text-white'}`}>{symbol}</button>)}<button type="button" onClick={() => setRefreshVersion((version) => version + 1)} className="rounded-lg border border-white/10 bg-white/[.03] p-2 text-zinc-400 hover:text-white" aria-label="Refresh exchange flow"><RefreshCw size={15} /></button></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Last price" value={number(state.snapshot.price, 2)} /><Metric label="Delta" value={latest ? `${latest.delta > 0 ? '+' : ''}${number(latest.delta)}` : '—'} className={latest ? tone(latest.delta) : ''} /><Metric label="Cumulative delta" value={latest ? `${latest.cumulative_delta > 0 ? '+' : ''}${number(latest.cumulative_delta)}` : '—'} className={latest ? tone(latest.cumulative_delta) : ''} /><Metric label="Buy / sell" value={latest ? `${number(latest.buy_percentage, 1)}% / ${number(latest.sell_percentage, 1)}%` : '—'} /></div><div className="mt-5 grid gap-5 xl:grid-cols-2"><DeltaHistogram buckets={state.snapshot.order_flow_buckets} /><VolumeProfile profile={state.snapshot.volume_profile} /><DepthLadder levels={state.snapshot.depth_levels} availability={state.capability?.market_depth.availability ?? 'UNAVAILABLE'} /><section className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-200">Method boundary</p><p className="mt-3 text-sm font-bold text-zinc-100">Calculated from normalized exchange records</p><p className="mt-3 text-xs leading-5 text-zinc-400">{state.capability?.market_data.boundary}</p><p className="mt-4 text-xs leading-5 text-zinc-500">The system shows strength labels and observed evidence. It does not show a probability, trade recommendation, broker control, or unverified “institutional” claim.</p></section></div></section>;
}

function Metric({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-zinc-500">{label}</p><p className={`mt-2 font-mono text-lg font-black ${className || 'text-zinc-100'}`}>{value}</p></div>;
}
