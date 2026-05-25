import { CommanderDirection, CommanderInstrument, CommanderSession, JournalRecord, MistakeTag, SetupType } from './types';

export interface CommanderPerformanceBucket {
  label: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  averageR: number;
  totalR: number;
  profitLoss: number;
}

export interface CommanderAnalyticsSummary {
  totalTrades: number;
  winRate: number;
  averageR: number;
  profitFactor: number;
  totalProfitLoss: number;
  bestSetupType: string;
  worstSetupType: string;
}

export interface CommanderRollingSummary {
  label: string;
  trades: number;
  winRate: number;
  averageR: number;
  profitLoss: number;
}

export interface CommanderInstrumentHeatmapRow {
  instrument: CommanderInstrument;
  longTrades: number;
  shortTrades: number;
  totalTrades: number;
  averageR: number;
}

export interface CommanderAnalytics {
  summary: CommanderAnalyticsSummary;
  bySetupType: CommanderPerformanceBucket[];
  bySession: CommanderPerformanceBucket[];
  byInstrument: CommanderPerformanceBucket[];
  byDirection: CommanderPerformanceBucket[];
  mistakeFrequency: { tag: MistakeTag; count: number }[];
  rollingWindows: CommanderRollingSummary[];
  instrumentHeatmap: CommanderInstrumentHeatmapRow[];
}

const setupTypes: SetupType[] = [
  'Seller Absorption Long',
  'Buyer Absorption Short',
  'Bullish Continuation',
  'Bearish Continuation',
  'No Trade',
];

const sessions: CommanderSession[] = ['London', 'New York AM', 'New York PM', 'Asia'];
const instruments: CommanderInstrument[] = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'XAUUSD', 'MNQ', 'MES', 'GC'];
const directions: CommanderDirection[] = ['Long', 'Short'];

function buildBucket(label: string, records: JournalRecord[]): CommanderPerformanceBucket {
  const trades = records.length;
  const wins = records.filter((record) => record.resultR > 0).length;
  const losses = records.filter((record) => record.resultR < 0).length;
  const totalR = records.reduce((sum, record) => sum + record.resultR, 0);
  const profitLoss = records.reduce((sum, record) => sum + record.profitLoss, 0);

  return {
    label,
    trades,
    wins,
    losses,
    winRate: trades > 0 ? (wins / trades) * 100 : 0,
    averageR: trades > 0 ? totalR / trades : 0,
    totalR,
    profitLoss,
  };
}

function buildBuckets<TLabel extends string>(
  labels: readonly TLabel[],
  records: JournalRecord[],
  getLabel: (record: JournalRecord) => TLabel
): CommanderPerformanceBucket[] {
  return labels
    .map((label) => buildBucket(label, records.filter((record) => getLabel(record) === label)))
    .filter((bucket) => bucket.trades > 0);
}

function buildRollingWindow(label: string, limit: number, records: JournalRecord[]): CommanderRollingSummary {
  const windowRecords = records.slice(0, limit);
  const bucket = buildBucket(label, windowRecords);

  return {
    label,
    trades: bucket.trades,
    winRate: bucket.winRate,
    averageR: bucket.averageR,
    profitLoss: bucket.profitLoss,
  };
}

export function buildCommanderAnalytics(journalRecords: JournalRecord[]): CommanderAnalytics {
  const sortedRecords = [...journalRecords].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
  );
  const totalTrades = sortedRecords.length;
  const wins = sortedRecords.filter((record) => record.resultR > 0);
  const losses = sortedRecords.filter((record) => record.resultR < 0);
  const grossProfit = wins.reduce((sum, record) => sum + record.profitLoss, 0);
  const grossLoss = Math.abs(losses.reduce((sum, record) => sum + record.profitLoss, 0));
  const bySetupType = buildBuckets(setupTypes, sortedRecords, (record) => record.setupType);
  const summaryBestSetup = [...bySetupType].sort((left, right) => right.averageR - left.averageR)[0]?.label ?? 'N/A';
  const summaryWorstSetup = [...bySetupType].sort((left, right) => left.averageR - right.averageR)[0]?.label ?? 'N/A';
  const byDirection = buildBuckets(directions, sortedRecords, (record) => record.direction).sort(
    (left, right) => right.trades - left.trades
  );

  return {
    summary: {
      totalTrades,
      winRate: totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0,
      averageR: totalTrades > 0 ? sortedRecords.reduce((sum, record) => sum + record.resultR, 0) / totalTrades : 0,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? grossProfit : 0,
      totalProfitLoss: sortedRecords.reduce((sum, record) => sum + record.profitLoss, 0),
      bestSetupType: summaryBestSetup,
      worstSetupType: summaryWorstSetup,
    },
    bySetupType,
    bySession: buildBuckets(sessions, sortedRecords, (record) => record.session).sort(
      (left, right) => right.averageR - left.averageR
    ),
    byInstrument: buildBuckets(instruments, sortedRecords, (record) => record.instrument).sort(
      (left, right) => right.averageR - left.averageR
    ),
    byDirection,
    mistakeFrequency: Array.from(
      sortedRecords.reduce<Map<MistakeTag, number>>((accumulator, record) => {
        record.mistakeTags.forEach((tag) => {
          accumulator.set(tag, (accumulator.get(tag) ?? 0) + 1);
        });
        return accumulator;
      }, new Map()).entries()
    )
      .map(([tag, count]) => ({ tag, count }))
      .sort((left, right) => right.count - left.count),
    rollingWindows: [
      buildRollingWindow('Last 10 trades', 10, sortedRecords),
      buildRollingWindow('Last 30 trades', 30, sortedRecords),
    ],
    instrumentHeatmap: instruments.map((instrument) => {
      const instrumentRecords = sortedRecords.filter((record) => record.instrument === instrument);
      const longTrades = instrumentRecords.filter((record) => record.direction === 'Long').length;
      const shortTrades = instrumentRecords.filter((record) => record.direction === 'Short').length;
      const totalInstrumentTrades = instrumentRecords.length;

      return {
        instrument,
        longTrades,
        shortTrades,
        totalTrades: totalInstrumentTrades,
        averageR:
          totalInstrumentTrades > 0
            ? instrumentRecords.reduce((sum, record) => sum + record.resultR, 0) / totalInstrumentTrades
            : 0,
      };
    }),
  };
}
