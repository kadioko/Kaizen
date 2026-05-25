import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { formatCurrency } from '../../utils/helpers';
import { RiskMetrics } from '../types';

interface RiskInputs {
  accountSize: string;
  riskPercent: string;
  tickValue: string;
}

interface RiskCardProps {
  isDark: boolean;
  riskInputs: RiskInputs;
  setRiskInputs: React.Dispatch<React.SetStateAction<RiskInputs>>;
  riskMetrics: RiskMetrics;
}

export function RiskCard({ isDark, riskInputs, setRiskInputs, riskMetrics }: RiskCardProps) {
  const surfaceClass = isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Sizing</CardTitle>
        <CardDescription>Position sizing based on account, risk percent, and tick value.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Account size</label>
            <Input
              type="number"
              value={riskInputs.accountSize}
              onChange={(event) => setRiskInputs((previous) => ({ ...previous, accountSize: event.target.value }))}
              className="mt-1 rounded-[1.1rem]"
            />
          </div>
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Risk %</label>
            <Input
              type="number"
              value={riskInputs.riskPercent}
              onChange={(event) => setRiskInputs((previous) => ({ ...previous, riskPercent: event.target.value }))}
              className="mt-1 rounded-[1.1rem]"
            />
          </div>
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Tick value</label>
            <Input
              type="number"
              value={riskInputs.tickValue}
              onChange={(event) => setRiskInputs((previous) => ({ ...previous, tickValue: event.target.value }))}
              className="mt-1 rounded-[1.1rem]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className={`rounded-[1.1rem] border p-4 ${surfaceClass}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Risk budget</p>
            <p className="mt-1 text-base font-semibold">{formatCurrency(riskMetrics.riskBudget)}</p>
          </div>
          <div className={`rounded-[1.1rem] border p-4 ${surfaceClass}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Contracts</p>
            <p className="mt-1 text-base font-semibold">
              {riskMetrics.maxContracts} @ ${riskMetrics.riskPerContract.toFixed(2)} risk
            </p>
          </div>
          <div className={`rounded-[1.1rem] border p-4 ${surfaceClass}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total risk</p>
            <p className="mt-1 text-base font-semibold">{formatCurrency(riskMetrics.totalRisk)}</p>
          </div>
          <div className={`rounded-[1.1rem] border p-4 ${surfaceClass}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">R multiple</p>
            <p className="mt-1 text-base font-semibold">{riskMetrics.rMultiple.toFixed(2)}R</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
