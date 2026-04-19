import React from 'react';
import { AlertTriangle, CheckCircle, Info, Shield, Sparkles, Wallet } from 'lucide-react';
import { Pie, PieChart, Cell, ResponsiveContainer, RadialBarChart, RadialBar, Tooltip } from 'recharts';
import { useTrading } from '../context/TradingContext';
import { useMarketData } from '../context/MarketDataContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatPercent } from '../utils/helpers';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function RiskScore() {
  const { isDark } = useTheme();
  const { instruments } = useMarketData();
  const { balance, positions } = useTrading();

  const totalInvested = positions.reduce((sum, position) => sum + position.currentPrice * position.shares, 0);
  const totalPortfolio = balance + totalInvested;
  const cashPercent = totalPortfolio > 0 ? (balance / totalPortfolio) * 100 : 100;

  const positionWeights = positions.map((position) => ({
    symbol: position.symbol,
    value: position.currentPrice * position.shares,
    weight: totalPortfolio > 0 ? (position.currentPrice * position.shares / totalPortfolio) * 100 : 0,
    pnl: ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100,
  }));

  const maxWeight = Math.max(...positionWeights.map((position) => position.weight), 0);
  const concentrationScore = maxWeight > 25 ? 'high' : maxWeight > 15 ? 'moderate' : 'low';

  const sectors = new Set(positions.map((position) => instruments.find((instrument) => instrument.symbol === position.symbol)?.sector || 'Other'));
  const assetClasses = new Set(positions.map((position) => instruments.find((instrument) => instrument.symbol === position.symbol)?.assetClass || 'stock'));
  const diversificationScore = sectors.size >= 4 ? 'good' : sectors.size >= 2 ? 'moderate' : positions.length > 0 ? 'poor' : 'none';

  let riskScore = 20;
  if (cashPercent < 10) riskScore += 30;
  else if (cashPercent < 30) riskScore += 15;
  if (maxWeight > 30) riskScore += 25;
  else if (maxWeight > 20) riskScore += 15;
  if (sectors.size < 3 && positions.length > 2) riskScore += 15;
  riskScore = Math.min(100, riskScore);

  const riskLevel = riskScore < 30 ? 'Low' : riskScore < 50 ? 'Moderate' : riskScore < 70 ? 'High' : 'Very High';
  const riskColor = riskScore < 30 ? '#22C55E' : riskScore < 50 ? '#F59E0B' : riskScore < 70 ? '#EF4444' : '#DC2626';

  const recommendations: string[] = [];
  if (cashPercent < 20) recommendations.push('Hold at least 20% cash when possible so you can absorb volatility and stay flexible.');
  if (maxWeight > 20) recommendations.push(`Your largest position is ${maxWeight.toFixed(1)}% of the portfolio. Rebalancing under 20% would lower concentration risk.`);
  if (sectors.size < 3 && positions.length > 2) recommendations.push('Sector diversification is light right now. Adding different sectors would reduce single-theme stress.');
  if (assetClasses.size === 1 && positions.length > 1) recommendations.push('You are concentrated in one market type. Mixing market structures can improve resilience when sized carefully.');
  if (positions.length === 0) recommendations.push('No positions are open yet. Start with small, diversified risk and use the score as a guardrail while learning.');
  if (positions.length === 1) recommendations.push('One position means one idea can dominate the whole book. Consider spreading risk across more than one setup.');
  if (recommendations.length === 0) recommendations.push('Your current portfolio shape looks reasonably balanced. Keep monitoring concentration and cash before adding more size.');

  const pieData = [{ name: 'Cash', value: balance }, ...positionWeights.map((position) => ({ name: position.symbol, value: position.value }))];
  const pieColors = ['#6B7280', '#0F3A6B', '#D4AF37', '#22C55E', '#8B5CF6', '#EF4444', '#EC4899', '#F97316', '#14B8A6', '#3B82F6'];
  const gaugeData = [{ name: 'Risk', value: riskScore, fill: riskColor }];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-navy-950 to-slate-900 text-white shadow-[0_35px_100px_-48px_rgba(15,58,107,0.95)]">
        <CardContent className="relative p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.16),transparent_42%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.25fr_0.95fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">
                <Sparkles size={14} />
                Risk Control
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight sm:text-5xl">
                See concentration before it becomes pain.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                This view now highlights cash exposure, concentration, and diversification together so you can spot hidden fragility before the next drawdown does.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk score</p>
                <p className="mt-2 text-3xl font-semibold" style={{ color: riskColor }}>{riskScore}</p>
                <p className="mt-1 text-sm text-slate-300">{riskLevel} risk</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cash buffer</p>
                <p className="mt-2 text-3xl font-semibold">{cashPercent.toFixed(1)}%</p>
                <p className="mt-1 text-sm text-slate-300">{formatCurrency(balance)} available</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Largest weight</p>
                <p className="mt-2 text-3xl font-semibold">{maxWeight.toFixed(1)}%</p>
                <p className="mt-1 text-sm text-slate-300">{positions.length} active positions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Overall risk score</CardTitle>
            <CardDescription>A quick reading of the portfolio's current risk posture.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={190}>
              <RadialBarChart innerRadius="60%" outerRadius="100%" data={gaugeData} startAngle={180} endAngle={0} cx="50%" cy="80%">
                <RadialBar dataKey="value" cornerRadius={12} fill={riskColor} background={{ fill: isDark ? '#1f2937' : '#e5e7eb' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-8">
              <p className="text-4xl font-bold" style={{ color: riskColor }}>{riskScore}</p>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{riskLevel} risk</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio allocation</CardTitle>
            <CardDescription>Cash and position sizing across the whole book.</CardDescription>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>100% cash. Start trading to see allocation shape.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={84} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key drivers</CardTitle>
            <CardDescription>The signals pushing the score up or down.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Portfolio value</span>
              <span className="font-semibold">{formatCurrency(totalPortfolio)}</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cash %</span>
              <span className={`font-semibold ${cashPercent < 10 ? 'text-red-500' : ''}`}>{cashPercent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Concentration</span>
              <Badge className={concentrationScore === 'low' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : concentrationScore === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'}>
                {concentrationScore}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Diversification</span>
              <Badge className={diversificationScore === 'good' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : diversificationScore === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'}>
                {diversificationScore}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sectors</span>
              <span className="font-semibold">{sectors.size || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Market types</span>
              <span className="font-semibold">{assetClasses.size || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-gold-400" />
            <CardTitle>Recommendations</CardTitle>
          </div>
          <CardDescription>Specific ways to reduce unnecessary portfolio stress.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <div key={index} className={`flex items-start gap-3 rounded-[1.2rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
              <Info size={16} className="mt-0.5 flex-shrink-0 text-navy-600" />
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{recommendation}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {positionWeights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Position risk details</CardTitle>
            <CardDescription>Inspect the positions contributing most to concentration and drawdown sensitivity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    <th className="px-3 py-2 text-left font-medium">Symbol</th>
                    <th className="px-3 py-2 text-right font-medium">Value</th>
                    <th className="px-3 py-2 text-right font-medium">Weight</th>
                    <th className="px-3 py-2 text-right font-medium">P&L</th>
                    <th className="px-3 py-2 text-left font-medium">Risk level</th>
                  </tr>
                </thead>
                <tbody>
                  {positionWeights.sort((left, right) => right.weight - left.weight).map((position) => (
                    <tr key={position.symbol} className={`border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                      <td className="px-3 py-3 font-medium">{position.symbol}</td>
                      <td className="px-3 py-3 text-right">{formatCurrency(position.value)}</td>
                      <td className="px-3 py-3 text-right">{position.weight.toFixed(1)}%</td>
                      <td className={`px-3 py-3 text-right ${position.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatPercent(position.pnl)}</td>
                      <td className="px-3 py-3">
                        {position.weight > 25 ? (
                          <span className="flex items-center gap-1 text-red-500"><AlertTriangle size={14} /> High</span>
                        ) : position.weight > 15 ? (
                          <span className="flex items-center gap-1 text-amber-500"><AlertTriangle size={14} /> Moderate</span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-500"><CheckCircle size={14} /> Low</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={`flex items-start gap-3 rounded-[1.2rem] border p-4 text-xs ${isDark ? 'border-white/10 bg-white/5 text-slate-400' : 'border-slate-200 bg-white/70 text-slate-500'}`}>
        <Wallet size={16} className="mt-0.5 flex-shrink-0 text-gold-500" />
        <p>
          Risk scores here are educational estimates based on portfolio composition. They are decision aids, not financial advice.
        </p>
      </div>
    </div>
  );
}
