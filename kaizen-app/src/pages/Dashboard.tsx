import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Target, Activity, ArrowUpRight } from 'lucide-react';
import { useMarketData } from '../context/MarketDataContext';
import { useTrading } from '../context/TradingContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatInstrumentQuote, formatPercent, getInstrumentCategory, getSizeLabel } from '../utils/helpers';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { getStockCandles } from '../data/stocks';

function StatCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string; value: string; subtitle?: string; icon: React.ElementType; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
          <Icon size={18} className={trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className={`text-sm mt-1 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { isDark } = useTheme();
  const { instruments } = useMarketData();
  const { balance, positions, trades, getPerformanceMetrics } = useTrading();
  const metrics = getPerformanceMetrics();

  const totalPortfolioValue = balance + positions.reduce((sum, p) => sum + p.currentPrice * p.shares, 0);
  const totalPnL = totalPortfolioValue - 100000;
  const totalPnLPercent = (totalPnL / 100000) * 100;

  const portfolioHistory = getStockCandles('AAPL', 30, instruments.find(stock => stock.symbol === 'AAPL')).map((c, i) => ({
    date: c.date,
    value: 100000 + (totalPnL * (i / 30)) + (Math.random() - 0.5) * 1000,
  }));
  const featuredPrediction = instruments.find(stock => getInstrumentCategory(stock) === 'prediction');
  const featuredForex = instruments.find(stock => getInstrumentCategory(stock) === 'forex');
  const featuredCrypto = instruments.find(stock => getInstrumentCategory(stock) === 'crypto');

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Dashboard</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your performance, active exposure, and multi-market watchlist in one place.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/trade">Open Paper Trade</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/charts">View Charts</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Portfolio Value"
          value={formatCurrency(totalPortfolioValue)}
          subtitle={`${formatPercent(totalPnLPercent)} all time`}
          icon={DollarSign}
          trend={totalPnL >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Cash Balance"
          value={formatCurrency(balance)}
          subtitle={`${positions.length} open positions`}
          icon={BarChart3}
          trend="neutral"
        />
        <StatCard
          title="Total Trades"
          value={trades.length.toString()}
          subtitle={`${metrics.winRate.toFixed(0)}% win rate`}
          icon={Target}
          trend={metrics.winRate > 50 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Unrealized P&L"
          value={formatCurrency(metrics.totalReturn)}
          subtitle={formatPercent(metrics.totalReturnPercent)}
          icon={Activity}
          trend={metrics.totalReturn >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr] mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
            <CardDescription>Track how your paper account is evolving relative to your starting capital.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F3A6B" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0F3A6B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => [formatCurrency(value), 'Value']} />
                <Area type="monotone" dataKey="value" stroke="#0F3A6B" fill="url(#portfolioGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Positions</CardTitle>
            <CardDescription>Your active positions across stocks, prediction markets, forex, and crypto.</CardDescription>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <p className="text-sm">No open positions</p>
                <Button asChild variant="ghost" className="mt-2 text-gold-400 hover:text-gold-500">
                  <Link to="/trade">Start trading <ArrowUpRight size={14} className="ml-1" /></Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {positions.slice(0, 5).map(p => {
                  const instrument = instruments.find(stock => stock.symbol === p.symbol);
                  const positionCategory = instrument ? getInstrumentCategory(instrument) : 'stock';
                  const pnl = (p.currentPrice - p.entryPrice) * p.shares;
                  const pnlPercent = ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100;
                  return (
                    <div key={p.id} className={`rounded-2xl border p-3 ${isDark ? 'border-gray-800 bg-gray-800/70' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="mb-2 flex items-center gap-2">
                        <p className="font-semibold text-sm">{p.symbol}</p>
                        <Badge variant={positionCategory === 'prediction' ? 'gold' : 'outline'}>{positionCategory}</Badge>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.shares} {instrument ? getSizeLabel(instrument).toLowerCase() : 'shares'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {formatCurrency(pnl)}
                        </p>
                        <p className={`text-xs ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatPercent(pnlPercent)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        {[featuredPrediction, featuredForex, featuredCrypto].filter(Boolean).map(stock => (
          <Card key={stock!.symbol}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{stock!.symbol}</CardTitle>
                  <CardDescription className="mt-1">{stock!.name}</CardDescription>
                </div>
                <Badge variant={getInstrumentCategory(stock!) === 'prediction' ? 'gold' : 'secondary'}>{getInstrumentCategory(stock!)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{formatInstrumentQuote(stock!, stock!.price)}</p>
                  <p className={`mt-1 text-sm ${stock!.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatPercent(stock!.changePercent)} today
                  </p>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link to={`/charts?symbol=${stock!.symbol}`}>Analyze</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Overview</CardTitle>
            <CardDescription>Quickly scan active instruments across all supported market types.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {instruments.slice(0, 8).map(stock => (
                <Link
                  key={stock.symbol}
                  to={`/charts?symbol=${stock.symbol}`}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${isDark ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-navy-50 text-navy-700'}`}>
                      {stock.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{stock.symbol}</p>
                        <Badge variant={getInstrumentCategory(stock) === 'prediction' ? 'gold' : 'outline'}>{getInstrumentCategory(stock)}</Badge>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stock.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatInstrumentQuote(stock, stock.price)}</p>
                    <p className={`text-xs flex items-center gap-1 ${stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {stock.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {formatPercent(stock.changePercent)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>Review your last executions and maintain feedback loops around sizing and timing.</CardDescription>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <p className="text-sm">No trades yet</p>
                <Button asChild variant="ghost" className="mt-2 text-gold-400 hover:text-gold-500">
                  <Link to="/trade">Place your first trade <ArrowUpRight size={14} className="ml-1" /></Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {trades.slice(0, 8).map((trade, index) => (
                  <div key={trade.id}>
                    <div className={`flex items-center justify-between rounded-xl border p-3 ${isDark ? 'border-gray-800 bg-gray-800/70' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${trade.type === 'buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {trade.type.toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{trade.symbol}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{trade.shares} shares @ {formatCurrency(trade.price)}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium">{formatCurrency(trade.total)}</p>
                    </div>
                    {index < Math.min(trades.length, 8) - 1 && <Separator className="my-2 opacity-0" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={`mt-8 ${isDark ? 'bg-navy-900/30 border-navy-800' : 'bg-navy-50 border-navy-100'}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold-400 flex items-center justify-center flex-shrink-0">
              <Target size={16} className="text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Kaizen Tip</h4>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Trade one market at a time until your edge is repeatable. Use prediction markets for probabilistic thinking,
                forex for discipline around tight risk, and crypto for volatility management before scaling up size.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
