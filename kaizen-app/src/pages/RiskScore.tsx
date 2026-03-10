import React from 'react';
import { useTrading } from '../context/TradingContext';
import { useMarketData } from '../context/MarketDataContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatPercent } from '../utils/helpers';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar, Tooltip } from 'recharts';

export default function RiskScore() {
  const { isDark } = useTheme();
  const { instruments } = useMarketData();
  const { balance, positions } = useTrading();

  const totalInvested = positions.reduce((sum, p) => sum + p.currentPrice * p.shares, 0);
  const totalPortfolio = balance + totalInvested;
  const cashPercent = (balance / totalPortfolio) * 100;

  // Concentration risk: how much of portfolio is in one stock
  const positionWeights = positions.map(p => ({
    symbol: p.symbol,
    value: p.currentPrice * p.shares,
    weight: (p.currentPrice * p.shares / totalPortfolio) * 100,
    pnl: ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100,
  }));

  const maxWeight = Math.max(...positionWeights.map(p => p.weight), 0);
  const concentrationScore = maxWeight > 25 ? 'high' : maxWeight > 15 ? 'moderate' : 'low';

  const sectors = new Set(positions.map(p => instruments.find(s => s.symbol === p.symbol)?.sector || 'Other'));
  const assetClasses = new Set(positions.map(p => instruments.find(s => s.symbol === p.symbol)?.assetClass || 'stock'));
  const diversificationScore = sectors.size >= 4 ? 'good' : sectors.size >= 2 ? 'moderate' : positions.length > 0 ? 'poor' : 'none';

  // Overall risk score (0-100, lower is better)
  let riskScore = 20; // base
  if (cashPercent < 10) riskScore += 30;
  else if (cashPercent < 30) riskScore += 15;
  if (maxWeight > 30) riskScore += 25;
  else if (maxWeight > 20) riskScore += 15;
  if (sectors.size < 3 && positions.length > 2) riskScore += 15;
  riskScore = Math.min(100, riskScore);

  const riskLevel = riskScore < 30 ? 'Low' : riskScore < 50 ? 'Moderate' : riskScore < 70 ? 'High' : 'Very High';
  const riskColor = riskScore < 30 ? '#22C55E' : riskScore < 50 ? '#F59E0B' : riskScore < 70 ? '#EF4444' : '#DC2626';

  const recommendations: string[] = [];
  if (cashPercent < 20) recommendations.push('Consider holding at least 20% cash to manage risk and capitalize on opportunities.');
  if (maxWeight > 20) recommendations.push(`Your largest position is ${maxWeight.toFixed(1)}% of your portfolio. Consider rebalancing to under 20%.`);
  if (sectors.size < 3 && positions.length > 2) recommendations.push('Your portfolio lacks sector diversification. Consider adding exposure to different sectors.');
  if (assetClasses.size === 1 && positions.length > 1) recommendations.push('You are concentrated in a single market type. Blending stocks, forex, crypto, or prediction markets can improve diversification when risk-managed well.');
  if (positions.length === 0) recommendations.push('You have no positions yet. Start with small, diversified positions to learn.');
  if (positions.length === 1) recommendations.push('Having only one position creates concentration risk. Consider diversifying across multiple stocks.');
  if (recommendations.length === 0) recommendations.push('Your portfolio risk profile looks reasonable. Keep monitoring and rebalancing as needed.');

  const pieData = [
    { name: 'Cash', value: balance },
    ...positionWeights.map(p => ({ name: p.symbol, value: p.value })),
  ];
  const PIE_COLORS = ['#6B7280', '#0F3A6B', '#D4AF37', '#22C55E', '#8B5CF6', '#EF4444', '#EC4899', '#F97316', '#14B8A6', '#3B82F6'];

  const gaugeData = [{ name: 'Risk', value: riskScore, fill: riskColor }];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Risk Analysis</h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Understand concentration, diversification, cash exposure, and overall portfolio resilience.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Overall Risk Score</CardTitle>
            <CardDescription>A quick view of the portfolio’s current risk posture.</CardDescription>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart innerRadius="60%" outerRadius="100%" data={gaugeData} startAngle={180} endAngle={0} cx="50%" cy="80%">
              <RadialBar dataKey="value" cornerRadius={10} fill={riskColor} background={{ fill: isDark ? '#1f2937' : '#f3f4f6' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="-mt-8">
            <p className="text-3xl font-bold" style={{ color: riskColor }}>{riskScore}</p>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{riskLevel} Risk</p>
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
            <CardDescription>See how cash and positions are distributed across the account.</CardDescription>
          </CardHeader>
          <CardContent>
          {positions.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>100% Cash — Start trading to see allocation</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
            <CardDescription>The core signals driving the current risk score.</CardDescription>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Portfolio Value</span>
              <span className="font-semibold">{formatCurrency(totalPortfolio)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cash %</span>
              <span className={`font-semibold ${cashPercent < 10 ? 'text-red-500' : ''}`}>{cashPercent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Positions</span>
              <span className="font-semibold">{positions.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Concentration</span>
              <Badge className={`${
                concentrationScore === 'low' ? 'bg-emerald-100 text-emerald-700' :
                concentrationScore === 'moderate' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {concentrationScore.charAt(0).toUpperCase() + concentrationScore.slice(1)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Diversification</span>
              <Badge className={`${
                diversificationScore === 'good' ? 'bg-emerald-100 text-emerald-700' :
                diversificationScore === 'moderate' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {diversificationScore.charAt(0).toUpperCase() + diversificationScore.slice(1)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sectors</span>
              <span className="font-semibold">{sectors.size || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Market Types</span>
              <span className="font-semibold">{assetClasses.size || 0}</span>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-gold-400" />
            <CardTitle>Recommendations</CardTitle>
          </div>
          <CardDescription>Actionable ways to improve resilience and reduce unnecessary portfolio stress.</CardDescription>
        </CardHeader>
        <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl border p-4 ${isDark ? 'border-gray-800 bg-gray-800/60' : 'border-gray-100 bg-gray-50'}`}>
              <Info size={16} className="text-navy-600 mt-0.5 flex-shrink-0" />
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{rec}</p>
            </div>
          ))}
        </div>
        </CardContent>
      </Card>

      {positionWeights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Position Risk Details</CardTitle>
            <CardDescription>Inspect the positions contributing most to concentration and drawdown sensitivity.</CardDescription>
          </CardHeader>
          <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  <th className="text-left py-2 px-3 font-medium">Symbol</th>
                  <th className="text-right py-2 px-3 font-medium">Value</th>
                  <th className="text-right py-2 px-3 font-medium">Weight</th>
                  <th className="text-right py-2 px-3 font-medium">P&L</th>
                  <th className="text-left py-2 px-3 font-medium">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {positionWeights.sort((a, b) => b.weight - a.weight).map(p => (
                  <tr key={p.symbol} className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <td className="py-3 px-3 font-medium">{p.symbol}</td>
                    <td className="py-3 px-3 text-right">{formatCurrency(p.value)}</td>
                    <td className="py-3 px-3 text-right">{p.weight.toFixed(1)}%</td>
                    <td className={`py-3 px-3 text-right ${p.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatPercent(p.pnl)}</td>
                    <td className="py-3 px-3">
                      {p.weight > 25 ? (
                        <span className="flex items-center gap-1 text-red-500"><AlertTriangle size={14} /> High</span>
                      ) : p.weight > 15 ? (
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

      <div className={`mt-6 rounded-xl border p-4 text-xs ${isDark ? 'border-gray-800 bg-gray-900/50 text-gray-500' : 'border-gray-100 bg-gray-100 text-gray-400'}`}>
        Risk scores are educational estimates based on portfolio composition. They are not financial advice.
        Always consult a qualified financial advisor for investment decisions.
      </div>
    </div>
  );
}
