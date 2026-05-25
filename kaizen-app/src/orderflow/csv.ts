import { generateId } from '../utils/helpers';
import { CommanderInstrument, OrderFlowRow, Timeframe } from './types';

const requiredHeaders = ['timestamp', 'instrument', 'timeframe', 'open', 'high', 'low', 'close', 'delta', 'delta_change', 'volume', 'cumulative_delta'];
const validInstruments: CommanderInstrument[] = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'XAUUSD', 'MNQ', 'MES', 'GC'];
const validTimeframes: Timeframe[] = ['M1', 'M3', 'M5'];

export interface CsvParseResult {
  rows: OrderFlowRow[];
  errors: string[];
  skippedRows: number;
}

function toNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseCsvRows(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: ['CSV must include a header row and at least one data row.'], skippedRows: 0 };

  const [header, ...dataRows] = lines;
  const headers = header.split(',').map((item) => item.trim());
  const missingHeaders = requiredHeaders.filter((requiredHeader) => !headers.includes(requiredHeader));

  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [`Missing required CSV header${missingHeaders.length === 1 ? '' : 's'}: ${missingHeaders.join(', ')}.`],
      skippedRows: dataRows.length,
    };
  }

  return dataRows.reduce<CsvParseResult>((result, line, index) => {
    const values = line.split(',').map((item) => item.trim());
    const row = Object.fromEntries(headers.map((key, valueIndex) => [key, values[valueIndex] ?? ''])) as Record<string, string>;
    const instrument = row.instrument as CommanderInstrument;
    const timeframe = row.timeframe as Timeframe;
    const rowNumber = index + 2;

    if (!validInstruments.includes(instrument)) {
      result.errors.push(`Row ${rowNumber}: invalid instrument "${row.instrument}".`);
      result.skippedRows += 1;
      return result;
    }

    if (!validTimeframes.includes(timeframe)) {
      result.errors.push(`Row ${rowNumber}: invalid timeframe "${row.timeframe}".`);
      result.skippedRows += 1;
      return result;
    }

    const numericValues = {
      open: toNumber(row.open),
      high: toNumber(row.high),
      low: toNumber(row.low),
      close: toNumber(row.close),
      delta: toNumber(row.delta),
      deltaChange: toNumber(row.delta_change),
      volume: toNumber(row.volume),
      cumulativeDelta: toNumber(row.cumulative_delta),
    };

    const badNumberFields = Object.entries(numericValues).filter(([, value]) => value === null).map(([key]) => key);
    if (!row.timestamp || Number.isNaN(new Date(row.timestamp).getTime()) || badNumberFields.length > 0) {
      result.errors.push(`Row ${rowNumber}: invalid ${[!row.timestamp || Number.isNaN(new Date(row.timestamp).getTime()) ? 'timestamp' : '', ...badNumberFields].filter(Boolean).join(', ')}.`);
      result.skippedRows += 1;
      return result;
    }

    result.rows.push({
      id: generateId(),
      timestamp: new Date(row.timestamp).toISOString(),
      instrument,
      timeframe,
      open: numericValues.open ?? 0,
      high: numericValues.high ?? 0,
      low: numericValues.low ?? 0,
      close: numericValues.close ?? 0,
      delta: numericValues.delta ?? 0,
      deltaChange: numericValues.deltaChange ?? 0,
      volume: numericValues.volume ?? 0,
      cumulativeDelta: numericValues.cumulativeDelta ?? 0,
      aggressiveBuyersObserved: (numericValues.delta ?? 0) > 0,
      aggressiveSellersObserved: (numericValues.delta ?? 0) < 0,
      priceContinuedAfterAggression: false,
      notes: 'Imported from CSV',
      source: 'csv',
    });

    return result;
  }, { rows: [], errors: [], skippedRows: 0 });
}
