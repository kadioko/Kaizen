import { parseCsvRows } from './csv';

describe('parseCsvRows', () => {
  it('imports valid CSV rows', () => {
    const result = parseCsvRows([
      'timestamp,instrument,timeframe,open,high,low,close,delta,delta_change,volume,cumulative_delta',
      '2026-05-20T07:30:00Z,MNQ,M1,18942.25,18944,18940.75,18943.5,-128,90,546,3210',
    ].join('\n'));

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].instrument).toBe('MNQ');
    expect(result.rows[0].deltaChange).toBe(90);
    expect(result.skippedRows).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('reports missing required headers', () => {
    const result = parseCsvRows([
      'timestamp,instrument,timeframe,open,high,low,close,delta,volume,cumulative_delta',
      '2026-05-20T07:30:00Z,MNQ,M1,18942.25,18944,18940.75,18943.5,-128,546,3210',
    ].join('\n'));

    expect(result.rows).toHaveLength(0);
    expect(result.skippedRows).toBe(1);
    expect(result.errors[0]).toContain('Missing required CSV header');
  });

  it('skips rows with bad numbers, empty rows, and invalid instrument values', () => {
    const result = parseCsvRows([
      'timestamp,instrument,timeframe,open,high,low,close,delta,delta_change,volume,cumulative_delta',
      '',
      '2026-05-20T07:30:00Z,BTC,M1,18942.25,18944,18940.75,18943.5,-128,90,546,3210',
      '2026-05-20T07:31:00Z,MNQ,M1,bad,18944,18940.75,18943.5,-128,90,546,3210',
    ].join('\n'));

    expect(result.rows).toHaveLength(0);
    expect(result.skippedRows).toBe(2);
    expect(result.errors).toHaveLength(2);
  });
});
