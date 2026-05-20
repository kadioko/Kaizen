import { buildCommanderPlan } from './setupEngine';
import { CommanderLevel, OrderFlowRow } from './types';

const levels: CommanderLevel[] = [
  { id: 'support', instrument: 'MNQ', price: 100, type: 'Demand', strength: 5, notes: '', active: true },
  { id: 'target', instrument: 'MNQ', price: 104, type: 'Supply', strength: 4, notes: '', active: true },
];

const rows: OrderFlowRow[] = [
  {
    id: 'm1',
    timestamp: '2026-05-20T07:31:00Z',
    instrument: 'MNQ',
    timeframe: 'M1',
    open: 100,
    high: 101,
    low: 99.5,
    close: 100.5,
    delta: -160,
    deltaChange: 90,
    volume: 700,
    cumulativeDelta: 1000,
    aggressiveBuyersObserved: false,
    aggressiveSellersObserved: true,
    priceContinuedAfterAggression: false,
    notes: '',
    source: 'manual',
  },
  {
    id: 'm3',
    timestamp: '2026-05-20T07:30:00Z',
    instrument: 'MNQ',
    timeframe: 'M3',
    open: 100,
    high: 101,
    low: 99.5,
    close: 100.5,
    delta: 80,
    deltaChange: 80,
    volume: 650,
    cumulativeDelta: 1080,
    aggressiveBuyersObserved: true,
    aggressiveSellersObserved: false,
    priceContinuedAfterAggression: true,
    notes: '',
    source: 'manual',
  },
];

describe('buildCommanderPlan', () => {
  it('detects seller absorption long near support', () => {
    const plan = buildCommanderPlan({
      bias: 'Bullish',
      session: 'New York AM',
      riskContext: 'Balanced',
      newsRisk: false,
      currentPrice: 100.5,
      levels,
      rows,
      tickSize: 0.25,
      proximityThreshold: 2,
    });

    expect(plan.direction).toBe('Long');
    expect(plan.setupType).toBe('Seller Absorption Long');
    expect(plan.entry).toBe(101.25);
    expect(plan.stop).toBe(99);
    expect(plan.score).toBeGreaterThanOrEqual(70);
  });

  it('returns no trade when no rows are loaded', () => {
    const plan = buildCommanderPlan({
      bias: 'Bullish',
      session: 'New York AM',
      riskContext: 'Balanced',
      newsRisk: false,
      currentPrice: 100.5,
      levels,
      rows: [],
      tickSize: 0.25,
      proximityThreshold: 2,
    });

    expect(plan.direction).toBe('No Trade');
    expect(plan.skipReasons).toContain('No order-flow rows are loaded for the selected instrument.');
  });
});
