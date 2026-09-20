'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export function WatchlistPanel() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!supabaseBrowser) return;
    let active = true;
    supabaseBrowser.auth.getUser().then(({ data }) => { if (active) setUserId(data.user?.id ?? null); }).catch(() => {});
    const { data } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setSymbols([]);
      setMessage('');
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabaseBrowser || !userId) return;
    let active = true;
    void supabaseBrowser.from('tofauti_watchlists').select('symbol').eq('user_id', userId).order('created_at').then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage('Could not load your watchlist.');
      else setSymbols((data ?? []).map((item) => item.symbol));
    });
    return () => { active = false; };
  }, [userId]);

  async function add(symbol: 'GC' | 'MGC') {
    if (!supabaseBrowser || !userId || pending) return;
    setPending(true);
    try {
      // Ignore an existing row; no UPDATE policy or extra permission is needed.
      const { error } = await supabaseBrowser.from('tofauti_watchlists').upsert({ user_id: userId, symbol }, { onConflict: 'user_id,symbol', ignoreDuplicates: true });
      if (error) setMessage(error.code === '23503' ? 'Watchlist instruments are not available yet. Cloud setup needs to be completed.' : 'Could not save your watchlist. Please try again.');
      else { setSymbols((current) => [...new Set([...current, symbol])]); setMessage(symbol + ' saved.'); }
    } catch {
      setMessage('Watchlist service unavailable. Please try again.');
    } finally { setPending(false); }
  }

  return <section className="panel rounded-3xl p-6">
    <div className="flex items-center gap-2"><Star className="text-violet-300" size={17} /><p className="text-lg font-black">Personal watchlist</p></div>
    <p className="mt-2 text-sm leading-6 text-zinc-400">{userId ? 'Saved under your account. Watchlists do not enable a market feed.' : 'Sign in to save a personal watchlist.'}</p>
    <div className="mt-5 flex gap-2">{(['GC', 'MGC'] as const).map((symbol) => <button key={symbol} disabled={!userId || pending || symbols.includes(symbol)} onClick={() => void add(symbol)} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 disabled:opacity-50">{symbols.includes(symbol) ? symbol + ' saved' : 'Add ' + symbol}</button>)}</div>
    {message && <p role="status" className="mt-3 text-xs text-zinc-400">{message}</p>}
  </section>;
}
