import Link from 'next/link';
import { Activity, BookOpen, ChartNoAxesCombined, Layers3, Settings, Waves } from 'lucide-react';

const items = [
  { href: '/war-room', label: 'War Room', icon: Activity },
  { href: '/order-flow', label: 'Order Flow', icon: Waves },
  { href: '/macro', label: 'Macro', icon: ChartNoAxesCombined },
  { href: '/levels', label: 'Levels', icon: Layers3 },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function TerminalNav() {
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 text-xs font-bold uppercase tracking-[.12em] text-zinc-400 transition hover:border-violet-300/35 hover:bg-violet-400/10 hover:text-white"><Icon size={14} />{label}</Link>)}
    </nav>
  );
}
