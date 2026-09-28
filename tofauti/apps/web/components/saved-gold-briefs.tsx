'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';
import type { GoldBriefRecord } from '@/lib/gold-brief';
import { GOLD_BRIEFS_ENABLED } from '@/lib/brief-availability';
import { formatTimeInZone, useUserTimezone } from './use-user-timezone';
import { useGoldBriefs } from './use-gold-briefs';

export function SavedGoldBriefs() {
  const { userId, briefs, loading, message, review } = useGoldBriefs();
  const { timeZone } = useUserTimezone();
  if (!GOLD_BRIEFS_ENABLED) return <section className="panel rounded-3xl border-amber-300/20 p-6"><BookOpenCheck className="text-amber-200" size={18} /><h2 className="mt-4 text-xl font-black">Gold Brief history is being prepared</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">The shared Kaizen Supabase brief table and owner access need verification before cloud saving opens. You can view the current source-backed Gold Brief in the <Link href="/war-room" className="font-bold text-amber-200 underline">War Room</Link>.</p></section>;
  return <section className="panel rounded-3xl p-6"><div className="flex items-center gap-2 text-cyan-200"><BookOpenCheck size={18} /><p className="text-[10px] font-black uppercase tracking-[.18em]">Personal Gold Brief history</p></div><h2 className="mt-3 text-xl font-black">Plan, then review what happened</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">Each saved brief retains its source timestamp, spot bar, calculated context, your planned conditions, and your post-session note. These are personal observations, not system-generated trades.</p>
    {!userId ? <p className="mt-5 text-sm text-amber-100">Sign in from <Link href="/settings" className="font-bold underline">Settings</Link> to load your private briefs.</p> : loading ? <p className="mt-5 text-sm text-zinc-400">Loading saved briefs...</p> : !briefs.length ? <p className="mt-5 text-sm text-zinc-400">No saved Gold Briefs yet. Start from the <Link href="/war-room" className="font-bold text-cyan-200 underline">War Room</Link>.</p> : <><div className="mt-5 grid gap-3 sm:grid-cols-3"><Count label="Briefs saved" value={briefs.length} /><Count label="Reviewed" value={briefs.filter((brief) => brief.reviewed_at).length} /><Count label="Plan followed" value={briefs.filter((brief) => brief.review_outcome === 'FOLLOWED_PLAN').length} /></div><p className="mt-3 text-xs text-zinc-500">Counts include the latest 100 personal briefs loaded here. They measure your review process, not trading performance.</p><div className="mt-5 space-y-4">{briefs.map((brief) => <SavedBrief key={brief.id} brief={brief} timeZone={timeZone} review={review} />)}</div></>}{message && <p role="status" className="mt-4 text-xs text-amber-200">{message}</p>}
  </section>;
}

function Count({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-white/[.08] bg-white/[.025] p-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-zinc-500">{label}</p><p className="mt-2 text-2xl font-black text-white">{value}</p></div>;
}

function SavedBrief({ brief, timeZone, review }: { brief: GoldBriefRecord; timeZone: string; review: (id: string, note: string, outcome: Exclude<GoldBriefRecord['review_outcome'], null>) => Promise<void> }) {
  const [note, setNote] = useState(brief.post_session_note ?? '');
  const [outcome, setOutcome] = useState<GoldBriefRecord['review_outcome']>(brief.review_outcome);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const snapshot = brief.snapshot;
  async function saveNote() {
    if (!note.trim() || !outcome) { setMessage('Choose a process outcome and write a review note.'); return; }
    if (note.length > 5000) { setMessage('Review note must be 5,000 characters or less.'); return; }
    setPending(true);
    setMessage('');
    try { await review(brief.id, note.trim(), outcome); setMessage('Review saved.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save the review.'); }
    finally { setPending(false); }
  }
  return <article className="rounded-2xl border border-white/[.08] bg-white/[.025] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-black text-white">XAU/USD · {snapshot?.source?.provider ?? 'Source unavailable'}</p><p className="mt-1 text-xs text-zinc-400">Saved {formatTimeInZone(brief.created_at, timeZone, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · source bar {formatTimeInZone(brief.source_as_of, timeZone, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</p></div><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold text-zinc-300">{brief.reviewed_at ? 'REVIEWED' : 'AWAITING REVIEW'}</span></div>
    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-xs text-zinc-500">Observed spot close</p><p className="font-mono font-bold text-white">{snapshot?.price?.toFixed(2) ?? 'Unavailable'}</p></div><div><p className="text-xs text-zinc-500">Structure at capture</p><p className="font-bold text-zinc-200">{snapshot?.structure?.direction ?? 'Unavailable'}</p></div><div><p className="text-xs text-zinc-500">Invalidation you set</p><p className="font-mono font-bold text-zinc-200">{brief.invalidation_price?.toFixed(2) ?? 'None'}</p></div></div>
    <p className="mt-4 text-sm leading-6 text-zinc-300"><strong className="text-white">Plan:</strong> {brief.scenario}</p><p className="mt-2 text-xs leading-5 text-zinc-500">{snapshot?.summary} {snapshot?.scheduled_risk ? `Scheduled: ${snapshot.scheduled_risk.title} on ${snapshot.scheduled_risk.date} (${snapshot.scheduled_risk.impact} expected volatility).` : 'Official schedule information was unavailable or had no upcoming meeting at capture.'}</p>
    <div className="mt-5 grid gap-3 md:grid-cols-[220px_1fr]"><label className="text-[10px] font-black uppercase tracking-[.14em] text-zinc-400">Process outcome<select value={outcome ?? ''} onChange={(event) => setOutcome(event.target.value as GoldBriefRecord['review_outcome'])} className="mt-2 w-full rounded-xl border border-white/10 bg-[#100e17] p-3 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-cyan-300/50"><option value="">Choose outcome</option><option value="FOLLOWED_PLAN">Followed my plan</option><option value="CHANGED_PLAN">Changed my plan</option><option value="NO_ACTION">No action taken</option></select></label><label className="text-[10px] font-black uppercase tracking-[.14em] text-zinc-400">Post-session review<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={5000} rows={3} placeholder="What happened, what did you follow, and what would you change?" className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#100e17] p-3 text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300/50" /></label></div><button type="button" onClick={() => void saveNote()} disabled={pending || !note.trim() || !outcome} className="mt-3 rounded-xl border border-cyan-200/30 px-4 py-2 text-xs font-black text-cyan-100 disabled:opacity-40">{pending ? 'Saving...' : 'Save review'}</button>{message && <p role="status" className="mt-2 text-xs text-cyan-200">{message}</p>}
  </article>;
}
