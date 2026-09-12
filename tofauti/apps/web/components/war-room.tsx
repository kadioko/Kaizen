'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Bot, CircleDotDashed, Gauge, Radio, ShieldAlert, Zap } from 'lucide-react';
import type { LayerState, MarketSnapshot } from '@/lib/types';
import { CandlestickChart } from './candlestick-chart';
import { TerminalNav } from './terminal-nav';
import { browserDemoSnapshot } from '@/lib/browser-demo';
import { getSnapshot, marketSocketUrl, setDemoScenario, usesBrowserDemo } from '@/lib/market-api';

const scenarios = [
  ['bearish_liquidity_sweep', 'Bearish sweep'], ['bullish_reversal', 'Bullish reversal'], ['mixed', 'Mixed'], ['macro_divergence', 'Macro divergence'], ['full_alignment', 'Full alignment'],
];

function colorFor(direction: string) {
  if (direction === 'BULLISH') return 'text-emerald-300 border-emerald-300/25 bg-emerald-300/10';
  if (direction === 'BEARISH') return 'text-rose-300 border-rose-300/25 bg-rose-300/10';
  return 'text-violet-200 border-violet-300/25 bg-violet-300/10';
}

function StateCard({ label, state }: { label: string; state: LayerState }) {
  return <section className="panel rounded-2xl p-4"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-zinc-500">{label}</p><div className={`mt-3 inline-flex rounded-lg border px-2.5 py-1 text-xs font-black tracking-[.14em] ${colorFor(state.direction)}`}>{state.direction}</div><div className="mt-4 flex items-end justify-between gap-3"><p className="text-2xl font-black text-white">{state.strength}</p><p className="text-sm font-bold text-zinc-400">{state.score > 0 ? '+' : ''}{state.score}</p></div><p className="mt-3 min-h-10 text-xs leading-5 text-zinc-400">{state.summary}</p></section>;
}

function SnapshotLoading() {
  return <main className="terminal-grid min-h-screen bg-[#0d0b13] p-6 text-zinc-400"><div className="mx-auto max-w-7xl animate-pulse rounded-3xl border border-white/10 bg-white/5 p-8">Connecting to the TOFAUTI demo feed...</div></main>;
}

export function WarRoom() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [connection, setConnection] = useState<'connecting' | 'live' | 'reconnecting' | 'browser-demo'>('connecting');
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenario, setScenario] = useState('bearish_liquidity_sweep');

  useEffect(() => {
    if (usesBrowserDemo()) {
      let frame = 0;
      const replay = () => setSnapshot(browserDemoSnapshot(scenario as Parameters<typeof browserDemoSnapshot>[0], frame++));
      replay();
      const timer = window.setInterval(replay, 900);
      return () => window.clearInterval(timer);
    }
    let socket: WebSocket | undefined;
    let reconnectTimer: number | undefined;
    let active = true;
    getSnapshot().then((data) => active && setSnapshot(data)).catch(() => active && setConnection('reconnecting'));
    const connect = () => {
      const url = marketSocketUrl();
      if (!url) return;
      socket = new WebSocket(url);
      socket.onopen = () => active && setConnection('live');
      socket.onmessage = (event) => active && setSnapshot(JSON.parse(event.data) as MarketSnapshot);
      socket.onclose = () => {
        if (!active) return;
        setConnection('reconnecting');
        reconnectTimer = window.setTimeout(connect, 1500);
      };
      socket.onerror = () => socket?.close();
    };
    connect();
    return () => { active = false; socket?.close(); if (reconnectTimer) window.clearTimeout(reconnectTimer); };
  }, [scenario]);

  async function changeScenario(scenario: string) {
    setScenarioLoading(true);
    try {
      if (usesBrowserDemo()) setScenario(scenario);
      else await setDemoScenario(scenario);
    } finally { setScenarioLoading(false); }
  }

  if (!snapshot) return <SnapshotLoading />;
  const latestBucket = snapshot.order_flow_buckets.at(-1);
  const displayConnection = usesBrowserDemo() ? 'browser-demo' : connection;
  const isBearish = snapshot.alignment.direction === 'BEARISH';
  const stateTone = isBearish ? 'text-rose-300' : snapshot.alignment.direction === 'BULLISH' ? 'text-emerald-300' : 'text-violet-200';

  return (
    <main className="terminal-grid min-h-screen bg-[#0d0b13] text-zinc-100">
      <div className="mx-auto max-w-[1550px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-5 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 text-lg font-black text-white shadow-[0_0_30px_-6px_rgba(168,85,247,.8)]">T</div><div><p className="text-lg font-black tracking-[.16em]">TOFAUTI</p><p className="text-[10px] font-bold uppercase tracking-[.2em] text-zinc-500">Market intelligence system</p></div></div>
          <TerminalNav />
          <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] ${displayConnection === 'live' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : displayConnection === 'browser-demo' ? 'border-violet-400/25 bg-violet-400/10 text-violet-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-300'}`}><Radio size={12} className={displayConnection === 'live' || displayConnection === 'browser-demo' ? 'animate-pulse' : ''} />{displayConnection === 'live' ? 'Demo stream connected' : displayConnection === 'browser-demo' ? 'Public browser demo' : 'Reconnecting to stream'}</div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1.7fr_.85fr]">
          <section className="panel relative overflow-hidden rounded-3xl p-6 sm:p-8"><div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl" /><div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start"><div><div className="flex items-center gap-3"><p className="text-4xl font-black tracking-tight">{snapshot.instrument.symbol}</p><span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold tracking-[.15em] text-zinc-400">{snapshot.instrument.exchange}</span></div><p className="mt-1 text-sm text-zinc-400">{snapshot.instrument.name} <span className="text-zinc-600">|</span> deterministic market simulation</p></div><div className="sm:text-right"><p className="text-4xl font-black tabular-nums">{snapshot.price.toFixed(1)}</p><p className={`mt-1 inline-flex items-center gap-1 text-sm font-bold ${snapshot.change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{snapshot.change >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{snapshot.change >= 0 ? '+' : ''}{snapshot.change.toFixed(1)} simulated session move</p></div></div>
            <div className="relative mt-9 border-t border-white/10 pt-7"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-zinc-500">Calculated market state</p><div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-2"><h1 className={`signal-glow text-4xl font-black tracking-tight sm:text-5xl ${stateTone}`}>{snapshot.alignment.direction}</h1><span className="text-lg font-bold text-zinc-300">{snapshot.war_room_state.replaceAll('_', ' ')}</span></div><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{snapshot.alignment.summary} TOFAUTI reports calculated state and evidence, not a buy/sell instruction.</p></div>
          </section>
          <section className="panel rounded-3xl p-6"><div className="flex items-center gap-2 text-violet-300"><Bot size={17} /><p className="text-xs font-black uppercase tracking-[.18em]">Analyst boundary</p></div><p className="mt-4 text-lg font-bold">Explanation only. No invented signals.</p><p className="mt-3 text-sm leading-6 text-zinc-400">The local MockAIAnalyst will explain this stored snapshot when added; engine layers own all calculations and state changes.</p><div className="mt-5 rounded-xl border border-violet-300/15 bg-violet-300/5 p-3 text-xs leading-5 text-violet-100">Ask next: “Why is Gold {snapshot.alignment.direction.toLowerCase()}?”</div></section>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><StateCard label="Macro" state={snapshot.macro} /><StateCard label="Structure" state={snapshot.structure} /><StateCard label="Order flow" state={snapshot.order_flow} /><StateCard label="Liquidity" state={snapshot.liquidity} /></div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_.95fr]">
          <section className="panel rounded-3xl p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">GC simulated price action</p><p className="mt-1 text-lg font-bold">Candles, marked levels, and sweep context</p></div><span className="rounded-full bg-violet-300/10 px-3 py-1.5 text-xs font-bold text-violet-200">{snapshot.scenario.replaceAll('_', ' ')}</span></div><CandlestickChart snapshot={snapshot} /></section>
          <section className="panel rounded-3xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">Alignment</p><p className="mt-1 text-xl font-black">{snapshot.alignment.state.replaceAll('_', ' ')}</p></div><Gauge className={stateTone} size={28} /></div><div className="mt-6 grid grid-cols-2 gap-3 text-sm"><Metric label="Internal strength" value={`${snapshot.alignment.score > 0 ? '+' : ''}${snapshot.alignment.score}`} /><Metric label="Display strength" value={snapshot.alignment.strength} /><Metric label="Current delta" value={String(latestBucket?.delta ?? 0)} tone={(latestBucket?.delta ?? 0) >= 0 ? 'good' : 'bad'} /><Metric label="Cumulative delta" value={String(latestBucket?.cumulative_delta ?? 0)} tone={(latestBucket?.cumulative_delta ?? 0) >= 0 ? 'good' : 'bad'} /></div><div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs leading-5 text-zinc-400">{snapshot.alignment.evidence ? 'All four layers are shown separately so disagreement is visible rather than hidden.' : 'Evidence is still building.'}</p></div></section>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <section className="panel rounded-3xl p-5 sm:p-6"><div className="flex items-center gap-2"><Zap className="text-violet-300" size={18} /><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">Live order flow</p><p className="mt-1 text-lg font-bold">Recent simulated 5-minute buckets</p></div></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[.15em] text-zinc-500"><tr><th className="pb-3">Time</th><th className="pb-3">Delta</th><th className="pb-3">Delta change</th><th className="pb-3">Volume</th><th className="pb-3">Buy %</th><th className="pb-3">Sell %</th></tr></thead><tbody>{snapshot.order_flow_buckets.slice().reverse().map((bucket) => <tr key={bucket.start} className="border-b border-white/[.06] text-zinc-300"><td className="py-3">{new Date(bucket.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td className={bucket.delta >= 0 ? 'font-bold text-emerald-300' : 'font-bold text-rose-300'}>{bucket.delta}</td><td>{bucket.delta_change > 0 ? '+' : ''}{bucket.delta_change}</td><td>{bucket.total_volume.toLocaleString()}</td><td>{bucket.buy_percentage}%</td><td>{bucket.sell_percentage}%</td></tr>)}</tbody></table></div></section>
          <section className="panel rounded-3xl p-5 sm:p-6"><div className="flex items-center gap-2"><CircleDotDashed className="text-violet-300" size={18} /><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">Key levels</p><p className="mt-1 text-lg font-bold">Explainable reference map</p></div></div><div className="mt-5 space-y-2">{snapshot.levels.map((level) => <div key={level.id} className="flex items-center justify-between rounded-xl border border-white/[.07] bg-white/[.025] px-4 py-3"><div><p className="font-bold text-zinc-200">{level.type}</p><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-zinc-500">{level.strength} · {level.touches} touches</p></div><p className="font-mono text-base font-bold text-white">{level.price.toFixed(1)}</p></div>)}</div></section>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
          <section className="panel rounded-3xl p-5 sm:p-6"><div className="flex items-center gap-2"><ShieldAlert className="text-violet-300" size={18} /><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">War Room timeline</p><p className="mt-1 text-lg font-bold">Calculated sequence of events</p></div></div><div className="mt-5 space-y-3">{snapshot.events.length === 0 ? <p className="rounded-xl border border-white/10 p-4 text-sm text-zinc-400">Scanning for a marked level interaction.</p> : snapshot.events.map((event) => <article key={event.id} className="grid grid-cols-[65px_1fr] gap-4 rounded-xl border border-white/[.07] bg-white/[.025] p-4"><p className="pt-0.5 font-mono text-xs text-violet-300">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><div><p className="font-bold text-zinc-100">{event.title}</p><p className="mt-1 text-xs leading-5 text-zinc-400">{event.description}</p></div></article>)}</div></section>
          <section className="panel rounded-3xl p-5 sm:p-6"><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">Developer demo controls</p><p className="mt-1 text-lg font-bold">Replay calculated environments</p><p className="mt-2 text-xs leading-5 text-zinc-400">Scenario selection only changes mock provider inputs. It does not call a broker or external data feed.</p><div className="mt-5 grid gap-2">{scenarios.map(([value, label]) => <button key={value} disabled={scenarioLoading} onClick={() => changeScenario(value)} className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition ${snapshot.scenario === value ? 'border-violet-300/40 bg-violet-300/15 text-violet-100' : 'border-white/10 bg-white/[.025] text-zinc-400 hover:border-white/20 hover:text-white'}`}>{label}</button>)}</div>{snapshot.setup && <div className="mt-5 rounded-xl border border-rose-300/25 bg-rose-300/[.08] p-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-rose-200">Stored confirmed setup</p><p className="mt-2 font-bold">{snapshot.setup.id} · {snapshot.setup.direction}</p><p className="mt-2 text-xs text-rose-100/75">Entry {snapshot.setup.entry_reference.toFixed(1)} · Invalid {snapshot.setup.invalidation.toFixed(1)} · T1 {snapshot.setup.target1.toFixed(1)}</p></div>}</section>
        </div>
        <footer className="py-8 text-center text-[10px] uppercase tracking-[.16em] text-zinc-600">Demo data only · Explainable calculated states · Not financial advice</footer>
      </div>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) { return <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-3"><p className="text-[10px] uppercase tracking-[.14em] text-zinc-500">{label}</p><p className={`mt-2 text-lg font-black ${tone === 'good' ? 'text-emerald-300' : tone === 'bad' ? 'text-rose-300' : 'text-zinc-100'}`}>{value}</p></div>; }
