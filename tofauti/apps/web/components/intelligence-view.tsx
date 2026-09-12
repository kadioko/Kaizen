'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TerminalNav } from './terminal-nav';

const content: Record<string, { title: string; description: string }> = {
  macro: { title: 'Gold Macro Intelligence', description: 'Mock USD, real-yield, risk-sentiment, inflation, and central-bank inputs will be rendered from the same real-time MarketSnapshot.' },
  'order-flow': { title: 'Order Flow', description: 'The vertical slice already streams 5-minute delta buckets into War Room. This dedicated view is reserved for delta histograms and cumulative-delta study.' },
  levels: { title: 'Level Map', description: 'Supply, demand, VWAP, previous-day references, session extremes, and round numbers are calculated in the market engine and shown in War Room.' },
  journal: { title: 'Setup Journal', description: 'Confirmed setups will appear here with snapshot evidence and observed 5/15/30/60-minute outcomes once persistence is switched on.' },
  settings: { title: 'Demo Settings', description: 'The MVP runs in deterministic demo mode. Scenario controls are available in the War Room while provider and database configuration lives in environment settings.' },
};

export function IntelligenceView({ view }: { view: string }) {
  const item = content[view] ?? { title: 'Not found', description: 'This TOFAUTI view is not available.' };
  return <main className="terminal-grid min-h-screen bg-[#0d0b13] p-5 text-zinc-100 sm:p-8"><div className="mx-auto max-w-6xl"><header className="mb-12 flex flex-col justify-between gap-5 border-b border-white/10 pb-5 lg:flex-row lg:items-center"><Link href="/war-room" className="text-lg font-black tracking-[.16em]">TOFAUTI</Link><TerminalNav /></header><section className="panel max-w-3xl rounded-3xl p-8 sm:p-12"><p className="text-xs font-black uppercase tracking-[.25em] text-violet-300">V0.1 workspace</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{item.title}</h1><p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">{item.description}</p><Link href="/war-room" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-violet-300 px-4 py-3 text-sm font-black text-[#171122]">Open live War Room <ArrowRight size={16} /></Link></section></div></main>;
}
