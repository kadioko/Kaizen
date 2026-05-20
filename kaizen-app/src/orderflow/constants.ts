import { generateId } from '../utils/helpers';
import { CommanderInstrument, CommanderLevel, LevelType, MistakeTag, OrderFlowRow } from './types';

export const instrumentConfig: Record<CommanderInstrument, { tickSize: number; defaultTickValue: number; proximityThreshold: number }> = {
  MNQ: { tickSize: 0.25, defaultTickValue: 0.5, proximityThreshold: 8 },
  MES: { tickSize: 0.25, defaultTickValue: 1.25, proximityThreshold: 4 },
  GC: { tickSize: 0.1, defaultTickValue: 10, proximityThreshold: 2 },
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
  { id: generateId(), instrument: 'MNQ', price: 18942.5, type: 'Demand', strength: 5, notes: 'Composite demand from NY AM pullback.', active: true },
  { id: generateId(), instrument: 'MNQ', price: 18958.25, type: 'Supply', strength: 4, notes: 'Overhead supply into prior failure.', active: true },
  { id: generateId(), instrument: 'MES', price: 5310.25, type: 'VAL', strength: 4, notes: 'Value area low and support confluence.', active: true },
  { id: generateId(), instrument: 'MES', price: 5314.75, type: 'VAH', strength: 3, notes: 'Value area high overhead target.', active: true },
  { id: generateId(), instrument: 'GC', price: 2417.4, type: 'VWAP', strength: 3, notes: 'Session VWAP reclaim zone.', active: true },
  { id: generateId(), instrument: 'GC', price: 2421.3, type: 'Previous day high', strength: 4, notes: 'Prior day reference for target or fade.', active: true },
];

export const seedRows: OrderFlowRow[] = [
  { id: generateId(), timestamp: '2026-05-20T07:30:00Z', instrument: 'MNQ', timeframe: 'M1', open: 18942.25, high: 18944, low: 18940.75, close: 18943.5, delta: -128, deltaChange: -44, volume: 546, cumulativeDelta: 3210, aggressiveBuyersObserved: false, aggressiveSellersObserved: true, priceContinuedAfterAggression: false, notes: 'Sellers hit demand and price held.', source: 'csv' },
  { id: generateId(), timestamp: '2026-05-20T07:31:00Z', instrument: 'MNQ', timeframe: 'M3', open: 18943.5, high: 18946, low: 18942.75, close: 18945.5, delta: 82, deltaChange: 210, volume: 618, cumulativeDelta: 3292, aggressiveBuyersObserved: true, aggressiveSellersObserved: false, priceContinuedAfterAggression: true, notes: 'Positive response after absorption.', source: 'csv' },
  { id: generateId(), timestamp: '2026-05-20T13:38:00Z', instrument: 'MES', timeframe: 'M5', open: 5311, high: 5311.5, low: 5309.75, close: 5310, delta: -94, deltaChange: -239, volume: 775, cumulativeDelta: 1090, aggressiveBuyersObserved: false, aggressiveSellersObserved: true, priceContinuedAfterAggression: true, notes: 'Momentum continuation lower.', source: 'csv' },
  { id: generateId(), timestamp: '2026-05-20T14:10:00Z', instrument: 'GC', timeframe: 'M1', open: 2418.7, high: 2420.3, low: 2418.4, close: 2420.1, delta: 178, deltaChange: 241, volume: 598, cumulativeDelta: 822, aggressiveBuyersObserved: true, aggressiveSellersObserved: false, priceContinuedAfterAggression: true, notes: 'Bullish continuation from VWAP hold.', source: 'csv' },
];
