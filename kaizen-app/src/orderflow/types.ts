export type CommanderInstrument = 'MNQ' | 'MES' | 'GC';
export type CommanderSession = 'London' | 'New York AM' | 'New York PM' | 'Asia';
export type CommanderBias = 'Bullish' | 'Bearish' | 'Neutral';
export type CommanderStatus = 'No Trade' | 'Watching' | 'Setup Forming' | 'Ready' | 'In Trade' | 'Trade Complete';
export type RiskContext = 'Risk-On' | 'Risk-Off' | 'Balanced';
export type LevelType =
  | 'Demand'
  | 'Supply'
  | 'VWAP'
  | 'POC'
  | 'VAH'
  | 'VAL'
  | 'Premarket imbalance'
  | 'Previous day high'
  | 'Previous day low'
  | 'Overnight high'
  | 'Overnight low'
  | 'Initial balance high'
  | 'Initial balance low';
export type Timeframe = 'M1' | 'M3' | 'M5';
export type SetupType =
  | 'Seller Absorption Long'
  | 'Buyer Absorption Short'
  | 'Bullish Continuation'
  | 'Bearish Continuation'
  | 'No Trade';
export type CommanderDirection = 'Long' | 'Short' | 'No Trade';
export type MistakeTag =
  | 'chased'
  | 'entered before confirmation'
  | 'ignored bias'
  | 'bad level'
  | 'moved stop'
  | 'revenge trade'
  | 'exited early'
  | 'good execution';
export type LevelFilter = 'active' | 'inactive' | 'all';

export interface CommanderLevel {
  id: string;
  instrument: CommanderInstrument;
  price: number;
  type: LevelType;
  strength: 1 | 2 | 3 | 4 | 5;
  notes: string;
  active: boolean;
}

export interface OrderFlowRow {
  id: string;
  timestamp: string;
  instrument: CommanderInstrument;
  timeframe: Timeframe;
  open: number;
  high: number;
  low: number;
  close: number;
  delta: number;
  deltaChange: number;
  volume: number;
  cumulativeDelta: number;
  aggressiveBuyersObserved: boolean;
  aggressiveSellersObserved: boolean;
  priceContinuedAfterAggression: boolean;
  notes: string;
  source: 'manual' | 'csv';
}

export interface CommanderScoreBreakdown {
  context: number;
  level: number;
  delta: number;
  alignment: number;
  reward: number;
  session: number;
}

export interface CommanderPlan {
  direction: CommanderDirection;
  setupType: SetupType;
  score: number;
  scoreBreakdown: CommanderScoreBreakdown;
  grade: 'A-grade' | 'Good' | 'Weak' | 'No trade';
  status: CommanderStatus;
  entry: number | null;
  stop: number | null;
  tp1: number | null;
  tp2: number | null;
  riskReward: number;
  validReasons: string[];
  skipReasons: string[];
  invalidation: string;
  entryTrigger: string;
  activeLevel: CommanderLevel | null;
}

export interface JournalRecord {
  id: string;
  date: string;
  instrument: CommanderInstrument;
  session: CommanderSession;
  setupType: SetupType;
  direction: CommanderDirection;
  entry: number;
  stop: number;
  tp1: number;
  tp2: number;
  exit: number;
  resultR: number;
  profitLoss: number;
  notes: string;
  lessons: string;
  mistakeTags: MistakeTag[];
}

export interface RiskMetrics {
  tickValue: number;
  accountSize: number;
  riskPercent: number;
  riskBudget: number;
  riskPerContract: number;
  maxContracts: number;
  totalRisk: number;
  rewardTp1: number;
  rewardTp2: number;
  rMultiple: number;
}
