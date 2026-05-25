import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { generateId } from '../utils/helpers';
import { instrumentConfig, resistanceTypes, supportTypes } from '../orderflow/constants';
import { buildCommanderAnalytics } from '../orderflow/analytics';
import { createDefaultCommanderState, defaultJournalDraft } from '../orderflow/defaults';
import { parseCsvRows } from '../orderflow/csv';
import { CommanderAnalyticsSection, CommanderAuthGate, CommanderGuide, CommanderHero, CommanderSubnav, JournalCard, LevelsManager, OrderFlowInput, PlaybooksNewsCard, RiskCard, ScoringLab, SessionContextCard, TradePlans } from '../orderflow/components';
import { commanderViews, CommanderViewSlug } from '../orderflow/navigation';
import { createLocalCommanderRepository } from '../orderflow/repository';
import { calculateRiskMetrics } from '../orderflow/riskEngine';
import { buildCommanderPlan } from '../orderflow/setupEngine';
import { hasSupabaseEnv } from '../orderflow/supabase';
import { createSupabaseCommanderRepository, getCommanderSession, signInWithEmailPassword, signOutCommander, signUpWithEmailPassword, uploadCommanderScreenshot } from '../orderflow/supabaseRepository';
import { CommanderBias, CommanderInstrument, CommanderSession, CommanderWorkspaceState, JournalRecord, LevelFilter, LevelType, MistakeTag, NewsEvent, RiskContext, SetupPlaybook, Timeframe } from '../orderflow/types';

type OrderFlowSortKey = 'timestamp' | 'timeframe' | 'close' | 'delta' | 'volume' | 'source';
type OrderFlowFilter = 'all' | 'M1' | 'M3' | 'M5' | 'manual' | 'csv' | 'positiveDelta' | 'negativeDelta';

const emptyState = createDefaultCommanderState();

export default function OrderFlowCommander() {
  const { isDark } = useTheme();
  const location = useLocation();
  const repository = useMemo(() => (hasSupabaseEnv ? createSupabaseCommanderRepository() : createLocalCommanderRepository()), []);
  const [workspace, setWorkspace] = useState<CommanderWorkspaceState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [commanderUserEmail, setCommanderUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!hasSupabaseEnv);
  const hydratedRef = useRef(false);
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('active');
  const [levelForm, setLevelForm] = useState({ instrument: 'MNQ' as CommanderInstrument, price: '18942.50', type: 'Demand' as LevelType, strength: '4', notes: '', active: true });
  const [flowForm, setFlowForm] = useState({ timestamp: new Date().toISOString().slice(0, 16), instrument: 'MNQ' as CommanderInstrument, timeframe: 'M1' as Timeframe, open: '18942.25', high: '18944.00', low: '18940.75', close: '18943.50', delta: '-128', deltaChange: '90', volume: '546', cumulativeDelta: '3210', aggressiveBuyersObserved: false, aggressiveSellersObserved: true, priceContinuedAfterAggression: false, notes: '' });
  const [importSummary, setImportSummary] = useState('');
  const [orderFlowSortKey, setOrderFlowSortKey] = useState<OrderFlowSortKey>('timestamp');
  const [orderFlowSortDirection, setOrderFlowSortDirection] = useState<'asc' | 'desc'>('desc');
  const [orderFlowFilter, setOrderFlowFilter] = useState<OrderFlowFilter>('all');
  const [selectedJournalRecordId, setSelectedJournalRecordId] = useState<string | null>(null);
  const [copySummary, setCopySummary] = useState('');
  const [journalStatus, setJournalStatus] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedPlaybookId, setSelectedPlaybookId] = useState('');
  const [templateForm, setTemplateForm] = useState({ name: '', instrument: 'Any' as CommanderInstrument | 'Any', session: 'Any' as CommanderSession | 'Any', bias: 'Neutral' as CommanderBias, riskContext: 'Balanced' as RiskContext, newsRisk: false, minimumScore: '70', notes: '' });
  const [playbookForm, setPlaybookForm] = useState({ name: '', setupType: 'Seller Absorption Long' as SetupPlaybook['setupType'], checklist: '', executionNotes: '', favorite: false });
  const [newsEventForm, setNewsEventForm] = useState({ title: '', timestamp: new Date().toISOString().slice(0, 16), instrument: 'All' as CommanderInstrument | 'All', session: 'All' as CommanderSession | 'All', impact: 'Medium' as NewsEvent['impact'], notes: '' });

  useEffect(() => {
    let cancelled = false;
    const loadWorkspace = async () => {
      try {
        if (hasSupabaseEnv) {
          const sessionResult = await getCommanderSession();
          const session = sessionResult.data.session;
          if (!cancelled) {
            setIsAuthenticated(Boolean(session));
            setCommanderUserEmail(session?.user?.email ?? '');
          }
          if (!session) {
            if (!cancelled) {
              hydratedRef.current = true;
              setIsLoading(false);
            }
            return;
          }
        }

        const loaded = await repository.load();
        if (cancelled) return;
        setWorkspace(loaded);
        setLevelForm((previous) => ({ ...previous, instrument: loaded.selectedInstrument }));
        setFlowForm((previous) => ({ ...previous, instrument: loaded.selectedInstrument }));
        setSelectedTemplateId(loaded.setupTemplates[0]?.id ?? '');
        setSelectedPlaybookId(loaded.playbooks[0]?.id ?? '');
      } catch {
        if (!cancelled) setAuthError('Commander could not connect to Supabase yet. Check auth and schema deployment.');
      } finally {
        if (!cancelled) {
          hydratedRef.current = true;
          setIsLoading(false);
        }
      }
    };
    loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, [repository]);

  useEffect(() => {
    if (!hydratedRef.current || (hasSupabaseEnv && !isAuthenticated)) return;
    repository.save(workspace).catch(() => undefined);
  }, [isAuthenticated, repository, workspace]);

  const activeView = useMemo<CommanderViewSlug | null>(() => {
    const segment = location.pathname.split('/')[2];
    if (!segment) return 'dashboard';
    return commanderViews.some((view) => view.slug === segment) ? (segment as CommanderViewSlug) : null;
  }, [location.pathname]);

  const selectedJournalRecord = useMemo(() => workspace.journalRecords.find((record) => record.id === selectedJournalRecordId) ?? null, [selectedJournalRecordId, workspace.journalRecords]);
  const config = instrumentConfig[workspace.selectedInstrument];
  const instrumentRows = useMemo(() => [...workspace.orderFlowRows].filter((row) => row.instrument === workspace.selectedInstrument).sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()), [workspace.orderFlowRows, workspace.selectedInstrument]);
  const activeInstrumentLevels = useMemo(() => workspace.levels.filter((level) => level.instrument === workspace.selectedInstrument && level.active), [workspace.levels, workspace.selectedInstrument]);
  const currentPrice = instrumentRows[0]?.close ?? (Number(workspace.manualPrice) || 0);
  const nearestSupport = useMemo(() => activeInstrumentLevels.filter((level) => supportTypes.includes(level.type) && level.price <= currentPrice).sort((left, right) => right.price - left.price)[0] ?? null, [activeInstrumentLevels, currentPrice]);
  const nearestResistance = useMemo(() => activeInstrumentLevels.filter((level) => resistanceTypes.includes(level.type) && level.price >= currentPrice).sort((left, right) => left.price - right.price)[0] ?? null, [activeInstrumentLevels, currentPrice]);
  const currentSessionRecords = useMemo(() => workspace.journalRecords.filter((record) => record.session === workspace.session && new Date(record.date).toDateString() === new Date().toDateString()), [workspace.journalRecords, workspace.session]);
  const currentSessionLosses = useMemo(() => currentSessionRecords.filter((record) => record.resultR < 0).length, [currentSessionRecords]);
  const sessionLocked = currentSessionRecords.length >= 2 || currentSessionLosses >= 2;
  const activeNewsEvents = useMemo(() => workspace.newsEvents.filter((event) => {
    const minutes = Math.abs(new Date(event.timestamp).getTime() - Date.now()) / 60000;
    const matchesInstrument = event.instrument === 'All' || event.instrument === workspace.selectedInstrument;
    const matchesSession = event.session === 'All' || event.session === workspace.session;
    return matchesInstrument && matchesSession && minutes <= 120;
  }).sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()), [workspace.newsEvents, workspace.selectedInstrument, workspace.session]);
  const effectiveNewsRisk = workspace.newsRisk || activeNewsEvents.some((event) => event.impact === 'High');
  const selectedPlaybook = useMemo(() => workspace.playbooks.find((playbook) => playbook.id === selectedPlaybookId) ?? null, [selectedPlaybookId, workspace.playbooks]);
  const plan = useMemo(() => buildCommanderPlan({ bias: workspace.bias, session: workspace.session, riskContext: workspace.riskContext, newsRisk: effectiveNewsRisk, currentPrice, levels: activeInstrumentLevels, rows: instrumentRows, tickSize: config.tickSize, proximityThreshold: config.proximityThreshold, scoreWeights: workspace.scoreWeights, minimumScore: workspace.minimumScore }), [activeInstrumentLevels, config.proximityThreshold, config.tickSize, currentPrice, effectiveNewsRisk, instrumentRows, workspace.bias, workspace.minimumScore, workspace.riskContext, workspace.scoreWeights, workspace.session]);
  const riskMetrics = useMemo(() => calculateRiskMetrics({ tickSize: config.tickSize, defaultTickValue: config.defaultTickValue, entry: plan.entry, stop: plan.stop, tp1: plan.tp1, tp2: plan.tp2, accountSize: workspace.riskInputs.accountSize, riskPercent: workspace.riskInputs.riskPercent, tickValue: workspace.riskInputs.tickValue }), [config.defaultTickValue, config.tickSize, plan.entry, plan.stop, plan.tp1, plan.tp2, workspace.riskInputs]);
  const analytics = useMemo(() => buildCommanderAnalytics(workspace.journalRecords), [workspace.journalRecords]);
  const scoreWeightTotal = useMemo(() => Object.values(workspace.scoreWeights).reduce((sum, value) => sum + value, 0), [workspace.scoreWeights]);
  const recentSessionSummary = useMemo(() => currentSessionRecords.length > 0 ? { todayTrades: currentSessionRecords.length, todayResultR: currentSessionRecords.reduce((sum, record) => sum + record.resultR, 0), sessionName: workspace.session, lastTradeDate: new Date(currentSessionRecords[0].date).toLocaleString() } : undefined, [currentSessionRecords, workspace.session]);

  const patchWorkspace = (patch: Partial<CommanderWorkspaceState>) => setWorkspace((previous) => ({ ...previous, ...patch }));
  const syncInstrument = (instrument: CommanderInstrument) => {
    patchWorkspace({ selectedInstrument: instrument, riskInputs: { ...workspace.riskInputs, tickValue: String(instrumentConfig[instrument].defaultTickValue) } });
    setLevelForm((previous) => ({ ...previous, instrument }));
    setFlowForm((previous) => ({ ...previous, instrument }));
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imported = parseCsvRows(await file.text());
    if (imported.rows.length > 0) {
      patchWorkspace({ orderFlowRows: [...imported.rows, ...workspace.orderFlowRows] });
      setImportSummary(`Imported ${imported.rows.length} row${imported.rows.length === 1 ? '' : 's'} from ${file.name}.${imported.skippedRows > 0 ? ` Skipped ${imported.skippedRows} invalid row${imported.skippedRows === 1 ? '' : 's'}.` : ''}`);
    } else {
      setImportSummary(`No valid rows were imported from ${file.name}.${imported.errors.length > 0 ? ` ${imported.errors.slice(0, 2).join(' ')}` : ''}`);
    }
    event.target.value = '';
  };

  const handleClearImportedRows = () => {
    patchWorkspace({ orderFlowRows: workspace.orderFlowRows.filter((row) => row.source !== 'csv') });
    setImportSummary('Imported CSV rows cleared.');
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = workspace.setupTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setSelectedTemplateId(templateId);
    patchWorkspace({
      selectedInstrument: template.instrument === 'Any' ? workspace.selectedInstrument : template.instrument,
      session: template.session === 'Any' ? workspace.session : template.session,
      bias: template.bias,
      riskContext: template.riskContext,
      newsRisk: template.newsRisk,
      minimumScore: template.minimumScore,
      riskInputs: {
        ...workspace.riskInputs,
        tickValue: String(instrumentConfig[(template.instrument === 'Any' ? workspace.selectedInstrument : template.instrument) as CommanderInstrument].defaultTickValue),
      },
    });
    if (template.instrument !== 'Any') syncInstrument(template.instrument);
    setImportSummary(`Applied template: ${template.name}.`);
  };

  const handleCopyPlan = async () => {
    const planText = [`OrderFlow Commander Plan - ${workspace.selectedInstrument}`, `Session: ${workspace.session}`, `Bias: ${workspace.bias}`, `Setup: ${plan.setupType}`, `Direction: ${plan.direction}`, `Score: ${plan.score}/100 (${plan.grade})`, `Entry: ${plan.entry !== null ? plan.entry.toFixed(2) : 'N/A'}`, `Stop: ${plan.stop !== null ? plan.stop.toFixed(2) : 'N/A'}`, `TP1: ${plan.tp1 !== null ? plan.tp1.toFixed(2) : 'N/A'}`, `TP2: ${plan.tp2 !== null ? plan.tp2.toFixed(2) : 'N/A'}`, `Risk/Reward: ${plan.riskReward.toFixed(2)}R`, `Trigger: ${plan.entryTrigger}`, `Invalidation: ${plan.invalidation}`, `Valid reasons: ${plan.validReasons.join('; ') || 'None'}`, `Skip reasons: ${plan.skipReasons.join('; ') || 'None'}`].join('\n');
    try {
      await navigator.clipboard.writeText(planText);
      setCopySummary('Plan copied to clipboard.');
    } catch {
      setCopySummary('Plan export text is ready, but clipboard access was blocked.');
    }
  };

  const handleResetCommanderState = () => {
    repository.reset().then((resetState) => {
      setWorkspace(resetState);
      setSelectedTemplateId(resetState.setupTemplates[0]?.id ?? '');
      setSelectedPlaybookId(resetState.playbooks[0]?.id ?? '');
      setImportSummary('Commander state reset to defaults.');
    }).catch(() => undefined);
  };

  const handleAuthSubmit = async () => {
    setIsAuthLoading(true);
    setAuthError('');
    try {
      const result = authMode === 'signin'
        ? await signInWithEmailPassword(authEmail, authPassword)
        : await signUpWithEmailPassword(authEmail, authPassword);
      if (result.error) throw result.error;
      const sessionResult = await getCommanderSession();
      setIsAuthenticated(Boolean(sessionResult.data.session));
      setCommanderUserEmail(sessionResult.data.session?.user?.email ?? authEmail);
      const loaded = await repository.load();
      setWorkspace(loaded);
      setSelectedTemplateId(loaded.setupTemplates[0]?.id ?? '');
      setSelectedPlaybookId(loaded.playbooks[0]?.id ?? '');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutCommander();
    setIsAuthenticated(false);
    setCommanderUserEmail('');
    setWorkspace(createDefaultCommanderState());
  };

  const handleSaveJournal = async () => {
    if (!plan.entry || !plan.stop || !plan.tp1 || !plan.tp2 || plan.direction === 'No Trade') return;
    let screenshotPath = workspace.journalDraft.screenshotName;
    let screenshotDataUrl = workspace.journalDraft.screenshotDataUrl;

    if (hasSupabaseEnv && isAuthenticated && workspace.journalDraft.screenshotName && workspace.journalDraft.screenshotDataUrl) {
      try {
        const sessionResult = await getCommanderSession();
        const userId = sessionResult.data.session?.user?.id;
        if (userId) {
          screenshotPath = await uploadCommanderScreenshot(userId, workspace.journalDraft.screenshotName, workspace.journalDraft.screenshotDataUrl);
          setJournalStatus('Screenshot uploaded to Supabase Storage and journal saved.');
        }
      } catch {
        setJournalStatus('Journal saved, but the screenshot upload did not complete.');
      }
    } else {
      setJournalStatus('Journal saved locally.');
    }

    const record: JournalRecord = { id: generateId(), date: new Date().toISOString(), instrument: workspace.selectedInstrument, session: workspace.session, setupType: plan.setupType, direction: plan.direction, entry: plan.entry, stop: plan.stop, tp1: plan.tp1, tp2: plan.tp2, exit: Number(workspace.journalDraft.exit) || plan.tp1, resultR: Number(workspace.journalDraft.resultR) || 0, profitLoss: Number(workspace.journalDraft.profitLoss) || 0, notes: workspace.journalDraft.notes, lessons: workspace.journalDraft.lessons, mistakeTags: workspace.journalDraft.mistakeTags, screenshotPath, screenshotName: workspace.journalDraft.screenshotName, screenshotDataUrl, screenshotAnnotation: workspace.journalDraft.screenshotAnnotation };
    patchWorkspace({ journalRecords: [record, ...workspace.journalRecords], journalDraft: defaultJournalDraft });
  };

  const toggleMistakeTag = (tag: MistakeTag) => patchWorkspace({ journalDraft: { ...workspace.journalDraft, mistakeTags: workspace.journalDraft.mistakeTags.includes(tag) ? workspace.journalDraft.mistakeTags.filter((item) => item !== tag) : [...workspace.journalDraft.mistakeTags, tag] } });
  const handleScreenshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Unable to read screenshot.'));
      reader.readAsDataURL(file);
    });
    patchWorkspace({ journalDraft: { ...workspace.journalDraft, screenshotName: file.name, screenshotDataUrl: dataUrl } });
    event.target.value = '';
  };

  if (activeView === null) return <Navigate to="/orderflow-commander" replace />;
  if (isLoading) return <div className={`rounded-[1.5rem] border p-8 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/70 text-slate-600'}`}>Loading Commander workspace...</div>;
  if (hasSupabaseEnv && !isAuthenticated) {
    return (
      <div className="space-y-6">
        <CommanderHero selectedInstrument={workspace.selectedInstrument} plan={plan} onReset={handleResetCommanderState} />
        <CommanderAuthGate
          isDark={isDark}
          email={authEmail}
          password={authPassword}
          mode={authMode}
          loading={isAuthLoading}
          error={authError}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onModeChange={setAuthMode}
          onSubmit={handleAuthSubmit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CommanderHero selectedInstrument={workspace.selectedInstrument} plan={plan} onReset={handleResetCommanderState} />
      {hasSupabaseEnv && commanderUserEmail && (
        <div className={`flex items-center justify-between rounded-[1.2rem] border px-4 py-3 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/70 text-slate-700'}`}>
          <p>Connected to Supabase as <span className="font-semibold">{commanderUserEmail}</span>.</p>
          <button type="button" onClick={handleSignOut} className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>Sign out</button>
        </div>
      )}
      <CommanderSubnav activeView={activeView} />

      {activeView === 'dashboard' && (
        <>
          <CommanderGuide isDark={isDark} />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <SessionContextCard isDark={isDark} selectedInstrument={workspace.selectedInstrument} setSelectedInstrument={(instrument) => patchWorkspace({ selectedInstrument: instrument })} session={workspace.session} setSession={(session) => patchWorkspace({ session })} bias={workspace.bias} setBias={(bias) => patchWorkspace({ bias })} riskContext={workspace.riskContext} setRiskContext={(riskContext) => patchWorkspace({ riskContext })} manualPrice={workspace.manualPrice} setManualPrice={(manualPrice) => patchWorkspace({ manualPrice })} newsRisk={workspace.newsRisk} setNewsRisk={(newsRisk) => patchWorkspace({ newsRisk })} plan={plan} currentPrice={currentPrice} scoreWeights={workspace.scoreWeights} minimumScore={workspace.minimumScore} scoreWeightTotal={scoreWeightTotal} currentSessionRecords={currentSessionRecords} currentSessionLosses={currentSessionLosses} sessionLocked={sessionLocked} activeNewsEvents={activeNewsEvents} effectiveNewsRisk={effectiveNewsRisk} onSyncInstrument={syncInstrument} />
            <TradePlans isDark={isDark} selectedInstrument={workspace.selectedInstrument} plan={plan} nearestSupport={nearestSupport} nearestResistance={nearestResistance} currentPrice={currentPrice} scoreWeights={workspace.scoreWeights} minimumScore={workspace.minimumScore} newsRisk={effectiveNewsRisk} sessionLocked={sessionLocked} onCopyPlan={handleCopyPlan} copySummary={copySummary} />
          </div>
          <RiskCard isDark={isDark} riskInputs={workspace.riskInputs} setRiskInputs={(value) => patchWorkspace({ riskInputs: typeof value === 'function' ? value(workspace.riskInputs) : value })} riskMetrics={riskMetrics} />
        </>
      )}

      {activeView === 'levels' && <LevelsManager isDark={isDark} selectedInstrument={workspace.selectedInstrument} levels={workspace.levels} setLevels={(value) => patchWorkspace({ levels: typeof value === 'function' ? value(workspace.levels) : value })} levelFilter={levelFilter} setLevelFilter={setLevelFilter} levelForm={levelForm} setLevelForm={setLevelForm} editingLevelId={editingLevelId} setEditingLevelId={setEditingLevelId} onSyncInstrument={syncInstrument} />}

      {activeView === 'order-flow' && <OrderFlowInput isDark={isDark} selectedInstrument={workspace.selectedInstrument} orderFlowRows={workspace.orderFlowRows} setOrderFlowRows={(value) => patchWorkspace({ orderFlowRows: typeof value === 'function' ? value(workspace.orderFlowRows) : value })} flowForm={flowForm} setFlowForm={setFlowForm} importSummary={importSummary} orderFlowFilter={orderFlowFilter} setOrderFlowFilter={setOrderFlowFilter} orderFlowSortKey={orderFlowSortKey} setOrderFlowSortKey={setOrderFlowSortKey} orderFlowSortDirection={orderFlowSortDirection} setOrderFlowSortDirection={setOrderFlowSortDirection} onSyncInstrument={syncInstrument} onImport={handleImport} onClearImported={handleClearImportedRows} />}

      {activeView === 'plans' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <TradePlans isDark={isDark} selectedInstrument={workspace.selectedInstrument} plan={plan} nearestSupport={nearestSupport} nearestResistance={nearestResistance} currentPrice={currentPrice} scoreWeights={workspace.scoreWeights} minimumScore={workspace.minimumScore} newsRisk={effectiveNewsRisk} sessionLocked={sessionLocked} onCopyPlan={handleCopyPlan} copySummary={copySummary} />
          <RiskCard isDark={isDark} riskInputs={workspace.riskInputs} setRiskInputs={(value) => patchWorkspace({ riskInputs: typeof value === 'function' ? value(workspace.riskInputs) : value })} riskMetrics={riskMetrics} />
        </div>
      )}

      {activeView === 'journal' && <JournalCard isDark={isDark} analytics={analytics} journalDraft={workspace.journalDraft} setJournalDraft={(value) => patchWorkspace({ journalDraft: typeof value === 'function' ? value(workspace.journalDraft) : value })} journalRecords={workspace.journalRecords} selectedJournalRecordId={selectedJournalRecordId} setSelectedJournalRecordId={setSelectedJournalRecordId} selectedJournalRecord={selectedJournalRecord} plan={plan} minimumScore={workspace.minimumScore} sessionLocked={sessionLocked} onSaveJournal={handleSaveJournal} onClearDraft={() => patchWorkspace({ journalDraft: defaultJournalDraft })} toggleMistakeTag={toggleMistakeTag} onScreenshotUpload={handleScreenshotUpload} recentSessionSummary={recentSessionSummary} journalStatus={journalStatus} />}

      {activeView === 'analytics' && <CommanderAnalyticsSection analytics={analytics} isDark={isDark} />}

      {activeView === 'settings' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <ScoringLab isDark={isDark} scoreWeights={workspace.scoreWeights} setScoreWeights={(value) => patchWorkspace({ scoreWeights: typeof value === 'function' ? value(workspace.scoreWeights) : value })} minimumScore={workspace.minimumScore} setMinimumScore={(minimumScore) => patchWorkspace({ minimumScore })} setupTemplates={workspace.setupTemplates} setSetupTemplates={(value) => patchWorkspace({ setupTemplates: typeof value === 'function' ? value(workspace.setupTemplates) : value })} selectedTemplateId={selectedTemplateId} setSelectedTemplateId={setSelectedTemplateId} templateForm={templateForm} setTemplateForm={setTemplateForm} onApplyTemplate={handleApplyTemplate} importSummary={importSummary} setImportSummary={setImportSummary} />
          <PlaybooksNewsCard isDark={isDark} playbooks={workspace.playbooks} setPlaybooks={(value) => patchWorkspace({ playbooks: typeof value === 'function' ? value(workspace.playbooks) : value })} newsEvents={workspace.newsEvents} setNewsEvents={(value) => patchWorkspace({ newsEvents: typeof value === 'function' ? value(workspace.newsEvents) : value })} selectedPlaybookId={selectedPlaybookId} setSelectedPlaybookId={setSelectedPlaybookId} selectedPlaybook={selectedPlaybook} playbookForm={playbookForm} setPlaybookForm={setPlaybookForm} newsEventForm={newsEventForm} setNewsEventForm={setNewsEventForm} activeNewsEvents={activeNewsEvents} />
        </div>
      )}

      <div className={`flex items-start gap-3 rounded-[1.2rem] border p-4 text-sm ${isDark ? 'border-amber-800/30 bg-amber-900/20 text-amber-200/80' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
        <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-500" />
        <p>This application is for educational and journaling purposes only. It does not provide financial advice, guarantee profits, or replace professional risk management. Futures trading involves substantial risk.</p>
      </div>
    </div>
  );
}
