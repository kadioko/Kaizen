import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

interface CommanderGuideProps {
  isDark: boolean;
}

export function CommanderGuide({ isDark }: CommanderGuideProps) {
  return (
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
              OrderFlow Commander helps you organize market context for forex majors like `EURUSD`, `GBPUSD`, `USDJPY`, and for `XAUUSD`, while still supporting futures workflows when needed.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              'Plan around supply, demand, VWAP, value, and session references across forex majors and gold.',
              'Record delta, volume, aggression, and continuation behavior.',
              'Generate a readable trade plan with valid and skip reasons.',
              'Enforce minimum score, risk/reward, and session discipline.',
            ].map((item) => (
              <div key={item} className={`rounded-[1rem] border p-3 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/70 text-slate-700'}`}>
                {item}
              </div>
            ))}
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
            { step: '1. Set session context', text: 'Choose the instrument, session, bias, risk context, and whether manual news risk is active.' },
            { step: '2. Mark the important levels', text: 'Load or create the supply, demand, VWAP, VAH, VAL, overnight, and prior-day references that matter today.' },
            { step: '3. Add order-flow evidence', text: 'Enter manual rows or import CSV data for M1, M3, and M5 so the engine can assess delta, volume, and aggression behavior.' },
            { step: '4. Review the generated plan', text: 'Use the setup type, score breakdown, support/resistance map, and skip reasons to decide whether the trade is actually valid.' },
            { step: '5. Apply workflow tools', text: 'Use templates, score weights, playbooks, session lockout, and news events to keep your process consistent and defensive.' },
            { step: '6. Journal the outcome', text: 'Save the plan, tag mistakes, upload a screenshot, add lessons, and review analytics to improve over time.' },
          ].map((item) => (
            <div key={item.step} className={`rounded-[1.1rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
              <p className="text-sm font-semibold">{item.step}</p>
              <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
