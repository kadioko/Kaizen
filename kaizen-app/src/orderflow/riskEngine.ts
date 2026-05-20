import { CommanderPlan, RiskMetrics } from './types';

export interface CalculateRiskMetricsInput {
  tickSize: number;
  defaultTickValue: number;
  entry: CommanderPlan['entry'];
  stop: CommanderPlan['stop'];
  tp1: CommanderPlan['tp1'];
  tp2: CommanderPlan['tp2'];
  accountSize: string | number;
  riskPercent: string | number;
  tickValue: string | number;
}

export function calculateRiskMetrics(input: CalculateRiskMetricsInput): RiskMetrics {
  const tickValue = Number(input.tickValue) || input.defaultTickValue;
  const accountSize = Number(input.accountSize) || 0;
  const riskPercent = Number(input.riskPercent) || 0;
  const riskBudget = accountSize * (riskPercent / 100);
  const stopDistance = input.entry !== null && input.stop !== null ? Math.abs(input.entry - input.stop) : 0;
  const ticksToStop = stopDistance > 0 ? stopDistance / input.tickSize : 0;
  const riskPerContract = ticksToStop * tickValue;
  const maxContracts = riskPerContract > 0 ? Math.floor(riskBudget / riskPerContract) : 0;
  const totalRisk = maxContracts * riskPerContract;
  const rewardTp1 = input.entry !== null && input.tp1 !== null ? (Math.abs(input.tp1 - input.entry) / input.tickSize) * tickValue * maxContracts : 0;
  const rewardTp2 = input.entry !== null && input.tp2 !== null ? (Math.abs(input.tp2 - input.entry) / input.tickSize) * tickValue * maxContracts : 0;
  const rMultiple = totalRisk > 0 ? rewardTp1 / totalRisk : 0;

  return {
    tickValue,
    accountSize,
    riskPercent,
    riskBudget,
    riskPerContract,
    maxContracts,
    totalRisk,
    rewardTp1,
    rewardTp2,
    rMultiple,
  };
}
