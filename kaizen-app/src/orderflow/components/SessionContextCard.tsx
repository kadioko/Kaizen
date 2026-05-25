import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { commanderInstrumentOptions, instrumentConfig } from '../constants';
import { CommanderBias, CommanderInstrument, CommanderPlan, CommanderScoreWeights, CommanderSession, RiskContext } from '../types';

interface SessionContextCardProps {
  isDark: boolean;
  selectedInstrument: CommanderInstrument;
  setSelectedInstrument: (instrument: CommanderInstrument) => void;
  session: CommanderSession;
  setSession: (session: CommanderSession) => void;
  bias: CommanderBias;
  setBias: (bias: CommanderBias) => void;
  riskContext: RiskContext;
  setRiskContext: (context: RiskContext) => void;
  manualPrice: string;
  setManualPrice: (price: string) => void;
  newsRisk: boolean;
  setNewsRisk: (risk: boolean) => void;
  plan: CommanderPlan;
  currentPrice: number;
  scoreWeights: CommanderScoreWeights;
  minimumScore: number;
  scoreWeightTotal: number;
  currentSessionRecords: JournalRecord[];
  currentSessionLosses: number;
  sessionLocked: boolean;
  activeNewsEvents: { impact: string }[];
  effectiveNewsRisk: boolean;
  onSyncInstrument: (instrument: CommanderInstrument) => void;
}

interface JournalRecord {
  resultR: number;
}

export function SessionContextCard({
  isDark,
  selectedInstrument,
  setSelectedInstrument,
  session,
  setSession,
  bias,
  setBias,
  riskContext,
  setRiskContext,
  manualPrice,
  setManualPrice,
  newsRisk,
  setNewsRisk,
  plan,
  currentPrice,
  minimumScore,
  scoreWeightTotal,
  currentSessionRecords,
  currentSessionLosses,
  sessionLocked,
  activeNewsEvents,
  effectiveNewsRisk,
  onSyncInstrument,
}: SessionContextCardProps) {
  const surfaceClass = isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70';
  const decimals = instrumentConfig[selectedInstrument].priceDecimals;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Context</CardTitle>
        <CardDescription>Set the market context that drives the setup engine.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Controls */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Instrument</label>
            <select
              value={selectedInstrument}
              onChange={(event) => onSyncInstrument(event.target.value as CommanderInstrument)}
              className={`mt-1 w-full rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              {commanderInstrumentOptions.map((instrument) => (
                <option key={instrument} value={instrument}>{instrument}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Session</label>
            <select
              value={session}
              onChange={(event) => setSession(event.target.value as CommanderSession)}
              className={`mt-1 w-full rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
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
              className={`mt-1 w-full rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <option>Bullish</option>
              <option>Bearish</option>
              <option>Neutral</option>
            </select>
          </div>
        </div>

        {/* Secondary Controls */}
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
              className={`mt-1 w-full rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <option>Risk-On</option>
              <option>Risk-Off</option>
              <option>Balanced</option>
            </select>
          </div>
          <div className="flex items-end">
            <label
              className={`flex w-full items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${
                isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={newsRisk}
                onChange={(event) => setNewsRisk(event.target.checked)}
                className="rounded"
              />
              Manual news risk
            </label>
          </div>
          <div className={`rounded-[1.1rem] border px-4 py-3 ${surfaceClass}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
            <p className="mt-1 text-sm font-semibold">{plan.status}</p>
          </div>
        </div>

        {/* Display Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={`rounded-[1.25rem] border p-4 ${surfaceClass}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bias</p>
            <Badge
              className={`mt-2 ${
                bias === 'Bullish'
                  ? 'bg-emerald-100 text-emerald-700'
                  : bias === 'Bearish'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-sky-100 text-sky-700'
              }`}
            >
              {bias}
            </Badge>
          </div>
          <div className={`rounded-[1.25rem] border p-4 ${surfaceClass}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current price</p>
            <p className="mt-2 text-xl font-semibold">{currentPrice.toFixed(decimals)}</p>
          </div>
          <div className={`rounded-[1.25rem] border p-4 ${surfaceClass}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Grade</p>
            <p className="mt-2 text-xl font-semibold">{plan.grade}</p>
          </div>
        </div>

        {/* Guardrails */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={`rounded-[1.1rem] border p-4 ${isDark ? 'border-cyan-500/20 bg-cyan-500/10' : 'border-cyan-200 bg-cyan-50'}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Scoring profile</p>
            <p className="mt-1 text-sm font-semibold">{scoreWeightTotal} total points configured</p>
            <p className={`mt-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Minimum tradable score: {minimumScore}</p>
          </div>
          <div className={`rounded-[1.1rem] border p-4 ${isDark ? 'border-amber-500/20 bg-amber-500/10' : 'border-amber-200 bg-amber-50'}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Session guardrails</p>
            <p className="mt-1 text-sm font-semibold">
              {currentSessionRecords.length} trade(s), {currentSessionLosses} loss(es)
            </p>
            <p className={`mt-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {sessionLocked ? 'Session lockout active.' : 'Session still available.'}
            </p>
          </div>
          <div
            className={`rounded-[1.1rem] border p-4 ${
              effectiveNewsRisk
                ? isDark
                  ? 'border-red-500/20 bg-red-500/10'
                  : 'border-red-200 bg-red-50'
                : surfaceClass
            }`}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">News radar</p>
            <p className="mt-1 text-sm font-semibold">{activeNewsEvents.length} active event(s)</p>
            <p className={`mt-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {effectiveNewsRisk
                ? 'Risk is elevated by manual or scheduled news risk.'
                : 'No elevated news risk in the current window.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
