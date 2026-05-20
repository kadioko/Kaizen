import { buildCommanderAnalytics } from './analytics';
import { JournalRecord } from './types';

const records: JournalRecord[] = [
  {
    id: '1',
    date: '2026-05-20T13:00:00Z',
    instrument: 'MNQ',
    session: 'New York AM',
    setupType: 'Seller Absorption Long',
    direction: 'Long',
    entry: 100,
    stop: 99,
    tp1: 102,
    tp2: 103,
    exit: 102,
    resultR: 2,
    profitLoss: 300,
    notes: '',
    lessons: '',
    mistakeTags: ['good execution'],
  },
  {
    id: '2',
    date: '2026-05-19T13:00:00Z',
    instrument: 'MES',
    session: 'London',
    setupType: 'Buyer Absorption Short',
    direction: 'Short',
    entry: 4000,
    stop: 4005,
    tp1: 3990,
    tp2: 3986,
    exit: 4005,
    resultR: -1,
    profitLoss: -125,
    notes: '',
    lessons: '',
    mistakeTags: ['chased', 'moved stop'],
  },
  {
    id: '3',
    date: '2026-05-18T13:00:00Z',
    instrument: 'GC',
    session: 'Asia',
    setupType: 'Bullish Continuation',
    direction: 'Long',
    entry: 2400,
    stop: 2398,
    tp1: 2404,
    tp2: 2408,
    exit: 2404,
    resultR: 1.5,
    profitLoss: 180,
    notes: '',
    lessons: '',
    mistakeTags: ['good execution'],
  },
];

describe('buildCommanderAnalytics', () => {
  it('builds summary, grouped performance, and rolling windows', () => {
    const analytics = buildCommanderAnalytics(records);

    expect(analytics.summary.totalTrades).toBe(3);
    expect(analytics.summary.winRate).toBeCloseTo(66.67, 1);
    expect(analytics.summary.averageR).toBeCloseTo(0.83, 1);
    expect(analytics.summary.profitFactor).toBeCloseTo(3.84, 2);
    expect(analytics.summary.bestSetupType).toBe('Seller Absorption Long');
    expect(analytics.summary.worstSetupType).toBe('Buyer Absorption Short');

    expect(analytics.byDirection.find((bucket) => bucket.label === 'Long')?.trades).toBe(2);
    expect(analytics.bySession.find((bucket) => bucket.label === 'London')?.averageR).toBe(-1);
    expect(analytics.mistakeFrequency[0]).toEqual({ tag: 'good execution', count: 2 });
    expect(analytics.rollingWindows[0].trades).toBe(3);
    expect(analytics.instrumentHeatmap.find((row) => row.instrument === 'MNQ')?.averageR).toBe(2);
  });

  it('returns empty-safe defaults when no records exist', () => {
    const analytics = buildCommanderAnalytics([]);

    expect(analytics.summary.totalTrades).toBe(0);
    expect(analytics.summary.bestSetupType).toBe('N/A');
    expect(analytics.bySetupType).toHaveLength(0);
    expect(analytics.mistakeFrequency).toHaveLength(0);
    expect(analytics.rollingWindows[0].trades).toBe(0);
  });
});
