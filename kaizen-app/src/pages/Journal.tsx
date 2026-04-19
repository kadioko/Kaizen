import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpen, CheckCircle, Plus, Sparkles, Star, Target, XCircle } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function Journal() {
  const { isDark } = useTheme();
  const { trades, journalEntries, addJournalEntry, getPerformanceMetrics } = useTrading();
  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [lessons, setLessons] = useState('');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [followedPlan, setFollowedPlan] = useState(true);

  const metrics = getPerformanceMetrics();

  const handleSubmit = () => {
    addJournalEntry({
      date: new Date().toISOString(),
      trades: trades.slice(0, 5),
      notes,
      lessonsLearned: lessons,
      rating,
      followedPlan,
    });
    setNotes('');
    setLessons('');
    setRating(3);
    setFollowedPlan(true);
    setShowForm(false);
  };

  const emotionData = trades.reduce((accumulator, trade) => {
    const emotion = trade.emotion || 'neutral';
    const existing = accumulator.find((item) => item.name === emotion);
    if (existing) existing.value += 1;
    else accumulator.push({ name: emotion, value: 1 });
    return accumulator;
  }, [] as { name: string; value: number }[]);

  const strategyData = trades.reduce((accumulator, trade) => {
    const strategy = trade.strategy || 'No Strategy';
    const existing = accumulator.find((item) => item.name === strategy);
    if (existing) existing.count += 1;
    else accumulator.push({ name: strategy, count: 1 });
    return accumulator;
  }, [] as { name: string; count: number }[]);

  const COLORS = ['#0F3A6B', '#D4AF37', '#22C55E', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-navy-950 via-slate-900 to-slate-950 text-white shadow-[0_35px_100px_-48px_rgba(15,58,107,0.95)]">
        <CardContent className="relative p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.22),transparent_42%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.25fr_0.95fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">
                <Sparkles size={14} />
                Reflection Engine
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight sm:text-5xl">
                Turn trades into feedback, not just history.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                The journal now frames your performance, emotions, and review notes as one loop so improvement feels visible instead of abstract.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trades logged</p>
                <p className="mt-2 text-3xl font-semibold">{metrics.totalTrades}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Journal entries</p>
                <p className="mt-2 text-3xl font-semibold">{journalEntries.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Win rate</p>
                <p className="mt-2 text-3xl font-semibold">{metrics.winRate.toFixed(1)}%</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Open return</p>
                <p className={`mt-2 text-3xl font-semibold ${metrics.totalReturn >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {formatCurrency(metrics.totalReturn)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">Trade Journal</h2>
          <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Capture lessons, emotional patterns, and execution quality from every session.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          {showForm ? 'Close entry form' : 'New entry'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New journal entry</CardTitle>
            <CardDescription>Document the session while the logic and emotion are still fresh.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Daily notes</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="What happened in the market, what did you execute, and what stood out?"
                rows={4}
                className={`mt-1 w-full resize-none rounded-[1.25rem] border px-4 py-3 text-sm outline-none ${
                  isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Lessons learned</label>
              <textarea
                value={lessons}
                onChange={(event) => setLessons(event.target.value)}
                placeholder="What would you repeat, refine, or avoid next time?"
                rows={3}
                className={`mt-1 w-full resize-none rounded-[1.25rem] border px-4 py-3 text-sm outline-none ${
                  isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Day rating</label>
                <div className="mt-2 flex gap-1">
                  {([1, 2, 3, 4, 5] as const).map((currentRating) => (
                    <button key={currentRating} type="button" onClick={() => setRating(currentRating)}>
                      <Star
                        size={20}
                        className={
                          currentRating <= rating ? 'fill-gold-400 text-gold-400' : isDark ? 'text-slate-600' : 'text-slate-300'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Followed plan?</label>
                <div className="mt-2 flex gap-2">
                  <Button
                    onClick={() => setFollowedPlan(true)}
                    variant={followedPlan ? 'secondary' : 'outline'}
                    size="sm"
                    className={followedPlan ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300' : ''}
                  >
                    <CheckCircle size={14} />
                    Yes
                  </Button>
                  <Button
                    onClick={() => setFollowedPlan(false)}
                    variant={!followedPlan ? 'secondary' : 'outline'}
                    size="sm"
                    className={!followedPlan ? 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300' : ''}
                  >
                    <XCircle size={14} />
                    No
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={handleSubmit}>Save entry</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total trades', value: metrics.totalTrades.toString(), icon: Target },
          { label: 'Win rate', value: `${metrics.winRate.toFixed(1)}%`, icon: Sparkles },
          { label: 'Total return', value: formatCurrency(metrics.totalReturn), icon: CheckCircle, tone: metrics.totalReturn >= 0 ? 'text-emerald-500' : 'text-red-500' },
          { label: 'Entries', value: journalEntries.length.toString(), icon: BookOpen },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
                  <p className={`mt-2 text-3xl font-bold tracking-tight ${item.tone || ''}`}>{item.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                  <item.icon size={18} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trading emotions</CardTitle>
            <CardDescription>See which emotional states show up most often in your execution flow.</CardDescription>
          </CardHeader>
          <CardContent>
            {emotionData.length === 0 ? (
              <p className={`py-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Make trades to see emotion data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={emotionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={84}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {emotionData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Strategies used</CardTitle>
            <CardDescription>Review which setups you actually trade most often.</CardDescription>
          </CardHeader>
          <CardContent>
            {strategyData.length === 0 ? (
              <p className={`py-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tag trades with strategies to unlock this view.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={strategyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#e5e7eb'} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0F3A6B" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade history</CardTitle>
          <CardDescription>Audit your executions, strategy tags, and emotional state side by side.</CardDescription>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <p className={`py-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No trades yet. Start paper trading to build your journal.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Symbol</th>
                    <th className="px-3 py-2 text-right font-medium">Shares</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                    <th className="px-3 py-2 text-left font-medium">Strategy</th>
                    <th className="px-3 py-2 text-left font-medium">Emotion</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className={`border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                      <td className="px-3 py-3">{formatDate(trade.date)}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                            trade.type === 'buy'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                          }`}
                        >
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium">{trade.symbol}</td>
                      <td className="px-3 py-3 text-right">{trade.shares}</td>
                      <td className="px-3 py-3 text-right">{formatCurrency(trade.price)}</td>
                      <td className="px-3 py-3 text-right font-medium">{formatCurrency(trade.total)}</td>
                      <td className="px-3 py-3">{trade.strategy || '-'}</td>
                      <td className="px-3 py-3 capitalize">{trade.emotion || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {journalEntries.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Journal entries</h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Revisit past sessions to reinforce what worked and what still needs adjustment.
            </p>
          </div>
          {journalEntries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-gold-400" />
                    <span className="text-sm font-medium">{formatDate(entry.date)}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((currentRating) => (
                        <Star
                          key={currentRating}
                          size={12}
                          className={currentRating <= entry.rating ? 'fill-gold-400 text-gold-400' : 'text-slate-300 dark:text-slate-600'}
                        />
                      ))}
                    </div>
                  </div>
                  <Badge className={entry.followedPlan ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'}>
                    {entry.followedPlan ? 'Followed plan' : 'Deviated from plan'}
                  </Badge>
                </div>
                <p className={`text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{entry.notes}</p>
                {entry.lessonsLearned && (
                  <div className={`mt-4 rounded-[1.2rem] p-4 ${isDark ? 'bg-white/5' : 'bg-amber-50'}`}>
                    <p className={`mb-1 text-xs font-medium uppercase tracking-[0.18em] ${isDark ? 'text-gold-300' : 'text-amber-700'}`}>
                      Lessons learned
                    </p>
                    <p className={`text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-amber-900'}`}>{entry.lessonsLearned}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
