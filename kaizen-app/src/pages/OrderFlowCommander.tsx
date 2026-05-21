import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Copy,
  Plus,
  Target,
  Trash2,
  Upload,
  Waves,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { formatCurrency, formatDate, generateId } from '../utils/helpers';
import { instrumentConfig, levelTypes, mistakeTags, resistanceTypes, supportTypes } from '../orderflow/constants';
import { buildCommanderAnalytics } from '../orderflow/analytics';
import { CommanderAnalyticsSection } from '../orderflow/components/CommanderAnalyticsSection';
import { parseCsvRows } from '../orderflow/csv';
import { defaultJournalDraft, defaultScoreWeights } from '../orderflow/defaults';
import { calculateRiskMetrics } from '../orderflow/riskEngine';
import { createLocalCommanderRepository } from '../orderflow/repository';
import { buildCommanderPlan } from '../orderflow/setupEngine';
import {
  CommanderBias,
  CommanderInstrument,
  CommanderLevel,
  CommanderScoreWeights,
  CommanderWorkspaceState,
  CommanderSession,
  JournalRecord,
  LevelFilter,
  LevelType,
  MistakeTag,
  NewsEvent,
  OrderFlowRow,
  RiskContext,
  SetupPlaybook,
  SetupTemplate,
  Timeframe,
} from '../orderflow/types';

type OrderFlowSortKey = 'timestamp' | 'timeframe' | 'close' | 'delta' | 'volume' | 'source';
type OrderFlowFilter = 'all' | 'M1' | 'M3' | 'M5' | 'manual' | 'csv' | 'positiveDelta' | 'negativeDelta';

export default function OrderFlowCommander() {
  const { isDark } = useTheme();
  const repository = useMemo(() => createLocalCommanderRepository(), []);
  const initialState = useMemo(() => repository.load(), [repository]);
  const [selectedInstrument, setSelectedInstrument] = useState<CommanderInstrument>(initialState.selectedInstrument);
  const [session, setSession] = useState<CommanderSession>(initialState.session);
  const [bias, setBias] = useState<CommanderBias>(initialState.bias);
  const [riskContext, setRiskContext] = useState<RiskContext>(initialState.riskContext);
  const [manualPrice, setManualPrice] = useState(initialState.manualPrice);
  const [newsRisk, setNewsRisk] = useState(initialState.newsRisk);
  const [levels, setLevels] = useState<CommanderLevel[]>(initialState.levels);
  const [orderFlowRows, setOrderFlowRows] = useState<OrderFlowRow[]>(initialState.orderFlowRows);
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('active');
  const [levelForm, setLevelForm] = useState({
    instrument: 'MNQ' as CommanderInstrument,
    price: '18942.50',
    type: 'Demand' as LevelType,
    strength: '4',
    notes: '',
    active: true,
  });
  const [flowForm, setFlowForm] = useState({
    timestamp: new Date().toISOString().slice(0, 16),
    instrument: 'MNQ' as CommanderInstrument,
    timeframe: 'M1' as Timeframe,
    open: '18942.25',
    high: '18944.00',
    low: '18940.75',
    close: '18943.50',
    delta: '-128',
    deltaChange: '90',
    volume: '546',
    cumulativeDelta: '3210',
    aggressiveBuyersObserved: false,
    aggressiveSellersObserved: true,
    priceContinuedAfterAggression: false,
    notes: '',
  });
  const [riskInputs, setRiskInputs] = useState(initialState.riskInputs);
  const [scoreWeights, setScoreWeights] = useState<CommanderScoreWeights>(initialState.scoreWeights);
  const [minimumScore, setMinimumScore] = useState(initialState.minimumScore);
  const [setupTemplates, setSetupTemplates] = useState<SetupTemplate[]>(initialState.setupTemplates);
  const [playbooks, setPlaybooks] = useState<SetupPlaybook[]>(initialState.playbooks);
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>(initialState.newsEvents);
  const [journalDraft, setJournalDraft] = useState(initialState.journalDraft);
  const [journalRecords, setJournalRecords] = useState<JournalRecord[]>(initialState.journalRecords);
  const [importSummary, setImportSummary] = useState('');
  const [orderFlowSortKey, setOrderFlowSortKey] = useState<OrderFlowSortKey>('timestamp');
  const [orderFlowSortDirection, setOrderFlowSortDirection] = useState<'asc' | 'desc'>('desc');
  const [orderFlowFilter, setOrderFlowFilter] = useState<OrderFlowFilter>('all');
  const [selectedJournalRecordId, setSelectedJournalRecordId] = useState<string | null>(null);
  const [copySummary, setCopySummary] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialState.setupTemplates[0]?.id ?? '');
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>(initialState.playbooks[0]?.id ?? '');
  const [templateForm, setTemplateForm] = useState({
    name: '',
    instrument: 'Any' as CommanderInstrument | 'Any',
    session: 'Any' as CommanderSession | 'Any',
    bias: 'Neutral' as CommanderBias,
    riskContext: 'Balanced' as RiskContext,
    newsRisk: false,
    minimumScore: '70',
    notes: '',
  });
  const [playbookForm, setPlaybookForm] = useState({
    name: '',
    setupType: 'Seller Absorption Long' as SetupPlaybook['setupType'],
    checklist: '',
    executionNotes: '',
    favorite: false,
  });
  const [newsEventForm, setNewsEventForm] = useState({
    title: '',
    timestamp: new Date().toISOString().slice(0, 16),
    instrument: 'All' as CommanderInstrument | 'All',
    session: 'All' as CommanderSession | 'All',
    impact: 'Medium' as NewsEvent['impact'],
    notes: '',
  });

  const config = instrumentConfig[selectedInstrument];
  const activeInstrumentLevels = useMemo(
    () => levels.filter((level) => level.instrument === selectedInstrument && level.active),
    [levels, selectedInstrument]
  );
  const visibleInstrumentLevels = useMemo(
    () =>
      levels.filter((level) => {
        if (level.instrument !== selectedInstrument) return false;
        if (levelFilter === 'active') return level.active;
        if (levelFilter === 'inactive') return !level.active;
        return true;
      }),
    [levelFilter, levels, selectedInstrument]
  );
  const instrumentRows = useMemo(
    () =>
      [...orderFlowRows]
        .filter((row) => row.instrument === selectedInstrument)
        .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()),
    [orderFlowRows, selectedInstrument]
  );
  const latestRow = instrumentRows[0] ?? null;
  const currentPrice = latestRow?.close ?? (Number(manualPrice) || 0);
  const nearestSupport = useMemo(
    () =>
      activeInstrumentLevels
        .filter((level) => supportTypes.includes(level.type) && level.price <= currentPrice)
        .sort((left, right) => right.price - left.price)[0] ?? null,
    [activeInstrumentLevels, currentPrice]
  );
  const nearestResistance = useMemo(
    () =>
      activeInstrumentLevels
        .filter((level) => resistanceTypes.includes(level.type) && level.price >= currentPrice)
        .sort((left, right) => left.price - right.price)[0] ?? null,
    [activeInstrumentLevels, currentPrice]
  );
  const displayedOrderFlowRows = useMemo(
    () =>
      [...instrumentRows]
        .filter((row) => {
          if (orderFlowFilter === 'all') return true;
          if (orderFlowFilter === 'manual' || orderFlowFilter === 'csv') return row.source === orderFlowFilter;
          if (orderFlowFilter === 'positiveDelta') return row.delta >= 0;
          if (orderFlowFilter === 'negativeDelta') return row.delta < 0;
          return row.timeframe === orderFlowFilter;
        })
        .sort((left, right) => {
          const direction = orderFlowSortDirection === 'asc' ? 1 : -1;
          const leftValue = orderFlowSortKey === 'timestamp' ? new Date(left.timestamp).getTime() : left[orderFlowSortKey];
          const rightValue = orderFlowSortKey === 'timestamp' ? new Date(right.timestamp).getTime() : right[orderFlowSortKey];

          if (typeof leftValue === 'number' && typeof rightValue === 'number') return (leftValue - rightValue) * direction;
          return String(leftValue).localeCompare(String(rightValue)) * direction;
        }),
    [instrumentRows, orderFlowFilter, orderFlowSortDirection, orderFlowSortKey]
  );
  const selectedJournalRecord = useMemo(
    () => journalRecords.find((record) => record.id === selectedJournalRecordId) ?? null,
    [journalRecords, selectedJournalRecordId]
  );
  const scoreWeightTotal = useMemo(() => Object.values(scoreWeights).reduce((sum, value) => sum + value, 0), [scoreWeights]);
  const currentSessionRecords = useMemo(
    () =>
      journalRecords.filter(
        (record) => record.session === session && new Date(record.date).toDateString() === new Date().toDateString()
      ),
    [journalRecords, session]
  );
  const currentSessionLosses = useMemo(
    () => currentSessionRecords.filter((record) => record.resultR < 0).length,
    [currentSessionRecords]
  );
  const sessionLocked = currentSessionRecords.length >= 2 || currentSessionLosses >= 2;
  const activeNewsEvents = useMemo(
    () =>
      newsEvents
        .filter((event) => {
          const eventTime = new Date(event.timestamp).getTime();
          const diffMinutes = Math.abs(eventTime - Date.now()) / 60000;
          const matchesInstrument = event.instrument === 'All' || event.instrument === selectedInstrument;
          const matchesSession = event.session === 'All' || event.session === session;
          return matchesInstrument && matchesSession && diffMinutes <= 120;
        })
        .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()),
    [newsEvents, selectedInstrument, session]
  );
  const effectiveNewsRisk = newsRisk || activeNewsEvents.some((event) => event.impact === 'High');
  const selectedPlaybook = useMemo(
    () => playbooks.find((playbook) => playbook.id === selectedPlaybookId) ?? null,
    [playbooks, selectedPlaybookId]
  );
  const plan = useMemo(() => buildCommanderPlan({
    bias,
    session,
    riskContext,
    newsRisk: effectiveNewsRisk,
    currentPrice,
    levels: activeInstrumentLevels,
    rows: instrumentRows,
    tickSize: config.tickSize,
    proximityThreshold: config.proximityThreshold,
    scoreWeights,
    minimumScore,
  }), [activeInstrumentLevels, bias, config.proximityThreshold, config.tickSize, currentPrice, effectiveNewsRisk, instrumentRows, minimumScore, riskContext, scoreWeights, session]);
  const riskMetrics = useMemo(() => calculateRiskMetrics({
    tickSize: config.tickSize,
    defaultTickValue: config.defaultTickValue,
    entry: plan.entry,
    stop: plan.stop,
    tp1: plan.tp1,
    tp2: plan.tp2,
    accountSize: riskInputs.accountSize,
    riskPercent: riskInputs.riskPercent,
    tickValue: riskInputs.tickValue,
  }), [config.defaultTickValue, config.tickSize, plan.entry, plan.stop, plan.tp1, plan.tp2, riskInputs.accountSize, riskInputs.riskPercent, riskInputs.tickValue]);
  const analytics = useMemo(() => buildCommanderAnalytics(journalRecords), [journalRecords]);

  useEffect(() => {
    const state: CommanderWorkspaceState = {
      selectedInstrument,
      session,
      bias,
      riskContext,
      manualPrice,
      newsRisk,
      levels,
      orderFlowRows,
      riskInputs,
      scoreWeights,
      minimumScore,
      setupTemplates,
      playbooks,
      newsEvents,
      journalDraft,
      journalRecords,
    };

    repository.save(state);
  }, [bias, journalDraft, journalRecords, levels, manualPrice, minimumScore, newsEvents, newsRisk, orderFlowRows, playbooks, repository, riskContext, riskInputs, scoreWeights, selectedInstrument, session, setupTemplates]);

  const handleLevelSubmit = () => {
    const nextLevel: CommanderLevel = {
      id: editingLevelId ?? generateId(),
      instrument: levelForm.instrument,
      price: Number(levelForm.price),
      type: levelForm.type,
      strength: Number(levelForm.strength) as CommanderLevel['strength'],
      notes: levelForm.notes,
      active: levelForm.active,
    };

    setLevels((previous) =>
      editingLevelId ? previous.map((level) => (level.id === editingLevelId ? nextLevel : level)) : [nextLevel, ...previous]
    );
    setEditingLevelId(null);
    setLevelForm({
      instrument: selectedInstrument,
      price: currentPrice.toFixed(2),
      type: 'Demand',
      strength: '4',
      notes: '',
      active: true,
    });
  };

  const handleLoadLevel = (level: CommanderLevel) => {
    setEditingLevelId(level.id);
    setLevelForm({
      instrument: level.instrument,
      price: String(level.price),
      type: level.type,
      strength: String(level.strength),
      notes: level.notes,
      active: level.active,
    });
  };

  const handleFlowSubmit = () => {
    const nextRow: OrderFlowRow = {
      id: generateId(),
      timestamp: new Date(flowForm.timestamp).toISOString(),
      instrument: flowForm.instrument,
      timeframe: flowForm.timeframe,
      open: Number(flowForm.open),
      high: Number(flowForm.high),
      low: Number(flowForm.low),
      close: Number(flowForm.close),
      delta: Number(flowForm.delta),
      deltaChange: Number(flowForm.deltaChange),
      volume: Number(flowForm.volume),
      cumulativeDelta: Number(flowForm.cumulativeDelta),
      aggressiveBuyersObserved: flowForm.aggressiveBuyersObserved,
      aggressiveSellersObserved: flowForm.aggressiveSellersObserved,
      priceContinuedAfterAggression: flowForm.priceContinuedAfterAggression,
      notes: flowForm.notes,
      source: 'manual',
    };

    setOrderFlowRows((previous) => [nextRow, ...previous]);
    setFlowForm((previous) => ({
      ...previous,
      close: previous.close,
      delta: '0',
      deltaChange: '0',
      volume: '0',
      cumulativeDelta: previous.cumulativeDelta,
      notes: '',
    }));
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = parseCsvRows(text);
    if (imported.rows.length > 0) {
      setOrderFlowRows((previous) => [...imported.rows, ...previous]);
      setImportSummary(`Imported ${imported.rows.length} row${imported.rows.length === 1 ? '' : 's'} from ${file.name}.${imported.skippedRows > 0 ? ` Skipped ${imported.skippedRows} invalid row${imported.skippedRows === 1 ? '' : 's'}.` : ''}`);
    } else {
      setImportSummary(`No valid rows were imported from ${file.name}.${imported.errors.length > 0 ? ` ${imported.errors.slice(0, 2).join(' ')}` : ''}`);
    }
    event.target.value = '';
  };

  const handleClearImportedRows = () => {
    setOrderFlowRows((previous) => previous.filter((row) => row.source !== 'csv'));
    setImportSummary('Imported CSV rows cleared.');
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = setupTemplates.find((item) => item.id === templateId);
    if (!template) return;

    setSelectedTemplateId(templateId);
    if (template.instrument !== 'Any') {
      setSelectedInstrument(template.instrument);
      setLevelForm((previous) => ({ ...previous, instrument: template.instrument as CommanderInstrument }));
      setFlowForm((previous) => ({ ...previous, instrument: template.instrument as CommanderInstrument }));
      setRiskInputs((previous) => ({
        ...previous,
        tickValue: String(instrumentConfig[template.instrument as CommanderInstrument].defaultTickValue),
      }));
    }
    if (template.session !== 'Any') setSession(template.session);
    setBias(template.bias);
    setRiskContext(template.riskContext);
    setNewsRisk(template.newsRisk);
    setMinimumScore(template.minimumScore);
    setImportSummary(`Applied template: ${template.name}.`);
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim()) return;
    const nextTemplate: SetupTemplate = {
      id: generateId(),
      name: templateForm.name.trim(),
      instrument: templateForm.instrument,
      session: templateForm.session,
      bias: templateForm.bias,
      riskContext: templateForm.riskContext,
      newsRisk: templateForm.newsRisk,
      minimumScore: Number(templateForm.minimumScore) || 70,
      notes: templateForm.notes.trim(),
    };

    setSetupTemplates((previous) => [nextTemplate, ...previous]);
    setSelectedTemplateId(nextTemplate.id);
    setTemplateForm({
      name: '',
      instrument: 'Any',
      session: 'Any',
      bias: 'Neutral',
      riskContext: 'Balanced',
      newsRisk: false,
      minimumScore: String(minimumScore),
      notes: '',
    });
  };

  const handleSavePlaybook = () => {
    if (!playbookForm.name.trim()) return;
    const nextPlaybook: SetupPlaybook = {
      id: generateId(),
      name: playbookForm.name.trim(),
      setupType: playbookForm.setupType,
      checklist: playbookForm.checklist.trim(),
      executionNotes: playbookForm.executionNotes.trim(),
      favorite: playbookForm.favorite,
    };

    setPlaybooks((previous) => [nextPlaybook, ...previous]);
    setSelectedPlaybookId(nextPlaybook.id);
    setPlaybookForm({
      name: '',
      setupType: 'Seller Absorption Long',
      checklist: '',
      executionNotes: '',
      favorite: false,
    });
  };

  const handleSaveNewsEvent = () => {
    if (!newsEventForm.title.trim()) return;
    const nextEvent: NewsEvent = {
      id: generateId(),
      title: newsEventForm.title.trim(),
      timestamp: new Date(newsEventForm.timestamp).toISOString(),
      instrument: newsEventForm.instrument,
      session: newsEventForm.session,
      impact: newsEventForm.impact,
      notes: newsEventForm.notes.trim(),
    };

    setNewsEvents((previous) =>
      [nextEvent, ...previous].sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime())
    );
    setNewsEventForm({
      title: '',
      timestamp: new Date().toISOString().slice(0, 16),
      instrument: 'All',
      session: 'All',
      impact: 'Medium',
      notes: '',
    });
  };

  const handleScreenshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Unable to read screenshot.'));
      reader.readAsDataURL(file);
    });

    setJournalDraft((previous) => ({
      ...previous,
      screenshotName: file.name,
      screenshotDataUrl: dataUrl,
    }));
    event.target.value = '';
  };

  const handleClearJournalDraft = () => {
    setJournalDraft(defaultJournalDraft);
  };

  const handleResetCommanderState = () => {
    const resetState = repository.reset();

    setSelectedInstrument(resetState.selectedInstrument);
    setSession(resetState.session);
    setBias(resetState.bias);
    setRiskContext(resetState.riskContext);
    setManualPrice(resetState.manualPrice);
    setNewsRisk(resetState.newsRisk);
    setLevels(resetState.levels);
    setOrderFlowRows(resetState.orderFlowRows);
    setRiskInputs(resetState.riskInputs);
    setScoreWeights(resetState.scoreWeights);
    setMinimumScore(resetState.minimumScore);
    setSetupTemplates(resetState.setupTemplates);
    setPlaybooks(resetState.playbooks);
    setNewsEvents(resetState.newsEvents);
    setJournalDraft(resetState.journalDraft);
    setJournalRecords(resetState.journalRecords);
    setSelectedTemplateId(resetState.setupTemplates[0]?.id ?? '');
    setSelectedPlaybookId(resetState.playbooks[0]?.id ?? '');
    setImportSummary('Commander state reset to defaults.');
  };

  const handleCopyPlan = async () => {
    const planText = [
      `OrderFlow Commander Plan - ${selectedInstrument}`,
      `Session: ${session}`,
      `Bias: ${bias}`,
      `Setup: ${plan.setupType}`,
      `Direction: ${plan.direction}`,
      `Score: ${plan.score}/100 (${plan.grade})`,
      `Entry: ${plan.entry !== null ? plan.entry.toFixed(2) : 'N/A'}`,
      `Stop: ${plan.stop !== null ? plan.stop.toFixed(2) : 'N/A'}`,
      `TP1: ${plan.tp1 !== null ? plan.tp1.toFixed(2) : 'N/A'}`,
      `TP2: ${plan.tp2 !== null ? plan.tp2.toFixed(2) : 'N/A'}`,
      `Risk/Reward: ${plan.riskReward.toFixed(2)}R`,
      `Trigger: ${plan.entryTrigger}`,
      `Invalidation: ${plan.invalidation}`,
      `Valid reasons: ${plan.validReasons.join('; ') || 'None'}`,
      `Skip reasons: ${plan.skipReasons.join('; ') || 'None'}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(planText);
      setCopySummary('Plan copied to clipboard.');
    } catch {
      setCopySummary('Plan export text is ready, but clipboard access was blocked.');
    }
  };

  const handleSaveJournal = () => {
    if (!plan.entry || !plan.stop || !plan.tp1 || !plan.tp2 || plan.direction === 'No Trade') return;

    const record: JournalRecord = {
      id: generateId(),
      date: new Date().toISOString(),
      instrument: selectedInstrument,
      session,
      setupType: plan.setupType,
      direction: plan.direction,
      entry: plan.entry,
      stop: plan.stop,
      tp1: plan.tp1,
      tp2: plan.tp2,
      exit: Number(journalDraft.exit) || plan.tp1,
      resultR: Number(journalDraft.resultR) || 0,
      profitLoss: Number(journalDraft.profitLoss) || 0,
      notes: journalDraft.notes,
      lessons: journalDraft.lessons,
      mistakeTags: journalDraft.mistakeTags,
      screenshotName: journalDraft.screenshotName,
      screenshotDataUrl: journalDraft.screenshotDataUrl,
      screenshotAnnotation: journalDraft.screenshotAnnotation,
    };

    setJournalRecords((previous) => [record, ...previous]);
    setJournalDraft(defaultJournalDraft);
  };

  const toggleMistakeTag = (tag: MistakeTag) => {
    setJournalDraft((previous) => ({
      ...previous,
      mistakeTags: previous.mistakeTags.includes(tag)
        ? previous.mistakeTags.filter((item) => item !== tag)
        : [...previous.mistakeTags, tag],
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900 text-white shadow-[0_35px_100px_-48px_rgba(2,132,199,0.75)]">
        <CardContent className="relative p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.22),transparent_42%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                <Waves size={14} />
                OrderFlow Commander
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight sm:text-5xl">
                Manual futures execution assistant for MNQ, MES, and GC.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                This MVP helps you structure context, mark levels, input order-flow evidence, score setups, size risk, and journal decisions without pretending to be a broker execution tool.
              </p>
              <Button variant="secondary" className="mt-5" onClick={handleResetCommanderState}>
                Reset Commander
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Instrument</p>
                <p className="mt-2 text-2xl font-semibold">{selectedInstrument}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active setup</p>
                <p className="mt-2 text-xl font-semibold">{plan.setupType}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trade score</p>
                <p className="mt-2 text-2xl font-semibold">{plan.score}/100</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>What OrderFlow Commander Is For</CardTitle>
            <CardDescription>Use Commander as a structured execution assistant for futures order-flow planning, not as a signal or broker tool.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-cyan-500/20 bg-cyan-500/10' : 'border-cyan-200 bg-cyan-50'}`}>
              <p className="text-sm font-semibold">Primary purpose</p>
              <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                OrderFlow Commander helps you organize market context for `MNQ`, `MES`, and `GC`, evaluate setup quality at key levels, apply risk rules, and keep a disciplined journal around execution.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                'Plan around supply, demand, VWAP, value, and session references.',
                'Record delta, volume, aggression, and continuation behavior.',
                'Generate a readable trade plan with valid and skip reasons.',
                'Enforce minimum score, risk/reward, and session discipline.',
              ].map((item) => (
                <div key={item} className={`rounded-[1rem] border p-3 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/70 text-slate-700'}`}>
                  {item}
                </div>
              ))}
            </div>

            <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-amber-800/30 bg-amber-900/20' : 'border-amber-200 bg-amber-50'}`}>
              <p className="text-sm font-semibold text-amber-500">What it is not for</p>
              <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                It does not provide financial advice, promise profitable trades, or place live broker orders. It is a decision-support, review, and journaling workspace.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How To Use It</CardTitle>
            <CardDescription>A simple operating loop for getting value from Commander each session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                step: '1. Set session context',
                text: 'Choose the instrument, session, bias, risk context, and whether manual news risk is active.',
              },
              {
                step: '2. Mark the important levels',
                text: 'Load or create the supply, demand, VWAP, VAH, VAL, overnight, and prior-day references that matter today.',
              },
              {
                step: '3. Add order-flow evidence',
                text: 'Enter manual rows or import CSV data for M1, M3, and M5 so the engine can assess delta, volume, and aggression behavior.',
              },
              {
                step: '4. Review the generated plan',
                text: 'Use the setup type, score breakdown, support/resistance map, and skip reasons to decide whether the trade is actually valid.',
              },
              {
                step: '5. Apply workflow tools',
                text: 'Use templates, score weights, playbooks, session lockout, and news events to keep your process consistent and defensive.',
              },
              {
                step: '6. Journal the outcome',
                text: 'Save the plan, tag mistakes, upload a screenshot, add lessons, and review analytics to improve over time.',
              },
            ].map((item) => (
              <div key={item.step} className={`rounded-[1.1rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                <p className="text-sm font-semibold">{item.step}</p>
                <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Execution Dashboard</CardTitle>
            <CardDescription>Core context, session framing, and setup status for the current futures instrument.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Instrument</label>
                <select
                  value={selectedInstrument}
                  onChange={(event) => {
                    const next = event.target.value as CommanderInstrument;
                    setSelectedInstrument(next);
                    setLevelForm((previous) => ({ ...previous, instrument: next }));
                    setFlowForm((previous) => ({ ...previous, instrument: next }));
                    setRiskInputs((previous) => ({ ...previous, tickValue: String(instrumentConfig[next].defaultTickValue) }));
                  }}
                  className={`mt-1 w-full rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                >
                  <option value="MNQ">MNQ</option>
                  <option value="MES">MES</option>
                  <option value="GC">GC</option>
                </select>
              </div>
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Session</label>
                <select
                  value={session}
                  onChange={(event) => setSession(event.target.value as CommanderSession)}
                  className={`mt-1 w-full rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                >
                  <option>London</option>
                  <option>New York AM</option>
                  <option>New York PM</option>
                  <option>Asia</option>
                </select>
              </div>
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Bias</label>
                <select
                  value={bias}
                  onChange={(event) => setBias(event.target.value as CommanderBias)}
                  className={`mt-1 w-full rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                >
                  <option>Bullish</option>
                  <option>Bearish</option>
                  <option>Neutral</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Current price</label>
                <Input
                  type="number"
                  value={manualPrice}
                  onChange={(event) => setManualPrice(event.target.value)}
                  className="mt-1 rounded-[1.1rem]"
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Risk context</label>
                <select
                  value={riskContext}
                  onChange={(event) => setRiskContext(event.target.value as RiskContext)}
                  className={`mt-1 w-full rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                >
                  <option>Risk-On</option>
                  <option>Risk-Off</option>
                  <option>Balanced</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className={`flex w-full items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
                  <input
                    type="checkbox"
                    checked={newsRisk}
                    onChange={(event) => setNewsRisk(event.target.checked)}
                    className="rounded"
                  />
                  Manual news risk
                </label>
              </div>
              <div className={`rounded-[1.1rem] border px-4 py-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                <p className="mt-1 text-sm font-semibold">{plan.status}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className={`rounded-[1.25rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bias</p>
                <Badge className={`mt-2 ${bias === 'Bullish' ? 'bg-emerald-100 text-emerald-700' : bias === 'Bearish' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}`}>
                  {bias}
                </Badge>
              </div>
              <div className={`rounded-[1.25rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current price</p>
                <p className="mt-2 text-xl font-semibold">{currentPrice.toFixed(selectedInstrument === 'GC' ? 2 : 2)}</p>
              </div>
              <div className={`rounded-[1.25rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Grade</p>
                <p className="mt-2 text-xl font-semibold">{plan.grade}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className={`rounded-[1.1rem] border p-4 ${isDark ? 'border-cyan-500/20 bg-cyan-500/10' : 'border-cyan-200 bg-cyan-50'}`}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Scoring profile</p>
                <p className="mt-1 text-sm font-semibold">{scoreWeightTotal} total points configured</p>
                <p className={`mt-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Minimum tradable score: {minimumScore}</p>
              </div>
              <div className={`rounded-[1.1rem] border p-4 ${isDark ? 'border-amber-500/20 bg-amber-500/10' : 'border-amber-200 bg-amber-50'}`}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Session guardrails</p>
                <p className="mt-1 text-sm font-semibold">{currentSessionRecords.length} trade(s), {currentSessionLosses} loss(es)</p>
                <p className={`mt-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{sessionLocked ? 'Session lockout active.' : 'Session still available.'}</p>
              </div>
              <div className={`rounded-[1.1rem] border p-4 ${effectiveNewsRisk ? isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50' : isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">News radar</p>
                <p className="mt-1 text-sm font-semibold">{activeNewsEvents.length} active event(s)</p>
                <p className={`mt-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{effectiveNewsRisk ? 'Risk is elevated by manual or scheduled news risk.' : 'No elevated news risk in the current window.'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trade Plan Generator</CardTitle>
            <CardDescription>Generated only from the current manual context, levels, and order-flow rows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`rounded-[1.3rem] border p-4 ${isDark ? 'border-cyan-500/20 bg-cyan-500/10' : 'border-cyan-200 bg-cyan-50'}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Detected setup</p>
                  <p className="mt-1 text-lg font-semibold">{plan.setupType}</p>
                </div>
                <Badge className={plan.direction === 'Long' ? 'bg-emerald-100 text-emerald-700' : plan.direction === 'Short' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}>
                  {plan.direction}
                </Badge>
              </div>
              <p className={`mt-3 text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{plan.entryTrigger}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Entry', value: plan.entry },
                { label: 'Stop', value: plan.stop },
                { label: 'TP1', value: plan.tp1 },
                { label: 'TP2', value: plan.tp2 },
              ].map((item) => (
                <div key={item.label} className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-base font-semibold">{item.value !== null ? item.value.toFixed(selectedInstrument === 'GC' ? 2 : 2) : 'N/A'}</p>
                </div>
              ))}
            </div>

            <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Score breakdown</p>
                  <p className="mt-1 text-sm font-semibold">{plan.score}/100 total points</p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleCopyPlan}>
                  <Copy size={14} />
                  Copy plan
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {Object.entries(plan.scoreBreakdown).map(([category, points]) => (
                  <div key={category}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="capitalize text-slate-400">{category}</span>
                      <span className="font-medium">{points}</span>
                    </div>
                    <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, (points / Math.max(scoreWeights[category as keyof CommanderScoreWeights], 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {copySummary && <p className={`mt-3 text-xs ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{copySummary}</p>}
            </div>

            <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Nearest support / resistance map</p>
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="rounded-[1rem] border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <p className="text-xs text-emerald-500">Support</p>
                  <p className="mt-1 text-sm font-semibold">{nearestSupport ? nearestSupport.price.toFixed(2) : 'N/A'}</p>
                  <p className="mt-1 text-xs text-slate-400">{nearestSupport ? `${nearestSupport.type} · ${Math.abs(currentPrice - nearestSupport.price).toFixed(2)} pts away` : 'No active lower support'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Price</p>
                  <p className="text-sm font-bold">{currentPrice.toFixed(2)}</p>
                </div>
                <div className="rounded-[1rem] border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-xs text-red-500">Resistance</p>
                  <p className="mt-1 text-sm font-semibold">{nearestResistance ? nearestResistance.price.toFixed(2) : 'N/A'}</p>
                  <p className="mt-1 text-xs text-slate-400">{nearestResistance ? `${nearestResistance.type} · ${Math.abs(nearestResistance.price - currentPrice).toFixed(2)} pts away` : 'No active upper resistance'}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Why valid</p>
              <div className="mt-2 space-y-2">
                {plan.validReasons.length > 0 ? plan.validReasons.map((reason) => (
                  <p key={reason} className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{reason}</p>
                )) : <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No valid trigger is confirmed yet.</p>}
              </div>
            </div>

            <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-amber-800/30 bg-amber-900/20' : 'border-amber-200 bg-amber-50'}`}>
              <p className="text-xs uppercase tracking-[0.18em] text-amber-500">Why skip</p>
              <div className="mt-2 space-y-2">
                {plan.skipReasons.length > 0 ? plan.skipReasons.map((reason) => (
                  <p key={reason} className={`text-sm ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>{reason}</p>
                )) : <p className={`text-sm ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>No major skip warning is active.</p>}
              </div>
            </div>

            <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Invalidation</p>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{plan.invalidation}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Scoring Lab + Templates</CardTitle>
            <CardDescription>Tune your scoring model and save reusable execution templates for specific sessions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {(Object.keys(defaultScoreWeights) as Array<keyof CommanderScoreWeights>).map((key) => (
                <div key={key}>
                  <label className={`text-xs font-medium uppercase tracking-[0.16em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{key}</label>
                  <Input
                    type="number"
                    value={scoreWeights[key]}
                    onChange={(event) => setScoreWeights((previous) => ({ ...previous, [key]: Number(event.target.value) || 0 }))}
                    className="mt-1 rounded-[1.1rem]"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px]">
              <div>
                <label className={`text-xs font-medium uppercase tracking-[0.16em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Minimum score</label>
                <Input type="number" value={minimumScore} onChange={(event) => setMinimumScore(Number(event.target.value) || 70)} className="mt-1 rounded-[1.1rem]" />
              </div>
              <div className={`rounded-[1.1rem] border px-4 py-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Weight total</p>
                <p className="mt-1 text-lg font-semibold">{scoreWeightTotal}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-[1.15rem] border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Apply template</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Use a saved market posture instead of rebuilding context each session.</p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedTemplateId}
                    onChange={(event) => setSelectedTemplateId(event.target.value)}
                    className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                  >
                    {setupTemplates.map((template) => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                  <Button variant="secondary" onClick={() => handleApplyTemplate(selectedTemplateId)} disabled={!selectedTemplateId}>Apply</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input value={templateForm.name} onChange={(event) => setTemplateForm((previous) => ({ ...previous, name: event.target.value }))} placeholder="Template name" className="rounded-[1.1rem]" />
                <select value={templateForm.instrument} onChange={(event) => setTemplateForm((previous) => ({ ...previous, instrument: event.target.value as CommanderInstrument | 'Any' }))} className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                  <option value="Any">Any instrument</option>
                  <option value="MNQ">MNQ</option>
                  <option value="MES">MES</option>
                  <option value="GC">GC</option>
                </select>
                <select value={templateForm.session} onChange={(event) => setTemplateForm((previous) => ({ ...previous, session: event.target.value as CommanderSession | 'Any' }))} className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                  <option value="Any">Any session</option>
                  <option value="London">London</option>
                  <option value="New York AM">New York AM</option>
                  <option value="New York PM">New York PM</option>
                  <option value="Asia">Asia</option>
                </select>
                <Input type="number" value={templateForm.minimumScore} onChange={(event) => setTemplateForm((previous) => ({ ...previous, minimumScore: event.target.value }))} placeholder="Template minimum score" className="rounded-[1.1rem]" />
                <select value={templateForm.bias} onChange={(event) => setTemplateForm((previous) => ({ ...previous, bias: event.target.value as CommanderBias }))} className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                  <option value="Bullish">Bullish</option>
                  <option value="Bearish">Bearish</option>
                  <option value="Neutral">Neutral</option>
                </select>
                <select value={templateForm.riskContext} onChange={(event) => setTemplateForm((previous) => ({ ...previous, riskContext: event.target.value as RiskContext }))} className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                  <option value="Risk-On">Risk-On</option>
                  <option value="Risk-Off">Risk-Off</option>
                  <option value="Balanced">Balanced</option>
                </select>
              </div>
              <label className={`flex items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
                <input type="checkbox" checked={templateForm.newsRisk} onChange={(event) => setTemplateForm((previous) => ({ ...previous, newsRisk: event.target.checked }))} />
                Template enables news risk by default
              </label>
              <textarea value={templateForm.notes} onChange={(event) => setTemplateForm((previous) => ({ ...previous, notes: event.target.value }))} placeholder="Template notes" rows={3} className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`} />
              <Button onClick={handleSaveTemplate}><Plus size={16} />Save template</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Playbooks + News Calendar</CardTitle>
            <CardDescription>Capture setup-specific execution rules and a manual event calendar that can raise risk warnings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Saved playbooks</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Keep execution checklists tied to actual setup types.</p>
                </div>
                <select value={selectedPlaybookId} onChange={(event) => setSelectedPlaybookId(event.target.value)} className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                  {playbooks.map((playbook) => (
                    <option key={playbook.id} value={playbook.id}>{playbook.name}</option>
                  ))}
                </select>
              </div>
              {selectedPlaybook && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge>{selectedPlaybook.setupType}</Badge>
                    {selectedPlaybook.favorite && <Badge variant="outline">Favorite</Badge>}
                  </div>
                  <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{selectedPlaybook.checklist}</p>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedPlaybook.executionNotes}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input value={playbookForm.name} onChange={(event) => setPlaybookForm((previous) => ({ ...previous, name: event.target.value }))} placeholder="Playbook name" className="rounded-[1.1rem]" />
              <select value={playbookForm.setupType} onChange={(event) => setPlaybookForm((previous) => ({ ...previous, setupType: event.target.value as SetupPlaybook['setupType'] }))} className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                <option value="Seller Absorption Long">Seller Absorption Long</option>
                <option value="Buyer Absorption Short">Buyer Absorption Short</option>
                <option value="Bullish Continuation">Bullish Continuation</option>
                <option value="Bearish Continuation">Bearish Continuation</option>
              </select>
            </div>
            <textarea value={playbookForm.checklist} onChange={(event) => setPlaybookForm((previous) => ({ ...previous, checklist: event.target.value }))} placeholder="Checklist" rows={3} className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`} />
            <textarea value={playbookForm.executionNotes} onChange={(event) => setPlaybookForm((previous) => ({ ...previous, executionNotes: event.target.value }))} placeholder="Execution notes" rows={3} className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`} />
            <label className={`flex items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
              <input type="checkbox" checked={playbookForm.favorite} onChange={(event) => setPlaybookForm((previous) => ({ ...previous, favorite: event.target.checked }))} />
              Mark as favorite
            </label>
            <Button onClick={handleSavePlaybook}><Plus size={16} />Save playbook</Button>

            <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-cyan-500/20 bg-cyan-500/10' : 'border-cyan-200 bg-cyan-50'}`}>
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays size={16} />
                <p className="text-sm font-semibold">Manual news-event calendar</p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input value={newsEventForm.title} onChange={(event) => setNewsEventForm((previous) => ({ ...previous, title: event.target.value }))} placeholder="Event title" className="rounded-[1.1rem]" />
                <Input type="datetime-local" value={newsEventForm.timestamp} onChange={(event) => setNewsEventForm((previous) => ({ ...previous, timestamp: event.target.value }))} className="rounded-[1.1rem]" />
                <select value={newsEventForm.instrument} onChange={(event) => setNewsEventForm((previous) => ({ ...previous, instrument: event.target.value as CommanderInstrument | 'All' }))} className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                  <option value="All">All instruments</option>
                  <option value="MNQ">MNQ</option>
                  <option value="MES">MES</option>
                  <option value="GC">GC</option>
                </select>
                <select value={newsEventForm.session} onChange={(event) => setNewsEventForm((previous) => ({ ...previous, session: event.target.value as CommanderSession | 'All' }))} className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                  <option value="All">All sessions</option>
                  <option value="London">London</option>
                  <option value="New York AM">New York AM</option>
                  <option value="New York PM">New York PM</option>
                  <option value="Asia">Asia</option>
                </select>
                <select value={newsEventForm.impact} onChange={(event) => setNewsEventForm((previous) => ({ ...previous, impact: event.target.value as NewsEvent['impact'] }))} className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                  <option value="Low">Low impact</option>
                  <option value="Medium">Medium impact</option>
                  <option value="High">High impact</option>
                </select>
              </div>
              <textarea value={newsEventForm.notes} onChange={(event) => setNewsEventForm((previous) => ({ ...previous, notes: event.target.value }))} placeholder="Event notes" rows={2} className={`mt-3 w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`} />
              <div className="mt-3 flex flex-wrap gap-3">
                <Button onClick={handleSaveNewsEvent}><Plus size={16} />Save event</Button>
                <p className={`self-center text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{activeNewsEvents.length} event(s) currently inside the warning window.</p>
              </div>
              <div className="mt-4 space-y-2">
                {newsEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className={`rounded-[1rem] border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-white/70 bg-white/70'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{event.title}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(event.timestamp)} {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <Badge variant="outline">{event.impact}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Level Manager</CardTitle>
            <CardDescription>Add, edit, deactivate, and delete the important levels driving the setup engine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select
                value={levelForm.instrument}
                onChange={(event) => setLevelForm((previous) => ({ ...previous, instrument: event.target.value as CommanderInstrument }))}
                className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              >
                <option value="MNQ">MNQ</option>
                <option value="MES">MES</option>
                <option value="GC">GC</option>
              </select>
              <Input
                type="number"
                value={levelForm.price}
                onChange={(event) => setLevelForm((previous) => ({ ...previous, price: event.target.value }))}
                placeholder="Level price"
                className="rounded-[1.1rem]"
              />
              <select
                value={levelForm.type}
                onChange={(event) => setLevelForm((previous) => ({ ...previous, type: event.target.value as LevelType }))}
                className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              >
                {levelTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
              <select
                value={levelForm.strength}
                onChange={(event) => setLevelForm((previous) => ({ ...previous, strength: event.target.value }))}
                className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              >
                {[1, 2, 3, 4, 5].map((strength) => <option key={strength}>{strength}</option>)}
              </select>
            </div>

            <textarea
              value={levelForm.notes}
              onChange={(event) => setLevelForm((previous) => ({ ...previous, notes: event.target.value }))}
              placeholder="Why does this level matter?"
              rows={3}
              className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`}
            />

            <label className={`flex items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
              <input
                type="checkbox"
                checked={levelForm.active}
                onChange={(event) => setLevelForm((previous) => ({ ...previous, active: event.target.checked }))}
              />
              Level is active
            </label>

            <Button onClick={handleLevelSubmit}>
              <Plus size={16} />
              {editingLevelId ? 'Update level' : 'Add level'}
            </Button>

            <div className="flex flex-wrap gap-2">
              {(['active', 'inactive', 'all'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={levelFilter === filter ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setLevelFilter(filter)}
                  className="capitalize"
                >
                  {filter}
                </Button>
              ))}
            </div>

            <div className="space-y-3">
              {visibleInstrumentLevels.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No {levelFilter} levels for this instrument yet.</p>
              ) : (
                visibleInstrumentLevels.map((level) => (
                  <div key={level.id} className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{level.type}</p>
                          <Badge variant="outline">Strength {level.strength}</Badge>
                          <Badge variant={level.active ? 'secondary' : 'outline'}>{level.active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <p className="mt-1 text-sm">{level.price.toFixed(selectedInstrument === 'GC' ? 2 : 2)}</p>
                        <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{level.notes}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleLoadLevel(level)}>Edit</Button>
                        <Button variant="ghost" size="icon" onClick={() => setLevels((previous) => previous.filter((item) => item.id !== level.id))}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order-Flow Input + CSV Import</CardTitle>
            <CardDescription>Enter rows manually or import CSV data to drive setup scoring.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input type="datetime-local" value={flowForm.timestamp} onChange={(event) => setFlowForm((previous) => ({ ...previous, timestamp: event.target.value }))} className="rounded-[1.1rem]" />
              <select
                value={flowForm.instrument}
                onChange={(event) => setFlowForm((previous) => ({ ...previous, instrument: event.target.value as CommanderInstrument }))}
                className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              >
                <option value="MNQ">MNQ</option>
                <option value="MES">MES</option>
                <option value="GC">GC</option>
              </select>
              <select
                value={flowForm.timeframe}
                onChange={(event) => setFlowForm((previous) => ({ ...previous, timeframe: event.target.value as Timeframe }))}
                className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              >
                <option value="M1">M1</option>
                <option value="M3">M3</option>
                <option value="M5">M5</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['open', 'Open'],
                ['high', 'High'],
                ['low', 'Low'],
                ['close', 'Close'],
                ['delta', 'Delta'],
                ['deltaChange', 'Delta Change'],
                ['volume', 'Volume'],
                ['cumulativeDelta', 'Cum Delta'],
              ].map(([key, label]) => (
                <Input
                  key={key}
                  type="number"
                  value={flowForm[key as keyof typeof flowForm] as string}
                  onChange={(event) => setFlowForm((previous) => ({ ...previous, [key]: event.target.value }))}
                  placeholder={label}
                  className="rounded-[1.1rem]"
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className={`flex items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={flowForm.aggressiveBuyersObserved}
                  onChange={(event) => setFlowForm((previous) => ({ ...previous, aggressiveBuyersObserved: event.target.checked }))}
                />
                Aggressive buyers observed
              </label>
              <label className={`flex items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={flowForm.aggressiveSellersObserved}
                  onChange={(event) => setFlowForm((previous) => ({ ...previous, aggressiveSellersObserved: event.target.checked }))}
                />
                Aggressive sellers observed
              </label>
              <label className={`flex items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={flowForm.priceContinuedAfterAggression}
                  onChange={(event) => setFlowForm((previous) => ({ ...previous, priceContinuedAfterAggression: event.target.checked }))}
                />
                Price continued after aggression
              </label>
            </div>

            <textarea
              value={flowForm.notes}
              onChange={(event) => setFlowForm((previous) => ({ ...previous, notes: event.target.value }))}
              placeholder="Notes about absorption, tape speed, or response."
              rows={3}
              className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`}
            />

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleFlowSubmit}>
                <Plus size={16} />
                Add manual row
              </Button>
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
                <Upload size={16} />
                Import CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
              </label>
              <Button variant="secondary" onClick={handleClearImportedRows}>
                Clear imported rows
              </Button>
            </div>

            {importSummary && <p className={`text-sm ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{importSummary}</p>}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select
                value={orderFlowFilter}
                onChange={(event) => setOrderFlowFilter(event.target.value as OrderFlowFilter)}
                className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              >
                <option value="all">All rows</option>
                <option value="M1">M1 only</option>
                <option value="M3">M3 only</option>
                <option value="M5">M5 only</option>
                <option value="manual">Manual only</option>
                <option value="csv">CSV only</option>
                <option value="positiveDelta">Positive delta</option>
                <option value="negativeDelta">Negative delta</option>
              </select>
              <select
                value={orderFlowSortKey}
                onChange={(event) => setOrderFlowSortKey(event.target.value as OrderFlowSortKey)}
                className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              >
                <option value="timestamp">Sort by time</option>
                <option value="timeframe">Sort by timeframe</option>
                <option value="close">Sort by close</option>
                <option value="delta">Sort by delta</option>
                <option value="volume">Sort by volume</option>
                <option value="source">Sort by source</option>
              </select>
              <Button variant="secondary" onClick={() => setOrderFlowSortDirection((previous) => previous === 'asc' ? 'desc' : 'asc')}>
                {orderFlowSortDirection === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>

            <div className="max-h-[340px] overflow-auto rounded-[1.15rem] border p-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    <th className="px-2 py-2 text-left font-medium">Time</th>
                    <th className="px-2 py-2 text-left font-medium">TF</th>
                    <th className="px-2 py-2 text-right font-medium">Close</th>
                    <th className="px-2 py-2 text-right font-medium">Delta</th>
                    <th className="px-2 py-2 text-right font-medium">Vol</th>
                    <th className="px-2 py-2 text-left font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrderFlowRows.slice(0, 12).map((row) => (
                    <tr key={row.id} className={`border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                      <td className="px-2 py-2">{new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-2 py-2">{row.timeframe}</td>
                      <td className="px-2 py-2 text-right">{row.close.toFixed(2)}</td>
                      <td className={`px-2 py-2 text-right ${row.delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{row.delta}</td>
                      <td className="px-2 py-2 text-right">{row.volume}</td>
                      <td className="px-2 py-2 capitalize">{row.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Risk Engine</CardTitle>
            <CardDescription>Manual sizing with hard rules for score, reward, losses, and session trade count.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input type="number" value={riskInputs.accountSize} onChange={(event) => setRiskInputs((previous) => ({ ...previous, accountSize: event.target.value }))} placeholder="Account size" className="rounded-[1.1rem]" />
              <Input type="number" value={riskInputs.riskPercent} onChange={(event) => setRiskInputs((previous) => ({ ...previous, riskPercent: event.target.value }))} placeholder="Risk %" className="rounded-[1.1rem]" />
              <Input type="number" value={riskInputs.tickValue} onChange={(event) => setRiskInputs((previous) => ({ ...previous, tickValue: event.target.value }))} placeholder="Tick value" className="rounded-[1.1rem]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Risk per contract', value: formatCurrency(riskMetrics.riskPerContract) },
                { label: 'Max contracts', value: String(riskMetrics.maxContracts) },
                { label: 'Total risk', value: formatCurrency(riskMetrics.totalRisk) },
                { label: 'R multiple at TP1', value: `${riskMetrics.rMultiple.toFixed(2)}R` },
                { label: 'Reward at TP1', value: formatCurrency(riskMetrics.rewardTp1) },
                { label: 'Reward at TP2', value: formatCurrency(riskMetrics.rewardTp2) },
              ].map((item) => (
                <div key={item.label} className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-base font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-amber-800/30 bg-amber-900/20' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-500" />
                <div className={`space-y-2 text-sm ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                  <p>Hard rules: max 2 trades per session, stop after 2 losses, and no setups below 70 score.</p>
                  {plan.score < minimumScore && <p>Current warning: setup score is below the tradable threshold of {minimumScore}.</p>}
                  {plan.riskReward > 0 && plan.riskReward < 1.5 && <p>Current warning: risk/reward is below 1.5R.</p>}
                  {effectiveNewsRisk && <p>Current warning: news risk is active, so the plan should stay defensive or be skipped.</p>}
                  {sessionLocked && <p>Current warning: session lockout is active because the session already hit the trade or loss limit.</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Journal</CardTitle>
            <CardDescription>Save the current plan, annotate outcome quality, and track execution mistakes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {[
                { label: 'Trades', value: String(analytics.summary.totalTrades) },
                { label: 'Win Rate', value: `${analytics.summary.winRate.toFixed(0)}%` },
                { label: 'Avg R', value: analytics.summary.averageR.toFixed(2) },
                { label: 'Best Setup', value: analytics.summary.bestSetupType },
              ].map((item) => (
                <div key={item.label} className={`rounded-[1.1rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-base font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input type="number" value={journalDraft.exit} onChange={(event) => setJournalDraft((previous) => ({ ...previous, exit: event.target.value }))} placeholder="Exit price" className="rounded-[1.1rem]" />
              <Input type="number" value={journalDraft.resultR} onChange={(event) => setJournalDraft((previous) => ({ ...previous, resultR: event.target.value }))} placeholder="Result in R" className="rounded-[1.1rem]" />
              <Input type="number" value={journalDraft.profitLoss} onChange={(event) => setJournalDraft((previous) => ({ ...previous, profitLoss: event.target.value }))} placeholder="P/L" className="rounded-[1.1rem]" />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
              <label className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-[1.1rem] border px-4 py-3 text-sm font-medium ${isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
                <Upload size={16} />
                Upload screenshot
                <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
              </label>
              <Input value={journalDraft.screenshotAnnotation} onChange={(event) => setJournalDraft((previous) => ({ ...previous, screenshotAnnotation: event.target.value }))} placeholder="Screenshot annotation" className="rounded-[1.1rem]" />
            </div>

            {journalDraft.screenshotDataUrl && (
              <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{journalDraft.screenshotName ?? 'Screenshot preview'}</p>
                <img src={journalDraft.screenshotDataUrl} alt="Journal draft screenshot" className="mt-3 max-h-52 rounded-[1rem] border object-cover" />
                {journalDraft.screenshotAnnotation && <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{journalDraft.screenshotAnnotation}</p>}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {mistakeTags.map((tag) => (
                <Button
                  key={tag}
                  onClick={() => toggleMistakeTag(tag)}
                  variant={journalDraft.mistakeTags.includes(tag) ? 'default' : 'secondary'}
                  size="sm"
                >
                  {tag}
                </Button>
              ))}
            </div>

            <textarea
              value={journalDraft.notes}
              onChange={(event) => setJournalDraft((previous) => ({ ...previous, notes: event.target.value }))}
              placeholder="Execution notes"
              rows={3}
              className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`}
            />
            <textarea
              value={journalDraft.lessons}
              onChange={(event) => setJournalDraft((previous) => ({ ...previous, lessons: event.target.value }))}
              placeholder="Lessons learned"
              rows={3}
              className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`}
            />

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSaveJournal} disabled={!plan.entry || !plan.stop || !plan.tp1 || !plan.tp2 || plan.direction === 'No Trade' || sessionLocked || plan.score < minimumScore}>
                <Target size={16} />
                Save current plan to journal
              </Button>
              <Button variant="secondary" onClick={handleClearJournalDraft}>
                Clear draft
              </Button>
            </div>

            <div className="space-y-3">
              {journalRecords.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No journal records yet. Save the current plan after a review or paper execution.</p>
              ) : (
                journalRecords.slice(0, 6).map((record) => (
                  <div key={record.id} className={`rounded-[1.15rem] border p-4 ${selectedJournalRecordId === record.id ? isDark ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-cyan-200 bg-cyan-50' : isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{record.instrument} · {record.setupType}</p>
                          <Badge className={record.direction === 'Long' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                            {record.direction}
                          </Badge>
                        </div>
                        <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(record.date)} · {record.session}</p>
                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{record.notes || 'No notes recorded.'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${record.resultR >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{record.resultR.toFixed(2)}R</p>
                        <p className="mt-1 text-xs">{formatCurrency(record.profitLoss)}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-3"
                          onClick={() => setSelectedJournalRecordId((previous) => previous === record.id ? null : record.id)}
                        >
                          {selectedJournalRecordId === record.id ? 'Hide' : 'Details'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedJournalRecord && (
              <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-cyan-500/20 bg-cyan-500/10' : 'border-cyan-200 bg-cyan-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Journal detail</p>
                    <p className="mt-1 text-sm font-semibold">{selectedJournalRecord.instrument} · {selectedJournalRecord.setupType}</p>
                  </div>
                  <Badge className={selectedJournalRecord.direction === 'Long' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                    {selectedJournalRecord.direction}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { label: 'Entry', value: selectedJournalRecord.entry.toFixed(2) },
                    { label: 'Stop', value: selectedJournalRecord.stop.toFixed(2) },
                    { label: 'TP1', value: selectedJournalRecord.tp1.toFixed(2) },
                    { label: 'Exit', value: selectedJournalRecord.exit.toFixed(2) },
                    { label: 'Result', value: `${selectedJournalRecord.resultR.toFixed(2)}R` },
                    { label: 'P/L', value: formatCurrency(selectedJournalRecord.profitLoss) },
                    { label: 'Session', value: selectedJournalRecord.session },
                    { label: 'Date', value: formatDate(selectedJournalRecord.date) },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-[1rem] border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-white/70 bg-white/60'}`}>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{selectedJournalRecord.notes || 'No execution notes recorded.'}</p>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedJournalRecord.lessons || 'No lessons recorded.'}</p>
                  {selectedJournalRecord.screenshotDataUrl && (
                    <div className={`rounded-[1rem] border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-white/70 bg-white/60'}`}>
                      <img src={selectedJournalRecord.screenshotDataUrl} alt={selectedJournalRecord.screenshotName ?? 'Journal screenshot'} className="max-h-56 rounded-[0.9rem] border object-cover" />
                      {selectedJournalRecord.screenshotAnnotation && <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedJournalRecord.screenshotAnnotation}</p>}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selectedJournalRecord.mistakeTags.length > 0 ? selectedJournalRecord.mistakeTags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    )) : <Badge variant="outline">No tags</Badge>}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CommanderAnalyticsSection analytics={analytics} isDark={isDark} />

      <div className={`flex items-start gap-3 rounded-[1.2rem] border p-4 text-sm ${isDark ? 'border-amber-800/30 bg-amber-900/20 text-amber-200/80' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
        <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-500" />
        <p>
          This application is for educational and journaling purposes only. It does not provide financial advice, guarantee profits, or replace professional risk management. Futures trading involves substantial risk.
        </p>
      </div>
    </div>
  );
}
