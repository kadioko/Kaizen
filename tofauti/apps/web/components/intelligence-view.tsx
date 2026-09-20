'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpenCheck, CandlestickChart, Database, Layers3, Settings2, ShieldCheck } from 'lucide-react';
import type { MarketSnapshot } from '@/lib/types';
import { CandlestickChart as PriceChart } from './candlestick-chart';
import { TerminalNav } from './terminal-nav';
import { useMarketSnapshot } from './use-market-snapshot';
import { AuthPanel } from './auth-panel';
import { WatchlistPanel } from './watchlist-panel';

const content: Record<string, { title: string; eyebrow: string }> = {
  macro: { title: 'Gold Macro Intelligence', eyebrow: 'Macro evidence' },
  'order-flow': { title: 'Order Flow Desk', eyebrow: 'Flow evidence' },
  levels: { title: 'Level Map', eyebrow: 'Structure evidence' },
  journal: { title: 'Setup Journal', eyebrow: 'Observed setup records' },
  settings: { title: 'System Settings', eyebrow: 'Runtime configuration' },
};

function tone(score: number) {
  return score > 0 ? 'text-emerald-300' : score < 0 ? 'text-rose-300' : 'text-violet-200';
}

function Shell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return <main className="terminal-grid min-h-screen bg-[#0d0b13] p-5 text-zinc-100 sm:p-8"><div className="mx-auto max-w-7xl"><header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-5 xl:flex-row xl:items-center"><Link href="/war-room" className="inline-flex items-center gap-3 text-lg font-black tracking-[.16em]"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-300 text-[#171122]">T</span>TOFAUTI</Link><TerminalNav /></header><section className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[.035] p-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.24em] text-violet-300">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1></div><Link href="/war-room" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white"><ArrowLeft size={15} /> Back to War Room</Link></section><aside className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">GC/MGC simulation workspace. Macro, order flow, levels and setups are demo data. Replay records are temporary; durable trading history is not available here.</aside>{children}</div></main>;
}

function Loading({ title, eyebrow }: { title: string; eyebrow: string }) {
  return <Shell title={title} eyebrow={eyebrow}><div className="animate-pulse rounded-3xl border border-white/10 bg-white/[.035] p-8 text-zinc-400">Loading calculated market snapshot...</div></Shell>;
}

export function IntelligenceView({ view }: { view: string }) {
  const item = content[view] ?? { title: 'Not found', eyebrow: 'TOFAUTI' };
  const { snapshot, connection, error } = useMarketSnapshot();
  if (view === 'settings') return <SettingsView connection={connection} />;
  if (!snapshot) return <Shell {...item}><p role="status" className="text-amber-200">{error || 'Connecting to market workspace...'}</p></Shell>;
  if (view === 'macro') return <MacroView snapshot={snapshot} connection={connection} />;
  if (view === 'order-flow') return <OrderFlowView snapshot={snapshot} />;
  if (view === 'levels') return <LevelsView snapshot={snapshot} />;
  if (view === 'journal') return <JournalView snapshot={snapshot} />;
  return <Shell {...item}><p className="text-zinc-400">This TOFAUTI view is not available.</p></Shell>;
}

function MacroView({ snapshot, connection }: { snapshot: MarketSnapshot; connection: string }) {
  const factors = snapshot.macro.factors ?? [];
  return <Shell {...content.macro}><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><section className="panel rounded-3xl p-6"><p className="text-[10px] font-black uppercase tracking-[.18em] text-zinc-500">Calculated macro state</p><p className={`mt-4 text-4xl font-black ${tone(snapshot.macro.score)}`}>{snapshot.macro.direction}</p><p className="mt-2 text-lg font-bold text-zinc-300">{snapshot.macro.strength} conviction</p><p className="mt-5 text-sm leading-6 text-zinc-400">{snapshot.macro.summary}</p><div className="mt-6 rounded-xl border border-white/10 bg-white/[.03] p-4 text-xs text-zinc-400"><span className="font-bold text-zinc-200">Source mode:</span> {connection === 'browser-demo' ? 'deterministic browser macro inputs' : 'server snapshot macro inputs'}.</div></section><section className="panel rounded-3xl p-6"><p className="text-[10px] font-black uppercase tracking-[.18em] text-zinc-500">Primary drivers</p><div className="mt-4 space-y-3">{factors.map((factor) => <article key={factor.name} className="flex items-center justify-between rounded-xl border border-white/[.08] bg-white/[.025] p-4"><div><p className="font-bold text-zinc-100">{factor.name}</p><p className="mt-1 text-xs text-zinc-500">{factor.current_state} · {factor.source}</p></div><div className="text-right"><p className={`font-mono text-lg font-black ${tone(factor.score)}`}>{factor.score > 0 ? '+' : ''}{factor.score}</p><p className="text-[10px] font-bold tracking-[.12em] text-zinc-500">{factor.directional_effect}</p></div></article>)}</div></section></div><div className="mt-5 grid gap-4 md:grid-cols-4"><Metric label="Macro" value={snapshot.macro.direction} score={snapshot.macro.score} /><Metric label="Structure" value={snapshot.structure.direction} score={snapshot.structure.score} /><Metric label="Order flow" value={snapshot.order_flow.direction} score={snapshot.order_flow.score} /><Metric label="Liquidity" value={snapshot.liquidity.direction} score={snapshot.liquidity.score} /></div></Shell>;
}

function OrderFlowView({ snapshot }: { snapshot: MarketSnapshot }) {
  const maxDelta = Math.max(1, ...snapshot.order_flow_buckets.map((bucket) => Math.abs(bucket.delta)));
  return <Shell {...content['order-flow']}><div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><section className="panel rounded-3xl p-5"><PriceChart snapshot={snapshot} /></section><section className="panel rounded-3xl p-6"><p className="text-[10px] font-black uppercase tracking-[.18em] text-zinc-500">Calculated flow state</p><p className={`mt-4 text-4xl font-black ${tone(snapshot.order_flow.score)}`}>{snapshot.order_flow.direction}</p><p className="mt-2 text-sm leading-6 text-zinc-400">{snapshot.order_flow.summary}</p><div className="mt-6 grid grid-cols-2 gap-3"><Metric label="Latest delta" value={String(snapshot.order_flow_buckets.at(-1)?.delta ?? 0)} score={snapshot.order_flow_buckets.at(-1)?.delta ?? 0} /><Metric label="Cumulative" value={String(snapshot.order_flow_buckets.at(-1)?.cumulative_delta ?? 0)} score={snapshot.order_flow_buckets.at(-1)?.cumulative_delta ?? 0} /></div></section></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><section className="panel rounded-3xl p-6"><div className="flex items-center gap-2"><CandlestickChart size={17} className="text-violet-300" /><p className="text-lg font-black">Delta histogram</p></div><div className="mt-6 space-y-3">{snapshot.order_flow_buckets.map((bucket) => <div key={bucket.start} className="grid grid-cols-[62px_1fr_64px] items-center gap-3 text-xs"><span className="font-mono text-zinc-500">{new Date(bucket.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><div className="h-3 overflow-hidden rounded-full bg-white/[.06]"><div className={`h-full rounded-full ${bucket.delta >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${Math.max(4, Math.abs(bucket.delta) / maxDelta * 100)}%` }} /></div><span className={`text-right font-mono font-bold ${tone(bucket.delta)}`}>{bucket.delta > 0 ? '+' : ''}{bucket.delta}</span></div>)}</div></section><VolumeProfile snapshot={snapshot} /></div><section className="panel mt-5 rounded-3xl p-6"><FlowTable snapshot={snapshot} /></section></Shell>;
}

function VolumeProfile({ snapshot }: { snapshot: MarketSnapshot }) {
  const profile = new Map<number, number>();
  snapshot.bars.forEach((bar) => {
    const priceBin = Math.round(bar.close * 2) / 2;
    profile.set(priceBin, (profile.get(priceBin) ?? 0) + bar.volume);
  });
  const rows = [...profile.entries()].sort(([left], [right]) => right - left);
  const maxVolume = Math.max(1, ...rows.map(([, volume]) => volume));
  return <section className="panel rounded-3xl p-6"><p className="text-[10px] font-black uppercase tracking-[.18em] text-zinc-500">Volume by price</p><p className="mt-1 text-lg font-black">Visible-bar volume proxy</p><p className="mt-2 text-xs leading-5 text-zinc-400">All bar volume is assigned to its closing-price bin. This approximation does not measure actual traded volume at each price.</p><div className="mt-5 space-y-3">{rows.map(([price, volume]) => <div key={price} className="grid grid-cols-[56px_1fr_42px] items-center gap-2 text-xs"><span className="font-mono text-zinc-400">{price.toFixed(1)}</span><div className="h-3 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-violet-400/75" style={{ width: `${volume / maxVolume * 100}%` }} /></div><span className="text-right font-mono text-zinc-500">{volume}</span></div>)}</div></section>;
}

function FlowTable({ snapshot }: { snapshot: MarketSnapshot }) {
  return <div className="mt-7 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[.15em] text-zinc-500"><tr><th className="pb-3">Time</th><th className="pb-3">Delta</th><th className="pb-3">Change</th><th className="pb-3">Volume</th><th className="pb-3">Buy / Sell</th></tr></thead><tbody>{snapshot.order_flow_buckets.slice().reverse().map((bucket) => <tr key={`table-${bucket.start}`} className="border-b border-white/[.06] text-zinc-300"><td className="py-3">{new Date(bucket.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td className={tone(bucket.delta)}>{bucket.delta}</td><td>{bucket.delta_change > 0 ? '+' : ''}{bucket.delta_change}</td><td>{bucket.total_volume.toLocaleString()}</td><td>{bucket.buy_percentage}% / {bucket.sell_percentage}%</td></tr>)}</tbody></table></div>;
}

function LevelsView({ snapshot }: { snapshot: MarketSnapshot }) {
  return <Shell {...content.levels}><section className="panel rounded-3xl p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-lg font-black">{snapshot.instrument.symbol} reference map</p><p className="mt-1 text-sm text-zinc-400">Current simulated price: <span className="font-mono font-bold text-white">{snapshot.price.toFixed(1)}</span></p></div><Layers3 className="text-violet-300" /></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[.15em] text-zinc-500"><tr><th className="pb-3">Level</th><th className="pb-3">Price</th><th className="pb-3">Distance</th><th className="pb-3">Strength</th><th className="pb-3">Touches</th><th className="pb-3">Last interaction</th></tr></thead><tbody>{snapshot.levels.map((level) => <tr key={level.id} className="border-b border-white/[.06] text-zinc-300"><td className="py-4 font-bold text-zinc-100">{level.type}</td><td className="font-mono">{level.price.toFixed(1)}</td><td className={tone(snapshot.price - level.price)}>{(snapshot.price - level.price) >= 0 ? '+' : ''}{(snapshot.price - level.price).toFixed(1)}</td><td>{level.strength}</td><td>{level.touches}</td><td className="text-zinc-500">{level.last_interaction ? new Date(level.last_interaction).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No interaction'}</td></tr>)}</tbody></table></div></section><section className="panel mt-5 rounded-3xl p-6"><p className="text-sm leading-6 text-zinc-400">Supply and demand are explainable V0.1 references. Their detection methodology is documented and is not presented as proprietary institutional data.</p></section></Shell>;
}

function JournalView({ snapshot }: { snapshot: MarketSnapshot }) {
  const setup = snapshot.setup;
  return <Shell {...content.journal}><section className="panel rounded-3xl p-6"><div className="flex items-center gap-2"><BookOpenCheck className="text-violet-300" size={18} /><p className="text-lg font-black">Current replay setup</p></div>{setup ? <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[.15em] text-zinc-500"><tr><th className="pb-3">Instrument</th><th className="pb-3">Direction</th><th className="pb-3">Entry</th><th className="pb-3">Invalidation</th><th className="pb-3">T1 / T2</th><th className="pb-3">Status</th></tr></thead><tbody><tr className="text-zinc-200"><td className="py-4 font-bold">{snapshot.instrument.symbol}</td><td className={tone(setup.direction === 'BULLISH' ? 1 : -1)}>{setup.direction}</td><td>{setup.entry_reference.toFixed(1)}</td><td>{setup.invalidation.toFixed(1)}</td><td>{setup.target1.toFixed(1)} / {setup.target2.toFixed(1)}</td><td>{setup.status}</td></tr></tbody></table></div> : <p className="mt-5 rounded-xl border border-white/10 p-4 text-sm leading-6 text-zinc-400">No setup has confirmed in the current replay. The journal records only calculated confirmations, never an invented trade signal.</p>}</section><section className="panel mt-5 rounded-3xl p-6"><p className="text-[10px] font-black uppercase tracking-[.18em] text-zinc-500">Current replay context (not the entry snapshot)</p><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Metric label="Alignment" value={snapshot.alignment.state.replaceAll('_', ' ')} score={snapshot.alignment.score} /><Metric label="Macro" value={snapshot.macro.direction} score={snapshot.macro.score} /><Metric label="Structure" value={snapshot.structure.direction} score={snapshot.structure.score} /><Metric label="Order flow" value={snapshot.order_flow.direction} score={snapshot.order_flow.score} /></div></section></Shell>;
}

function SettingsView({ connection }: { connection: string }) {
  return <Shell {...content.settings}><div className="grid gap-5 lg:grid-cols-2"><section className="panel rounded-3xl p-6"><Settings2 className="text-violet-300" /><p className="mt-4 text-lg font-black">Runtime mode</p><p className="mt-2 text-sm leading-6 text-zinc-400">{connection === 'browser-demo' ? 'Public browser demo is active. It is deterministic, does not call a broker, and cannot be called live market data.' : `A FastAPI service is configured. Connection state: ${connection}.`}</p><p className="mt-5 rounded-xl border border-white/10 bg-white/[.025] p-4 text-xs text-zinc-400">Set <code>NEXT_PUBLIC_API_URL</code> in Vercel only after a hosted FastAPI service is healthy and has a server-only Supabase service key.</p></section><section className="panel rounded-3xl p-6"><Database className="text-violet-300" /><p className="mt-4 text-lg font-black">Persistence mode</p><p className="mt-2 text-sm leading-6 text-zinc-400">The API detects Supabase only when both <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> are configured on the server. The browser must never receive the service-role credential.</p><div className="mt-5 flex items-center gap-2 text-xs text-zinc-400"><ShieldCheck size={15} className="text-emerald-300" /> RLS protects personal profiles and watchlists.</div></section></div><div className="mt-5 grid gap-5 lg:grid-cols-2"><AuthPanel /><WatchlistPanel /></div></Shell>;
}

function Metric({ label, value, score }: { label: string; value: string; score: number }) {
  return <div className="rounded-xl border border-white/[.08] bg-white/[.025] p-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-zinc-500">{label}</p><p className="mt-2 text-sm font-bold text-zinc-100">{value}</p><p className={`mt-2 font-mono text-lg font-black ${tone(score)}`}>{score > 0 ? '+' : ''}{score}</p></div>;
}
