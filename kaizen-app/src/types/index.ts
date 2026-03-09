export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  sector?: string;
  assetClass?: 'stock' | 'prediction' | 'forex' | 'crypto';
  quoteUnit?: 'usd' | 'cents' | 'rate';
}

export interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Position {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  entryDate: string;
  type: 'long' | 'short';
}

export interface Trade {
  id: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  total: number;
  date: string;
  notes?: string;
  strategy?: string;
  emotion?: 'confident' | 'fearful' | 'greedy' | 'neutral' | 'fomo';
}

export interface JournalEntry {
  id: string;
  date: string;
  trades: Trade[];
  notes: string;
  lessonsLearned: string;
  rating: 1 | 2 | 3 | 4 | 5;
  followedPlan: boolean;
}

export interface Alert {
  id: string;
  symbol: string;
  type: 'price_above' | 'price_below' | 'volume_spike' | 'rsi_overbought' | 'rsi_oversold' | 'macd_cross';
  value: number;
  active: boolean;
  triggered: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface PortfolioRisk {
  totalValue: number;
  cashBalance: number;
  investedAmount: number;
  concentrationScore: number;
  diversificationScore: number;
  volatilityScore: number;
  overallRiskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  recommendations: string[];
}

export interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'risk-management' | 'psychology' | 'strategy' | 'technical-analysis' | 'fundamentals';
  readTime: number;
  date: string;
  author: string;
}
