import { calculateRiskMetrics } from './riskEngine';

describe('calculateRiskMetrics', () => {
  it('calculates contract sizing and reward metrics from plan prices', () => {
    const result = calculateRiskMetrics({
      tickSize: 0.25,
      defaultTickValue: 0.5,
      entry: 100,
      stop: 99,
      tp1: 102,
      tp2: 103,
      accountSize: '25000',
      riskPercent: '1',
      tickValue: '0.5',
    });

    expect(result.riskBudget).toBe(250);
    expect(result.riskPerContract).toBe(2);
    expect(result.maxContracts).toBe(125);
    expect(result.totalRisk).toBe(250);
    expect(result.rewardTp1).toBe(500);
    expect(result.rewardTp2).toBe(750);
    expect(result.rMultiple).toBe(2);
  });

  it('returns zero sizing when a stop is missing', () => {
    const result = calculateRiskMetrics({
      tickSize: 0.25,
      defaultTickValue: 0.5,
      entry: 100,
      stop: null,
      tp1: 102,
      tp2: 103,
      accountSize: '25000',
      riskPercent: '1',
      tickValue: '',
    });

    expect(result.maxContracts).toBe(0);
    expect(result.totalRisk).toBe(0);
    expect(result.rMultiple).toBe(0);
  });
});
