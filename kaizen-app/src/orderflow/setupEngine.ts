import { resistanceTypes, supportTypes } from './constants';
import { CommanderBias, CommanderLevel, CommanderPlan, CommanderScoreWeights, CommanderSession, OrderFlowRow, RiskContext, SetupType } from './types';

export interface BuildCommanderPlanInput {
  bias: CommanderBias;
  session: CommanderSession;
  riskContext: RiskContext;
  newsRisk: boolean;
  currentPrice: number;
  levels: CommanderLevel[];
  rows: OrderFlowRow[];
  tickSize: number;
  proximityThreshold: number;
  scoreWeights?: CommanderScoreWeights;
  minimumScore?: number;
}

export function getGrade(score: number): CommanderPlan['grade'] {
  if (score >= 80) return 'A-grade';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Weak';
  return 'No trade';
}

export function buildCommanderPlan(input: BuildCommanderPlanInput): CommanderPlan {
  const scoreWeights = input.scoreWeights ?? {
    context: 20,
    level: 20,
    delta: 25,
    alignment: 15,
    reward: 10,
    session: 10,
  };
  const minimumScore = input.minimumScore ?? 70;
  const instrumentRows = [...input.rows].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  const latestRow = instrumentRows[0] ?? null;
  const activeLevels = input.levels.filter((level) => level.active);
  const avgAbsDelta = instrumentRows.length > 0 ? instrumentRows.slice(0, 8).reduce((sum, row) => sum + Math.abs(row.delta), 0) / Math.min(instrumentRows.length, 8) : 0;
  const avgVolume = instrumentRows.length > 0 ? instrumentRows.slice(0, 8).reduce((sum, row) => sum + row.volume, 0) / Math.min(instrumentRows.length, 8) : 0;
  const nearestLevel = activeLevels.length > 0 ? [...activeLevels].sort((left, right) => Math.abs(left.price - input.currentPrice) - Math.abs(right.price - input.currentPrice))[0] : null;
  const nearLevel = nearestLevel ? Math.abs(nearestLevel.price - input.currentPrice) <= input.proximityThreshold : false;
  const nearSupport = nearestLevel ? nearLevel && supportTypes.includes(nearestLevel.type) : false;
  const nearResistance = nearestLevel ? nearLevel && resistanceTypes.includes(nearestLevel.type) : false;
  const timeframeRows = ['M1', 'M3', 'M5'].map((timeframe) => instrumentRows.find((row) => row.timeframe === timeframe)).filter((row): row is OrderFlowRow => Boolean(row));
  const alignmentDirection =
    timeframeRows.length >= 2 && timeframeRows.every((row) => row.deltaChange >= 0 && row.close >= row.open)
      ? 'Long'
      : timeframeRows.length >= 2 && timeframeRows.every((row) => row.deltaChange <= 0 && row.close <= row.open)
        ? 'Short'
        : 'Mixed';

  const validReasons: string[] = [];
  const skipReasons: string[] = [];
  let setupType: SetupType = 'No Trade';
  let direction: CommanderPlan['direction'] = 'No Trade';
  let entry: number | null = null;
  let stop: number | null = null;
  let tp1: number | null = null;
  let tp2: number | null = null;
  let entryTrigger = 'Wait for clearer structure and order-flow agreement.';
  let invalidation = 'Conflicting context or no valid trigger.';

  if (!latestRow) {
    skipReasons.push('No order-flow rows are loaded for the selected instrument.');
  } else {
    const negativeDeltaThreshold = -Math.max(120, avgAbsDelta * 0.8);
    const positiveDeltaThreshold = Math.max(120, avgAbsDelta * 0.8);
    const highVolume = latestRow.volume >= Math.max(400, avgVolume * 0.8);

    if (nearSupport && latestRow.delta <= negativeDeltaThreshold && latestRow.aggressiveSellersObserved && !latestRow.priceContinuedAfterAggression && latestRow.deltaChange > 0) {
      setupType = 'Seller Absorption Long';
      direction = 'Long';
      entry = latestRow.high + input.tickSize;
      stop = latestRow.low - input.tickSize * 2;
      entryTrigger = 'Enter on break or reclaim of the local confirmation high.';
      invalidation = 'Price breaks back below the absorption low.';
      validReasons.push('Price is working near a support-side level.');
      validReasons.push('Negative delta hit the level but price failed to continue lower.');
      validReasons.push('Delta improved after seller aggression.');
    } else if (nearResistance && latestRow.delta >= positiveDeltaThreshold && latestRow.aggressiveBuyersObserved && !latestRow.priceContinuedAfterAggression && latestRow.deltaChange < 0) {
      setupType = 'Buyer Absorption Short';
      direction = 'Short';
      entry = latestRow.low - input.tickSize;
      stop = latestRow.high + input.tickSize * 2;
      entryTrigger = 'Enter on break of the local confirmation low.';
      invalidation = 'Price reclaims and holds above the absorption high.';
      validReasons.push('Price is working near a resistance-side level.');
      validReasons.push('Positive delta pushed into the level without continuation higher.');
      validReasons.push('Delta weakened after buyer aggression.');
    } else if (input.bias === 'Bullish' && nearSupport && latestRow.close >= (nearestLevel?.price ?? 0) && latestRow.deltaChange > 0 && highVolume) {
      setupType = 'Bullish Continuation';
      direction = 'Long';
      entry = latestRow.high + input.tickSize;
      stop = Math.min(latestRow.low, (nearestLevel?.price ?? latestRow.low) - input.tickSize * 2);
      entryTrigger = 'Enter after price accepts above the key level and breaks the continuation high.';
      invalidation = 'Pullback loses the accepted level and delta weakens again.';
      validReasons.push('Bias is bullish and price is holding a support-side level.');
      validReasons.push('Delta turned back positive on the retest.');
      validReasons.push('Volume is supportive for continuation.');
    } else if (input.bias === 'Bearish' && nearResistance && latestRow.close <= (nearestLevel?.price ?? latestRow.close) && latestRow.deltaChange < 0 && highVolume) {
      setupType = 'Bearish Continuation';
      direction = 'Short';
      entry = latestRow.low - input.tickSize;
      stop = Math.max(latestRow.high, (nearestLevel?.price ?? latestRow.high) + input.tickSize * 2);
      entryTrigger = 'Enter after price rejects the key level and breaks the continuation low.';
      invalidation = 'Retest accepts back above resistance and delta improves.';
      validReasons.push('Bias is bearish and price is failing at resistance.');
      validReasons.push('Delta turned back negative on the retest failure.');
      validReasons.push('Volume is supportive for continuation lower.');
    } else {
      skipReasons.push('No clean absorption or continuation pattern is present.');
    }
  }

  if (!nearestLevel) skipReasons.push('No active key level is loaded for this instrument.');
  if (nearestLevel && !nearLevel) skipReasons.push('Current price is not close enough to a high-value level.');
  if (input.newsRisk) skipReasons.push('News risk is toggled on.');
  if (input.riskContext === 'Risk-Off' && direction === 'Long') skipReasons.push('Risk-off context weakens long continuation and absorption quality.');
  if (input.riskContext === 'Risk-On' && direction === 'Short') skipReasons.push('Risk-on context weakens short continuation and fade quality.');
  if (alignmentDirection === 'Mixed') skipReasons.push('M1, M3, and M5 are not aligned.');

  const allTargets =
    direction === 'Long'
      ? activeLevels.filter((level) => level.price > (entry ?? input.currentPrice)).sort((left, right) => left.price - right.price)
      : activeLevels.filter((level) => level.price < (entry ?? input.currentPrice)).sort((left, right) => right.price - left.price);

  const stopDistance = entry !== null && stop !== null ? Math.abs(entry - stop) : 0;
  tp1 = entry !== null && stopDistance > 0 ? allTargets[0]?.price ?? (direction === 'Long' ? entry + stopDistance * 1.5 : entry - stopDistance * 1.5) : null;
  tp2 = entry !== null && stopDistance > 0 ? allTargets[1]?.price ?? (direction === 'Long' ? entry + stopDistance * 2.2 : entry - stopDistance * 2.2) : null;
  const riskReward = entry !== null && tp1 !== null && stopDistance > 0 ? Math.abs(tp1 - entry) / stopDistance : 0;
  const contextPoints =
    direction === 'No Trade'
      ? 0
      : input.bias === 'Neutral'
        ? scoreWeights.context * 0.5
        : (input.bias === 'Bullish' && direction === 'Long') || (input.bias === 'Bearish' && direction === 'Short')
          ? scoreWeights.context
          : 0;
  const levelPoints = nearestLevel && nearLevel ? scoreWeights.level : 0;
  const deltaPoints =
    setupType === 'Seller Absorption Long' || setupType === 'Buyer Absorption Short'
      ? scoreWeights.delta
      : setupType === 'Bullish Continuation' || setupType === 'Bearish Continuation'
        ? scoreWeights.delta * 0.72
        : 0;
  const alignmentPoints =
    alignmentDirection === direction
      ? scoreWeights.alignment
      : alignmentDirection === 'Mixed'
        ? 0
        : timeframeRows.length >= 2
          ? scoreWeights.alignment * 0.53
          : 0;
  const rewardPoints = riskReward >= 1.5 ? scoreWeights.reward : 0;
  const sessionPoints =
    input.session === 'London' || input.session === 'New York AM'
      ? scoreWeights.session
      : input.session === 'New York PM'
        ? scoreWeights.session * 0.7
        : scoreWeights.session * 0.5;
  const scoreBreakdown = { context: contextPoints, level: levelPoints, delta: deltaPoints, alignment: alignmentPoints, reward: rewardPoints, session: sessionPoints };
  const score = Math.round(Math.min(100, Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0)));
  const grade = getGrade(score);
  let status: CommanderPlan['status'] = 'No Trade';

  if (direction === 'No Trade') status = 'No Trade';
  else if (score >= 80 && riskReward >= 1.5 && !input.newsRisk) status = 'Ready';
  else if (score >= 70) status = 'Setup Forming';
  else if (score >= 60) status = 'Watching';

  if (score < minimumScore && direction !== 'No Trade') skipReasons.push(`Setup score is below the hard ${minimumScore}-point trading threshold.`);
  if (riskReward < 1.5 && direction !== 'No Trade') skipReasons.push('Risk/reward is below the 1.5R requirement.');

  return {
    direction,
    setupType,
    score,
    scoreBreakdown,
    grade,
    status,
    entry,
    stop,
    tp1,
    tp2,
    riskReward,
    validReasons,
    skipReasons,
    invalidation,
    entryTrigger,
    activeLevel: nearestLevel ?? null,
  };
}
