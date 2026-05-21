import { generateId } from '../utils/helpers';
import { instrumentConfig, seedLevels, seedRows } from './constants';
import { CommanderWorkspaceState, JournalDraft, NewsEvent, SetupPlaybook, SetupTemplate } from './types';

export const defaultJournalDraft: JournalDraft = {
  exit: '',
  resultR: '',
  profitLoss: '',
  notes: '',
  lessons: '',
  mistakeTags: [],
  screenshotAnnotation: '',
};

export const defaultScoreWeights = {
  context: 20,
  level: 20,
  delta: 25,
  alignment: 15,
  reward: 10,
  session: 10,
};

export const seedSetupTemplates: SetupTemplate[] = [
  {
    id: generateId(),
    name: 'NY AM Momentum',
    instrument: 'MNQ',
    session: 'New York AM',
    bias: 'Bullish',
    riskContext: 'Risk-On',
    newsRisk: false,
    minimumScore: 75,
    notes: 'Use for opening-drive continuation or clean acceptance above VWAP and demand.',
  },
  {
    id: generateId(),
    name: 'London Fade Framework',
    instrument: 'Any',
    session: 'London',
    bias: 'Neutral',
    riskContext: 'Balanced',
    newsRisk: false,
    minimumScore: 70,
    notes: 'Wait for extremes into value and require absorption before engaging.',
  },
];

export const seedPlaybooks: SetupPlaybook[] = [
  {
    id: generateId(),
    setupType: 'Seller Absorption Long',
    name: 'Absorption Bounce',
    checklist: 'Demand or VAL nearby; heavy negative delta; price fails lower; reclaim high; risk >= 1.5R.',
    executionNotes: 'Do not chase the first pop. Let the reclaim print and use the absorption low as invalidation.',
    favorite: true,
  },
  {
    id: generateId(),
    setupType: 'Bearish Continuation',
    name: 'Retest Failure',
    checklist: 'Bias bearish; resistance retest fails; delta turns negative again; volume confirms.',
    executionNotes: 'Prioritize clean retests and avoid shorting extension into support.',
    favorite: false,
  },
];

export const seedNewsEvents: NewsEvent[] = [
  {
    id: generateId(),
    title: 'CPI release watch',
    timestamp: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    instrument: 'All',
    session: 'New York AM',
    impact: 'High',
    notes: 'Stand aside or reduce size 15 to 30 minutes around the release.',
  },
];

export function createDefaultCommanderState(): CommanderWorkspaceState {
  return {
    selectedInstrument: 'MNQ',
    session: 'New York AM',
    bias: 'Bullish',
    riskContext: 'Balanced',
    manualPrice: '18945.50',
    newsRisk: false,
    levels: seedLevels,
    orderFlowRows: seedRows,
    riskInputs: {
      accountSize: '25000',
      riskPercent: '1',
      tickValue: String(instrumentConfig.MNQ.defaultTickValue),
    },
    scoreWeights: defaultScoreWeights,
    minimumScore: 70,
    setupTemplates: seedSetupTemplates,
    playbooks: seedPlaybooks,
    newsEvents: seedNewsEvents,
    journalDraft: defaultJournalDraft,
    journalRecords: [],
  };
}
