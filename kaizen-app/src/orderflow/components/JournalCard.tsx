import React from 'react';
import { Target, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { mistakeTags } from '../constants';
import { CommanderPlan, JournalDraft, JournalRecord, MistakeTag } from '../types';

interface JournalCardProps {
  isDark: boolean;
  analytics: {
    summary: {
      totalTrades: number;
      winRate: number;
      averageR: number;
      bestSetupType: string;
    };
  };
  journalDraft: JournalDraft;
  setJournalDraft: React.Dispatch<React.SetStateAction<JournalDraft>>;
  journalRecords: JournalRecord[];
  selectedJournalRecordId: string | null;
  setSelectedJournalRecordId: (id: string | null) => void;
  selectedJournalRecord: JournalRecord | null;
  plan: CommanderPlan;
  minimumScore: number;
  sessionLocked: boolean;
  onSaveJournal: () => void;
  onClearDraft: () => void;
  toggleMistakeTag: (tag: MistakeTag) => void;
  onScreenshotUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  journalStatus?: string;
  recentSessionSummary?: {
    todayTrades: number;
    todayResultR: number;
    sessionName: string;
    lastTradeDate: string;
  };
}

export function JournalCard({
  isDark,
  analytics,
  journalDraft,
  setJournalDraft,
  journalRecords,
  selectedJournalRecordId,
  setSelectedJournalRecordId,
  selectedJournalRecord,
  plan,
  minimumScore,
  sessionLocked,
  onSaveJournal,
  onClearDraft,
  toggleMistakeTag,
  onScreenshotUpload,
  journalStatus,
  recentSessionSummary,
}: JournalCardProps) {
  const surfaceClass = isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70';
  const subtleClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const disabledSave = !plan.entry || !plan.stop || !plan.tp1 || !plan.tp2 || plan.direction === 'No Trade' || sessionLocked || plan.score < minimumScore;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal</CardTitle>
        <CardDescription>Save the current plan, annotate outcome quality, and track execution mistakes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analytics Summary */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'Trades', value: String(analytics.summary.totalTrades) },
            { label: 'Win Rate', value: `${analytics.summary.winRate.toFixed(0)}%` },
            { label: 'Avg R', value: analytics.summary.averageR.toFixed(2) },
            { label: 'Best Setup', value: analytics.summary.bestSetupType },
          ].map((item) => (
            <div key={item.label} className={`rounded-[1.1rem] border p-4 ${surfaceClass}`}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
              <p className="mt-1 text-base font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Session Review Summary */}
        {recentSessionSummary && recentSessionSummary.todayTrades > 0 && (
          <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-cyan-500/20 bg-cyan-500/10' : 'border-cyan-200 bg-cyan-50'}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Recent Session Summary</p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <p className="text-sm font-semibold">{recentSessionSummary.sessionName}</p>
                <p className={`text-xs ${subtleClass}`}>{recentSessionSummary.lastTradeDate}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{recentSessionSummary.todayTrades} trade(s)</p>
                <p className={`text-xs ${subtleClass}`}>Today's activity</p>
              </div>
              <div>
                <p className={`text-sm font-semibold ${recentSessionSummary.todayResultR >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {recentSessionSummary.todayResultR >= 0 ? '+' : ''}{recentSessionSummary.todayResultR.toFixed(2)}R
                </p>
                <p className={`text-xs ${subtleClass}`}>Session result</p>
              </div>
            </div>
          </div>
        )}

        {/* Journal Input Fields */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            type="number"
            value={journalDraft.exit}
            onChange={(event) => setJournalDraft((previous) => ({ ...previous, exit: event.target.value }))}
            placeholder="Exit price"
            className="rounded-[1.1rem]"
          />
          <Input
            type="number"
            value={journalDraft.resultR}
            onChange={(event) => setJournalDraft((previous) => ({ ...previous, resultR: event.target.value }))}
            placeholder="Result in R"
            className="rounded-[1.1rem]"
          />
          <Input
            type="number"
            value={journalDraft.profitLoss}
            onChange={(event) => setJournalDraft((previous) => ({ ...previous, profitLoss: event.target.value }))}
            placeholder="P/L"
            className="rounded-[1.1rem]"
          />
        </div>

        {/* Screenshot Upload */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
          <label className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-[1.1rem] border px-4 py-3 text-sm font-medium ${isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
            <Upload size={16} />
            Upload screenshot
            <input type="file" accept="image/*" className="hidden" onChange={onScreenshotUpload} />
          </label>
          <Input
            value={journalDraft.screenshotAnnotation}
            onChange={(event) => setJournalDraft((previous) => ({ ...previous, screenshotAnnotation: event.target.value }))}
            placeholder="Screenshot annotation"
            className="rounded-[1.1rem]"
          />
        </div>

        {journalDraft.screenshotDataUrl && (
          <div className={`rounded-[1.15rem] border p-4 ${surfaceClass}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{journalDraft.screenshotName ?? 'Screenshot preview'}</p>
            <img
              src={journalDraft.screenshotDataUrl}
              alt="Journal draft screenshot"
              className="mt-3 max-h-52 rounded-[1rem] border object-cover"
            />
            {journalDraft.screenshotAnnotation && (
              <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{journalDraft.screenshotAnnotation}</p>
            )}
          </div>
        )}

        {/* Mistake Tags */}
        <div className="flex flex-wrap gap-2">
          {mistakeTags.map((tag) => (
            <Button
              key={tag}
              onClick={() => toggleMistakeTag(tag)}
              variant={journalDraft.mistakeTags.includes(tag) ? 'default' : 'secondary'}
              size="sm"
            >
              {tag}
            </Button>
          ))}
        </div>

        {/* Notes Textareas */}
        <textarea
          value={journalDraft.notes}
          onChange={(event) => setJournalDraft((previous) => ({ ...previous, notes: event.target.value }))}
          placeholder="Execution notes"
          rows={3}
          className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`}
        />
        <textarea
          value={journalDraft.lessons}
          onChange={(event) => setJournalDraft((previous) => ({ ...previous, lessons: event.target.value }))}
          placeholder="Lessons learned"
          rows={3}
          className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`}
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={onSaveJournal} disabled={disabledSave}>
            <Target size={16} />
            Save current plan to journal
          </Button>
          <Button variant="secondary" onClick={onClearDraft}>
            Clear draft
          </Button>
        </div>
        {journalStatus && <p className={`text-sm ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{journalStatus}</p>}

        {/* Journal Records List */}
        <div className="space-y-3">
          {journalRecords.length === 0 ? (
            <p className={`text-sm ${subtleClass}`}>No journal records yet. Save the current plan after a review or paper execution.</p>
          ) : (
            journalRecords.slice(0, 6).map((record) => (
              <div
                key={record.id}
                className={`rounded-[1.15rem] border p-4 ${
                  selectedJournalRecordId === record.id
                    ? isDark
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : 'border-cyan-200 bg-cyan-50'
                    : surfaceClass
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">
                        {record.instrument} · {record.setupType}
                      </p>
                      <Badge className={record.direction === 'Long' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                        {record.direction}
                      </Badge>
                    </div>
                    <p className={`mt-1 text-xs ${subtleClass}`}>
                      {formatDate(record.date)} · {record.session}
                    </p>
                    <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{record.notes || 'No notes recorded.'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${record.resultR >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {record.resultR.toFixed(2)}R
                    </p>
                    <p className="mt-1 text-xs">{formatCurrency(record.profitLoss)}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={() => setSelectedJournalRecordId(selectedJournalRecordId === record.id ? null : record.id)}
                    >
                      {selectedJournalRecordId === record.id ? 'Hide' : 'Details'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Journal Record Detail */}
        {selectedJournalRecord && (
          <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-cyan-500/20 bg-cyan-500/10' : 'border-cyan-200 bg-cyan-50'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Journal detail</p>
                <p className="mt-1 text-sm font-semibold">
                  {selectedJournalRecord.instrument} · {selectedJournalRecord.setupType}
                </p>
              </div>
              <Badge className={selectedJournalRecord.direction === 'Long' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                {selectedJournalRecord.direction}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Entry', value: selectedJournalRecord.entry.toFixed(2) },
                { label: 'Stop', value: selectedJournalRecord.stop.toFixed(2) },
                { label: 'TP1', value: selectedJournalRecord.tp1.toFixed(2) },
                { label: 'Exit', value: selectedJournalRecord.exit.toFixed(2) },
                { label: 'Result', value: `${selectedJournalRecord.resultR.toFixed(2)}R` },
                { label: 'P/L', value: formatCurrency(selectedJournalRecord.profitLoss) },
                { label: 'Session', value: selectedJournalRecord.session },
                { label: 'Date', value: formatDate(selectedJournalRecord.date) },
              ].map((item) => (
                <div key={item.label} className={`rounded-[1rem] border p-3 ${surfaceClass}`}>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {selectedJournalRecord.notes || 'No execution notes recorded.'}
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {selectedJournalRecord.lessons || 'No lessons recorded.'}
              </p>
              {selectedJournalRecord.screenshotDataUrl && (
                <div className={`rounded-[1rem] border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-white/70 bg-white/60'}`}>
                  <img
                    src={selectedJournalRecord.screenshotDataUrl}
                    alt={selectedJournalRecord.screenshotName ?? 'Journal screenshot'}
                    className="max-h-56 rounded-[0.9rem] border object-cover"
                  />
                  {selectedJournalRecord.screenshotAnnotation && (
                    <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedJournalRecord.screenshotAnnotation}</p>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {selectedJournalRecord.mistakeTags.length > 0 ? (
                  selectedJournalRecord.mistakeTags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)
                ) : (
                  <Badge variant="outline">No tags</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
