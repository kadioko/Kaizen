import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Gauge,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { useMarketData } from '../context/MarketDataContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatPercent, formatInstrumentQuote, getInstrumentCategory, getSizeLabel } from '../utils/helpers';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';

function getSearchPlaceholder(marketFilter: string) {
  if (marketFilter === 'all') return 'Search all markets...';
  return `Search ${marketFilter}...`;
}

export default function PaperTrade() {
  const { isDark } = useTheme();
  const { balance, positions, executeTrade } = useTrading();
  const { instruments, isLoadingPolymarket, polymarketError } = useMarketData();
  const [search, setSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState<'all' | 'stock' | 'prediction' | 'forex' | 'crypto'>('all');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [shares, setShares] = useState('');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [notes, setNotes] = useState('');
  const [strategy, setStrategy] = useState('');
  const [emotion, setEmotion] = useState<'confident' | 'fearful' | 'greedy' | 'neutral' | 'fomo'>('neutral');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState('');

  const categorizedInstruments = useMemo(
    () =>
      instruments.map((instrument) => ({
        instrument,
        category: getInstrumentCategory(instrument),
      })),
    [instruments]
  );

  const categoryLists = useMemo(
    () => ({
      all: categorizedInstruments.map(({ instrument }) => instrument),
      stock: categorizedInstruments.filter(({ category }) => category === 'stock').map(({ instrument }) => instrument),
      prediction: categorizedInstruments.filter(({ category }) => category === 'prediction').map(({ instrument }) => instrument),
      forex: categorizedInstruments.filter(({ category }) => category === 'forex').map(({ instrument }) => instrument),
      crypto: categorizedInstruments.filter(({ category }) => category === 'crypto').map(({ instrument }) => instrument),
    }),
    [categorizedInstruments]
  );

  const filteredStocks = useMemo(
    () =>
      categorizedInstruments
        .filter(
          ({ instrument, category }) =>
            (marketFilter === 'all' || category === marketFilter) &&
            (instrument.symbol.toLowerCase().includes(search.toLowerCase()) ||
              instrument.name.toLowerCase().includes(search.toLowerCase()) ||
              (instrument.sector || '').toLowerCase().includes(search.toLowerCase()))
        )
        .map(({ instrument }) => instrument),
    [categorizedInstruments, marketFilter, search]
  );

  const handleMarketFilterChange = (nextFilter: 'all' | 'stock' | 'prediction' | 'forex' | 'crypto') => {
    setMarketFilter(nextFilter);
    const nextCategoryStocks = categoryLists[nextFilter];
    if (nextCategoryStocks.length > 0) {
      setSelectedSymbol(nextCategoryStocks[0].symbol);
    }
  };

  useEffect(() => {
    if (filteredStocks.length === 0) return;
    const stillVisible = filteredStocks.some((instrument) => instrument.symbol === selectedSymbol);
    if (!stillVisible) {
      setSelectedSymbol(filteredStocks[0].symbol);
    }
  }, [filteredStocks, selectedSymbol]);

  const stock =
    filteredStocks.find((instrument) => instrument.symbol === selectedSymbol) ||
    (marketFilter === 'all' ? instruments.find((instrument) => instrument.symbol === selectedSymbol) : undefined) ||
    filteredStocks[0] ||
    instruments[0];
  const selectedStock = stock || instruments[0];
  const selectedCategory = getInstrumentCategory(selectedStock);

  const sharesNum = parseInt(shares, 10) || 0;
  const orderTotal = selectedStock.price * sharesNum;
  const position = positions.find((existingPosition) => existingPosition.symbol === selectedSymbol);
  const investedCapital = positions.reduce((sum, existingPosition) => sum + existingPosition.currentPrice * existingPosition.shares, 0);
  const totalPortfolioValue = balance + investedCapital;

  const maxBuyShares = Math.floor(balance / selectedStock.price);
  const maxSellShares = position?.shares || 0;
  const riskPercent = totalPortfolioValue > 0 ? (orderTotal / totalPortfolioValue) * 100 : 0;
  const largestPosition = positions.reduce((currentMax, currentPosition) => {
    const currentValue = currentPosition.currentPrice * currentPosition.shares;
    const maxValue = currentMax ? currentMax.currentPrice * currentMax.shares : 0;
    return currentValue > maxValue ? currentPosition : currentMax;
  }, positions[0]);

  const handleTrade = () => {
    if (sharesNum <= 0) {
      setShowError('Enter a valid number of shares');
      return;
    }
    if (orderType === 'buy' && orderTotal > balance) {
      setShowError('Insufficient balance');
      return;
    }
    if (orderType === 'sell' && (!position || position.shares < sharesNum)) {
      setShowError('Insufficient shares');
      return;
    }

    const success = executeTrade(selectedSymbol, sharesNum, orderType, notes, strategy, emotion);
    if (success) {
      setShowSuccess(true);
      setShares('');
      setNotes('');
      setStrategy('');
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setShowError('Trade failed. Check your balance and positions.');
    }
    setTimeout(() => setShowError(''), 3000);
  };

  if (!selectedStock) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 text-white shadow-[0_35px_100px_-48px_rgba(15,58,107,0.95)]">
        <CardContent className="relative p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.24),transparent_42%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">
                <Sparkles size={14} />
                Execution Lab
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight sm:text-5xl">
                Practice sizing, timing, and conviction before real money is on the line.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                The trading desk now separates browsing, order construction, and portfolio review so each decision feels deliberate instead of rushed.
              </p>

              {(isLoadingPolymarket || polymarketError) && (
                <div className={`mt-5 inline-flex rounded-full px-4 py-2 text-xs font-medium ${
                  polymarketError ? 'bg-amber-400/15 text-amber-200' : 'bg-white/10 text-slate-200'
                }`}>
                  {polymarketError
                    ? `Live Polymarket feed unavailable: ${polymarketError}. Showing fallback prediction markets.`
                    : 'Refreshing live Polymarket markets...'}
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-gold-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cash</p>
                    <p className="mt-1 text-xl font-semibold">{formatCurrency(balance)}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Layers3 className="h-5 w-5 text-sky-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Open positions</p>
                    <p className="mt-1 text-xl font-semibold">{positions.length}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Gauge className="h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Buying power</p>
                    <p className="mt-1 text-xl font-semibold">
                      {Math.floor(balance / selectedStock.price)} {getSizeLabel(selectedStock).toLowerCase()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr_0.92fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Market browser</CardTitle>
            <CardDescription>Filter by asset class and scan quickly before you commit to a setup.</CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              {([
                ['all', 'All'],
                ['stock', 'Stocks'],
                ['prediction', 'Prediction'],
                ['forex', 'Forex'],
                ['crypto', 'Crypto'],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  onClick={() => handleMarketFilterChange(value)}
                  variant={marketFilter === value ? 'default' : 'secondary'}
                  size="sm"
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="relative mt-2">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder={getSearchPlaceholder(marketFilter)}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 rounded-full pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[700px] space-y-3 overflow-y-auto pt-0">
            {filteredStocks.map((instrument) => (
              <button
                key={instrument.symbol}
                onClick={() => setSelectedSymbol(instrument.symbol)}
                className={`w-full rounded-[1.4rem] border p-4 text-left transition-all duration-200 ${
                  selectedSymbol === instrument.symbol
                    ? isDark
                      ? 'border-navy-700 bg-navy-900/30'
                      : 'border-navy-200 bg-navy-50'
                    : isDark
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{instrument.symbol}</p>
                      <Badge variant={getInstrumentCategory(instrument) === 'prediction' ? 'gold' : 'secondary'}>
                        {getInstrumentCategory(instrument)}
                      </Badge>
                    </div>
                    <p className={`mt-1 line-clamp-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{instrument.name}</p>
                    <p className={`mt-1 text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{instrument.sector}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatInstrumentQuote(instrument, instrument.price)}</p>
                    <p className={`mt-1 inline-flex items-center gap-1 text-xs ${instrument.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {instrument.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {formatPercent(instrument.changePercent)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>{selectedStock.symbol}</CardTitle>
                  <Badge variant={selectedCategory === 'prediction' ? 'gold' : 'outline'}>{selectedCategory}</Badge>
                </div>
                <CardDescription className="mt-1">{selectedStock.name}</CardDescription>
                <p className={`mt-2 text-xs uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {selectedStock.sector} · {getSizeLabel(selectedStock)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold tracking-tight">{formatInstrumentQuote(selectedStock, selectedStock.price)}</p>
                <p className={`mt-2 text-sm ${selectedStock.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {selectedStock.change >= 0 ? '+' : '-'}
                  {formatInstrumentQuote(selectedStock, Math.abs(selectedStock.change))} ({formatPercent(selectedStock.changePercent)})
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setOrderType('buy')}
                variant={orderType === 'buy' ? 'default' : 'secondary'}
                className={orderType === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-600' : ''}
              >
                <ArrowUpRight size={16} />
                Buy
              </Button>
              <Button onClick={() => setOrderType('sell')} variant={orderType === 'sell' ? 'destructive' : 'secondary'}>
                <ArrowDownRight size={16} />
                Sell
              </Button>
            </div>

            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{getSizeLabel(selectedStock)}</label>
              <Input
                type="number"
                value={shares}
                onChange={(event) => setShares(event.target.value)}
                placeholder="0"
                min="1"
                className="mt-1 h-12 rounded-2xl text-lg font-semibold"
              />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                  Max: {orderType === 'buy' ? maxBuyShares : maxSellShares} {getSizeLabel(selectedStock).toLowerCase()}
                </span>
                <button
                  onClick={() => setShares(String(orderType === 'buy' ? maxBuyShares : maxSellShares))}
                  className="font-semibold text-gold-500 hover:text-gold-600"
                  type="button"
                >
                  Use max
                </button>
              </div>
            </div>

            <div className={`rounded-[1.5rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}>
              <div className="mb-2 flex justify-between text-sm">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Price</span>
                <span>{formatInstrumentQuote(selectedStock, selectedStock.price)}</span>
              </div>
              <div className="mb-2 flex justify-between text-sm">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{getSizeLabel(selectedStock)}</span>
                <span>{sharesNum}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(orderTotal)}</span>
              </div>
            </div>

            {riskPercent > 5 && (
              <div className="flex items-center gap-2 rounded-[1.2rem] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle size={16} />
                <span>This trade is {riskPercent.toFixed(1)}% of your portfolio. Consider your sizing rule before sending it.</span>
              </div>
            )}

            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Strategy</label>
              <Input
                type="text"
                value={strategy}
                onChange={(event) => setStrategy(event.target.value)}
                placeholder="Breakout, mean reversion, event scalp..."
                className="mt-1 rounded-2xl"
              />
            </div>

            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Emotional state</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['confident', 'neutral', 'fearful', 'greedy', 'fomo'] as const).map((currentEmotion) => (
                  <Button
                    key={currentEmotion}
                    onClick={() => setEmotion(currentEmotion)}
                    variant={emotion === currentEmotion ? 'default' : 'secondary'}
                    size="sm"
                    className="capitalize"
                  >
                    {currentEmotion}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Trade notes</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="What is the setup, invalidation, and intended management plan?"
                rows={3}
                className={`mt-1 w-full resize-none rounded-[1.25rem] border px-4 py-3 text-sm outline-none transition-colors ${
                  isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white/70 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

            <button
              onClick={handleTrade}
              disabled={sharesNum <= 0}
              className={`w-full rounded-[1.25rem] py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                orderType === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {orderType === 'buy' ? 'Buy' : 'Sell'} {selectedStock.symbol}
            </button>

            {showSuccess && (
              <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                Trade executed successfully.
              </div>
            )}
            {showError && (
              <div className="rounded-[1.2rem] border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {showError}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account summary</CardTitle>
              <CardDescription>Check exposure before adding more risk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cash balance</span>
                <span className="font-semibold">{formatCurrency(balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Invested capital</span>
                <span className="font-semibold">{formatCurrency(investedCapital)}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Largest position</span>
                <span className="font-semibold">{largestPosition ? largestPosition.symbol : 'None'}</span>
              </div>
              <div className="flex justify-between border-t border-inherit pt-3">
                <span className="text-sm font-medium">Total equity</span>
                <span className="text-lg font-bold">{formatCurrency(totalPortfolioValue)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'border-gold-400/10 bg-gradient-to-br from-navy-950/70 to-slate-950/90' : 'border-gold-100 bg-gradient-to-br from-navy-50 to-white'}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-400 text-white">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Execution checklist</p>
                  <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Know your thesis, invalidation, and position size before clicking buy or sell. If one is missing, the trade is not ready.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open positions</CardTitle>
              <CardDescription>Keep the active book visible and easy to review.</CardDescription>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <p className={`py-6 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No open positions.</p>
              ) : (
                <div className="space-y-3">
                  {positions.map((currentPosition) => {
                    const positionStock = instruments.find((instrument) => instrument.symbol === currentPosition.symbol) || selectedStock;
                    const positionCategory = getInstrumentCategory(positionStock);
                    const pnl = (currentPosition.currentPrice - currentPosition.entryPrice) * currentPosition.shares;
                    const pnlPct = ((currentPosition.currentPrice - currentPosition.entryPrice) / currentPosition.entryPrice) * 100;

                    return (
                      <div key={currentPosition.id} className={`rounded-[1.4rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">{currentPosition.symbol}</p>
                              <Badge variant={positionCategory === 'prediction' ? 'gold' : 'outline'}>{positionCategory}</Badge>
                            </div>
                            <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {currentPosition.shares} @ {formatInstrumentQuote(positionStock, currentPosition.entryPrice)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(pnl)}</p>
                            <p className={`mt-1 text-xs ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatPercent(pnlPct)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
