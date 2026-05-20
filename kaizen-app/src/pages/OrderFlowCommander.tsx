import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
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
import { instrumentConfig, levelTypes, mistakeTags, resistanceTypes, seedLevels, seedRows, supportTypes } from '../orderflow/constants';
import { buildCommanderAnalytics } from '../orderflow/analytics';
import { CommanderAnalyticsSection } from '../orderflow/components/CommanderAnalyticsSection';
import { parseCsvRows } from '../orderflow/csv';
import { calculateRiskMetrics } from '../orderflow/riskEngine';
import { buildCommanderPlan } from '../orderflow/setupEngine';
import { clearCommanderState, loadCommanderState, saveCommanderState } from '../orderflow/storage';
import {
  CommanderBias,
  CommanderInstrument,
  CommanderLevel,
  CommanderSession,
  JournalRecord,
  LevelFilter,
  LevelType,
  MistakeTag,
  OrderFlowRow,
  RiskContext,
  Timeframe,
} from '../orderflow/types';

const defaultJournalDraft = {
  exit: '',
  resultR: '',
  profitLoss: '',
  notes: '',
  lessons: '',
  mistakeTags: [] as MistakeTag[],
};

type OrderFlowSortKey = 'timestamp' | 'timeframe' | 'close' | 'delta' | 'volume' | 'source';
type OrderFlowFilter = 'all' | 'M1' | 'M3' | 'M5' | 'manual' | 'csv' | 'positiveDelta' | 'negativeDelta';

export default function OrderFlowCommander() {
  const { isDark } = useTheme();
  const initialState = useMemo(() => loadCommanderState({
    selectedInstrument: 'MNQ' as CommanderInstrument,
    session: 'New York AM' as CommanderSession,
    bias: 'Bullish' as CommanderBias,
    riskContext: 'Balanced' as RiskContext,
    manualPrice: '18945.50',
    newsRisk: false,
    levels: seedLevels,
    orderFlowRows: seedRows,
    riskInputs: {
      accountSize: '25000',
      riskPercent: '1',
      tickValue: String(instrumentConfig.MNQ.defaultTickValue),
    },
    journalDraft: defaultJournalDraft,
    journalRecords: [] as JournalRecord[],
  }), []);
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
  const [journalDraft, setJournalDraft] = useState(initialState.journalDraft);
  const [journalRecords, setJournalRecords] = useState<JournalRecord[]>(initialState.journalRecords);
  const [importSummary, setImportSummary] = useState('');
  const [orderFlowSortKey, setOrderFlowSortKey] = useState<OrderFlowSortKey>('timestamp');
  const [orderFlowSortDirection, setOrderFlowSortDirection] = useState<'asc' | 'desc'>('desc');
  const [orderFlowFilter, setOrderFlowFilter] = useState<OrderFlowFilter>('all');
  const [selectedJournalRecordId, setSelectedJournalRecordId] = useState<string | null>(null);
  const [copySummary, setCopySummary] = useState('');

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

  const plan = useMemo(() => buildCommanderPlan({
    bias,
    session,
    riskContext,
    newsRisk,
    currentPrice,
    levels: activeInstrumentLevels,
    rows: instrumentRows,
    tickSize: config.tickSize,
    proximityThreshold: config.proximityThreshold,
  }), [activeInstrumentLevels, bias, config.proximityThreshold, config.tickSize, currentPrice, instrumentRows, newsRisk, riskContext, session]);

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
    saveCommanderState({
      selectedInstrument,
      session,
      bias,
      riskContext,
      manualPrice,
      newsRisk,
      levels,
      orderFlowRows,
      riskInputs,
      journalDraft,
      journalRecords,
    });
  }, [bias, journalDraft, journalRecords, levels, manualPrice, newsRisk, orderFlowRows, riskContext, riskInputs, selectedInstrument, session]);

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

  const handleClearJournalDraft = () => {
    setJournalDraft(defaultJournalDraft);
  };

  const handleResetCommanderState = () => {
    clearCommanderState();
    setSelectedInstrument('MNQ');
    setSession('New York AM');
    setBias('Bullish');
    setRiskContext('Balanced');
    setManualPrice('18945.50');
    setNewsRisk(false);
    setLevels(seedLevels);
    setOrderFlowRows(seedRows);
    setRiskInputs({
      accountSize: '25000',
      riskPercent: '1',
      tickValue: String(instrumentConfig.MNQ.defaultTickValue),
    });
    setJournalDraft(defaultJournalDraft);
    setJournalRecords([]);
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
    };

    setJournalRecords((previous) => [record, ...previous]);
    setJournalDraft({
      exit: '',
      resultR: '',
      profitLoss: '',
      notes: '',
      lessons: '',
      mistakeTags: [],
    });
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
                  News risk active
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
                      <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, (points / 25) * 100)}%` }} />
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
                  {plan.score < 70 && <p>Current warning: setup score is below the tradable threshold.</p>}
                  {plan.riskReward > 0 && plan.riskReward < 1.5 && <p>Current warning: risk/reward is below 1.5R.</p>}
                  {newsRisk && <p>Current warning: news risk is active, so the plan should stay defensive or be skipped.</p>}
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
              <Button onClick={handleSaveJournal} disabled={!plan.entry || !plan.stop || !plan.tp1 || !plan.tp2 || plan.direction === 'No Trade'}>
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
