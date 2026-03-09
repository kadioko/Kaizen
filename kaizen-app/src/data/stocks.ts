import { Stock, CandleData } from '../types';

export const STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.72, change: 2.35, changePercent: 1.33, volume: 58234100, high: 179.63, low: 176.21, open: 176.50, previousClose: 176.37, marketCap: 2780000000000, sector: 'Technology', assetClass: 'stock', quoteUnit: 'usd' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.50, change: -1.20, changePercent: -0.29, volume: 22456700, high: 417.80, low: 413.10, open: 416.70, previousClose: 416.70, marketCap: 3090000000000, sector: 'Technology', assetClass: 'stock', quoteUnit: 'usd' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: 0.95, changePercent: 0.67, volume: 25678900, high: 142.50, low: 140.30, open: 140.85, previousClose: 140.85, marketCap: 1770000000000, sector: 'Technology', assetClass: 'stock', quoteUnit: 'usd' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.60, change: 3.10, changePercent: 1.70, volume: 45123400, high: 186.20, low: 182.40, open: 182.50, previousClose: 182.50, marketCap: 1920000000000, sector: 'Consumer Cyclical', assetClass: 'stock', quoteUnit: 'usd' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.30, change: 15.20, changePercent: 1.77, volume: 41567800, high: 880.50, low: 858.00, open: 860.10, previousClose: 860.10, marketCap: 2160000000000, sector: 'Technology', assetClass: 'stock', quoteUnit: 'usd' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.80, change: -5.60, changePercent: -2.23, volume: 98765400, high: 252.30, low: 244.10, open: 251.40, previousClose: 251.40, marketCap: 780000000000, sector: 'Consumer Cyclical', assetClass: 'stock', quoteUnit: 'usd' },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 505.20, change: 8.40, changePercent: 1.69, volume: 18234500, high: 508.90, low: 496.70, open: 496.80, previousClose: 496.80, marketCap: 1290000000000, sector: 'Technology', assetClass: 'stock', quoteUnit: 'usd' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 198.40, change: 1.80, changePercent: 0.92, volume: 8567300, high: 199.20, low: 196.50, open: 196.60, previousClose: 196.60, marketCap: 571000000000, sector: 'Financial Services', assetClass: 'stock', quoteUnit: 'usd' },
  { symbol: 'V', name: 'Visa Inc.', price: 280.90, change: 0.60, changePercent: 0.21, volume: 6234500, high: 281.80, low: 279.50, open: 280.30, previousClose: 280.30, marketCap: 577000000000, sector: 'Financial Services', assetClass: 'stock', quoteUnit: 'usd' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 156.30, change: -0.40, changePercent: -0.26, volume: 7345600, high: 157.10, low: 155.80, open: 156.70, previousClose: 156.70, marketCap: 377000000000, sector: 'Healthcare', assetClass: 'stock', quoteUnit: 'usd' },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 165.20, change: 1.10, changePercent: 0.67, volume: 5678900, high: 165.90, low: 163.80, open: 164.10, previousClose: 164.10, marketCap: 445000000000, sector: 'Consumer Defensive', assetClass: 'stock', quoteUnit: 'usd' },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', price: 104.50, change: -1.30, changePercent: -1.23, volume: 12345600, high: 106.20, low: 104.10, open: 105.80, previousClose: 105.80, marketCap: 438000000000, sector: 'Energy', assetClass: 'stock', quoteUnit: 'usd' },
  { symbol: 'PM-TRUMP-2028', name: 'Prediction: Trump wins 2028 election', price: 0.43, change: 0.03, changePercent: 7.50, volume: 2840000, high: 0.45, low: 0.39, open: 0.40, previousClose: 0.40, sector: 'Prediction Markets', assetClass: 'prediction', quoteUnit: 'cents' },
  { symbol: 'PM-BTC-150K', name: 'Prediction: BTC above $150k this year', price: 0.31, change: -0.02, changePercent: -6.06, volume: 1910000, high: 0.34, low: 0.30, open: 0.33, previousClose: 0.33, sector: 'Prediction Markets', assetClass: 'prediction', quoteUnit: 'cents' },
  { symbol: 'PM-ETH-ETF', name: 'Prediction: Spot ETH ETF inflows beat expectations', price: 0.58, change: 0.04, changePercent: 7.41, volume: 1260000, high: 0.60, low: 0.53, open: 0.54, previousClose: 0.54, sector: 'Prediction Markets', assetClass: 'prediction', quoteUnit: 'cents' },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', price: 1.0874, change: 0.0042, changePercent: 0.39, volume: 89500000, high: 1.0901, low: 1.0829, open: 1.0832, previousClose: 1.0832, sector: 'Forex', assetClass: 'forex', quoteUnit: 'rate' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', price: 1.2748, change: 0.0031, changePercent: 0.24, volume: 68400000, high: 1.2782, low: 1.2706, open: 1.2717, previousClose: 1.2717, sector: 'Forex', assetClass: 'forex', quoteUnit: 'rate' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', price: 149.62, change: -0.71, changePercent: -0.47, volume: 74300000, high: 150.31, low: 149.28, open: 150.33, previousClose: 150.33, sector: 'Forex', assetClass: 'forex', quoteUnit: 'rate' },
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', price: 97250.00, change: 1850.00, changePercent: 1.94, volume: 32650000000, high: 98140.00, low: 95120.00, open: 95400.00, previousClose: 95400.00, marketCap: 1920000000000, sector: 'Crypto', assetClass: 'crypto', quoteUnit: 'usd' },
  { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', price: 3580.00, change: 96.00, changePercent: 2.76, volume: 18440000000, high: 3624.00, low: 3462.00, open: 3484.00, previousClose: 3484.00, marketCap: 430000000000, sector: 'Crypto', assetClass: 'crypto', quoteUnit: 'usd' },
  { symbol: 'SOLUSD', name: 'Solana / US Dollar', price: 208.40, change: 11.20, changePercent: 5.68, volume: 3920000000, high: 212.90, low: 194.10, open: 197.20, previousClose: 197.20, marketCap: 98000000000, sector: 'Crypto', assetClass: 'crypto', quoteUnit: 'usd' },
];

function generateCandles(stock: Stock, days: number): CandleData[] {
  const candles: CandleData[] = [];
  let price = stock.price * 0.85;
  const now = new Date();
  const volatility = stock.assetClass === 'crypto' ? 0.045 : stock.assetClass === 'prediction' ? 0.06 : stock.assetClass === 'forex' ? 0.008 : 0.02;
  const highWick = stock.assetClass === 'forex' ? 0.003 : stock.assetClass === 'prediction' ? 0.04 : 0.01;
  const lowWick = stock.assetClass === 'forex' ? 0.003 : stock.assetClass === 'prediction' ? 0.04 : 0.01;
  const precision = stock.quoteUnit === 'rate' ? 4 : 2;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    if (stock.assetClass !== 'crypto' && stock.assetClass !== 'prediction' && (date.getDay() === 0 || date.getDay() === 6)) continue;

    const drift = (stock.price - price) * 0.005;
    const change = price * volatility * (Math.random() - 0.48) + drift;
    const open = price;
    const rawClose = price + change;
    const close = stock.assetClass === 'prediction' ? Math.min(0.99, Math.max(0.01, rawClose)) : Math.max(0.0001, rawClose);
    const high = Math.max(open, close) * (1 + Math.random() * highWick);
    const lowBase = Math.min(open, close) * (1 - Math.random() * lowWick);
    const low = stock.assetClass === 'prediction' ? Math.max(0.01, lowBase) : Math.max(0.0001, lowBase);
    const volume = Math.floor(5000000 + Math.random() * 50000000);

    candles.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(precision)),
      high: parseFloat(high.toFixed(precision)),
      low: parseFloat(low.toFixed(precision)),
      close: parseFloat(close.toFixed(precision)),
      volume,
    });

    price = close;
  }

  return candles;
}

const candleCache: Record<string, CandleData[]> = {};

export function getStockCandles(symbol: string, days = 180, instrument?: Stock): CandleData[] {
  const key = `${symbol}-${days}-${instrument?.price || 'default'}`;
  if (!candleCache[key]) {
    const stock = instrument || STOCKS.find(s => s.symbol === symbol);
    candleCache[key] = generateCandles(stock || { symbol: symbol, name: symbol, price: 100, change: 0, changePercent: 0, volume: 0, high: 100, low: 100, open: 100, previousClose: 100, assetClass: 'stock', quoteUnit: 'usd' }, days);
  }
  return candleCache[key];
}
