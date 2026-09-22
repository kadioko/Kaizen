import type { Direction, Strength } from './types';
import type { LiveSpotBar, LiveSpotMarket } from './live-spot';

export interface LivePriceActionLayer {
  direction: Direction;
  score: number;
  strength: Strength;
  summary: string;
  evidence: Record<string, number | string | boolean>;
}

export interface LivePriceLevel {
  id: string;
  type: string;
  price: number;
  strength: Strength;
  touches: number;
  distance: number;
}

export interface LivePriceActionEvent {
  id: string;
  timestamp: number;
  severity: 'INFO' | 'WATCH' | 'HIGH';
  title: string;
  description: string;
}

export interface LivePriceActionAnalysis {
  state: 'SCANNING' | 'WATCHING' | 'RANGE_REJECTION' | 'RANGE_ACCEPTANCE' | 'CONFIRMING';
  direction: Direction;
  strength: Strength;
  score: number;
  alignment: 'STRUCTURE_AND_RANGE_ALIGNED' | 'STRUCTURE_ONLY' | 'RANGE_EVENT_ONLY' | 'MIXED_PRICE_ACTION';
  structure: LivePriceActionLayer;
  range_interaction: LivePriceActionLayer;
  levels: LivePriceLevel[];
  events: LivePriceActionEvent[];
  average_range: number;
  change: number;
  change_percent: number;
}

function clamp(value: number, lower = -100, upper = 100) {
  return Math.max(lower, Math.min(upper, value));
}

function strengthFor(score: number): Strength {
  const magnitude = Math.abs(score);
  return magnitude >= 55 ? 'STRONG' : magnitude >= 25 ? 'MODERATE' : 'WEAK';
}

function directionFor(score: number): Direction {
  return score >= 13 ? 'BULLISH' : score <= -13 ? 'BEARISH' : 'NEUTRAL';
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function highOf(bars: LiveSpotBar[]) {
  return Math.max(...bars.map((bar) => bar.high));
}

function lowOf(bars: LiveSpotBar[]) {
  return Math.min(...bars.map((bar) => bar.low));
}

function roundStep(market: LiveSpotMarket) {
  if (market.market === 'XAU/USD') return 5;
  if (market.market === 'USD/JPY') return 0.5;
  return 0.005;
}

function levelStrength(touches: number): Strength {
  return touches >= 4 ? 'STRONG' : touches >= 2 ? 'MODERATE' : 'WEAK';
}

function touchCount(bars: LiveSpotBar[], price: number, tolerance: number) {
  return bars.filter((bar) => bar.low - tolerance <= price && bar.high + tolerance >= price).length;
}

function eventForBar(bars: LiveSpotBar[], index: number, averageRange: number): LivePriceActionEvent | null {
  const context = bars.slice(Math.max(0, index - 20), index);
  if (context.length < 8) return null;
  const bar = bars[index];
  const upper = highOf(context);
  const lower = lowOf(context);
  const threshold = Math.max(averageRange * 0.08, Number.EPSILON);
  const timestamp = bar.time * 1000;
  if (bar.high > upper + threshold && bar.close < upper) {
    return { id: `upper-sweep-${bar.time}`, timestamp, severity: 'HIGH', title: 'Upper range sweep rejected', description: 'The source bar traded above the prior 20-bar high and closed back inside that range. This is a price-action observation, not exchange liquidity data.' };
  }
  if (bar.low < lower - threshold && bar.close > lower) {
    return { id: `lower-sweep-${bar.time}`, timestamp, severity: 'HIGH', title: 'Lower range sweep rejected', description: 'The source bar traded below the prior 20-bar low and closed back inside that range. This is a price-action observation, not exchange liquidity data.' };
  }
  if (bar.close > upper + threshold) {
    return { id: `upper-acceptance-${bar.time}`, timestamp, severity: 'WATCH', title: 'Upper range acceptance', description: 'The source bar closed above the prior 20-bar high. Follow-through still needs future bars; no trade instruction is implied.' };
  }
  if (bar.close < lower - threshold) {
    return { id: `lower-acceptance-${bar.time}`, timestamp, severity: 'WATCH', title: 'Lower range acceptance', description: 'The source bar closed below the prior 20-bar low. Follow-through still needs future bars; no trade instruction is implied.' };
  }
  return null;
}

export function analyzeLivePriceAction(market: LiveSpotMarket): LivePriceActionAnalysis {
  const bars = market.bars;
  if (bars.length < 20) throw new Error('At least twenty live bars are required for price-action analysis.');
  const latest = bars[bars.length - 1];
  const recent = bars.slice(-15);
  const baseline = bars[Math.max(0, bars.length - 16)];
  const averageRange = Math.max(average(recent.map((bar) => bar.high - bar.low)), Number.EPSILON);
  const fiveBarClose = average(bars.slice(-5).map((bar) => bar.close));
  const priorFiveBarClose = average(bars.slice(-10, -5).map((bar) => bar.close));
  const impulse = (latest.close - baseline.close) / averageRange;
  const slope = (fiveBarClose - priorFiveBarClose) / averageRange;
  const structureScore = clamp(Math.round(impulse * 12 + slope * 16));
  const structureDirection = directionFor(structureScore);
  const structure: LivePriceActionLayer = {
    direction: structureDirection,
    score: structureScore,
    strength: strengthFor(structureScore),
    summary: structureDirection === 'NEUTRAL'
      ? 'Recent closes are mixed relative to the rolling 15-bar range.'
      : `Recent closes and the five-bar slope are ${structureDirection.toLowerCase()} relative to the rolling 15-bar average range.`,
    evidence: { baseline_close: baseline.close, latest_close: latest.close, five_bar_average: fiveBarClose, prior_five_bar_average: priorFiveBarClose, average_range: averageRange },
  };

  const latestEvent = eventForBar(bars, bars.length - 1, averageRange);
  let rangeScore = 0;
  if (latestEvent?.id.startsWith('upper-sweep')) rangeScore = -60;
  else if (latestEvent?.id.startsWith('lower-sweep')) rangeScore = 60;
  else if (latestEvent?.id.startsWith('upper-acceptance')) rangeScore = 35;
  else if (latestEvent?.id.startsWith('lower-acceptance')) rangeScore = -35;
  const rangeDirection = directionFor(rangeScore);
  const rangeInteraction: LivePriceActionLayer = {
    direction: rangeDirection,
    score: rangeScore,
    strength: strengthFor(rangeScore),
    summary: latestEvent?.description ?? 'The latest source bar has not produced a defined 20-bar range sweep, rejection, or acceptance.',
    evidence: { average_range: averageRange, latest_high: latest.high, latest_low: latest.low, latest_close: latest.close },
  };

  const sameDirection = structureDirection !== 'NEUTRAL' && structureDirection === rangeDirection;
  const direction = sameDirection ? structureDirection : rangeDirection !== 'NEUTRAL' ? rangeDirection : structureDirection;
  const score = sameDirection ? Math.round((structureScore + rangeScore) / 2) : rangeScore || structureScore;
  const alignment = sameDirection ? 'STRUCTURE_AND_RANGE_ALIGNED' : structureDirection !== 'NEUTRAL' ? 'STRUCTURE_ONLY' : rangeDirection !== 'NEUTRAL' ? 'RANGE_EVENT_ONLY' : 'MIXED_PRICE_ACTION';
  const state = sameDirection ? 'CONFIRMING' : latestEvent?.id.includes('sweep') ? 'RANGE_REJECTION' : latestEvent?.id.includes('acceptance') ? 'RANGE_ACCEPTANCE' : structureDirection !== 'NEUTRAL' ? 'WATCHING' : 'SCANNING';

  const allBars = bars.slice(-60);
  const priorBars = bars.slice(-21, -1);
  const tolerance = Math.max(averageRange * 0.12, Number.EPSILON);
  const round = Math.round(latest.close / roundStep(market)) * roundStep(market);
  const definitions = [
    ['sixty-minute-high', '60-minute high', highOf(allBars)],
    ['sixty-minute-low', '60-minute low', lowOf(allBars)],
    ['prior-range-high', 'Prior 20-bar high', highOf(priorBars)],
    ['prior-range-low', 'Prior 20-bar low', lowOf(priorBars)],
    ['round-number', 'Nearest round number', round],
  ] as const;
  const levels = definitions.map(([id, type, price]) => {
    const touches = touchCount(allBars, price, tolerance);
    return { id, type, price, touches, distance: latest.close - price, strength: levelStrength(touches) };
  });

  const events = bars.slice(-12).map((_, offset, selected) => eventForBar(bars, bars.length - selected.length + offset, averageRange)).filter((event): event is LivePriceActionEvent => event !== null);
  events.push({ id: `source-bar-${latest.time}`, timestamp: latest.time * 1000, severity: 'INFO', title: 'Latest source bar processed', description: `The ${market.provider} ${market.market} one-minute bar closed at ${latest.close}. Calculations use the returned OHLC bars only.` });

  return {
    state,
    direction,
    score,
    strength: strengthFor(score),
    alignment,
    structure,
    range_interaction: rangeInteraction,
    levels,
    events: events.sort((left, right) => right.timestamp - left.timestamp).slice(0, 6),
    average_range: averageRange,
    change: latest.close - baseline.close,
    change_percent: ((latest.close - baseline.close) / baseline.close) * 100,
  };
}
