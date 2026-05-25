import React from 'react';
import { Waves } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { CommanderPlan, CommanderInstrument } from '../types';

interface CommanderHeroProps {
  selectedInstrument: CommanderInstrument;
  plan: CommanderPlan;
  onReset: () => void;
}

export function CommanderHero({ selectedInstrument, plan, onReset }: CommanderHeroProps) {
  return (
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
              Order-flow execution assistant for forex majors and XAUUSD.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Structure context, mark levels, track order-flow evidence, generate trade plans, size risk, and review execution for `EURUSD`, `GBPUSD`, `USDJPY`, `USDCHF`, `AUDUSD`, `USDCAD`, `NZDUSD`, and `XAUUSD`.
            </p>
            <button
              type="button"
              onClick={onReset}
              className="mt-5 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Reset Commander
            </button>
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
  );
}
