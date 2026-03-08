import { Stock, CandleData } from '../types';

export const STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.72, change: 2.35, changePercent: 1.33, volume: 58234100, high: 179.63, low: 176.21, open: 176.50, previousClose: 176.37, marketCap: 2780000000000, sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.50, change: -1.20, changePercent: -0.29, volume: 22456700, high: 417.80, low: 413.10, open: 416.70, previousClose: 416.70, marketCap: 3090000000000, sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: 0.95, changePercent: 0.67, volume: 25678900, high: 142.50, low: 140.30, open: 140.85, previousClose: 140.85, marketCap: 1770000000000, sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.60, change: 3.10, changePercent: 1.70, volume: 45123400, high: 186.20, low: 182.40, open: 182.50, previousClose: 182.50, marketCap: 1920000000000, sector: 'Consumer Cyclical' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.30, change: 15.20, changePercent: 1.77, volume: 41567800, high: 880.50, low: 858.00, open: 860.10, previousClose: 860.10, marketCap: 2160000000000, sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.80, change: -5.60, changePercent: -2.23, volume: 98765400, high: 252.30, low: 244.10, open: 251.40, previousClose: 251.40, marketCap: 780000000000, sector: 'Consumer Cyclical' },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 505.20, change: 8.40, changePercent: 1.69, volume: 18234500, high: 508.90, low: 496.70, open: 496.80, previousClose: 496.80, marketCap: 1290000000000, sector: 'Technology' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 198.40, change: 1.80, changePercent: 0.92, volume: 8567300, high: 199.20, low: 196.50, open: 196.60, previousClose: 196.60, marketCap: 571000000000, sector: 'Financial Services' },
  { symbol: 'V', name: 'Visa Inc.', price: 280.90, change: 0.60, changePercent: 0.21, volume: 6234500, high: 281.80, low: 279.50, open: 280.30, previousClose: 280.30, marketCap: 577000000000, sector: 'Financial Services' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 156.30, change: -0.40, changePercent: -0.26, volume: 7345600, high: 157.10, low: 155.80, open: 156.70, previousClose: 156.70, marketCap: 377000000000, sector: 'Healthcare' },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 165.20, change: 1.10, changePercent: 0.67, volume: 5678900, high: 165.90, low: 163.80, open: 164.10, previousClose: 164.10, marketCap: 445000000000, sector: 'Consumer Defensive' },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', price: 104.50, change: -1.30, changePercent: -1.23, volume: 12345600, high: 106.20, low: 104.10, open: 105.80, previousClose: 105.80, marketCap: 438000000000, sector: 'Energy' },
];

function generateCandles(basePrice: number, days: number): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice * 0.85;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const volatility = 0.02;
    const drift = (basePrice - price) * 0.005;
    const change = price * volatility * (Math.random() - 0.48) + drift;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(5000000 + Math.random() * 50000000);

    candles.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    price = close;
  }

  return candles;
}

const candleCache: Record<string, CandleData[]> = {};

export function getStockCandles(symbol: string, days = 180): CandleData[] {
  const key = `${symbol}-${days}`;
  if (!candleCache[key]) {
    const stock = STOCKS.find(s => s.symbol === symbol);
    candleCache[key] = generateCandles(stock?.price || 100, days);
  }
  return candleCache[key];
}
