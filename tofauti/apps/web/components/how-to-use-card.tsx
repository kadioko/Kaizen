import Link from 'next/link';
import { ArrowUpRight, BookOpenCheck } from 'lucide-react';

export function HowToUseCard() {
  return <section className="panel rounded-3xl border-violet-300/20 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-violet-200"><BookOpenCheck size={18} /><p className="text-[10px] font-black uppercase tracking-[.18em]">Effective workflow</p></div><p className="mt-3 text-lg font-black text-white">Context before interpretation</p><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Set your timezone, note active session overlaps and scheduled risk, then assess only the verified price-action layers. The guide explains the safe operating sequence and the limits of each live input.</p></div><Link href="/guide" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-violet-300/25 bg-violet-300/10 px-3 py-2 text-xs font-black uppercase tracking-[.12em] text-violet-100 transition hover:bg-violet-300/20">Open guide<ArrowUpRight size={14} /></Link></div></section>;
}
