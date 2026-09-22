'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpenCheck, CheckCircle2, Database, Layers3, Settings2, ShieldCheck, Waves } from 'lucide-react';
import { analyzeLivePriceAction } from '@/lib/live-price-action';
import type { LiveSpotSymbol } from '@/lib/live-spot';
import { AuthPanel } from './auth-panel';
import { GlobalSessionClock } from './global-session-clock';
import { LiveSpotChart } from './live-spot-chart';
import { LiveSpotMarket } from './live-spot-market';
import { OfficialMacroRisk } from './official-macro-risk';
import { TerminalNav } from './terminal-nav';
import { TimezoneSettings } from './timezone-settings';
import { useLiveSpotMarket } from './use-live-spot-market';
import { WatchlistPanel } from './watchlist-panel';

const content: Record<string, { title: string; eyebrow: string }> = {
  macro: { title: 'Macro Risk Schedule', eyebrow: 'Verified source coverage' },
  'order-flow': { title: 'Order Flow Coverage', eyebrow: 'Feed availability' },
  levels: { title: 'Live Level Map', eyebrow: 'Price-action references' },
  journal: { title: 'Observed Setup Journal', eyebrow: 'Evidence retention' },
  guide: { title: 'How To Use TOFAUTI', eyebrow: 'Effective operating workflow' },
  settings: { title: 'System Settings', eyebrow: 'Runtime configuration' },
};

function priceDigits(market: LiveSpotSymbol) {
  return market === 'USD/JPY' ? 3 : market === 'XAU/USD' ? 2 : 5;
}

function Shell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return <main className="terminal-grid min-h-screen bg-[#0d0b13] p-5 text-zinc-100 sm:p-8"><div className="mx-auto max-w-7xl"><header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-5 xl:flex-row xl:items-center"><Link href="/war-room" className="inline-flex items-center gap-3 text-lg font-black tracking-[.16em]"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-300 text-[#171122]">T</span>TOFAUTI</Link><TerminalNav /></header><section className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[.035] p-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.24em] text-violet-300">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1></div><Link href="/war-room" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white"><ArrowLeft size={15} /> Back to War Room</Link></section><aside className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4 text-sm leading-6 text-cyan-50">Public screens use provider-reported spot OHLC bars and the official FOMC schedule. They do not render browser replay data or substitute unavailable macro and order-flow inputs.</aside>{children}</div></main>;
}

function LiveWorkspace({ children }: { children: (args: ReturnType<typeof useLiveSpotMarket> & { analysis: ReturnType<typeof analyzeLivePriceAction> }) => React.ReactNode }) {
  const workspace = useLiveSpotMarket('XAU/USD');
  if (!workspace.market) return <LiveSpotMarket {...workspace} />;
  return <>{children({ ...workspace, analysis: analyzeLivePriceAction(workspace.market) })}</>;
}

export function IntelligenceView({ view }: { view: string }) {
  const item = content[view] ?? { title: 'Not found', eyebrow: 'TOFAUTI' };
  if (view === 'settings') return <Shell {...item}><SettingsView /></Shell>;
  if (view === 'guide') return <Shell {...item}><GuideView /></Shell>;
  return <Shell {...item}><LiveWorkspace>{(workspace) => {
    if (view === 'macro') return <MacroView {...workspace} />;
    if (view === 'order-flow') return <OrderFlowView {...workspace} />;
    if (view === 'levels') return <LevelsView {...workspace} />;
    if (view === 'journal') return <JournalView {...workspace} />;
    return <p className="text-zinc-400">This TOFAUTI view is not available.</p>;
  }}</LiveWorkspace></Shell>;
}

function MacroView({ selectedMarket, setSelectedMarket, market, error, now }: ReturnType<typeof useLiveSpotMarket> & { analysis: ReturnType<typeof analyzeLivePriceAction> }) {
  return <><div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]"><LiveSpotMarket selectedMarket={selectedMarket} setSelectedMarket={setSelectedMarket} market={market} error={error} now={now} /><OfficialMacroRisk /></div><section className="panel mt-5 rounded-3xl p-6"><p className="text-[10px] font-black uppercase tracking-[.18em] text-zinc-500">Directional macro status</p><p className="mt-3 text-2xl font-black text-amber-200">WITHHELD</p><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">The product currently has an official FOMC schedule only. It does not have a verified live USD index, real-yields, inflation, risk-sentiment, central-bank-demand, consensus, or released-data feed. Therefore it does not create a bullish or bearish macro score.</p></section></>;
}

function OrderFlowView({ selectedMarket, setSelectedMarket, market, error, now }: ReturnType<typeof useLiveSpotMarket> & { analysis: ReturnType<typeof analyzeLivePriceAction> }) {
  if (!market) return <LiveSpotMarket selectedMarket={selectedMarket} setSelectedMarket={setSelectedMarket} market={market} error={error} now={now} />;
  return <><div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><section className="panel rounded-3xl p-5"><p className="mb-4 text-lg font-black">Live provider price bars</p><LiveSpotChart market={market} /></section><section className="panel rounded-3xl border-amber-300/20 p-6"><Waves className="text-amber-200" /><p className="mt-4 text-lg font-black">True order flow is unavailable</p><p className="mt-3 text-sm leading-6 text-zinc-400">The selected provider supplies one-minute OHLC bars only. It does not provide trade aggressor side, exchange volume, delta, cumulative delta, buy/sell percentages, DOM, or CME market-by-order data. This screen deliberately does not turn candle movement into fake order flow.</p></section></div><div className="mt-5"><LiveSpotMarket selectedMarket={selectedMarket} setSelectedMarket={setSelectedMarket} market={market} error={error} now={now} /></div></>;
}

function LevelsView({ selectedMarket, setSelectedMarket, market, error, now, analysis }: ReturnType<typeof useLiveSpotMarket> & { analysis: ReturnType<typeof analyzeLivePriceAction> }) {
  if (!market) return <LiveSpotMarket selectedMarket={selectedMarket} setSelectedMarket={setSelectedMarket} market={market} error={error} now={now} />;
  const digits = priceDigits(selectedMarket);
  const format = new Intl.NumberFormat(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return <><LiveSpotMarket selectedMarket={selectedMarket} setSelectedMarket={setSelectedMarket} market={market} error={error} now={now} /><section className="panel mt-5 rounded-3xl p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-lg font-black">{market.market} price-action references</p><p className="mt-1 text-sm text-zinc-400">Current provider bar close: <span className="font-mono font-bold text-white">{format.format(market.price)}</span></p></div><Layers3 className="text-cyan-200" /></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[.15em] text-zinc-500"><tr><th className="pb-3">Reference</th><th className="pb-3">Price</th><th className="pb-3">Distance</th><th className="pb-3">Strength</th><th className="pb-3">Touches</th></tr></thead><tbody>{analysis.levels.map((level) => <tr key={level.id} className="border-b border-white/[.06] text-zinc-300"><td className="py-4 font-bold text-zinc-100">{level.type}</td><td className="font-mono">{format.format(level.price)}</td><td className={level.distance >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{level.distance >= 0 ? '+' : ''}{format.format(level.distance)}</td><td>{level.strength}</td><td>{level.touches}</td></tr>)}</tbody></table></div><p className="mt-5 text-xs leading-5 text-zinc-500">Levels are mathematical references from returned bars, not manually verified supply, demand, VWAP, or exchange liquidity levels.</p></section></>;
}

function JournalView({ selectedMarket, setSelectedMarket, market, error, now }: ReturnType<typeof useLiveSpotMarket> & { analysis: ReturnType<typeof analyzeLivePriceAction> }) {
  return <><LiveSpotMarket selectedMarket={selectedMarket} setSelectedMarket={setSelectedMarket} market={market} error={error} now={now} /><section className="panel mt-5 rounded-3xl p-6"><BookOpenCheck className="text-cyan-200" size={18} /><p className="mt-4 text-lg font-black">No automatic live setup journal yet</p><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">TOFAUTI does not create, score, or journal a live setup from spot OHLC alone. Durable setup records will begin only after a verified market-data pipeline, optional user authentication, and explicit setup criteria are connected. This avoids presenting a simulated or incomplete record as a live trade journal.</p></section></>;
}

function SettingsView() {
  return <><div className="grid gap-5 lg:grid-cols-2"><TimezoneSettings /><section className="panel rounded-3xl p-6"><Settings2 className="text-cyan-200" /><p className="mt-4 text-lg font-black">Public runtime</p><p className="mt-2 text-sm leading-6 text-zinc-400">The public workspace uses a server-only Twelve Data key for selected spot-market OHLC bars and a cached Federal Reserve FOMC schedule. The browser never receives the provider secret. No browser simulation provider is mounted in the public app.</p></section><section className="panel rounded-3xl p-6"><Database className="text-cyan-200" /><p className="mt-4 text-lg font-black">What needs a provider</p><p className="mt-2 text-sm leading-6 text-zinc-400">True GC/MGC futures prices and order flow require a licensed futures provider such as Databento with the right CME entitlements. Directional macro analysis needs separately verified macro feeds. Neither is approximated from the current spot bars.</p><div className="mt-5 flex items-center gap-2 text-xs text-zinc-400"><ShieldCheck size={15} className="text-emerald-300" /> Auth and personal watchlists remain separately scoped.</div></section><section className="panel rounded-3xl p-6"><BookOpenCheck className="text-cyan-200" /><p className="mt-4 text-lg font-black">Use the workspace deliberately</p><p className="mt-2 text-sm leading-6 text-zinc-400">Set your display timezone, use the Global Session Clock to understand timing, check scheduled risk, then interpret only the live layers with an identified source.</p><Link href="/guide" className="mt-5 inline-flex text-sm font-bold text-violet-200 hover:text-violet-100">Read the effective-use guide</Link></section></div><div className="mt-5 grid gap-5 lg:grid-cols-2"><AuthPanel /><WatchlistPanel /></div></>;
}

function GuideView() {
  const steps = [
    ['1', 'Set the display clock', 'In Settings, choose your IANA timezone. Source timestamps stay intact while bars and timeline events display in the timezone you select.'],
    ['2', 'Start with timing', 'Use the Global Session Clock on the War Room to see the regional windows that are active and whether London and New York overlap. Session status describes timing, not volume or a trading signal.'],
    ['3', 'Check scheduled risk', 'Read the official FOMC panel before reviewing the latest bars. HIGH, MEDIUM, and LOW are expected-volatility categories, not direction, probability, or price targets.'],
    ['4', 'Choose the right market', 'Select XAU/USD, EUR/USD, GBP/USD, or USD/JPY. Confirm the source, the latest-bar age, and the selected instrument before interpreting any state.'],
    ['5', 'Read the verified layers', 'Structure and range interaction are calculated only from the returned spot OHLC bars. Read their evidence and timeline together; neither is an entry instruction.'],
    ['6', 'Respect unavailable layers', 'TOFAUTI withholds true exchange order flow and directional macro conclusions until dedicated verified data is connected. Do not treat an unavailable layer as neutral or infer it from candles.'],
  ];
  return <><div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><section className="panel rounded-3xl p-6"><div className="flex items-center gap-2 text-violet-200"><BookOpenCheck size={18} /><p className="text-[10px] font-black uppercase tracking-[.18em]">Six-step workflow</p></div><h2 className="mt-4 text-2xl font-black">Use context before interpretation.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">The platform is designed to make source-backed context visible quickly. It is not a signal generator, a broker tool, or a substitute for your own risk process.</p><div className="mt-6 space-y-3">{steps.map(([number, title, detail]) => <article key={number} className="grid grid-cols-[38px_1fr] gap-4 rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-300/10 text-xs font-black text-violet-100">{number}</span><div><p className="font-bold text-zinc-100">{title}</p><p className="mt-1 text-sm leading-6 text-zinc-400">{detail}</p></div></article>)}</div></section><div className="space-y-5"><GlobalSessionClock /><section className="panel rounded-3xl border-amber-300/20 p-6"><div className="flex items-center gap-2 text-amber-200"><CheckCircle2 size={18} /><p className="text-[10px] font-black uppercase tracking-[.18em]">Truthful-use check</p></div><p className="mt-4 text-lg font-black">Before relying on a screen</p><ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-400"><li>Confirm the provider, instrument, and freshness.</li><li>Separate spot price action from futures, order flow, and macro data.</li><li>Read event impact as volatility sensitivity only.</li><li>Do not turn calculated state into a probability or execution instruction.</li></ul></section></div></div></>;
}
