'use client';

import { ArrowDownRight, ArrowUpRight, Bot, CircleAlert, Gauge, Radio, ShieldAlert, Zap } from 'lucide-react';
import type { Direction, Strength } from '@/lib/types';
import { analyzeLivePriceAction, type LivePriceActionLayer } from '@/lib/live-price-action';
import { liveSpotAge, type LiveSpotMarket as LiveSpotMarketData, type LiveSpotSymbol } from '@/lib/live-spot';
import { LiveSpotMarket as LiveSpotMarketPanel } from './live-spot-market';
import { LiveSpotChart } from './live-spot-chart';
import { OfficialMacroRisk } from './official-macro-risk';
import { TerminalNav } from './terminal-nav';
import { useLiveSpotMarket } from './use-live-spot-market';

function directionTone(direction: Direction) {
  if (direction === 'BULLISH') return 'border-emerald-300/25 bg-emerald-300/10 text-emerald-300';
  if (direction === 'BEARISH') return 'border-rose-300/25 bg-rose-300/10 text-rose-300';
  return 'border-violet-300/25 bg-violet-300/10 text-violet-200';
}

function textTone(direction: Direction) {
  return direction === 'BULLISH' ? 'text-emerald-300' : direction === 'BEARISH' ? 'text-rose-300' : 'text-violet-200';
}

function precisionFor(market: LiveSpotSymbol) {
  return market === 'USD/JPY' ? 3 : market === 'XAU/USD' ? 2 : 5;
}

function PriceActionCard({ label, layer }: { label: string; layer: LivePriceActionLayer }) {
  return <section className="panel rounded-2xl p-4"><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">{label}</p><div className={`mt-3 inline-flex rounded-lg border px-2.5 py-1 text-xs font-black tracking-[.14em] ${directionTone(layer.direction)}`}>{layer.direction}</div><div className="mt-4 flex items-end justify-between gap-3"><p className="text-2xl font-black text-white">{layer.strength}</p><p className="text-sm font-bold text-zinc-400">{layer.score > 0 ? '+' : ''}{layer.score}</p></div><p className="mt-3 min-h-10 text-xs leading-5 text-zinc-400">{layer.summary}</p></section>;
}

function AvailabilityCard({ label, title, detail, tone = 'violet' }: { label: string; title: string; detail: string; tone?: 'violet' | 'amber' }) {
  const classes = tone === 'amber' ? 'border-amber-300/25 bg-amber-300/10 text-amber-200' : 'border-violet-300/25 bg-violet-300/10 text-violet-200';
  return <section className="panel rounded-2xl p-4"><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">{label}</p><div className={`mt-3 inline-flex rounded-lg border px-2.5 py-1 text-xs font-black tracking-[.14em] ${classes}`}>{title}</div><p className="mt-4 min-h-16 text-xs leading-5 text-zinc-400">{detail}</p></section>;
}

function LoadingWarRoom() {
  return <main className="terminal-grid min-h-screen bg-[#0d0b13] p-6 text-zinc-400"><div className="mx-auto max-w-7xl animate-pulse rounded-3xl border border-white/10 bg-white/5 p-8">Loading verified spot-market data...</div></main>;
}

export function WarRoom() {
  const workspace = useLiveSpotMarket('XAU/USD');
  const market = workspace.market;
  const analysis = market ? analyzeLivePriceAction(market) : null;
  const digits = precisionFor(workspace.selectedMarket);
  const formatPrice = new Intl.NumberFormat(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  if (!market || !analysis) {
    return <main className="terminal-grid min-h-screen bg-[#0d0b13] px-4 py-5 text-zinc-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1550px]"><header className="mb-6 flex flex-col gap-5 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between"><Brand /><TerminalNav /></header><LiveSpotMarketPanel {...workspace} />{workspace.error ? null : <LoadingWarRoom />}</div></main>;
  }

  const latest = market.bars.at(-1)!;
  const age = liveSpotAge(market.as_of, workspace.now);
  const liveDirection = analysis.direction;
  const eventLabel = analysis.alignment.replaceAll('_', ' ');

  return <main className="terminal-grid min-h-screen bg-[#0d0b13] text-zinc-100"><div className="mx-auto max-w-[1550px] px-4 py-5 sm:px-6 lg:px-8">
    <header className="mb-6 flex flex-col gap-5 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between"><Brand /><TerminalNav /><div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-cyan-200"><Radio size={12} className="animate-pulse" />{market.provider} · spot bars</div></header>

    <aside role="status" className="mb-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/5 p-4 text-sm leading-6 text-cyan-50"><strong>Live spot price-action mode.</strong> The War Room below processes the selected provider-reported one-minute OHLC bars. No browser replay, simulated GC/MGC price, simulated delta, or mock setup is rendered. True exchange order flow and directional macro inputs remain unavailable until dedicated providers are connected.</aside>

    <div className="grid gap-5 xl:grid-cols-[1.55fr_.85fr]"><LiveSpotMarketPanel {...workspace} /><OfficialMacroRisk /></div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_.85fr]">
      <section className="panel relative overflow-hidden rounded-3xl p-6 sm:p-8"><div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" /><div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start"><div><div className="flex items-center gap-3"><p className="text-4xl font-black tracking-tight">{market.market}</p><span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] font-bold tracking-[.15em] text-cyan-100">SPOT</span></div><p className="mt-1 text-sm text-zinc-400">Provider-reported 1-minute OHLC · latest bar start {new Date(market.as_of).toISOString().replace('T', ' ').replace('.000Z', ' UTC')}</p></div><div className="sm:text-right"><p className="text-4xl font-black tabular-nums">{formatPrice.format(market.price)}</p><p className={`mt-1 inline-flex items-center gap-1 text-sm font-bold ${analysis.change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{analysis.change >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{analysis.change >= 0 ? '+' : ''}{formatPrice.format(analysis.change)} ({analysis.change_percent >= 0 ? '+' : ''}{analysis.change_percent.toFixed(3)}%) / 15 bars</p></div></div>
        <div className="relative mt-9 border-t border-white/10 pt-7"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-zinc-500">Live calculated price-action state</p><div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-2"><h1 className={`signal-glow text-4xl font-black tracking-tight sm:text-5xl ${textTone(liveDirection)}`}>{liveDirection}</h1><span className="text-lg font-bold text-zinc-300">{analysis.state.replaceAll('_', ' ')}</span></div><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{eventLabel}. This is an explainable technical classification from current spot bars, not a probability, a broker instruction, or a claim of live futures order flow.</p></div>
      </section>
      <section className="panel rounded-3xl p-6"><div className="flex items-center gap-2 text-violet-300"><Bot size={17} /><p className="text-xs font-black uppercase tracking-[.18em]">Analyst boundary</p></div><p className="mt-4 text-lg font-bold">Live explanation, constrained to source data.</p><p className="mt-3 text-sm leading-6 text-zinc-400">The displayed state explains the latest provider bars, rolling levels, and range interaction. No LLM is connected, and the app withholds directional macro and order-flow conclusions because this feed does not provide the required inputs.</p><div className="mt-5 rounded-xl border border-violet-300/15 bg-violet-300/5 p-3 text-xs leading-5 text-violet-100">Current bar age: {age}s. The most recent close is {formatPrice.format(latest.close)}; average 15-bar range is {formatPrice.format(analysis.average_range)}.</div></section>
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><PriceActionCard label="Structure" layer={analysis.structure} /><PriceActionCard label="Range interaction" layer={analysis.range_interaction} /><AvailabilityCard label="Macro" title="SCHEDULE ONLY" detail="The official FOMC schedule is live above. No live USD, real-yield, inflation, risk-sentiment, or central-bank feed is connected, so no macro direction is assigned." /><AvailabilityCard label="Order flow" title="NOT AVAILABLE" tone="amber" detail="This spot-bar provider does not supply aggressor-side trades, volume, delta, cumulative delta, DOM, or exchange liquidity. No proxy is displayed as order flow." /></div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_.95fr]"><section className="panel rounded-3xl p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">Live price action</p><p className="mt-1 text-lg font-bold">Provider bars and calculated range references</p></div><span className="rounded-full bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100">{market.market} · {market.interval}</span></div><div className="h-[260px]"><LiveSpotMarketChart market={market} /></div></section><section className="panel rounded-3xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">Price-action alignment</p><p className="mt-1 text-xl font-black">{eventLabel}</p></div><Gauge className={textTone(liveDirection)} size={28} /></div><div className="mt-6 grid grid-cols-2 gap-3 text-sm"><Metric label="Technical score" value={`${analysis.score > 0 ? '+' : ''}${analysis.score}`} /><Metric label="Display strength" value={analysis.strength} /><Metric label="Bar range" value={formatPrice.format(latest.high - latest.low)} /><Metric label="Bar age" value={`${age}s`} /></div><div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs leading-5 text-zinc-400">Alignment includes only the live layers available from this feed: structure and range interaction. Macro and order flow are intentionally excluded.</p></div></section></div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><section className="panel rounded-3xl p-5 sm:p-6"><div className="flex items-center gap-2"><Zap className="text-cyan-300" size={18} /><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">Live source bars</p><p className="mt-1 text-lg font-bold">Latest provider-reported one-minute OHLC</p></div></div><LiveBarsTable market={market} precision={digits} /></section><section className="panel rounded-3xl p-5 sm:p-6"><div className="flex items-center gap-2"><CircleAlert className="text-cyan-300" size={18} /><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">Key references</p><p className="mt-1 text-lg font-bold">Calculated from current returned bars</p></div></div><div className="mt-5 space-y-2">{analysis.levels.map((level) => <div key={level.id} className="flex items-center justify-between rounded-xl border border-white/[.07] bg-white/[.025] px-4 py-3"><div><p className="font-bold text-zinc-200">{level.type}</p><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-zinc-500">{level.strength} · {level.touches} touches · {formatPrice.format(Math.abs(level.distance))} away</p></div><p className="font-mono text-base font-bold text-white">{formatPrice.format(level.price)}</p></div>)}</div></section></div>

    <section className="panel mt-5 rounded-3xl p-5 sm:p-6"><div className="flex items-center gap-2"><ShieldAlert className="text-cyan-300" size={18} /><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">Live market timeline</p><p className="mt-1 text-lg font-bold">Observations derived from returned source bars</p></div></div><div className="mt-5 space-y-3">{analysis.events.map((event) => <article key={event.id} className="grid grid-cols-[65px_1fr] gap-4 rounded-xl border border-white/[.07] bg-white/[.025] p-4"><p className="pt-0.5 font-mono text-xs text-cyan-200">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}</p><div><p className="font-bold text-zinc-100">{event.title}</p><p className="mt-1 text-xs leading-5 text-zinc-400">{event.description}</p></div></article>)}</div></section>
    <footer className="py-8 text-center text-[10px] uppercase tracking-[.16em] text-zinc-600">Live spot OHLC reference · Explainable price-action classifications · Not financial advice</footer>
  </div></main>;
}

function Brand() {
  return <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 text-lg font-black text-white shadow-[0_0_30px_-6px_rgba(168,85,247,.8)]">T</div><div><p className="text-lg font-black tracking-[.16em]">TOFAUTI</p><p className="text-[10px] font-bold uppercase tracking-[.2em] text-zinc-500">Live spot intelligence</p></div></div>;
}

function LiveSpotMarketChart({ market }: { market: LiveSpotMarketData }) {
  return <LiveSpotChart market={market} />;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-3"><p className="text-[10px] uppercase tracking-[.14em] text-zinc-500">{label}</p><p className="mt-2 text-lg font-black text-zinc-100">{value}</p></div>;
}

function LiveBarsTable({ market, precision }: { market: LiveSpotMarketData; precision: number }) {
  const formatPrice = new Intl.NumberFormat(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision });
  return <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[.15em] text-zinc-500"><tr><th className="pb-3">Time</th><th className="pb-3">Open</th><th className="pb-3">High</th><th className="pb-3">Low</th><th className="pb-3">Close</th><th className="pb-3">Bar move</th></tr></thead><tbody>{market.bars.slice(-8).reverse().map((bar) => { const move = bar.close - bar.open; return <tr key={bar.time} className="border-b border-white/[.06] text-zinc-300"><td className="py-3">{new Date(bar.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}</td><td>{formatPrice.format(bar.open)}</td><td>{formatPrice.format(bar.high)}</td><td>{formatPrice.format(bar.low)}</td><td className="font-bold text-white">{formatPrice.format(bar.close)}</td><td className={move >= 0 ? 'font-bold text-emerald-300' : 'font-bold text-rose-300'}>{move >= 0 ? '+' : ''}{formatPrice.format(move)}</td></tr>; })}</tbody></table></div>;
}
