import React from 'react';
import { Plus, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { generateId } from '../../utils/helpers';
import { commanderInstrumentOptions, instrumentConfig } from '../constants';
import { CommanderInstrument, OrderFlowRow, Timeframe } from '../types';

type OrderFlowSortKey = 'timestamp' | 'timeframe' | 'close' | 'delta' | 'volume' | 'source';
type OrderFlowFilter = 'all' | 'M1' | 'M3' | 'M5' | 'manual' | 'csv' | 'positiveDelta' | 'negativeDelta';

interface FlowFormState {
  timestamp: string;
  instrument: CommanderInstrument;
  timeframe: Timeframe;
  open: string;
  high: string;
  low: string;
  close: string;
  delta: string;
  deltaChange: string;
  volume: string;
  cumulativeDelta: string;
  aggressiveBuyersObserved: boolean;
  aggressiveSellersObserved: boolean;
  priceContinuedAfterAggression: boolean;
  notes: string;
}

interface OrderFlowInputProps {
  isDark: boolean;
  selectedInstrument: CommanderInstrument;
  orderFlowRows: OrderFlowRow[];
  setOrderFlowRows: React.Dispatch<React.SetStateAction<OrderFlowRow[]>>;
  flowForm: FlowFormState;
  setFlowForm: React.Dispatch<React.SetStateAction<FlowFormState>>;
  importSummary: string;
  orderFlowFilter: OrderFlowFilter;
  setOrderFlowFilter: (filter: OrderFlowFilter) => void;
  orderFlowSortKey: OrderFlowSortKey;
  setOrderFlowSortKey: (key: OrderFlowSortKey) => void;
  orderFlowSortDirection: 'asc' | 'desc';
  setOrderFlowSortDirection: (direction: 'asc' | 'desc') => void;
  onSyncInstrument: (instrument: CommanderInstrument) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImported: () => void;
}

export function OrderFlowInput({
  isDark,
  selectedInstrument,
  orderFlowRows,
  setOrderFlowRows,
  flowForm,
  setFlowForm,
  importSummary,
  orderFlowFilter,
  setOrderFlowFilter,
  orderFlowSortKey,
  setOrderFlowSortKey,
  orderFlowSortDirection,
  setOrderFlowSortDirection,
  onSyncInstrument,
  onImport,
  onClearImported,
}: OrderFlowInputProps) {

  const instrumentRows = React.useMemo(
    () =>
      [...orderFlowRows]
        .filter((row) => row.instrument === selectedInstrument)
        .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()),
    [orderFlowRows, selectedInstrument]
  );

  const displayedRows = React.useMemo(() => {
    const filtered = instrumentRows.filter((row) => {
      if (orderFlowFilter === 'all') return true;
      if (orderFlowFilter === 'manual' || orderFlowFilter === 'csv') return row.source === orderFlowFilter;
      if (orderFlowFilter === 'positiveDelta') return row.delta >= 0;
      if (orderFlowFilter === 'negativeDelta') return row.delta < 0;
      return row.timeframe === orderFlowFilter;
    });

    return [...filtered].sort((left, right) => {
      const direction = orderFlowSortDirection === 'asc' ? 1 : -1;
      const leftValue = orderFlowSortKey === 'timestamp' ? new Date(left.timestamp).getTime() : (left as never)[orderFlowSortKey];
      const rightValue = orderFlowSortKey === 'timestamp' ? new Date(right.timestamp).getTime() : (right as never)[orderFlowSortKey];

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * direction;
      }
      return String(leftValue).localeCompare(String(rightValue)) * direction;
    });
  }, [instrumentRows, orderFlowFilter, orderFlowSortKey, orderFlowSortDirection]);
  const decimals = instrumentConfig[selectedInstrument].priceDecimals;

  const handleFlowSubmit = () => {
    const row: OrderFlowRow = {
      id: generateId(),
      timestamp: new Date(flowForm.timestamp).toISOString(),
      instrument: flowForm.instrument,
      timeframe: flowForm.timeframe,
      open: Number(flowForm.open) || 0,
      high: Number(flowForm.high) || 0,
      low: Number(flowForm.low) || 0,
      close: Number(flowForm.close) || 0,
      delta: Number(flowForm.delta) || 0,
      deltaChange: Number(flowForm.deltaChange) || 0,
      volume: Number(flowForm.volume) || 0,
      cumulativeDelta: Number(flowForm.cumulativeDelta) || 0,
      aggressiveBuyersObserved: flowForm.aggressiveBuyersObserved,
      aggressiveSellersObserved: flowForm.aggressiveSellersObserved,
      priceContinuedAfterAggression: flowForm.priceContinuedAfterAggression,
      notes: flowForm.notes,
      source: 'manual',
    };

    setOrderFlowRows((previous) => [row, ...previous]);
    onSyncInstrument(flowForm.instrument);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order-Flow Input + CSV Import</CardTitle>
        <CardDescription>Enter rows manually or import CSV data to drive setup scoring.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timestamp, Instrument, Timeframe */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            type="datetime-local"
            value={flowForm.timestamp}
            onChange={(event) => setFlowForm((previous) => ({ ...previous, timestamp: event.target.value }))}
            className="rounded-[1.1rem]"
          />
          <select
            value={flowForm.instrument}
            onChange={(event) =>
              setFlowForm((previous) => ({ ...previous, instrument: event.target.value as CommanderInstrument }))
            }
            className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
              isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            {commanderInstrumentOptions.map((instrument) => (
              <option key={instrument} value={instrument}>{instrument}</option>
            ))}
          </select>
          <select
            value={flowForm.timeframe}
            onChange={(event) => setFlowForm((previous) => ({ ...previous, timeframe: event.target.value as Timeframe }))}
            className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
              isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <option value="M1">M1</option>
            <option value="M3">M3</option>
            <option value="M5">M5</option>
          </select>
        </div>

        {/* Price/Delta Inputs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['open', 'Open'],
            ['high', 'High'],
            ['low', 'Low'],
            ['close', 'Close'],
            ['delta', 'Delta'],
            ['deltaChange', 'Delta Change'],
            ['volume', 'Volume'],
            ['cumulativeDelta', 'Cum Delta'],
          ].map(([key, label]) => (
            <Input
              key={key}
              type="number"
              value={flowForm[key as keyof FlowFormState] as string}
              onChange={(event) => setFlowForm((previous) => ({ ...previous, [key]: event.target.value }))}
              placeholder={label}
              className="rounded-[1.1rem]"
            />
          ))}
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label
            className={`flex items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${
              isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={flowForm.aggressiveBuyersObserved}
              onChange={(event) =>
                setFlowForm((previous) => ({ ...previous, aggressiveBuyersObserved: event.target.checked }))
              }
            />
            Aggressive buyers observed
          </label>
          <label
            className={`flex items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${
              isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={flowForm.aggressiveSellersObserved}
              onChange={(event) =>
                setFlowForm((previous) => ({ ...previous, aggressiveSellersObserved: event.target.checked }))
              }
            />
            Aggressive sellers observed
          </label>
          <label
            className={`flex items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${
              isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={flowForm.priceContinuedAfterAggression}
              onChange={(event) =>
                setFlowForm((previous) => ({ ...previous, priceContinuedAfterAggression: event.target.checked }))
              }
            />
            Price continued after aggression
          </label>
        </div>

        {/* Notes */}
        <textarea
          value={flowForm.notes}
          onChange={(event) => setFlowForm((previous) => ({ ...previous, notes: event.target.value }))}
          placeholder="Notes about absorption, tape speed, or response."
          rows={3}
          className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${
            isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
          }`}
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleFlowSubmit}>
            <Plus size={16} />
            Add manual row
          </Button>
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
              isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <Upload size={16} />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={onImport} />
          </label>
          <Button variant="secondary" onClick={onClearImported}>
            Clear imported rows
          </Button>
        </div>

        {importSummary && <p className={`text-sm ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{importSummary}</p>}

        {/* Filter/Sort Controls */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={orderFlowFilter}
            onChange={(event) => setOrderFlowFilter(event.target.value as OrderFlowFilter)}
            className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
              isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <option value="all">All rows</option>
            <option value="M1">M1 only</option>
            <option value="M3">M3 only</option>
            <option value="M5">M5 only</option>
            <option value="manual">Manual only</option>
            <option value="csv">CSV only</option>
            <option value="positiveDelta">Positive delta</option>
            <option value="negativeDelta">Negative delta</option>
          </select>
          <select
            value={orderFlowSortKey}
            onChange={(event) => setOrderFlowSortKey(event.target.value as OrderFlowSortKey)}
            className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
              isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <option value="timestamp">Sort by time</option>
            <option value="timeframe">Sort by timeframe</option>
            <option value="close">Sort by close</option>
            <option value="delta">Sort by delta</option>
            <option value="volume">Sort by volume</option>
            <option value="source">Sort by source</option>
          </select>
          <Button
            variant="secondary"
            onClick={() => setOrderFlowSortDirection(orderFlowSortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {orderFlowSortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </div>

        {/* Table */}
        <div className="max-h-[340px] overflow-auto rounded-[1.15rem] border p-3">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                <th className="px-2 py-2 text-left font-medium">Time</th>
                <th className="px-2 py-2 text-left font-medium">TF</th>
                <th className="px-2 py-2 text-right font-medium">Close</th>
                <th className="px-2 py-2 text-right font-medium">Delta</th>
                <th className="px-2 py-2 text-right font-medium">Vol</th>
                <th className="px-2 py-2 text-left font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.slice(0, 12).map((row) => (
                <tr key={row.id} className={`border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                  <td className="px-2 py-2">
                    {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-2 py-2">{row.timeframe}</td>
                  <td className="px-2 py-2 text-right">{row.close.toFixed(decimals)}</td>
                  <td className={`px-2 py-2 text-right ${row.delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {row.delta}
                  </td>
                  <td className="px-2 py-2 text-right">{row.volume}</td>
                  <td className="px-2 py-2 capitalize">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
