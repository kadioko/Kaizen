export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function getInstrumentCategory(stock: {
  assetClass?: 'stock' | 'prediction' | 'forex' | 'crypto';
  source?: 'static' | 'polymarket';
  sector?: string;
  symbol: string;
}): 'stock' | 'prediction' | 'forex' | 'crypto' {
  if (stock.assetClass === 'prediction' || stock.source === 'polymarket' || stock.symbol.startsWith('PM-') || stock.sector === 'Prediction Markets') return 'prediction';
  if (stock.assetClass === 'forex' || stock.sector === 'Forex') return 'forex';
  if (stock.assetClass === 'crypto' || stock.sector === 'Crypto') return 'crypto';
  return 'stock';
}

export function getSizeLabel(stock: { assetClass?: 'stock' | 'prediction' | 'forex' | 'crypto'; source?: 'static' | 'polymarket'; sector?: string; symbol: string; }) {
  const category = getInstrumentCategory(stock);
  if (category === 'forex') return 'Units';
  if (category === 'crypto') return 'Coins';
  if (category === 'prediction') return 'Contracts';
  return 'Shares';
}

export function formatInstrumentQuote(stock: { quoteUnit?: 'usd' | 'cents' | 'rate' }, value: number): string {
  if (stock.quoteUnit === 'cents') return `${Math.round(value * 100)}¢`;
  if (stock.quoteUnit === 'rate') return value.toFixed(4);
  return formatCurrency(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function calculateRSI(prices: number[], period = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      rsi.push(50);
      continue;
    }

    const avgGain = gains.slice(i - period, i).reduce((s, v) => s + v, 0) / period;
    const avgLoss = losses.slice(i - period, i).reduce((s, v) => s + v, 0) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  return rsi;
}

export function calculateSMA(prices: number[], period: number): (number | null)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return null;
    const slice = prices.slice(i - period + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / period;
  });
}

export function calculateEMA(prices: number[], period: number): (number | null)[] {
  const multiplier = 2 / (period + 1);
  const ema: (number | null)[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      ema.push(null);
    } else if (i === period - 1) {
      const sma = prices.slice(0, period).reduce((s, v) => s + v, 0) / period;
      ema.push(sma);
    } else {
      const prev = ema[i - 1] as number;
      ema.push((prices[i] - prev) * multiplier + prev);
    }
  }

  return ema;
}

export function calculateMACD(prices: number[]): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  const macdLine: (number | null)[] = prices.map((_, i) => {
    if (ema12[i] === null || ema26[i] === null) return null;
    return (ema12[i] as number) - (ema26[i] as number);
  });

  const macdValues = macdLine.filter((v): v is number => v !== null);
  const signalEma = calculateEMA(macdValues, 9);

  let signalIdx = 0;
  const signal: (number | null)[] = macdLine.map(v => {
    if (v === null) return null;
    return signalEma[signalIdx++] ?? null;
  });

  const histogram: (number | null)[] = macdLine.map((v, i) => {
    if (v === null || signal[i] === null) return null;
    return v - (signal[i] as number);
  });

  return { macd: macdLine, signal, histogram };
}

export function calculateBollingerBands(prices: number[], period = 20, stdDev = 2): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const sma = calculateSMA(prices, period);

  return {
    upper: sma.map((avg, i) => {
      if (avg === null) return null;
      const slice = prices.slice(i - period + 1, i + 1);
      const variance = slice.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / period;
      return avg + stdDev * Math.sqrt(variance);
    }),
    middle: sma,
    lower: sma.map((avg, i) => {
      if (avg === null) return null;
      const slice = prices.slice(i - period + 1, i + 1);
      const variance = slice.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / period;
      return avg - stdDev * Math.sqrt(variance);
    }),
  };
}
