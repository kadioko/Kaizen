export type CommanderInstrument =
  | 'EURUSD'
  | 'GBPUSD'
  | 'USDJPY'
  | 'USDCHF'
  | 'AUDUSD'
  | 'USDCAD'
  | 'NZDUSD'
  | 'XAUUSD'
  | 'MNQ'
  | 'MES'
  | 'GC';
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
export type NewsImpact = 'Low' | 'Medium' | 'High';

export interface CommanderScoreWeights {
  context: number;
  level: number;
  delta: number;
  alignment: number;
  reward: number;
  session: number;
}

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

export interface SetupTemplate {
  id: string;
  name: string;
  instrument: CommanderInstrument | 'Any';
  session: CommanderSession | 'Any';
  bias: CommanderBias;
  riskContext: RiskContext;
  newsRisk: boolean;
  minimumScore: number;
  notes: string;
}

export interface SetupPlaybook {
  id: string;
  setupType: Exclude<SetupType, 'No Trade'>;
  name: string;
  checklist: string;
  executionNotes: string;
  favorite: boolean;
}

export interface NewsEvent {
  id: string;
  title: string;
  timestamp: string;
  instrument: CommanderInstrument | 'All';
  session: CommanderSession | 'All';
  impact: NewsImpact;
  notes: string;
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
  screenshotName?: string;
  screenshotDataUrl?: string;
  screenshotAnnotation?: string;
}

export interface JournalDraft {
  exit: string;
  resultR: string;
  profitLoss: string;
  notes: string;
  lessons: string;
  mistakeTags: MistakeTag[];
  screenshotName?: string;
  screenshotDataUrl?: string;
  screenshotAnnotation: string;
}

export interface CommanderRiskInputs {
  accountSize: string;
  riskPercent: string;
  tickValue: string;
}

export interface CommanderWorkspaceState {
  selectedInstrument: CommanderInstrument;
  session: CommanderSession;
  bias: CommanderBias;
  riskContext: RiskContext;
  manualPrice: string;
  newsRisk: boolean;
  levels: CommanderLevel[];
  orderFlowRows: OrderFlowRow[];
  riskInputs: CommanderRiskInputs;
  scoreWeights: CommanderScoreWeights;
  minimumScore: number;
  setupTemplates: SetupTemplate[];
  playbooks: SetupPlaybook[];
  newsEvents: NewsEvent[];
  journalDraft: JournalDraft;
  journalRecords: JournalRecord[];
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
