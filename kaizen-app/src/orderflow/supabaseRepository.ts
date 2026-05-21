import { CommanderRepository } from './repository';
import { createDefaultCommanderState } from './defaults';
import { CommanderWorkspaceState } from './types';
import { hasSupabaseEnv, supabase } from './supabase';

function assertSupabase() {
  if (!supabase || !hasSupabaseEnv) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return supabase;
}

export function createSupabaseCommanderRepository(): CommanderRepository {
  return {
    load() {
      return createDefaultCommanderState();
    },
    save(_state) {
      return;
    },
    reset() {
      return createDefaultCommanderState();
    },
  };
}

export async function signInWithEmailPassword(email: string, password: string) {
  return assertSupabase().auth.signInWithPassword({ email, password });
}

export async function signUpWithEmailPassword(email: string, password: string) {
  return assertSupabase().auth.signUp({ email, password });
}

export async function signOutCommander() {
  return assertSupabase().auth.signOut();
}

export async function getCommanderSession() {
  return assertSupabase().auth.getSession();
}

export async function uploadCommanderScreenshot(userId: string, fileName: string, dataUrl: string) {
  const client = assertSupabase();
  const [, base64] = dataUrl.split(',');

  if (!base64) throw new Error('Invalid screenshot payload.');

  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  const storagePath = `${userId}/${Date.now()}-${fileName}`;
  const { data, error } = await client.storage
    .from('commander-screenshots')
    .upload(storagePath, bytes, { upsert: true, contentType: 'image/png' });

  if (error) throw error;
  return data.path;
}

export async function hydrateCommanderWorkspace(userId: string): Promise<CommanderWorkspaceState> {
  const client = assertSupabase();
  const defaultState = createDefaultCommanderState();

  const [levels, rows, journalEntries, templates, playbooks, newsEvents] = await Promise.all([
    client.from('commander_levels').select('*').eq('user_id', userId),
    client.from('commander_orderflow_rows').select('*').eq('user_id', userId).order('timestamp_utc', { ascending: false }),
    client.from('commander_journal_entries').select('*').eq('user_id', userId).order('trade_date', { ascending: false }),
    client.from('commander_setup_templates').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('commander_playbooks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('commander_news_events').select('*').eq('user_id', userId).order('event_time', { ascending: true }),
  ]);

  return {
    ...defaultState,
    levels: levels.error || !levels.data ? defaultState.levels : defaultState.levels,
    orderFlowRows: rows.error || !rows.data ? defaultState.orderFlowRows : defaultState.orderFlowRows,
    journalRecords: journalEntries.error || !journalEntries.data ? defaultState.journalRecords : defaultState.journalRecords,
    setupTemplates: templates.error || !templates.data ? defaultState.setupTemplates : defaultState.setupTemplates,
    playbooks: playbooks.error || !playbooks.data ? defaultState.playbooks : defaultState.playbooks,
    newsEvents: newsEvents.error || !newsEvents.data ? defaultState.newsEvents : defaultState.newsEvents,
  };
}
