import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { generateId } from '../../utils/helpers';
import { levelTypes } from '../constants';
import { CommanderInstrument, CommanderLevel, LevelFilter, LevelType } from '../types';

interface LevelFormState {
  instrument: CommanderInstrument;
  price: string;
  type: LevelType;
  strength: string;
  notes: string;
  active: boolean;
}

interface LevelsManagerProps {
  isDark: boolean;
  selectedInstrument: CommanderInstrument;
  levels: CommanderLevel[];
  setLevels: React.Dispatch<React.SetStateAction<CommanderLevel[]>>;
  levelFilter: LevelFilter;
  setLevelFilter: (filter: LevelFilter) => void;
  levelForm: LevelFormState;
  setLevelForm: React.Dispatch<React.SetStateAction<LevelFormState>>;
  editingLevelId: string | null;
  setEditingLevelId: (id: string | null) => void;
  onSyncInstrument: (instrument: CommanderInstrument) => void;
}

export function LevelsManager({
  isDark,
  selectedInstrument,
  levels,
  setLevels,
  levelFilter,
  setLevelFilter,
  levelForm,
  setLevelForm,
  editingLevelId,
  setEditingLevelId,
  onSyncInstrument,
}: LevelsManagerProps) {
  const surfaceClass = isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70';
  const subtleClass = isDark ? 'text-slate-400' : 'text-slate-500';

  const visibleInstrumentLevels = React.useMemo(
    () =>
      levels.filter((level) => {
        if (level.instrument !== selectedInstrument) return false;
        if (levelFilter === 'active') return level.active;
        if (levelFilter === 'inactive') return !level.active;
        return true;
      }),
    [levelFilter, levels, selectedInstrument]
  );

  const handleLevelSubmit = () => {
    const nextLevel: CommanderLevel = {
      id: editingLevelId ?? generateId(),
      instrument: levelForm.instrument,
      price: Number(levelForm.price) || 0,
      type: levelForm.type,
      strength: Math.max(1, Math.min(5, Number(levelForm.strength) || 1)) as 1 | 2 | 3 | 4 | 5,
      notes: levelForm.notes,
      active: levelForm.active,
    };

    setLevels((previous) => {
      const filtered = editingLevelId ? previous.filter((item) => item.id !== editingLevelId) : previous;
      return [nextLevel, ...filtered];
    });

    setEditingLevelId(null);
    setLevelForm({
      instrument: selectedInstrument,
      price: levelForm.price,
      type: 'Demand',
      strength: '4',
      notes: '',
      active: true,
    });
  };

  const handleLoadLevel = (level: CommanderLevel) => {
    setEditingLevelId(level.id);
    setLevelForm({
      instrument: level.instrument,
      price: String(level.price),
      type: level.type,
      strength: String(level.strength),
      notes: level.notes,
      active: level.active,
    });
    onSyncInstrument(level.instrument);
  };

  const decimals = selectedInstrument === 'GC' ? 2 : 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Level Manager</CardTitle>
        <CardDescription>Add, edit, deactivate, and delete the important levels driving the setup engine.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level Form */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <select
            value={levelForm.instrument}
            onChange={(event) =>
              setLevelForm((previous) => ({ ...previous, instrument: event.target.value as CommanderInstrument }))
            }
            className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
              isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <option value="MNQ">MNQ</option>
            <option value="MES">MES</option>
            <option value="GC">GC</option>
          </select>
          <Input
            type="number"
            value={levelForm.price}
            onChange={(event) => setLevelForm((previous) => ({ ...previous, price: event.target.value }))}
            placeholder="Price"
            className="rounded-[1.1rem]"
          />
          <select
            value={levelForm.type}
            onChange={(event) => setLevelForm((previous) => ({ ...previous, type: event.target.value as LevelType }))}
            className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
              isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            {levelTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={1}
            max={5}
            value={levelForm.strength}
            onChange={(event) => setLevelForm((previous) => ({ ...previous, strength: event.target.value }))}
            placeholder="Strength 1-5"
            className="rounded-[1.1rem]"
          />
          <Input
            value={levelForm.notes}
            onChange={(event) => setLevelForm((previous) => ({ ...previous, notes: event.target.value }))}
            placeholder="Notes"
            className="rounded-[1.1rem] md:col-span-2"
          />
        </div>

        <label
          className={`flex items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${
            isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          <input
            type="checkbox"
            checked={levelForm.active}
            onChange={(event) => setLevelForm((previous) => ({ ...previous, active: event.target.checked }))}
          />
          Level is active
        </label>

        <Button onClick={handleLevelSubmit}>
          <Plus size={16} />
          {editingLevelId ? 'Update level' : 'Add level'}
        </Button>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {(['active', 'inactive', 'all'] as const).map((filter) => (
            <Button
              key={filter}
              variant={levelFilter === filter ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setLevelFilter(filter)}
              className="capitalize"
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Level List */}
        <div className="space-y-3">
          {visibleInstrumentLevels.length === 0 ? (
            <p className={`text-sm ${subtleClass}`}>No {levelFilter} levels for this instrument yet.</p>
          ) : (
            visibleInstrumentLevels.map((level) => (
              <div key={level.id} className={`rounded-[1.15rem] border p-4 ${surfaceClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{level.type}</p>
                      <Badge variant="outline">Strength {level.strength}</Badge>
                      <Badge variant={level.active ? 'secondary' : 'outline'}>{level.active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="mt-1 text-sm">{level.price.toFixed(decimals)}</p>
                    <p className={`mt-1 text-xs ${subtleClass}`}>{level.notes}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleLoadLevel(level)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLevels((previous) => previous.filter((item) => item.id !== level.id))}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
