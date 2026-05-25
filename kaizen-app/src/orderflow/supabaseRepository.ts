import { CommanderRepository } from './repository';
import { createDefaultCommanderState } from './defaults';
import {
  CommanderLevel,
  CommanderWorkspaceState,
  JournalRecord,
  NewsEvent,
  OrderFlowRow,
  SetupPlaybook,
  SetupTemplate,
} from './types';
import { hasSupabaseEnv, supabase } from './supabase';

function assertSupabase() {
  if (!supabase || !hasSupabaseEnv) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return supabase;
}

export function createSupabaseCommanderRepository(): CommanderRepository {
  return {
    async load() {
      const client = assertSupabase();
      const session = await client.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) return createDefaultCommanderState();
      return hydrateCommanderWorkspace(userId);
    },
    async save(state) {
      const client = assertSupabase();
      const session = await client.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) return;

      await client.from('commander_workspaces').upsert({
        user_id: userId,
        selected_instrument: state.selectedInstrument,
        session_name: state.session,
        bias: state.bias,
        risk_context: state.riskContext,
        manual_price: Number(state.manualPrice) || 0,
        news_risk: state.newsRisk,
        minimum_score: state.minimumScore,
        risk_inputs: state.riskInputs,
        score_weights: state.scoreWeights,
        journal_draft: state.journalDraft,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      await replaceUserRows(userId, 'commander_levels', state.levels.map((level) => ({
        id: level.id,
        user_id: userId,
        instrument: level.instrument,
        level_type: level.type,
        price: level.price,
        strength_score: level.strength,
        notes: level.notes,
        is_active: level.active,
      })));

      await replaceUserRows(userId, 'commander_orderflow_rows', state.orderFlowRows.map((row) => ({
        id: row.id,
        user_id: userId,
        timestamp_utc: row.timestamp,
        instrument: row.instrument,
        timeframe: row.timeframe,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        delta: row.delta,
        delta_change: row.deltaChange,
        volume: row.volume,
        cumulative_delta: row.cumulativeDelta,
        aggressive_buyers: row.aggressiveBuyersObserved,
        aggressive_sellers: row.aggressiveSellersObserved,
        price_continued_after_aggression: row.priceContinuedAfterAggression,
        notes: row.notes,
        source: row.source,
      })));

      await replaceUserRows(userId, 'commander_journal_entries', state.journalRecords.map((record) => ({
        id: record.id,
        user_id: userId,
        trade_date: record.date,
        instrument: record.instrument,
        session_name: record.session,
        setup_type: record.setupType,
        direction: record.direction,
        entry_price: record.entry,
        stop_price: record.stop,
        tp1: record.tp1,
        tp2: record.tp2,
        exit_price: record.exit,
        result_r: record.resultR,
        profit_loss: record.profitLoss,
        screenshot_path: record.screenshotPath ?? record.screenshotName ?? null,
        screenshot_annotation: record.screenshotAnnotation ?? null,
        mistake_tags: record.mistakeTags,
        notes: record.notes,
        lessons: record.lessons,
      })));

      await replaceUserRows(userId, 'commander_setup_templates', state.setupTemplates.map((template) => ({
        id: template.id,
        user_id: userId,
        name: template.name,
        instrument: template.instrument,
        session_name: template.session,
        bias: template.bias,
        risk_context: template.riskContext,
        news_risk: template.newsRisk,
        minimum_score: template.minimumScore,
        notes: template.notes,
      })));

      await replaceUserRows(userId, 'commander_playbooks', state.playbooks.map((playbook) => ({
        id: playbook.id,
        user_id: userId,
        setup_type: playbook.setupType,
        name: playbook.name,
        checklist: playbook.checklist,
        execution_notes: playbook.executionNotes,
        favorite: playbook.favorite,
      })));

      await replaceUserRows(userId, 'commander_news_events', state.newsEvents.map((event) => ({
        id: event.id,
        user_id: userId,
        title: event.title,
        event_time: event.timestamp,
        instrument: event.instrument,
        session_name: event.session,
        impact: event.impact,
        notes: event.notes,
      })));
    },
    async reset() {
      const client = assertSupabase();
      const session = await client.auth.getSession();
      const userId = session.data.session?.user?.id;
      const next = createDefaultCommanderState();
      if (!userId) return next;

      await Promise.all([
        client.from('commander_workspaces').delete().eq('user_id', userId),
        client.from('commander_levels').delete().eq('user_id', userId),
        client.from('commander_orderflow_rows').delete().eq('user_id', userId),
        client.from('commander_journal_entries').delete().eq('user_id', userId),
        client.from('commander_setup_templates').delete().eq('user_id', userId),
        client.from('commander_playbooks').delete().eq('user_id', userId),
        client.from('commander_news_events').delete().eq('user_id', userId),
      ]);
      return next;
    },
  };
}

async function replaceUserRows(userId: string, table: string, rows: Record<string, unknown>[]) {
  const client = assertSupabase();
  const deleteResult = await client.from(table).delete().eq('user_id', userId);
  if (deleteResult.error) throw deleteResult.error;
  if (rows.length === 0) return;
  const insertResult = await client.from(table).insert(rows);
  if (insertResult.error) throw insertResult.error;
}

function mapLevel(row: Record<string, unknown>): CommanderLevel {
  return {
    id: String(row.id),
    instrument: row.instrument as CommanderLevel['instrument'],
    price: Number(row.price),
    type: row.level_type as CommanderLevel['type'],
    strength: Number(row.strength_score) as CommanderLevel['strength'],
    notes: String(row.notes ?? ''),
    active: Boolean(row.is_active),
  };
}

function mapOrderFlowRow(row: Record<string, unknown>): OrderFlowRow {
  return {
    id: String(row.id),
    timestamp: String(row.timestamp_utc),
    instrument: row.instrument as OrderFlowRow['instrument'],
    timeframe: row.timeframe as OrderFlowRow['timeframe'],
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    delta: Number(row.delta ?? 0),
    deltaChange: Number(row.delta_change ?? 0),
    volume: Number(row.volume ?? 0),
    cumulativeDelta: Number(row.cumulative_delta ?? 0),
    aggressiveBuyersObserved: Boolean(row.aggressive_buyers),
    aggressiveSellersObserved: Boolean(row.aggressive_sellers),
    priceContinuedAfterAggression: Boolean(row.price_continued_after_aggression),
    notes: String(row.notes ?? ''),
    source: (row.source as OrderFlowRow['source']) ?? 'manual',
  };
}

function mapJournalEntry(row: Record<string, unknown>): JournalRecord {
  const screenshotPath = row.screenshot_path ? String(row.screenshot_path) : undefined;
  return {
    id: String(row.id),
    date: String(row.trade_date),
    instrument: row.instrument as JournalRecord['instrument'],
    session: row.session_name as JournalRecord['session'],
    setupType: row.setup_type as JournalRecord['setupType'],
    direction: row.direction as JournalRecord['direction'],
    entry: Number(row.entry_price),
    stop: Number(row.stop_price),
    tp1: Number(row.tp1),
    tp2: Number(row.tp2),
    exit: Number(row.exit_price),
    resultR: Number(row.result_r ?? 0),
    profitLoss: Number(row.profit_loss ?? 0),
    screenshotPath,
    screenshotName: screenshotPath ? screenshotPath.split('/').pop() : undefined,
    screenshotAnnotation: row.screenshot_annotation ? String(row.screenshot_annotation) : undefined,
    notes: String(row.notes ?? ''),
    lessons: String(row.lessons ?? ''),
    mistakeTags: Array.isArray(row.mistake_tags) ? (row.mistake_tags as JournalRecord['mistakeTags']) : [],
  };
}

function mapTemplate(row: Record<string, unknown>): SetupTemplate {
  return {
    id: String(row.id),
    name: String(row.name),
    instrument: row.instrument as SetupTemplate['instrument'],
    session: row.session_name as SetupTemplate['session'],
    bias: row.bias as SetupTemplate['bias'],
    riskContext: row.risk_context as SetupTemplate['riskContext'],
    newsRisk: Boolean(row.news_risk),
    minimumScore: Number(row.minimum_score ?? 70),
    notes: String(row.notes ?? ''),
  };
}

function mapPlaybook(row: Record<string, unknown>): SetupPlaybook {
  return {
    id: String(row.id),
    setupType: row.setup_type as SetupPlaybook['setupType'],
    name: String(row.name),
    checklist: String(row.checklist ?? ''),
    executionNotes: String(row.execution_notes ?? ''),
    favorite: Boolean(row.favorite),
  };
}

function mapNewsEvent(row: Record<string, unknown>): NewsEvent {
  return {
    id: String(row.id),
    title: String(row.title),
    timestamp: String(row.event_time),
    instrument: row.instrument as NewsEvent['instrument'],
    session: row.session_name as NewsEvent['session'],
    impact: row.impact as NewsEvent['impact'],
    notes: String(row.notes ?? ''),
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

export async function getCommanderScreenshotUrl(path: string) {
  const client = assertSupabase();
  const { data, error } = await client.storage.from('commander-screenshots').createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function hydrateCommanderWorkspace(userId: string): Promise<CommanderWorkspaceState> {
  const client = assertSupabase();
  const defaultState = createDefaultCommanderState();

  const [workspace, levels, rows, journalEntries, templates, playbooks, newsEvents] = await Promise.all([
    client.from('commander_workspaces').select('*').eq('user_id', userId).maybeSingle(),
    client.from('commander_levels').select('*').eq('user_id', userId),
    client.from('commander_orderflow_rows').select('*').eq('user_id', userId).order('timestamp_utc', { ascending: false }),
    client.from('commander_journal_entries').select('*').eq('user_id', userId).order('trade_date', { ascending: false }),
    client.from('commander_setup_templates').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('commander_playbooks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('commander_news_events').select('*').eq('user_id', userId).order('event_time', { ascending: true }),
  ]);

  const mappedJournalEntries = journalEntries.error || !journalEntries.data
    ? defaultState.journalRecords
    : await Promise.all(journalEntries.data.map(async (row) => {
      const entry = mapJournalEntry(row as Record<string, unknown>);
      if (!entry.screenshotPath) return entry;

      try {
        const signedUrl = await getCommanderScreenshotUrl(entry.screenshotPath);
        return { ...entry, screenshotDataUrl: signedUrl };
      } catch {
        return entry;
      }
    }));

  return {
    ...defaultState,
    selectedInstrument: workspace.data?.selected_instrument ?? defaultState.selectedInstrument,
    session: workspace.data?.session_name ?? defaultState.session,
    bias: workspace.data?.bias ?? defaultState.bias,
    riskContext: workspace.data?.risk_context ?? defaultState.riskContext,
    manualPrice: workspace.data?.manual_price ? String(workspace.data.manual_price) : defaultState.manualPrice,
    newsRisk: workspace.data?.news_risk ?? defaultState.newsRisk,
    minimumScore: workspace.data?.minimum_score ?? defaultState.minimumScore,
    riskInputs: (workspace.data?.risk_inputs as CommanderWorkspaceState['riskInputs']) ?? defaultState.riskInputs,
    scoreWeights: (workspace.data?.score_weights as CommanderWorkspaceState['scoreWeights']) ?? defaultState.scoreWeights,
    journalDraft: (workspace.data?.journal_draft as CommanderWorkspaceState['journalDraft']) ?? defaultState.journalDraft,
    levels: levels.error || !levels.data ? defaultState.levels : levels.data.map((row) => mapLevel(row as Record<string, unknown>)),
    orderFlowRows: rows.error || !rows.data ? defaultState.orderFlowRows : rows.data.map((row) => mapOrderFlowRow(row as Record<string, unknown>)),
    journalRecords: mappedJournalEntries,
    setupTemplates: templates.error || !templates.data ? defaultState.setupTemplates : templates.data.map((row) => mapTemplate(row as Record<string, unknown>)),
    playbooks: playbooks.error || !playbooks.data ? defaultState.playbooks : playbooks.data.map((row) => mapPlaybook(row as Record<string, unknown>)),
    newsEvents: newsEvents.error || !newsEvents.data ? defaultState.newsEvents : newsEvents.data.map((row) => mapNewsEvent(row as Record<string, unknown>)),
  };
}
