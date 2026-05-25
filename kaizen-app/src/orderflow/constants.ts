import { generateId } from '../utils/helpers';
import { CommanderInstrument, CommanderLevel, LevelType, MistakeTag, OrderFlowRow } from './types';

export const commanderInstrumentOptions: CommanderInstrument[] = [
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'USDCHF',
  'AUDUSD',
  'USDCAD',
  'NZDUSD',
  'XAUUSD',
  'MNQ',
  'MES',
  'GC',
];

export const instrumentConfig: Record<CommanderInstrument, { tickSize: number; defaultTickValue: number; proximityThreshold: number; priceDecimals: number; market: 'forex' | 'metal' | 'futures' }> = {
  EURUSD: { tickSize: 0.0001, defaultTickValue: 10, proximityThreshold: 0.0015, priceDecimals: 5, market: 'forex' },
  GBPUSD: { tickSize: 0.0001, defaultTickValue: 10, proximityThreshold: 0.0018, priceDecimals: 5, market: 'forex' },
  USDJPY: { tickSize: 0.01, defaultTickValue: 9.1, proximityThreshold: 0.18, priceDecimals: 3, market: 'forex' },
  USDCHF: { tickSize: 0.0001, defaultTickValue: 10.5, proximityThreshold: 0.0015, priceDecimals: 5, market: 'forex' },
  AUDUSD: { tickSize: 0.0001, defaultTickValue: 10, proximityThreshold: 0.0012, priceDecimals: 5, market: 'forex' },
  USDCAD: { tickSize: 0.0001, defaultTickValue: 10, proximityThreshold: 0.0014, priceDecimals: 5, market: 'forex' },
  NZDUSD: { tickSize: 0.0001, defaultTickValue: 10, proximityThreshold: 0.0012, priceDecimals: 5, market: 'forex' },
  XAUUSD: { tickSize: 0.01, defaultTickValue: 1, proximityThreshold: 1.8, priceDecimals: 2, market: 'metal' },
  MNQ: { tickSize: 0.25, defaultTickValue: 0.5, proximityThreshold: 8, priceDecimals: 2, market: 'futures' },
  MES: { tickSize: 0.25, defaultTickValue: 1.25, proximityThreshold: 4, priceDecimals: 2, market: 'futures' },
  GC: { tickSize: 0.1, defaultTickValue: 10, proximityThreshold: 2, priceDecimals: 2, market: 'futures' },
};

export const levelTypes: LevelType[] = [
  'Demand',
  'Supply',
  'VWAP',
  'POC',
  'VAH',
  'VAL',
  'Premarket imbalance',
  'Previous day high',
  'Previous day low',
  'Overnight high',
  'Overnight low',
  'Initial balance high',
  'Initial balance low',
];

export const mistakeTags: MistakeTag[] = [
  'chased',
  'entered before confirmation',
  'ignored bias',
  'bad level',
  'moved stop',
  'revenge trade',
  'exited early',
  'good execution',
];

export const supportTypes: LevelType[] = ['Demand', 'VAL', 'VWAP', 'POC', 'Previous day low', 'Overnight low', 'Initial balance low'];
export const resistanceTypes: LevelType[] = ['Supply', 'VAH', 'Premarket imbalance', 'VWAP', 'POC', 'Previous day high', 'Overnight high', 'Initial balance high'];

export const seedLevels: CommanderLevel[] = [
  { id: generateId(), instrument: 'EURUSD', price: 1.0812, type: 'Demand', strength: 5, notes: 'London demand from prior sweep and reclaim.', active: true },
  { id: generateId(), instrument: 'EURUSD', price: 1.0846, type: 'Supply', strength: 4, notes: 'NY AM supply and prior intraday failure.', active: true },
  { id: generateId(), instrument: 'GBPUSD', price: 1.2748, type: 'VAL', strength: 4, notes: 'Value low and Asian range support.', active: true },
  { id: generateId(), instrument: 'GBPUSD', price: 1.2794, type: 'VAH', strength: 3, notes: 'Value high into London expansion target.', active: true },
  { id: generateId(), instrument: 'XAUUSD', price: 2334.2, type: 'VWAP', strength: 4, notes: 'Session VWAP reclaim zone for gold.', active: true },
  { id: generateId(), instrument: 'XAUUSD', price: 2342.8, type: 'Previous day high', strength: 4, notes: 'Prior day high reference for continuation or fade.', active: true },
];

export const seedRows: OrderFlowRow[] = [
  { id: generateId(), timestamp: '2026-05-25T07:30:00Z', instrument: 'EURUSD', timeframe: 'M1', open: 1.0814, high: 1.0818, low: 1.0811, close: 1.0817, delta: -128, deltaChange: 52, volume: 546, cumulativeDelta: 3210, aggressiveBuyersObserved: false, aggressiveSellersObserved: true, priceContinuedAfterAggression: false, notes: 'Sellers hit demand and failed to extend lower.', source: 'csv' },
  { id: generateId(), timestamp: '2026-05-25T07:33:00Z', instrument: 'EURUSD', timeframe: 'M3', open: 1.0817, high: 1.0823, low: 1.0815, close: 1.0821, delta: 82, deltaChange: 210, volume: 618, cumulativeDelta: 3292, aggressiveBuyersObserved: true, aggressiveSellersObserved: false, priceContinuedAfterAggression: true, notes: 'Positive response after absorption.', source: 'csv' },
  { id: generateId(), timestamp: '2026-05-25T08:15:00Z', instrument: 'GBPUSD', timeframe: 'M5', open: 1.2764, high: 1.2771, low: 1.2758, close: 1.276, delta: -94, deltaChange: -239, volume: 775, cumulativeDelta: 1090, aggressiveBuyersObserved: false, aggressiveSellersObserved: true, priceContinuedAfterAggression: true, notes: 'London continuation lower from value edge.', source: 'csv' },
  { id: generateId(), timestamp: '2026-05-25T14:10:00Z', instrument: 'XAUUSD', timeframe: 'M1', open: 2336.7, high: 2338.3, low: 2336.4, close: 2338.1, delta: 178, deltaChange: 241, volume: 598, cumulativeDelta: 822, aggressiveBuyersObserved: true, aggressiveSellersObserved: false, priceContinuedAfterAggression: true, notes: 'Bullish continuation from VWAP hold on gold.', source: 'csv' },
];
