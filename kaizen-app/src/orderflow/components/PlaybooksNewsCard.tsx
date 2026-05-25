import React from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { formatDate, generateId } from '../../utils/helpers';
import { commanderInstrumentOptions } from '../constants';
import { CommanderInstrument, CommanderSession, NewsEvent, SetupPlaybook } from '../types';

interface PlaybookFormState {
  name: string;
  setupType: SetupPlaybook['setupType'];
  checklist: string;
  executionNotes: string;
  favorite: boolean;
}

interface NewsEventFormState {
  title: string;
  timestamp: string;
  instrument: CommanderInstrument | 'All';
  session: CommanderSession | 'All';
  impact: NewsEvent['impact'];
  notes: string;
}

interface PlaybooksNewsCardProps {
  isDark: boolean;
  playbooks: SetupPlaybook[];
  setPlaybooks: React.Dispatch<React.SetStateAction<SetupPlaybook[]>>;
  newsEvents: NewsEvent[];
  setNewsEvents: React.Dispatch<React.SetStateAction<NewsEvent[]>>;
  selectedPlaybookId: string;
  setSelectedPlaybookId: (id: string) => void;
  selectedPlaybook: SetupPlaybook | null;
  playbookForm: PlaybookFormState;
  setPlaybookForm: React.Dispatch<React.SetStateAction<PlaybookFormState>>;
  newsEventForm: NewsEventFormState;
  setNewsEventForm: React.Dispatch<React.SetStateAction<NewsEventFormState>>;
  activeNewsEvents: NewsEvent[];
}

export function PlaybooksNewsCard({
  isDark,
  playbooks,
  setPlaybooks,
  newsEvents,
  setNewsEvents,
  selectedPlaybookId,
  setSelectedPlaybookId,
  selectedPlaybook,
  playbookForm,
  setPlaybookForm,
  newsEventForm,
  setNewsEventForm,
  activeNewsEvents,
}: PlaybooksNewsCardProps) {
  const surfaceClass = isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70';
  const subtleClass = isDark ? 'text-slate-400' : 'text-slate-500';

  const handleSavePlaybook = () => {
    if (!playbookForm.name.trim()) return;
    const nextPlaybook: SetupPlaybook = {
      id: generateId(),
      name: playbookForm.name.trim(),
      setupType: playbookForm.setupType,
      checklist: playbookForm.checklist.trim(),
      executionNotes: playbookForm.executionNotes.trim(),
      favorite: playbookForm.favorite,
    };

    setPlaybooks((previous) => [nextPlaybook, ...previous]);
    setSelectedPlaybookId(nextPlaybook.id);
    setPlaybookForm({
      name: '',
      setupType: 'Seller Absorption Long',
      checklist: '',
      executionNotes: '',
      favorite: false,
    });
  };

  const handleSaveNewsEvent = () => {
    if (!newsEventForm.title.trim()) return;
    const nextEvent: NewsEvent = {
      id: generateId(),
      title: newsEventForm.title.trim(),
      timestamp: new Date(newsEventForm.timestamp).toISOString(),
      instrument: newsEventForm.instrument,
      session: newsEventForm.session,
      impact: newsEventForm.impact,
      notes: newsEventForm.notes.trim(),
    };

    setNewsEvents((previous) =>
      [nextEvent, ...previous].sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime())
    );
    setNewsEventForm({
      title: '',
      timestamp: new Date().toISOString().slice(0, 16),
      instrument: 'All',
      session: 'All',
      impact: 'Medium',
      notes: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Playbooks + News Calendar</CardTitle>
        <CardDescription>
          Capture setup-specific execution rules and a manual event calendar that can raise risk warnings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Playbooks Section */}
        <div className={`rounded-[1.15rem] border p-4 ${surfaceClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Saved playbooks</p>
              <p className={`text-xs ${subtleClass}`}>Keep execution checklists tied to actual setup types.</p>
            </div>
            <select
              value={selectedPlaybookId}
              onChange={(event) => setSelectedPlaybookId(event.target.value)}
              className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              {playbooks.map((playbook) => (
                <option key={playbook.id} value={playbook.id}>
                  {playbook.name}
                </option>
              ))}
            </select>
          </div>

          {selectedPlaybook && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge>{selectedPlaybook.setupType}</Badge>
                {selectedPlaybook.favorite && <Badge variant="outline">Favorite</Badge>}
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{selectedPlaybook.checklist}</p>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedPlaybook.executionNotes}</p>
            </div>
          )}
        </div>

        {/* Playbook Form */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            value={playbookForm.name}
            onChange={(event) => setPlaybookForm((previous) => ({ ...previous, name: event.target.value }))}
            placeholder="Playbook name"
            className="rounded-[1.1rem]"
          />
          <select
            value={playbookForm.setupType}
            onChange={(event) =>
              setPlaybookForm((previous) => ({ ...previous, setupType: event.target.value as SetupPlaybook['setupType'] }))
            }
            className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
              isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <option value="Seller Absorption Long">Seller Absorption Long</option>
            <option value="Buyer Absorption Short">Buyer Absorption Short</option>
            <option value="Bullish Continuation">Bullish Continuation</option>
            <option value="Bearish Continuation">Bearish Continuation</option>
          </select>
        </div>

        <textarea
          value={playbookForm.checklist}
          onChange={(event) => setPlaybookForm((previous) => ({ ...previous, checklist: event.target.value }))}
          placeholder="Checklist"
          rows={3}
          className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${
            isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
          }`}
        />

        <textarea
          value={playbookForm.executionNotes}
          onChange={(event) => setPlaybookForm((previous) => ({ ...previous, executionNotes: event.target.value }))}
          placeholder="Execution notes"
          rows={3}
          className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${
            isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
          }`}
        />

        <label
          className={`flex items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${
            isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          <input
            type="checkbox"
            checked={playbookForm.favorite}
            onChange={(event) => setPlaybookForm((previous) => ({ ...previous, favorite: event.target.checked }))}
          />
          Mark as favorite
        </label>

        <Button onClick={handleSavePlaybook}>
          <Plus size={16} />
          Save playbook
        </Button>

        {/* News Events Section */}
        <div className={`rounded-[1.15rem] border p-4 ${isDark ? 'border-cyan-500/20 bg-cyan-500/10' : 'border-cyan-200 bg-cyan-50'}`}>
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays size={16} />
            <p className="text-sm font-semibold">Manual news-event calendar</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              value={newsEventForm.title}
              onChange={(event) => setNewsEventForm((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Event title"
              className="rounded-[1.1rem]"
            />
            <Input
              type="datetime-local"
              value={newsEventForm.timestamp}
              onChange={(event) => setNewsEventForm((previous) => ({ ...previous, timestamp: event.target.value }))}
              className="rounded-[1.1rem]"
            />
            <select
              value={newsEventForm.instrument}
              onChange={(event) =>
                setNewsEventForm((previous) => ({ ...previous, instrument: event.target.value as CommanderInstrument | 'All' }))
              }
              className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <option value="All">All instruments</option>
              {commanderInstrumentOptions.map((instrument) => (
                <option key={instrument} value={instrument}>{instrument}</option>
              ))}
            </select>
            <select
              value={newsEventForm.session}
              onChange={(event) =>
                setNewsEventForm((previous) => ({ ...previous, session: event.target.value as CommanderSession | 'All' }))
              }
              className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <option value="All">All sessions</option>
              <option value="London">London</option>
              <option value="New York AM">New York AM</option>
              <option value="New York PM">New York PM</option>
              <option value="Asia">Asia</option>
            </select>
            <select
              value={newsEventForm.impact}
              onChange={(event) =>
                setNewsEventForm((previous) => ({ ...previous, impact: event.target.value as NewsEvent['impact'] }))
              }
              className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <option value="Low">Low impact</option>
              <option value="Medium">Medium impact</option>
              <option value="High">High impact</option>
            </select>
          </div>

          <textarea
            value={newsEventForm.notes}
            onChange={(event) => setNewsEventForm((previous) => ({ ...previous, notes: event.target.value }))}
            placeholder="Event notes"
            rows={2}
            className={`mt-3 w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${
              isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
            }`}
          />

          <div className="mt-3 flex flex-wrap gap-3">
            <Button onClick={handleSaveNewsEvent}>
              <Plus size={16} />
              Save event
            </Button>
            <p className={`self-center text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {activeNewsEvents.length} event(s) currently inside the warning window.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {newsEvents.slice(0, 5).map((event) => (
              <div key={event.id} className={`rounded-[1rem] border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-white/70 bg-white/70'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className={`text-xs ${subtleClass}`}>
                      {formatDate(event.timestamp)}{' '}
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge variant="outline">{event.impact}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
