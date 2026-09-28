'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { GOLD_BRIEFS_ENABLED } from '@/lib/brief-availability';
import type { GoldBriefRecord, GoldBriefSnapshot } from '@/lib/gold-brief';

export function useGoldBriefs() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [briefState, setBriefState] = useState<{ ownerId: string | null; records: GoldBriefRecord[] }>({ ownerId: null, records: [] });
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabaseBrowser || !GOLD_BRIEFS_ENABLED) return;
    let active = true;
    void supabaseBrowser.auth.getUser().then(({ data, error }) => {
      if (active) { setUserId(data.user?.id ?? null); setAuthReady(true); if (error) setMessage('Could not restore your account session.'); }
    });
    const { data: listener } = supabaseBrowser.auth.onAuthStateChange((_event, session) => { setUserId(session?.user.id ?? null); setAuthReady(true); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabaseBrowser || !GOLD_BRIEFS_ENABLED || !userId) return;
    const client = supabaseBrowser;
    let active = true;
    const load = async () => {
      const { data, error } = await client.from('tofauti_gold_briefs').select('id,user_id,created_at,source_as_of,snapshot,scenario,invalidation_price,post_session_note,review_outcome,reviewed_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
      if (active) {
        if (error) setMessage('Could not load saved briefs. Check the shared Kaizen database migration and try again.');
        else { setBriefState({ ownerId: userId, records: data as GoldBriefRecord[] }); setMessage(''); }
        setLoadedUserId(userId);
      }
    };
    void load();
    const channel = client.channel(`tofauti-gold-briefs-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tofauti_gold_briefs', filter: `user_id=eq.${userId}` }, () => void load())
      .subscribe();
    return () => { active = false; void client.removeChannel(channel); };
  }, [userId]);

  async function save(snapshot: GoldBriefSnapshot, scenario: string, invalidationPrice: number | null) {
    if (!GOLD_BRIEFS_ENABLED) throw new Error('Cloud saving is not enabled until the Kaizen database is verified.');
    if (!supabaseBrowser || !userId) throw new Error('Sign in before saving a Gold Brief.');
    const { error } = await supabaseBrowser.from('tofauti_gold_briefs').insert({ user_id: userId, source_as_of: snapshot.source.as_of, snapshot, scenario, invalidation_price: invalidationPrice });
    if (error) throw new Error(`Could not save this brief: ${error.message}`);
    const { data } = await supabaseBrowser.from('tofauti_gold_briefs').select('id,user_id,created_at,source_as_of,snapshot,scenario,invalidation_price,post_session_note,review_outcome,reviewed_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
    if (data) setBriefState({ ownerId: userId, records: data as GoldBriefRecord[] });
  }

  async function review(id: string, note: string, outcome: Exclude<GoldBriefRecord['review_outcome'], null>) {
    if (!GOLD_BRIEFS_ENABLED) throw new Error('Cloud review is not enabled until the Kaizen database is verified.');
    if (!supabaseBrowser || !userId) throw new Error('Sign in before reviewing a Gold Brief.');
    const { data, error } = await supabaseBrowser.from('tofauti_gold_briefs').update({ post_session_note: note, review_outcome: outcome }).eq('id', id).eq('user_id', userId).select('id,user_id,created_at,source_as_of,snapshot,scenario,invalidation_price,post_session_note,review_outcome,reviewed_at').single();
    if (error) throw new Error(`Could not save this review: ${error.message}`);
    setBriefState((current) => ({ ...current, records: current.records.map((brief) => brief.id === id ? data as GoldBriefRecord : brief) }));
  }

  const briefs = briefState.ownerId === userId ? briefState.records : [];
  const loading = !!supabaseBrowser && GOLD_BRIEFS_ENABLED && (!authReady || (userId !== null && loadedUserId !== userId));
  return { userId, briefs, loading, message, save, review };
}
