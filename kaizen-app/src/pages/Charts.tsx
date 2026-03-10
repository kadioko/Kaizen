import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMarketData } from '../context/MarketDataContext';
import { useTheme } from '../context/ThemeContext';
import { getStockCandles } from '../data/stocks';
import { formatPercent, calculateRSI, calculateSMA, calculateEMA, calculateMACD, calculateBollingerBands, formatInstrumentQuote, getInstrumentCategory } from '../utils/helpers';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine
} from 'recharts';

type Indicator = 'sma20' | 'sma50' | 'sma200' | 'ema12' | 'ema26' | 'bollinger' | 'rsi' | 'macd' | 'volume';

export default function Charts() {
  const { isDark } = useTheme();
  const { instruments } = useMarketData();
  const [searchParams] = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || 'AAPL');
  const [timeframe, setTimeframe] = useState(180);
  const [indicators, setIndicators] = useState<Set<Indicator>>(() => new Set<Indicator>(['sma20', 'volume']));

  const stock = instruments.find(s => s.symbol === symbol) || instruments[0];
  const candles = useMemo(() => getStockCandles(symbol, timeframe, stock), [symbol, timeframe, stock]);

  const closePrices = candles.map(c => c.close);
  const rsiValues = useMemo(() => calculateRSI(closePrices), [closePrices]);
  const sma20 = useMemo(() => calculateSMA(closePrices, 20), [closePrices]);
  const sma50 = useMemo(() => calculateSMA(closePrices, 50), [closePrices]);
  const sma200 = useMemo(() => calculateSMA(closePrices, 200), [closePrices]);
  const ema12 = useMemo(() => calculateEMA(closePrices, 12), [closePrices]);
  const ema26 = useMemo(() => calculateEMA(closePrices, 26), [closePrices]);
  const macdData = useMemo(() => calculateMACD(closePrices), [closePrices]);
  const bollinger = useMemo(() => calculateBollingerBands(closePrices), [closePrices]);

  const chartData = candles.map((c, i) => ({
    date: c.date,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    sma20: sma20[i],
    sma50: sma50[i],
    sma200: sma200[i],
    ema12: ema12[i],
    ema26: ema26[i],
    rsi: rsiValues[i],
    macd: macdData.macd[i],
    signal: macdData.signal[i],
    histogram: macdData.histogram[i],
    bbUpper: bollinger.upper[i],
    bbMiddle: bollinger.middle[i],
    bbLower: bollinger.lower[i],
  }));

  const toggleIndicator = (ind: Indicator) => {
    setIndicators(prev => {
      const next = new Set(prev);
      next.has(ind) ? next.delete(ind) : next.add(ind);
      return next;
    });
  };

  const cardBg = isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100';
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
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Technical Analysis</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Study price structure, technical indicators, and cross-market behavior from one charting workspace.</p>
        </div>
        <div className="flex w-full items-center gap-3 lg:w-auto">
          <select
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className={`w-full rounded-lg border px-4 py-2 text-sm font-medium outline-none lg:w-[360px] ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
          >
            {instruments.map(s => (
              <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <Card className={`${cardBg} mb-6`}>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{stock.symbol}</CardTitle>
                <Badge variant={getInstrumentCategory(stock) === 'prediction' ? 'gold' : 'outline'}>{getInstrumentCategory(stock)}</Badge>
              </div>
              <CardDescription className="mt-1">{stock.name}</CardDescription>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <span className="text-3xl font-bold">{formatInstrumentQuote(stock, stock.price)}</span>
                <span className={`text-sm ${stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stock.change >= 0 ? '+' : ''}{formatInstrumentQuote(stock, Math.abs(stock.change))} ({formatPercent(stock.changePercent)})
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
            {[{ days: 30, label: '1M' }, { days: 90, label: '3M' }, { days: 180, label: '6M' }, { days: 365, label: '1Y' }].map(tf => (
              <Button
                key={tf.days}
                onClick={() => setTimeframe(tf.days)}
                variant={timeframe === tf.days ? 'default' : 'secondary'}
                size="sm"
              >
                {tf.label}
              </Button>
            ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {allIndicators.map(ind => (
            <Button
              key={ind.key}
              onClick={() => toggleIndicator(ind.key)}
              variant="outline"
              size="sm"
              className={`rounded-full ${indicators.has(ind.key) ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
              style={indicators.has(ind.key) ? { color: ind.color, borderColor: ind.color } : undefined}
            >
              {ind.label}
            </Button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#f0f0f0'} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => formatInstrumentQuote(stock, Number(v))} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#fff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                color: isDark ? '#e5e7eb' : '#1f2937',
                fontSize: '12px',
              }}
              formatter={(value: any, name: any) => [typeof value === 'number' ? formatInstrumentQuote(stock, value) : value, name]}
            />
            <Line type="monotone" dataKey="close" stroke="#0F3A6B" strokeWidth={2} dot={false} name="Price" />
            {indicators.has('sma20') && <Line type="monotone" dataKey="sma20" stroke="#3B82F6" strokeWidth={1} dot={false} name="SMA 20" strokeDasharray="4 2" />}
            {indicators.has('sma50') && <Line type="monotone" dataKey="sma50" stroke="#F59E0B" strokeWidth={1} dot={false} name="SMA 50" strokeDasharray="4 2" />}
            {indicators.has('sma200') && <Line type="monotone" dataKey="sma200" stroke="#EF4444" strokeWidth={1} dot={false} name="SMA 200" strokeDasharray="4 2" />}
            {indicators.has('ema12') && <Line type="monotone" dataKey="ema12" stroke="#8B5CF6" strokeWidth={1} dot={false} name="EMA 12" />}
            {indicators.has('ema26') && <Line type="monotone" dataKey="ema26" stroke="#EC4899" strokeWidth={1} dot={false} name="EMA 26" />}
            {indicators.has('bollinger') && (
              <>
                <Line type="monotone" dataKey="bbUpper" stroke="#6366F1" strokeWidth={1} dot={false} name="BB Upper" strokeDasharray="2 2" />
                <Line type="monotone" dataKey="bbMiddle" stroke="#6366F1" strokeWidth={1} dot={false} name="BB Middle" />
                <Line type="monotone" dataKey="bbLower" stroke="#6366F1" strokeWidth={1} dot={false} name="BB Lower" strokeDasharray="2 2" />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {showVolume && (
          <div className="mt-6 rounded-2xl border p-4 dark:border-gray-800">
            <h4 className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Volume</h4>
            <ResponsiveContainer width="100%" height={80}>
              <ComposedChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
                <Bar dataKey="volume" fill={isDark ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="date" hide />
                <YAxis hide />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {showRSI && (
          <div className="mt-6 rounded-2xl border p-4 dark:border-gray-800">
            <h4 className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>RSI (14)</h4>
            <ResponsiveContainer width="100%" height={100}>
              <ComposedChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#f0f0f0'} />
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
          <div className="mt-6 rounded-2xl border p-4 dark:border-gray-800">
            <h4 className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>MACD</h4>
            <ResponsiveContainer width="100%" height={100}>
              <ComposedChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#f0f0f0'} />
                <XAxis dataKey="date" hide />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <ReferenceLine y={0} stroke={isDark ? '#4B5563' : '#D1D5DB'} />
                <Bar dataKey="histogram" fill="#6366F1" />
                <Line type="monotone" dataKey="macd" stroke="#F97316" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="signal" stroke="#EF4444" strokeWidth={1} dot={false} strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        </CardContent>
      </Card>

      <Card className={cardBg}>
        <CardHeader>
          <CardTitle>Instrument Details</CardTitle>
          <CardDescription>Core quote stats and session context for the selected market.</CardDescription>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Open', value: formatInstrumentQuote(stock, stock.open) },
            { label: 'High', value: formatInstrumentQuote(stock, stock.high) },
            { label: 'Low', value: formatInstrumentQuote(stock, stock.low) },
            { label: 'Prev Close', value: formatInstrumentQuote(stock, stock.previousClose) },
            { label: 'Volume', value: (stock.volume / 1000000).toFixed(1) + 'M' },
            { label: 'Market Cap', value: stock.marketCap ? `$${(stock.marketCap / 1000000000).toFixed(0)}B` : 'N/A' },
            { label: 'Sector', value: stock.sector || 'N/A' },
            { label: 'Day Range', value: `${formatInstrumentQuote(stock, stock.low)} - ${formatInstrumentQuote(stock, stock.high)}` },
          ].map(item => (
            <div key={item.label} className={`rounded-2xl border p-4 ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</p>
              <p className="text-sm font-semibold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
        </CardContent>
      </Card>

      <div className={`mt-4 rounded-xl border p-4 text-xs ${isDark ? 'border-gray-800 bg-gray-900/50 text-gray-500' : 'border-gray-100 bg-gray-100 text-gray-400'}`}>
        Technical indicators are tools, not crystal balls. Past performance does not predict future results.
        Always use multiple forms of analysis and proper risk management.
      </div>
    </div>
  );
}
