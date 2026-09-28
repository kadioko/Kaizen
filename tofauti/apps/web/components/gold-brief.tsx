'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenCheck, Compass, Save } from 'lucide-react';
import { buildGoldBriefSnapshot } from '@/lib/gold-brief';
import { GOLD_BRIEFS_ENABLED } from '@/lib/brief-availability';
import { liveSpotAge, type LiveSpotMarket } from '@/lib/live-spot';
import type { LivePriceActionAnalysis } from '@/lib/live-price-action';
import { getOfficialMacroSchedule, type OfficialMacroSchedule } from '@/lib/official-macro';
import { describeActiveSessions, getMarketSessionStatuses } from '@/lib/market-sessions';
import { useGoldBriefs } from './use-gold-briefs';

export function GoldBrief({ market, analysis, now }: { market: LiveSpotMarket; analysis: LivePriceActionAnalysis; now: number }) {
  const [schedule, setSchedule] = useState<OfficialMacroSchedule | null>(null);
  const [scheduleError, setScheduleError] = useState(false);
  const [scenario, setScenario] = useState('');
  const [invalidation, setInvalidation] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const { userId, save } = useGoldBriefs();

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void getOfficialMacroSchedule(AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]))
      .then((value) => { if (active) setSchedule(value); })
      .catch(() => { if (active) setScheduleError(true); });
    return () => { active = false; controller.abort(); };
  }, []);

  if (market.market !== 'XAU/USD') return null;
  const fresh = liveSpotAge(market.as_of, now) <= 360;
  const nearest = [...analysis.levels].sort((left, right) => Math.abs(left.distance) - Math.abs(right.distance)).slice(0, 3);
  const nextEvent = schedule?.events.find((event) => Date.parse(`${event.date}T23:59:59Z`) >= now);
  const activeSessions = describeActiveSessions(getMarketSessionStatuses(new Date(now)));

  async function submit() {
    const plan = scenario.trim();
    if (!plan || plan.length > 2000) { setMessage('Describe a scenario to monitor in 1 to 2,000 characters.'); return; }
    const invalidationPrice = invalidation.trim() ? Number(invalidation) : null;
    if (invalidationPrice !== null && (!Number.isFinite(invalidationPrice) || invalidationPrice <= 0)) { setMessage('Invalidation must be a positive price, or left blank.'); return; }
    setPending(true);
    setMessage('');
    try {
      await save(buildGoldBriefSnapshot(market, analysis, schedule, Date.now()), plan, invalidationPrice);
      setScenario('');
      setInvalidation('');
      setMessage('Brief saved to your Kaizen account. Open Journal to review it later.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save this brief.');
    } finally { setPending(false); }
  }

  return <section className="panel mt-5 rounded-3xl border-amber-300/20 p-6 sm:p-7" aria-labelledby="gold-brief-heading">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-amber-200"><Compass size={18} /><p className="text-[10px] font-black uppercase tracking-[.2em]">Daily Gold Brief</p></div><h2 id="gold-brief-heading" className="mt-3 text-2xl font-black text-white">Context to carry into your session</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Observed XAU/USD spot bars, calculated references, regional clock windows, and published FOMC dates. Save your own conditions and review them later.</p></div><span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[10px] font-black text-amber-100">{fresh ? 'CURRENT BAR' : 'CAPTURE PAUSED'}</span></div>
    <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><BriefFact label="Structure" value={`${analysis.structure.direction} · ${analysis.structure.strength}`} detail={analysis.structure.summary} /><BriefFact label="Current session windows" value={activeSessions} detail="Regional time windows, not measured participation." /><BriefFact label="Nearby bar references" value={nearest.map((level) => `${level.type} ${level.price.toFixed(2)}`).join(' · ')} detail="Derived from the returned one-minute bars only." /><BriefFact label="Scheduled risk" value={nextEvent ? `${nextEvent.title} · ${nextEvent.date}` : scheduleError ? 'Official schedule unavailable' : schedule ? 'No upcoming published meeting' : 'Checking official schedule'} detail={nextEvent ? `${nextEvent.expected_volatility_impact} expected volatility · ${nextEvent.source_name}. Exact release time is not supplied.` : 'FOMC meeting dates only; other releases are not covered.'} /></div>
    <p className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-300/[.04] p-4 text-sm leading-6 text-zinc-200">{analysis.structure.summary} {analysis.range_interaction.summary}</p>
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px_auto]"><label className="text-[10px] font-black uppercase tracking-[.15em] text-zinc-400">Conditions to monitor<textarea value={scenario} onChange={(event) => setScenario(event.target.value)} maxLength={2000} rows={3} placeholder="What would confirm or change your own plan?" className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#100e17] p-3 text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-zinc-600 focus:border-amber-300/50" /></label><label className="text-[10px] font-black uppercase tracking-[.15em] text-zinc-400">Invalidation price (optional)<input value={invalidation} onChange={(event) => setInvalidation(event.target.value)} inputMode="decimal" placeholder="e.g. 2650.00" className="mt-2 w-full rounded-xl border border-white/10 bg-[#100e17] p-3 text-sm font-normal tracking-normal text-white outline-none placeholder:text-zinc-600 focus:border-amber-300/50" /><span className="mt-2 block text-xs font-normal normal-case tracking-normal text-zinc-500">Your own reference, never an auto stop.</span></label><div className="self-end"><button type="button" onClick={() => void submit()} disabled={!GOLD_BRIEFS_ENABLED || !userId || !fresh || pending || !scenario.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-200 px-4 py-3 text-xs font-black text-[#221817] disabled:cursor-not-allowed disabled:opacity-40"><Save size={15} />{pending ? 'Saving...' : 'Save brief'}</button></div></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400"><p>{!GOLD_BRIEFS_ENABLED ? 'Cloud saving is paused while the shared Kaizen database table and owner access are verified. Your draft stays on this page only.' : userId ? 'Saved briefs belong to your Kaizen account.' : <>Sign in from <Link href="/settings" className="font-bold text-amber-200 underline">Settings</Link> to save.</>} {scheduleError ? 'News schedule is unavailable and will be marked as such in a saved snapshot.' : ''}</p><Link href="/journal" className="inline-flex items-center gap-1 font-bold text-amber-200 hover:text-white"><BookOpenCheck size={14} /> Open Journal</Link></div>{message && <p role="status" className="mt-3 text-xs text-amber-100">{message}</p>}
  </section>;
}

function BriefFact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-zinc-500">{label}</p><p className="mt-2 text-sm font-bold text-zinc-100">{value}</p><p className="mt-2 text-xs leading-5 text-zinc-500">{detail}</p></div>;
}
