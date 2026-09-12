'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { LogIn, LogOut, UserRound } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!supabaseBrowser) return;
    supabaseBrowser.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabaseBrowser.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(mode: 'sign-in' | 'sign-up') {
    if (!supabaseBrowser) return;
    setPending(true);
    setMessage('');
    const result = mode === 'sign-in'
      ? await supabaseBrowser.auth.signInWithPassword({ email, password })
      : await supabaseBrowser.auth.signUp({ email, password });
    setPending(false);
    setMessage(result.error ? result.error.message : mode === 'sign-up' ? 'Account created. Confirm the email if your project requires it.' : 'Signed in.');
  }

  if (!supabaseBrowser) return <section className="panel rounded-3xl p-6"><p className="text-lg font-black">Account access</p><p className="mt-3 text-sm leading-6 text-zinc-400">Supabase browser auth is ready but not configured in this deployment. Add the public project URL and anon key in Vercel; never add a service-role key here.</p></section>;
  if (user) return <section className="panel rounded-3xl p-6"><div className="flex items-center gap-3"><UserRound className="text-violet-300" /><div><p className="text-lg font-black">Signed in</p><p className="mt-1 text-sm text-zinc-400">{user.email}</p></div></div><button onClick={() => void supabaseBrowser?.auth.signOut()} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:border-rose-300/40 hover:text-rose-200"><LogOut size={14} /> Sign out</button></section>;
  return <section className="panel rounded-3xl p-6"><div className="flex items-center gap-2"><LogIn className="text-violet-300" /><p className="text-lg font-black">Account access</p></div><p className="mt-2 text-sm leading-6 text-zinc-400">Sign in to use RLS-protected personal watchlists when the Supabase project is configured.</p><div className="mt-5 grid gap-3"><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="Email" className="rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-violet-300/50" /><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Password" className="rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-violet-300/50" /></div><div className="mt-3 flex flex-wrap gap-2"><button disabled={pending || !email || !password} onClick={() => submit('sign-in')} className="rounded-xl bg-violet-300 px-4 py-2 text-xs font-black text-[#171122] disabled:opacity-50">Sign in</button><button disabled={pending || !email || !password} onClick={() => submit('sign-up')} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 disabled:opacity-50">Create account</button></div>{message && <p className="mt-3 text-xs text-zinc-400">{message}</p>}</section>;
}
