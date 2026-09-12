'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export function WatchlistPanel() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    if (!supabaseBrowser) return;
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) return;
    const { data, error } = await supabaseBrowser.from('tofauti_watchlists').select('symbol').order('created_at');
    if (error) setMessage(error.message);
    else setSymbols(data.map((item) => item.symbol));
  }

  async function add(symbol: 'GC' | 'MGC') {
    if (!supabaseBrowser) return;
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) { setMessage('Sign in before saving a personal watchlist.'); return; }
    const { error } = await supabaseBrowser.from('tofauti_watchlists').upsert({ user_id: user.id, symbol }, { onConflict: 'user_id,symbol' });
    if (error) setMessage(error.message);
    else { setMessage(`${symbol} saved to your watchlist.`); await load(); }
  }

  return <section className="panel rounded-3xl p-6"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Star className="text-violet-300" size={17} /><p className="text-lg font-black">Personal watchlist</p></div><button onClick={() => void load()} className="text-xs font-bold text-violet-200 hover:text-white">Refresh</button></div><p className="mt-2 text-sm leading-6 text-zinc-400">Saved only under your authenticated Supabase user ID.</p><div className="mt-5 flex gap-2">{(['GC', 'MGC'] as const).map((symbol) => <button key={symbol} onClick={() => add(symbol)} className={`rounded-xl border px-4 py-2 text-xs font-bold ${symbols.includes(symbol) ? 'border-violet-300/35 bg-violet-300/10 text-violet-100' : 'border-white/10 text-zinc-300 hover:border-white/20'}`}>{symbols.includes(symbol) ? `${symbol} saved` : `Add ${symbol}`}</button>)}</div>{message && <p className="mt-3 text-xs text-zinc-400">{message}</p>}</section>;
}
