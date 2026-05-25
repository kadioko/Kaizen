import React from 'react';
import { Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { CommanderLevel, CommanderPlan, CommanderScoreWeights } from '../types';

interface TradePlansProps {
  isDark: boolean;
  plan: CommanderPlan;
  nearestSupport: CommanderLevel | null;
  nearestResistance: CommanderLevel | null;
  currentPrice: number;
  scoreWeights: CommanderScoreWeights;
  minimumScore: number;
  newsRisk: boolean;
  sessionLocked: boolean;
  onCopyPlan: () => void;
  copySummary: string;
}

export function TradePlans({
  isDark,
  plan,
  nearestSupport,
  nearestResistance,
  currentPrice,
  scoreWeights,
  minimumScore,
  newsRisk,
  sessionLocked,
  onCopyPlan,
  copySummary,
}: TradePlansProps) {
  const surfaceClass = isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70';

  const decimals = 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Plan</CardTitle>
        <CardDescription>
          Setup detection, entry logic, and risk controls based on current context and levels.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entry/Stop/Targets Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Entry', value: plan.entry },
            { label: 'Stop', value: plan.stop },
            { label: 'TP1', value: plan.tp1 },
            { label: 'TP2', value: plan.tp2 },
          ].map((item) => (
            <div key={item.label} className={`rounded-[1.15rem] border p-4 ${surfaceClass}`}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
              <p className="mt-1 text-base font-semibold">
                {item.value !== null ? item.value.toFixed(decimals) : 'N/A'}
              </p>
            </div>
          ))}
        </div>

        {/* Score Breakdown */}
        <div className={`rounded-[1.15rem] border p-4 ${surfaceClass}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Score breakdown</p>
              <p className="mt-1 text-sm font-semibold">{plan.score}/100 total points</p>
            </div>
            <Button variant="secondary" size="sm" onClick={onCopyPlan}>
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
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{
                      width: `${Math.min(100, (points / Math.max(scoreWeights[category as keyof CommanderScoreWeights], 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {copySummary && (
            <p className={`mt-3 text-xs ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{copySummary}</p>
          )}
        </div>

        {/* Support/Resistance Map */}
        <div className={`rounded-[1.15rem] border p-4 ${surfaceClass}`}>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Nearest support / resistance map</p>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="rounded-[1rem] border border-emerald-500/20 bg-emerald-500/10 p-3">
              <p className="text-xs text-emerald-500">Support</p>
              <p className="mt-1 text-sm font-semibold">
                {nearestSupport ? nearestSupport.price.toFixed(decimals) : 'N/A'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {nearestSupport
                  ? `${nearestSupport.type} · ${Math.abs(currentPrice - nearestSupport.price).toFixed(decimals)} pts away`
                  : 'No active lower support'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Price</p>
              <p className="text-sm font-bold">{currentPrice.toFixed(decimals)}</p>
            </div>
            <div className="rounded-[1rem] border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-xs text-red-500">Resistance</p>
              <p className="mt-1 text-sm font-semibold">
                {nearestResistance ? nearestResistance.price.toFixed(decimals) : 'N/A'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {nearestResistance
                  ? `${nearestResistance.type} · ${Math.abs(nearestResistance.price - currentPrice).toFixed(decimals)} pts away`
                  : 'No active upper resistance'}
              </p>
            </div>
          </div>
        </div>

        {/* Valid Reasons */}
        <div className={`rounded-[1.15rem] border p-4 ${surfaceClass}`}>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Why valid</p>
          <div className="mt-2 space-y-2">
            {plan.validReasons.length > 0 ? (
              plan.validReasons.map((reason) => (
                <p key={reason} className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {reason}
                </p>
              ))
            ) : (
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No valid trigger is confirmed yet.
              </p>
            )}
          </div>
        </div>

        {/* Skip Reasons */}
        <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-amber-800/30 bg-amber-900/20' : 'border-amber-200 bg-amber-50'}`}>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-500">Why skip</p>
          <div className="mt-2 space-y-2">
            {plan.skipReasons.length > 0 ? (
              plan.skipReasons.map((reason) => (
                <p key={reason} className={`text-sm ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                  {reason}
                </p>
              ))
            ) : (
              <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>No skip reasons. Setup may be valid.</p>
            )}
          </div>
        </div>

        {/* Warnings */}
        <div className={`flex items-start gap-3 rounded-[1.2rem] border p-4 ${isDark ? 'border-amber-800/30 bg-amber-900/20' : 'border-amber-200 bg-amber-50'}`}>
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-500" />
          <div className={`space-y-2 text-sm ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
            <p>Hard rules: max 2 trades per session, stop after 2 losses, and no setups below {minimumScore} score.</p>
            {plan.score < minimumScore && (
              <p>Current warning: setup score is below the tradable threshold of {minimumScore}.</p>
            )}
            {plan.riskReward > 0 && plan.riskReward < 1.5 && (
              <p>Current warning: risk/reward is below 1.5R.</p>
            )}
            {newsRisk && (
              <p>Current warning: news risk is active, so the plan should stay defensive or be skipped.</p>
            )}
            {sessionLocked && (
              <p>Current warning: session lockout is active because the session already hit the trade or loss limit.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
