import React, { useEffect, useMemo, useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { useMarketData } from '../context/MarketDataContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatPercent, formatInstrumentQuote, getInstrumentCategory, getSizeLabel } from '../utils/helpers';
import { Search, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, AlertTriangle, Wallet, Gauge, Layers3 } from 'lucide-react';
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

  const filteredStocks = useMemo(() => instruments.filter(s =>
    (marketFilter === 'all' || getInstrumentCategory(s) === marketFilter) && (
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.sector || '').toLowerCase().includes(search.toLowerCase())
    )
  ), [instruments, marketFilter, search]);

  useEffect(() => {
    if (filteredStocks.length === 0) return;
    const stillVisible = filteredStocks.some(s => s.symbol === selectedSymbol);
    if (!stillVisible) {
      setSelectedSymbol(filteredStocks[0].symbol);
    }
  }, [filteredStocks, selectedSymbol]);

  const stock = filteredStocks.find(s => s.symbol === selectedSymbol) || instruments.find(s => s.symbol === selectedSymbol) || filteredStocks[0] || instruments[0];
  const selectedStock = stock || instruments[0];
  const selectedCategory = getInstrumentCategory(selectedStock);

  const sharesNum = parseInt(shares) || 0;
  const orderTotal = selectedStock.price * sharesNum;
  const position = positions.find(p => p.symbol === selectedSymbol);

  const maxBuyShares = Math.floor(balance / selectedStock.price);
  const maxSellShares = position?.shares || 0;
  const riskPercent = (orderTotal / (balance + positions.reduce((s, p) => s + p.currentPrice * p.shares, 0))) * 100;

  const handleTrade = () => {
    if (sharesNum <= 0) { setShowError('Enter a valid number of shares'); return; }
    if (orderType === 'buy' && orderTotal > balance) { setShowError('Insufficient balance'); return; }
    if (orderType === 'sell' && (!position || position.shares < sharesNum)) { setShowError('Insufficient shares'); return; }

    const success = executeTrade(selectedSymbol, sharesNum, orderType, notes, strategy, emotion);
    if (success) {
      setShowSuccess(true);
      setShares('');
      setNotes('');
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setShowError('Trade failed. Check your balance and positions.');
    }
    setTimeout(() => setShowError(''), 3000);
  };

  const cardBg = isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100';

  if (!selectedStock) {
    return null;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Paper Trading</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Practice across multi-asset markets with virtual capital and tighter execution discipline.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[520px]">
          <Card className={cardBg}>
            <CardContent className="flex items-center gap-3 p-4">
              <Wallet className="h-5 w-5 text-gold-400" />
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Cash</p>
                <p className="text-sm font-semibold">{formatCurrency(balance)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className={cardBg}>
            <CardContent className="flex items-center gap-3 p-4">
              <Layers3 className="h-5 w-5 text-navy-500" />
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Open Positions</p>
                <p className="text-sm font-semibold">{positions.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className={cardBg}>
            <CardContent className="flex items-center gap-3 p-4">
              <Gauge className="h-5 w-5 text-emerald-500" />
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Buying Power</p>
                <p className="text-sm font-semibold">{Math.floor(balance / selectedStock.price)} {getSizeLabel(selectedStock).toLowerCase()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        {(isLoadingPolymarket || polymarketError) && (
          <p className={`mt-2 text-xs ${polymarketError ? 'text-amber-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {polymarketError ? `Live Polymarket feed unavailable: ${polymarketError}. Showing fallback prediction markets.` : 'Refreshing live Polymarket markets...'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr_0.95fr]">
        {/* Stock List */}
        <Card className={cardBg}>
          <CardHeader className="pb-4">
            <CardTitle>Market Browser</CardTitle>
            <CardDescription>Browse instruments by asset class with prediction markets isolated to their own category.</CardDescription>
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
                  onClick={() => setMarketFilter(value)}
                  variant={marketFilter === value ? 'default' : 'secondary'}
                  size="sm"
                  className="rounded-full"
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="relative mt-2">
              <Search size={16} className="text-gray-400" />
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder={getSearchPlaceholder(marketFilter)}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[620px] space-y-3 overflow-y-auto pt-0">
            {filteredStocks.map(s => (
              <button
                key={s.symbol}
                onClick={() => setSelectedSymbol(s.symbol)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  selectedSymbol === s.symbol
                    ? isDark ? 'border-navy-700 bg-navy-900/30' : 'border-navy-200 bg-navy-50'
                    : isDark ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{s.symbol}</p>
                      <Badge variant={getInstrumentCategory(s) === 'prediction' ? 'gold' : 'secondary'}>{getInstrumentCategory(s)}</Badge>
                    </div>
                    <p className={`mt-1 line-clamp-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.name}</p>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{s.sector}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatInstrumentQuote(s, s.price)}</p>
                    <p className={`text-xs flex items-center gap-0.5 justify-end ${s.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {s.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {s.change >= 0 ? '+' : ''}{formatPercent(s.changePercent)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Order Form */}
        <Card className={cardBg}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>{selectedStock.symbol}</CardTitle>
                  <Badge variant={selectedCategory === 'prediction' ? 'gold' : 'outline'}>{selectedCategory}</Badge>
                </div>
                <CardDescription className="mt-1">{selectedStock.name}</CardDescription>
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{selectedStock.sector} · {getSizeLabel(selectedStock)}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatInstrumentQuote(selectedStock, selectedStock.price)}</p>
                <p className={`text-sm ${selectedStock.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {selectedStock.change >= 0 ? '+' : ''}{formatInstrumentQuote(selectedStock, Math.abs(selectedStock.change))} ({formatPercent(selectedStock.changePercent)})
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setOrderType('buy')}
              variant={orderType === 'buy' ? 'default' : 'secondary'}
              className={orderType === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
            >
              <ArrowUpRight size={16} className="inline mr-1" /> Buy
            </Button>
            <Button
              onClick={() => setOrderType('sell')}
              variant={orderType === 'sell' ? 'destructive' : 'secondary'}
            >
              <ArrowDownRight size={16} className="inline mr-1" /> Sell
            </Button>
            </div>

          <div className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{getSizeLabel(selectedStock)}</label>
              <Input
                type="number"
                value={shares}
                onChange={e => setShares(e.target.value)}
                placeholder="0"
                min="1"
                className="mt-1 h-12 text-lg font-semibold"
              />
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Max: {orderType === 'buy' ? maxBuyShares : maxSellShares} {getSizeLabel(selectedStock).toLowerCase()}
                </span>
                <button
                  onClick={() => setShares(String(orderType === 'buy' ? maxBuyShares : maxSellShares))}
                  className="text-xs text-gold-400 hover:text-gold-500"
                >
                  Max
                </button>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex justify-between text-sm mb-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Price</span>
                <span>{formatInstrumentQuote(selectedStock, selectedStock.price)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{getSizeLabel(selectedStock)}</span>
                <span>{sharesNum}</span>
              </div>
              <Separator className="my-3" />
              <div className="border-inherit pt-0">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
              </div>
            </div>

            {riskPercent > 5 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle size={16} />
                <span>This trade is {riskPercent.toFixed(1)}% of your portfolio. Consider the 2% rule.</span>
              </div>
            )}

            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Strategy (optional)</label>
              <Input
                type="text"
                value={strategy}
                onChange={e => setStrategy(e.target.value)}
                placeholder="e.g., Breakout, Mean reversion"
                className="mt-1"
              />
            </div>

            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>How are you feeling?</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['confident', 'neutral', 'fearful', 'greedy', 'fomo'] as const).map(e => (
                  <Button
                    key={e}
                    onClick={() => setEmotion(e)}
                    variant={emotion === e ? 'default' : 'secondary'}
                    size="sm"
                    className="capitalize rounded-full"
                  >
                    {e}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Trade Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Why are you making this trade?"
                rows={2}
                className={`mt-1 w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'}`}
              />
            </div>

            <button
              onClick={handleTrade}
              disabled={sharesNum <= 0}
              className={`w-full rounded-lg py-3 font-semibold text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                orderType === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {orderType === 'buy' ? 'Buy' : 'Sell'} {stock.symbol}
            </button>

            {showSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                Trade executed successfully!
              </div>
            )}
            {showError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {showError}
              </div>
            )}
          </div>
          </CardContent>
        </Card>

        {/* Portfolio */}
        <div className="space-y-6">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
              <CardDescription>Review your capital and deployed exposure before placing the next trade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cash Balance</span>
                <span className="font-semibold">{formatCurrency(balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Invested</span>
                <span className="font-semibold">{formatCurrency(positions.reduce((s, p) => s + p.currentPrice * p.shares, 0))}</span>
              </div>
              <div className="border-t border-inherit pt-2 flex justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="font-bold">{formatCurrency(balance + positions.reduce((s, p) => s + p.currentPrice * p.shares, 0))}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={cardBg}>
            <CardHeader>
              <CardTitle>Positions</CardTitle>
              <CardDescription>Track the active book and spot winners, laggards, and mis-sized trades quickly.</CardDescription>
            </CardHeader>
            <CardContent>
            {positions.length === 0 ? (
              <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No open positions</p>
            ) : (
              <div className="space-y-3">
                {positions.map(p => {
                  const positionStock = instruments.find(s => s.symbol === p.symbol) || selectedStock;
                  const positionCategory = getInstrumentCategory(positionStock);
                  const pnl = (p.currentPrice - p.entryPrice) * p.shares;
                  const pnlPct = ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100;
                  return (
                    <div key={p.id} className={`rounded-2xl border p-3 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{p.symbol}</p>
                            <Badge variant={positionCategory === 'prediction' ? 'gold' : 'outline'}>{positionCategory}</Badge>
                          </div>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {p.shares} @ {formatInstrumentQuote(positionStock, p.entryPrice)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {formatCurrency(pnl)}
                          </p>
                          <p className={`text-xs ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatPercent(pnlPct)}
                          </p>
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
