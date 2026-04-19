import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  CandlestickChart,
  Compass,
  Layers3,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { useMarketData } from '../context/MarketDataContext';
import { useTheme } from '../context/ThemeContext';
import { getStockCandles } from '../data/stocks';
import {
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
  formatInstrumentQuote,
  formatPercent,
  getInstrumentCategory,
} from '../utils/helpers';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Indicator = 'sma20' | 'sma50' | 'sma200' | 'ema12' | 'ema26' | 'bollinger' | 'rsi' | 'macd' | 'volume';

export default function Charts() {
  const { isDark } = useTheme();
  const { instruments } = useMarketData();
  const [searchParams] = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || 'AAPL');
  const [timeframe, setTimeframe] = useState(180);
  const [indicators, setIndicators] = useState<Set<Indicator>>(() => new Set<Indicator>(['sma20', 'volume']));

  const stock = instruments.find((instrument) => instrument.symbol === symbol) || instruments[0];
  const candles = useMemo(() => getStockCandles(symbol, timeframe, stock), [symbol, timeframe, stock]);

  const closePrices = candles.map((candle) => candle.close);
  const rsiValues = useMemo(() => calculateRSI(closePrices), [closePrices]);
  const sma20 = useMemo(() => calculateSMA(closePrices, 20), [closePrices]);
  const sma50 = useMemo(() => calculateSMA(closePrices, 50), [closePrices]);
  const sma200 = useMemo(() => calculateSMA(closePrices, 200), [closePrices]);
  const ema12 = useMemo(() => calculateEMA(closePrices, 12), [closePrices]);
  const ema26 = useMemo(() => calculateEMA(closePrices, 26), [closePrices]);
  const macdData = useMemo(() => calculateMACD(closePrices), [closePrices]);
  const bollinger = useMemo(() => calculateBollingerBands(closePrices), [closePrices]);

  const chartData = candles.map((candle, index) => ({
    date: candle.date,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    sma20: sma20[index],
    sma50: sma50[index],
    sma200: sma200[index],
    ema12: ema12[index],
    ema26: ema26[index],
    rsi: rsiValues[index],
    macd: macdData.macd[index],
    signal: macdData.signal[index],
    histogram: macdData.histogram[index],
    bbUpper: bollinger.upper[index],
    bbMiddle: bollinger.middle[index],
    bbLower: bollinger.lower[index],
  }));

  const toggleIndicator = (indicator: Indicator) => {
    setIndicators((previous) => {
      const next = new Set(previous);
      if (next.has(indicator)) next.delete(indicator);
      else next.add(indicator);
      return next;
    });
  };

  const showRSI = indicators.has('rsi');
  const showMACD = indicators.has('macd');
  const showVolume = indicators.has('volume');

  const allIndicators: { key: Indicator; label: string; color: string }[] = [
    { key: 'sma20', label: 'SMA 20', color: '#3B82F6' },
    { key: 'sma50', label: 'SMA 50', color: '#F59E0B' },
    { key: 'sma200', label: 'SMA 200', color: '#EF4444' },
    { key: 'ema12', label: 'EMA 12', color: '#8B5CF6' },
    { key: 'ema26', label: 'EMA 26', color: '#EC4899' },
    { key: 'bollinger', label: 'Bollinger', color: '#6366F1' },
    { key: 'rsi', label: 'RSI', color: '#14B8A6' },
    { key: 'macd', label: 'MACD', color: '#F97316' },
    { key: 'volume', label: 'Volume', color: '#6B7280' },
  ];

  if (!stock) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-navy-950 to-slate-900 text-white shadow-[0_35px_100px_-48px_rgba(15,58,107,0.95)]">
        <CardContent className="relative p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.26),transparent_42%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.25fr_0.95fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">
                <Sparkles size={14} />
                Chart Lab
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight sm:text-5xl">
                Read structure, not just price.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                The chart workspace now emphasizes the selected market, indicator stack, and session context so analysis feels deliberate and easier to trust.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <CandlestickChart className="h-5 w-5 text-sky-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Selected</p>
                    <p className="mt-1 text-xl font-semibold">{stock.symbol}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Compass className="h-5 w-5 text-gold-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Timeframe</p>
                    <p className="mt-1 text-xl font-semibold">{timeframe}d</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Layers3 className="h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Indicators</p>
                    <p className="mt-1 text-xl font-semibold">{indicators.size} active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{stock.symbol}</CardTitle>
                <Badge variant={getInstrumentCategory(stock) === 'prediction' ? 'gold' : 'outline'}>
                  {getInstrumentCategory(stock)}
                </Badge>
              </div>
              <CardDescription className="mt-1">{stock.name}</CardDescription>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <span className="text-3xl font-bold tracking-tight">{formatInstrumentQuote(stock, stock.price)}</span>
                <span className={`text-sm ${stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stock.change >= 0 ? '+' : '-'}
                  {formatInstrumentQuote(stock, Math.abs(stock.change))} ({formatPercent(stock.changePercent)})
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
              <select
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                className={`w-full rounded-full border px-4 py-3 text-sm font-medium outline-none xl:w-[360px] ${
                  isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white/80 text-slate-900'
                }`}
              >
                {instruments.map((instrument) => (
                  <option key={instrument.symbol} value={instrument.symbol}>
                    {instrument.symbol} - {instrument.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                {[{ days: 30, label: '1M' }, { days: 90, label: '3M' }, { days: 180, label: '6M' }, { days: 365, label: '1Y' }].map((currentTimeframe) => (
                  <Button
                    key={currentTimeframe.days}
                    onClick={() => setTimeframe(currentTimeframe.days)}
                    variant={timeframe === currentTimeframe.days ? 'default' : 'secondary'}
                    size="sm"
                  >
                    {currentTimeframe.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {allIndicators.map((indicator) => (
              <Button
                key={indicator.key}
                onClick={() => toggleIndicator(indicator.key)}
                variant="outline"
                size="sm"
                className={`${indicators.has(indicator.key) ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
                style={indicators.has(indicator.key) ? { color: indicator.color, borderColor: indicator.color } : undefined}
              >
                {indicator.label}
              </Button>
            ))}
          </div>

          <div className={`rounded-[1.6rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}>
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#e5e7eb'} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatInstrumentQuote(stock, Number(value))}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 18px 50px -28px rgba(15, 23, 42, 0.55)',
                    color: isDark ? '#e5e7eb' : '#1f2937',
                    fontSize: '12px',
                  }}
                  formatter={(value, name) => [typeof value === 'number' ? formatInstrumentQuote(stock, value) : value, name]}
                />
                <Line type="monotone" dataKey="close" stroke="#1d4ed8" strokeWidth={2.4} dot={false} name="Price" />
                {indicators.has('sma20') && <Line type="monotone" dataKey="sma20" stroke="#3B82F6" strokeWidth={1.2} dot={false} name="SMA 20" strokeDasharray="4 2" />}
                {indicators.has('sma50') && <Line type="monotone" dataKey="sma50" stroke="#F59E0B" strokeWidth={1.2} dot={false} name="SMA 50" strokeDasharray="4 2" />}
                {indicators.has('sma200') && <Line type="monotone" dataKey="sma200" stroke="#EF4444" strokeWidth={1.2} dot={false} name="SMA 200" strokeDasharray="4 2" />}
                {indicators.has('ema12') && <Line type="monotone" dataKey="ema12" stroke="#8B5CF6" strokeWidth={1.2} dot={false} name="EMA 12" />}
                {indicators.has('ema26') && <Line type="monotone" dataKey="ema26" stroke="#EC4899" strokeWidth={1.2} dot={false} name="EMA 26" />}
                {indicators.has('bollinger') && (
                  <>
                    <Line type="monotone" dataKey="bbUpper" stroke="#6366F1" strokeWidth={1} dot={false} name="BB Upper" strokeDasharray="2 2" />
                    <Line type="monotone" dataKey="bbMiddle" stroke="#6366F1" strokeWidth={1} dot={false} name="BB Middle" />
                    <Line type="monotone" dataKey="bbLower" stroke="#6366F1" strokeWidth={1} dot={false} name="BB Lower" strokeDasharray="2 2" />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {showVolume && (
            <div className={`rounded-[1.4rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
              <p className={`mb-2 text-xs font-medium uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Volume</p>
              <ResponsiveContainer width="100%" height={90}>
                <ComposedChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
                  <Bar dataKey="volume" fill={isDark ? '#334155' : '#dbeafe'} radius={[8, 8, 0, 0]} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {showRSI && (
            <div className={`rounded-[1.4rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
              <p className={`mb-2 text-xs font-medium uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>RSI (14)</p>
              <ResponsiveContainer width="100%" height={120}>
                <ComposedChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#e5e7eb'} />
                  <XAxis dataKey="date" hide />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} ticks={[30, 50, 70]} />
                  <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" />
                  <ReferenceLine y={30} stroke="#22C55E" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="rsi" stroke="#14B8A6" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {showMACD && (
            <div className={`rounded-[1.4rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
              <p className={`mb-2 text-xs font-medium uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>MACD</p>
              <ResponsiveContainer width="100%" height={120}>
                <ComposedChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#e5e7eb'} />
                  <XAxis dataKey="date" hide />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <ReferenceLine y={0} stroke={isDark ? '#4B5563' : '#CBD5E1'} />
                  <Bar dataKey="histogram" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="macd" stroke="#F97316" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="signal" stroke="#EF4444" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Instrument details</CardTitle>
            <CardDescription>Core quote stats and session context for the selected market.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'Open', value: formatInstrumentQuote(stock, stock.open), icon: ScanLine },
                { label: 'High', value: formatInstrumentQuote(stock, stock.high), icon: Activity },
                { label: 'Low', value: formatInstrumentQuote(stock, stock.low), icon: Activity },
                { label: 'Prev close', value: formatInstrumentQuote(stock, stock.previousClose), icon: CandlestickChart },
                { label: 'Volume', value: `${(stock.volume / 1000000).toFixed(1)}M`, icon: Layers3 },
                { label: 'Market cap', value: stock.marketCap ? `$${(stock.marketCap / 1000000000).toFixed(0)}B` : 'N/A', icon: Layers3 },
                { label: 'Sector', value: stock.sector || 'N/A', icon: Compass },
                { label: 'Day range', value: `${formatInstrumentQuote(stock, stock.low)} - ${formatInstrumentQuote(stock, stock.high)}`, icon: ScanLine },
              ].map((item) => (
                <div key={item.label} className={`rounded-[1.35rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-slate-800 dark:text-slate-200">
                    <item.icon size={16} />
                  </div>
                  <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
                  <p className="mt-1 text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDark ? 'border-gold-400/10 bg-gradient-to-br from-navy-950/70 to-slate-950/90' : 'border-gold-100 bg-gradient-to-br from-navy-50 to-white'}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-400 text-white">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">Analysis reminder</p>
                <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Indicators are context tools, not predictions. Let structure, volatility, and your risk plan confirm each other before acting.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
