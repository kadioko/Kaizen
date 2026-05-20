import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { CommanderAnalytics } from '../analytics';
import { formatCurrency } from '../../utils/helpers';

interface CommanderAnalyticsSectionProps {
  analytics: CommanderAnalytics;
  isDark: boolean;
}

const directionColors: Record<string, string> = {
  Long: '#10b981',
  Short: '#ef4444',
};

const chartAxisClass = 'text-[11px] fill-slate-400';

export function CommanderAnalyticsSection({ analytics, isDark }: CommanderAnalyticsSectionProps) {
  const surfaceClass = isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70';
  const subtleClass = isDark ? 'text-slate-300' : 'text-slate-600';

  if (analytics.summary.totalTrades === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Performance review unlocks after you have journal records to analyze.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`rounded-[1.15rem] border border-dashed p-6 text-sm ${subtleClass}`}>
            Save journal entries and this section will start showing setup quality, session strength, mistake frequency, and rolling trade health.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>Review what is working across setups, sessions, directions, and instruments.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'Profit Factor', value: analytics.summary.profitFactor.toFixed(2) },
            { label: 'Net P/L', value: formatCurrency(analytics.summary.totalProfitLoss) },
            { label: 'Worst Setup', value: analytics.summary.worstSetupType },
            {
              label: analytics.rollingWindows[0].label,
              value: `${analytics.rollingWindows[0].averageR.toFixed(2)}R / ${analytics.rollingWindows[0].winRate.toFixed(0)}%`,
            },
          ].map((item) => (
            <div key={item.label} className={`rounded-[1.1rem] border p-4 ${surfaceClass}`}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
              <p className="mt-1 text-base font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className={`rounded-[1.15rem] border p-4 ${surfaceClass}`}>
            <div className="mb-4">
              <p className="text-sm font-semibold">Setup performance</p>
              <p className={`text-xs ${subtleClass}`}>Average R by setup type with live journal data.</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.bySetupType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} className={chartAxisClass} interval={0} angle={-18} textAnchor="end" height={60} />
                  <YAxis tickLine={false} axisLine={false} className={chartAxisClass} />
                  <Tooltip />
                  <Bar dataKey="averageR" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`rounded-[1.15rem] border p-4 ${surfaceClass}`}>
            <div className="mb-4">
              <p className="text-sm font-semibold">Session performance</p>
              <p className={`text-xs ${subtleClass}`}>Spot which trading blocks deserve more size and patience.</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.bySession}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} className={chartAxisClass} />
                  <YAxis tickLine={false} axisLine={false} className={chartAxisClass} />
                  <Tooltip />
                  <Bar dataKey="winRate" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className={`rounded-[1.15rem] border p-4 ${surfaceClass}`}>
            <div className="mb-4">
              <p className="text-sm font-semibold">Long vs short mix</p>
              <p className={`text-xs ${subtleClass}`}>Direction balance keeps you honest about one-sided bias.</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.byDirection}
                    dataKey="trades"
                    nameKey="label"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {analytics.byDirection.map((entry) => (
                      <Cell key={entry.label} fill={directionColors[entry.label] ?? '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {analytics.byDirection.map((bucket) => (
                <div key={bucket.label} className={`rounded-[1rem] border p-3 ${surfaceClass}`}>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{bucket.label}</p>
                  <p className="mt-1 text-sm font-semibold">{bucket.trades} trades</p>
                  <p className={`text-xs ${subtleClass}`}>{bucket.averageR.toFixed(2)}R avg</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-[1.15rem] border p-4 ${surfaceClass}`}>
            <div className="mb-4">
              <p className="text-sm font-semibold">Mistake frequency</p>
              <p className={`text-xs ${subtleClass}`}>The habits showing up most often in your saved reviews.</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.mistakeFrequency}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="tag" tickLine={false} axisLine={false} className={chartAxisClass} interval={0} angle={-18} textAnchor="end" height={70} />
                  <YAxis tickLine={false} axisLine={false} className={chartAxisClass} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={`rounded-[1.15rem] border p-4 ${surfaceClass}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Instrument heatmap</p>
              <p className={`text-xs ${subtleClass}`}>Quick read on where your execution quality is concentrating.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {analytics.rollingWindows.map((window) => (
                <div key={window.label} className={`rounded-full border px-3 py-1 text-xs ${surfaceClass}`}>
                  {window.label}: {window.averageR.toFixed(2)}R
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  <th className="px-2 py-2 text-left font-medium">Instrument</th>
                  <th className="px-2 py-2 text-right font-medium">Long</th>
                  <th className="px-2 py-2 text-right font-medium">Short</th>
                  <th className="px-2 py-2 text-right font-medium">Trades</th>
                  <th className="px-2 py-2 text-right font-medium">Avg R</th>
                </tr>
              </thead>
              <tbody>
                {analytics.instrumentHeatmap.map((row) => (
                  <tr key={row.instrument} className={`border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                    <td className="px-2 py-3 font-medium">{row.instrument}</td>
                    <td className="px-2 py-3 text-right">{row.longTrades}</td>
                    <td className="px-2 py-3 text-right">{row.shortTrades}</td>
                    <td className="px-2 py-3 text-right">{row.totalTrades}</td>
                    <td className={`px-2 py-3 text-right ${row.averageR >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {row.averageR.toFixed(2)}R
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
