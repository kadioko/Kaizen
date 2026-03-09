import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { useTheme } from '../context/ThemeContext';
import { STOCKS } from '../data/stocks';
import { formatCurrency, formatPercent } from '../utils/helpers';
import { Search, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { Stock } from '../types';

function formatQuote(stock: Stock, value: number) {
  if (stock.quoteUnit === 'cents') return `${Math.round(value * 100)}¢`;
  if (stock.quoteUnit === 'rate') return value.toFixed(4);
  return formatCurrency(value);
}

function getSizeLabel(stock: Stock) {
  if (stock.assetClass === 'forex') return 'Units';
  if (stock.assetClass === 'crypto') return 'Coins';
  if (stock.assetClass === 'prediction') return 'Contracts';
  return 'Shares';
}

function getSearchPlaceholder(marketFilter: string) {
  if (marketFilter === 'all') return 'Search all markets...';
  return `Search ${marketFilter}...`;
}

export default function PaperTrade() {
  const { isDark } = useTheme();
  const { balance, positions, executeTrade } = useTrading();
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

  const stock = STOCKS.find(s => s.symbol === selectedSymbol)!;
  const filteredStocks = STOCKS.filter(s =>
    (marketFilter === 'all' || s.assetClass === marketFilter) && (
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.sector || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const sharesNum = parseInt(shares) || 0;
  const orderTotal = stock.price * sharesNum;
  const position = positions.find(p => p.symbol === selectedSymbol);

  const maxBuyShares = Math.floor(balance / stock.price);
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
  const inputBg = isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900';

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Paper Trading</h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Practice with virtual ${formatCurrency(100000).replace('$', '')} — no real money at risk
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock List */}
        <div className={`rounded-xl shadow-sm ${cardBg}`}>
          <div className="p-4 border-b border-inherit">
            <div className="flex flex-wrap gap-2 mb-3">
              {([
                ['all', 'All'],
                ['stock', 'Stocks'],
                ['prediction', 'Prediction'],
                ['forex', 'Forex'],
                ['crypto', 'Crypto'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setMarketFilter(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    marketFilter === value
                      ? 'bg-navy-800 text-white'
                      : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${inputBg}`}>
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder={getSearchPlaceholder(marketFilter)}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {filteredStocks.map(s => (
              <button
                key={s.symbol}
                onClick={() => setSelectedSymbol(s.symbol)}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors border-b border-inherit ${
                  selectedSymbol === s.symbol
                    ? isDark ? 'bg-navy-900/30' : 'bg-navy-50'
                    : isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                }`}
              >
                <div>
                  <p className="font-semibold text-sm">{s.symbol}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.name}</p>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{s.sector}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatQuote(s, s.price)}</p>
                  <p className={`text-xs flex items-center gap-0.5 justify-end ${s.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {s.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {s.change >= 0 ? '+' : ''}{formatPercent(s.changePercent)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Order Form */}
        <div className={`rounded-xl p-6 shadow-sm ${cardBg}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">{stock.symbol}</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stock.name}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stock.sector} · {getSizeLabel(stock)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatQuote(stock, stock.price)}</p>
              <p className={`text-sm ${stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {stock.change >= 0 ? '+' : ''}{formatQuote(stock, Math.abs(stock.change))} ({formatPercent(stock.changePercent)})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => setOrderType('buy')}
              className={`py-3 rounded-lg font-semibold text-sm transition-colors ${
                orderType === 'buy'
                  ? 'bg-emerald-500 text-white'
                  : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowUpRight size={16} className="inline mr-1" /> Buy
            </button>
            <button
              onClick={() => setOrderType('sell')}
              className={`py-3 rounded-lg font-semibold text-sm transition-colors ${
                orderType === 'sell'
                  ? 'bg-red-500 text-white'
                  : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowDownRight size={16} className="inline mr-1" /> Sell
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{getSizeLabel(stock)}</label>
              <input
                type="number"
                value={shares}
                onChange={e => setShares(e.target.value)}
                placeholder="0"
                min="1"
                className={`mt-1 w-full px-4 py-3 rounded-lg border text-lg font-semibold outline-none focus:ring-2 focus:ring-navy-500 ${inputBg}`}
              />
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Max: {orderType === 'buy' ? maxBuyShares : maxSellShares} {getSizeLabel(stock).toLowerCase()}
                </span>
                <button
                  onClick={() => setShares(String(orderType === 'buy' ? maxBuyShares : maxSellShares))}
                  className="text-xs text-gold-400 hover:text-gold-500"
                >
                  Max
                </button>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex justify-between text-sm mb-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Price</span>
                <span>{formatQuote(stock, stock.price)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{getSizeLabel(stock)}</span>
                <span>{sharesNum}</span>
              </div>
              <div className="border-t border-inherit my-2 pt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
              </div>
            </div>

            {riskPercent > 5 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">
                <AlertTriangle size={16} />
                <span>This trade is {riskPercent.toFixed(1)}% of your portfolio. Consider the 2% rule.</span>
              </div>
            )}

            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Strategy (optional)</label>
              <input
                type="text"
                value={strategy}
                onChange={e => setStrategy(e.target.value)}
                placeholder="e.g., Breakout, Mean reversion"
                className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none ${inputBg}`}
              />
            </div>

            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>How are you feeling?</label>
              <div className="flex gap-2 mt-1">
                {(['confident', 'neutral', 'fearful', 'greedy', 'fomo'] as const).map(e => (
                  <button
                    key={e}
                    onClick={() => setEmotion(e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      emotion === e
                        ? 'bg-navy-800 text-white'
                        : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {e}
                  </button>
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
                className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none ${inputBg}`}
              />
            </div>

            <button
              onClick={handleTrade}
              disabled={sharesNum <= 0}
              className={`w-full py-3 rounded-lg font-semibold text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                orderType === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {orderType === 'buy' ? 'Buy' : 'Sell'} {stock.symbol}
            </button>

            {showSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm text-center font-medium">
                Trade executed successfully!
              </div>
            )}
            {showError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm text-center font-medium">
                {showError}
              </div>
            )}
          </div>
        </div>

        {/* Portfolio */}
        <div className="space-y-6">
          <div className={`rounded-xl p-6 shadow-sm ${cardBg}`}>
            <h3 className="font-semibold mb-2">Account Summary</h3>
            <div className="space-y-3">
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
            </div>
          </div>

          <div className={`rounded-xl p-6 shadow-sm ${cardBg}`}>
            <h3 className="font-semibold mb-4">Positions</h3>
            {positions.length === 0 ? (
              <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No open positions</p>
            ) : (
              <div className="space-y-3">
                {positions.map(p => {
                  const positionStock = STOCKS.find(s => s.symbol === p.symbol) || stock;
                  const pnl = (p.currentPrice - p.entryPrice) * p.shares;
                  const pnlPct = ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100;
                  return (
                    <div key={p.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">{p.symbol}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {p.shares} @ {formatQuote(positionStock, p.entryPrice)}
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
          </div>
        </div>
      </div>
    </div>
  );
}
