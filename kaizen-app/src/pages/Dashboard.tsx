import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Flame,
  Radar,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { useMarketData } from '../context/MarketDataContext';
import { useTrading } from '../context/TradingContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatInstrumentQuote, formatPercent, getInstrumentCategory, getSizeLabel } from '../utils/helpers';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { getStockCandles } from '../data/stocks';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative p-6">
        <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-navy-100/70 blur-3xl dark:bg-navy-500/10" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
            <p className={`mt-2 text-sm ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
              {subtitle}
            </p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            trend === 'up'
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
              : trend === 'down'
                ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            <Icon size={18} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { isDark } = useTheme();
  const { instruments } = useMarketData();
  const { balance, positions, trades, getPerformanceMetrics } = useTrading();
  const metrics = getPerformanceMetrics();

  const totalPortfolioValue = balance + positions.reduce((sum, position) => sum + position.currentPrice * position.shares, 0);
  const totalPnL = totalPortfolioValue - 100000;
  const totalPnLPercent = (totalPnL / 100000) * 100;
  const investedCapital = totalPortfolioValue - balance;

  const portfolioHistory = useMemo(() => {
    const baseInstrument = instruments.find((instrument) => instrument.symbol === 'AAPL');
    const candles = getStockCandles('AAPL', 30, baseInstrument);
    const startValue = 100000 - metrics.totalReturn;

    return candles.map((candle, index) => {
      const progress = candles.length === 1 ? 1 : index / (candles.length - 1);
      const smoothContribution = metrics.totalReturn * progress;
      const candleDrift = (candle.close - candle.open) * 140;
      const cycle = Math.sin(index * 0.8) * 180;

      return {
        date: candle.date,
        value: startValue + smoothContribution + candleDrift + cycle,
      };
    });
  }, [instruments, metrics.totalReturn]);

  const featuredMarkets = useMemo(
    () =>
      ['prediction', 'forex', 'crypto']
        .map((category) => instruments.find((instrument) => getInstrumentCategory(instrument) === category))
        .filter((instrument): instrument is NonNullable<typeof instrument> => Boolean(instrument)),
    [instruments]
  );

  const strongestMover = useMemo(
    () => [...instruments].sort((left, right) => Math.abs(right.changePercent) - Math.abs(left.changePercent))[0],
    [instruments]
  );

  const focusMetrics = [
    {
      label: 'Capital deployed',
      value: formatCurrency(investedCapital),
      detail: `${positions.length} live positions`,
    },
    {
      label: 'Win rate',
      value: `${metrics.winRate.toFixed(0)}%`,
      detail: `${trades.length} total trades logged`,
    },
    {
      label: 'Process streak',
      value: positions.length > 0 ? 'Active' : 'Ready',
      detail: positions.length > 0 ? 'Review open exposure before adding size' : 'No open risk on the book',
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 text-white shadow-[0_35px_100px_-45px_rgba(15,58,107,0.95)]">
        <CardContent className="relative p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.24),transparent_42%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gold-300">
                <Radar size={14} />
                Daily Control Tower
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight sm:text-5xl">
                Trade with more clarity, not more noise.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Kaizen now opens with a stronger market brief, better hierarchy, and cleaner risk context so the most important signals rise above the clutter.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="gold">
                  <Link to="/trade">
                    Go to trade desk
                    <ArrowUpRight size={16} />
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="bg-white/10 text-white hover:bg-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
                  <Link to="/journal">
                    Review journal
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {focusMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
                    <p className="mt-1 text-sm text-slate-400">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-muted rounded-[1.75rem] p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Session snapshot</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-[1.35rem] bg-white/80 p-4 dark:bg-slate-950/70">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Net account value</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{formatCurrency(totalPortfolioValue)}</p>
                  <p className={`mt-2 inline-flex items-center gap-1 text-sm font-medium ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {totalPnL >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {formatPercent(totalPnLPercent)} since reset
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[1.25rem] bg-white/80 p-4 dark:bg-slate-950/70">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Best edge</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                      {strongestMover ? strongestMover.symbol : 'N/A'}
                    </p>
                    <p className={`mt-1 text-sm ${strongestMover && strongestMover.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {strongestMover ? formatPercent(strongestMover.changePercent) : 'No data'}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-white/80 p-4 dark:bg-slate-950/70">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Risk posture</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                      {positions.length > 4 ? 'Elevated' : positions.length > 0 ? 'Managed' : 'Flat'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {positions.length} open positions
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-dashed border-slate-300/70 p-4 dark:border-white/10">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <ShieldCheck size={16} className="text-gold-400" />
                    Kaizen reminder
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Add size only when your thesis, stop, and journal note all agree. Cleaner process creates steadier returns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Portfolio value"
          value={formatCurrency(totalPortfolioValue)}
          subtitle={`${formatPercent(totalPnLPercent)} all time`}
          icon={DollarSign}
          trend={totalPnL >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Cash available"
          value={formatCurrency(balance)}
          subtitle={`${positions.length} positions currently funded`}
          icon={BarChart3}
          trend="neutral"
        />
        <StatCard
          title="Trades logged"
          value={String(trades.length)}
          subtitle={`${metrics.winRate.toFixed(0)}% win rate`}
          icon={Target}
          trend={metrics.winRate >= 50 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Open P&L"
          value={formatCurrency(metrics.totalReturn)}
          subtitle={formatPercent(metrics.totalReturnPercent)}
          icon={Activity}
          trend={metrics.totalReturn >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Performance curve</CardTitle>
              <CardDescription>Stable simulated account growth based on recent market movement and your current open P&amp;L.</CardDescription>
            </div>
            <Badge variant="gold">30 sessions</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity={0.34} />
                    <stop offset="55%" stopColor="#2563eb" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Account value']} />
                <Area type="monotone" dataKey="value" stroke="#1d4ed8" fill="url(#portfolioGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open exposure</CardTitle>
            <CardDescription>The positions demanding your attention right now.</CardDescription>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <div className={`rounded-[1.5rem] border border-dashed p-8 text-center ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <p className="text-sm">No open positions.</p>
                <Button asChild variant="ghost" className="mt-3 text-gold-500 hover:text-gold-600">
                  <Link to="/trade">
                    Start trading
                    <ArrowUpRight size={14} />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {positions.slice(0, 5).map((position) => {
                  const instrument = instruments.find((item) => item.symbol === position.symbol);
                  const category = instrument ? getInstrumentCategory(instrument) : 'stock';
                  const pnl = (position.currentPrice - position.entryPrice) * position.shares;
                  const pnlPercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;

                  return (
                    <div key={position.id} className={`rounded-[1.5rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-semibold">{position.symbol}</p>
                            <Badge variant={category === 'prediction' ? 'gold' : 'outline'}>{category}</Badge>
                          </div>
                          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{position.name}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(pnl)}</p>
                          <p className={`mt-1 text-xs ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatPercent(pnlPercent)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        <span>{position.shares} {instrument ? getSizeLabel(instrument).toLowerCase() : 'shares'}</span>
                        <span>Entry {formatCurrency(position.entryPrice)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {featuredMarkets.map((market) => (
          <Card key={market.symbol} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{market.symbol}</CardTitle>
                  <CardDescription className="mt-1">{market.name}</CardDescription>
                </div>
                <Badge variant={getInstrumentCategory(market) === 'prediction' ? 'gold' : 'secondary'}>
                  {getInstrumentCategory(market)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-bold tracking-tight">{formatInstrumentQuote(market, market.price)}</p>
                  <p className={`mt-2 flex items-center gap-1 text-sm ${market.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {market.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {formatPercent(market.changePercent)} today
                  </p>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link to={`/charts?symbol=${market.symbol}`}>Analyze</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Market overview</CardTitle>
            <CardDescription>Scan the most active names across stocks, prediction markets, forex, and crypto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {instruments.slice(0, 8).map((instrument) => (
              <Link
                key={instrument.symbol}
                to={`/charts?symbol=${instrument.symbol}`}
                className={`flex items-center justify-between rounded-[1.35rem] border p-4 transition-all duration-200 ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white/70 hover:bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-navy-50 text-navy-700'}`}>
                    {instrument.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{instrument.symbol}</p>
                      <Badge variant={getInstrumentCategory(instrument) === 'prediction' ? 'gold' : 'outline'}>
                        {getInstrumentCategory(instrument)}
                      </Badge>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{instrument.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatInstrumentQuote(instrument, instrument.price)}</p>
                  <p className={`mt-1 inline-flex items-center gap-1 text-xs ${instrument.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {instrument.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {formatPercent(instrument.changePercent)}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent trades</CardTitle>
              <CardDescription>Your latest executions and the feedback loop they create.</CardDescription>
            </CardHeader>
            <CardContent>
              {trades.length === 0 ? (
                <div className={`rounded-[1.5rem] border border-dashed p-8 text-center ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <p className="text-sm">No trades yet.</p>
                  <Button asChild variant="ghost" className="mt-3 text-gold-500 hover:text-gold-600">
                    <Link to="/trade">
                      Place your first trade
                      <ArrowUpRight size={14} />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {trades.slice(0, 6).map((trade) => (
                    <div key={trade.id} className={`rounded-[1.35rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                            trade.type === 'buy'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                          }`}>
                            {trade.type}
                          </span>
                          <div>
                            <p className="font-semibold">{trade.symbol}</p>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {trade.shares} shares @ {formatCurrency(trade.price)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold">{formatCurrency(trade.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'border-gold-400/10 bg-gradient-to-br from-navy-950/70 to-slate-950/90' : 'border-gold-100 bg-gradient-to-br from-navy-50 to-white'}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-400 text-white">
                  <Flame size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Kaizen tip of the day</p>
                  <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Focus on one market long enough to recognize your patterns. Breadth can come later; consistency comes first.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
