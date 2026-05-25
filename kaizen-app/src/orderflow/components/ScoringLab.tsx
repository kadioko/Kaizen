import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { generateId } from '../../utils/helpers';
import { commanderInstrumentOptions } from '../constants';
import { defaultScoreWeights } from '../defaults';
import { CommanderBias, CommanderInstrument, CommanderScoreWeights, CommanderSession, RiskContext, SetupTemplate } from '../types';

interface TemplateFormState {
  name: string;
  instrument: CommanderInstrument | 'Any';
  session: CommanderSession | 'Any';
  bias: CommanderBias;
  riskContext: RiskContext;
  newsRisk: boolean;
  minimumScore: string;
  notes: string;
}

interface ScoringLabProps {
  isDark: boolean;
  scoreWeights: CommanderScoreWeights;
  setScoreWeights: React.Dispatch<React.SetStateAction<CommanderScoreWeights>>;
  minimumScore: number;
  setMinimumScore: (score: number) => void;
  setupTemplates: SetupTemplate[];
  setSetupTemplates: React.Dispatch<React.SetStateAction<SetupTemplate[]>>;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  templateForm: TemplateFormState;
  setTemplateForm: React.Dispatch<React.SetStateAction<TemplateFormState>>;
  onApplyTemplate: (templateId: string) => void;
  importSummary: string;
  setImportSummary: (summary: string) => void;
}

export function ScoringLab({
  isDark,
  scoreWeights,
  setScoreWeights,
  minimumScore,
  setMinimumScore,
  setupTemplates,
  setSetupTemplates,
  selectedTemplateId,
  setSelectedTemplateId,
  templateForm,
  setTemplateForm,
  onApplyTemplate,
}: ScoringLabProps) {
  const surfaceClass = isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70';

  const scoreWeightTotal = React.useMemo(
    () => Object.values(scoreWeights).reduce((sum, value) => sum + value, 0),
    [scoreWeights]
  );

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim()) return;
    const nextTemplate: SetupTemplate = {
      id: generateId(),
      name: templateForm.name.trim(),
      instrument: templateForm.instrument,
      session: templateForm.session,
      bias: templateForm.bias,
      riskContext: templateForm.riskContext,
      newsRisk: templateForm.newsRisk,
      minimumScore: Number(templateForm.minimumScore) || 70,
      notes: templateForm.notes.trim(),
    };

    setSetupTemplates((previous) => [nextTemplate, ...previous]);
    setSelectedTemplateId(nextTemplate.id);
    setTemplateForm({
      name: '',
      instrument: 'Any',
      session: 'Any',
      bias: 'Neutral',
      riskContext: 'Balanced',
      newsRisk: false,
      minimumScore: String(minimumScore),
      notes: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scoring Lab + Templates</CardTitle>
        <CardDescription>Tune your scoring model and save reusable execution templates for specific sessions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Weights Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {(Object.keys(defaultScoreWeights) as Array<keyof CommanderScoreWeights>).map((key) => (
            <div key={key}>
              <label className={`text-xs font-medium uppercase tracking-[0.16em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {key}
              </label>
              <Input
                type="number"
                value={scoreWeights[key]}
                onChange={(event) =>
                  setScoreWeights((previous) => ({ ...previous, [key]: Number(event.target.value) || 0 }))
                }
                className="mt-1 rounded-[1.1rem]"
              />
            </div>
          ))}
        </div>

        {/* Minimum Score */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px]">
          <div>
            <label className={`text-xs font-medium uppercase tracking-[0.16em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Minimum score
            </label>
            <Input
              type="number"
              value={minimumScore}
              onChange={(event) => setMinimumScore(Number(event.target.value) || 70)}
              className="mt-1 rounded-[1.1rem]"
            />
          </div>
          <div className={`rounded-[1.1rem] border px-4 py-3 ${surfaceClass}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Weight total</p>
            <p className="mt-1 text-lg font-semibold">{scoreWeightTotal}</p>
          </div>
        </div>

        {/* Template Section */}
        <div className="space-y-3 rounded-[1.15rem] border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Apply template</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Use a saved market posture instead of rebuilding context each session.
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                  isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
                }`}
              >
                {setupTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => onApplyTemplate(selectedTemplateId)} disabled={!selectedTemplateId}>
                Apply
              </Button>
            </div>
          </div>

          {/* Template Form */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              value={templateForm.name}
              onChange={(event) => setTemplateForm((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Template name"
              className="rounded-[1.1rem]"
            />
            <select
              value={templateForm.instrument}
              onChange={(event) =>
                setTemplateForm((previous) => ({ ...previous, instrument: event.target.value as CommanderInstrument | 'Any' }))
              }
              className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <option value="Any">Any instrument</option>
              {commanderInstrumentOptions.map((instrument) => (
                <option key={instrument} value={instrument}>{instrument}</option>
              ))}
            </select>
            <select
              value={templateForm.session}
              onChange={(event) =>
                setTemplateForm((previous) => ({ ...previous, session: event.target.value as CommanderSession | 'Any' }))
              }
              className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <option value="Any">Any session</option>
              <option value="London">London</option>
              <option value="New York AM">New York AM</option>
              <option value="New York PM">New York PM</option>
              <option value="Asia">Asia</option>
            </select>
            <Input
              type="number"
              value={templateForm.minimumScore}
              onChange={(event) =>
                setTemplateForm((previous) => ({ ...previous, minimumScore: event.target.value }))
              }
              placeholder="Template minimum score"
              className="rounded-[1.1rem]"
            />
            <select
              value={templateForm.bias}
              onChange={(event) =>
                setTemplateForm((previous) => ({ ...previous, bias: event.target.value as CommanderBias }))
              }
              className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <option value="Bullish">Bullish</option>
              <option value="Bearish">Bearish</option>
              <option value="Neutral">Neutral</option>
            </select>
            <select
              value={templateForm.riskContext}
              onChange={(event) =>
                setTemplateForm((previous) => ({ ...previous, riskContext: event.target.value as RiskContext }))
              }
              className={`rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${
                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <option value="Risk-On">Risk-On</option>
              <option value="Risk-Off">Risk-Off</option>
              <option value="Balanced">Balanced</option>
            </select>
          </div>

          <label
            className={`flex items-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm ${
              isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={templateForm.newsRisk}
              onChange={(event) =>
                setTemplateForm((previous) => ({ ...previous, newsRisk: event.target.checked }))
              }
            />
            Template enables news risk by default
          </label>

          <textarea
            value={templateForm.notes}
            onChange={(event) => setTemplateForm((previous) => ({ ...previous, notes: event.target.value }))}
            placeholder="Template notes"
            rows={3}
            className={`w-full resize-none rounded-[1.15rem] border px-4 py-3 text-sm outline-none ${
              isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
            }`}
          />

          <Button onClick={handleSaveTemplate}>
            <Plus size={16} />
            Save template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
