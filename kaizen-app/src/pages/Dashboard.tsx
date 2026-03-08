import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Target, Activity } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatPercent } from '../utils/helpers';
import { STOCKS } from '../data/stocks';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { getStockCandles } from '../data/stocks';

function StatCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string; value: string; subtitle?: string; icon: React.ElementType; trend?: 'up' | 'down' | 'neutral';
}) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'} shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</span>
        <Icon size={18} className={trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className={`text-sm mt-1 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { isDark } = useTheme();
  const { balance, positions, trades, getPerformanceMetrics } = useTrading();
  const metrics = getPerformanceMetrics();

  const totalPortfolioValue = balance + positions.reduce((sum, p) => sum + p.currentPrice * p.shares, 0);
  const totalPnL = totalPortfolioValue - 100000;
  const totalPnLPercent = (totalPnL / 100000) * 100;

  const portfolioHistory = getStockCandles('AAPL', 30).map((c, i) => ({
    date: c.date,
    value: 100000 + (totalPnL * (i / 30)) + (Math.random() - 0.5) * 1000,
  }));

  const cardBg = isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100';

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Dashboard</h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your trading overview and performance metrics</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className={`col-span-2 rounded-xl p-6 shadow-sm ${cardBg}`}>
          <h3 className="font-semibold mb-4">Portfolio Performance</h3>
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
        </div>

        <div className={`rounded-xl p-6 shadow-sm ${cardBg}`}>
          <h3 className="font-semibold mb-4">Open Positions</h3>
          {positions.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <p className="text-sm">No open positions</p>
              <Link to="/trade" className="text-sm text-gold-400 hover:text-gold-500 mt-2 inline-block">Start trading →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.slice(0, 5).map(p => {
                const pnl = (p.currentPrice - p.entryPrice) * p.shares;
                const pnlPercent = ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100;
                return (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-semibold text-sm">{p.symbol}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.shares} shares</p>
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-xl p-6 shadow-sm ${cardBg}`}>
          <h3 className="font-semibold mb-4">Market Overview</h3>
          <div className="space-y-2">
            {STOCKS.slice(0, 8).map(stock => (
              <Link
                key={stock.symbol}
                to={`/charts?symbol=${stock.symbol}`}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-navy-50 text-navy-700'}`}>
                    {stock.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{stock.symbol}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(stock.price)}</p>
                  <p className={`text-xs flex items-center gap-1 ${stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stock.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {formatPercent(stock.changePercent)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className={`rounded-xl p-6 shadow-sm ${cardBg}`}>
          <h3 className="font-semibold mb-4">Recent Trades</h3>
          {trades.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <p className="text-sm">No trades yet</p>
              <Link to="/trade" className="text-sm text-gold-400 hover:text-gold-500 mt-2 inline-block">Place your first trade →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {trades.slice(0, 8).map(trade => (
                <div key={trade.id} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
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
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`mt-8 rounded-xl p-6 shadow-sm ${isDark ? 'bg-navy-900/30 border border-navy-800' : 'bg-navy-50 border border-navy-100'}`}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold-400 flex items-center justify-center flex-shrink-0">
            <Target size={16} className="text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Kaizen Tip</h4>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Start by paper trading with small position sizes. Focus on following your process, not on profits.
              The best traders master risk management before they master stock picking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
