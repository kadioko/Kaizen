import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { BookOpen, Plus, Star, CheckCircle, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Journal() {
  const { isDark } = useTheme();
  const { trades, journalEntries, addJournalEntry, getPerformanceMetrics } = useTrading();
  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [lessons, setLessons] = useState('');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [followedPlan, setFollowedPlan] = useState(true);

  const metrics = getPerformanceMetrics();

  const cardBg = isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100';
  const inputBg = isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900';

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
    setShowForm(false);
  };

  const emotionData = trades.reduce((acc, t) => {
    const emotion = t.emotion || 'neutral';
    const existing = acc.find(a => a.name === emotion);
    if (existing) existing.value++;
    else acc.push({ name: emotion, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['#0F3A6B', '#D4AF37', '#22C55E', '#EF4444', '#8B5CF6'];


  const strategyData = trades.reduce((acc, t) => {
    const strat = t.strategy || 'No Strategy';
    const existing = acc.find(a => a.name === strat);
    if (existing) existing.count++;
    else acc.push({ name: strat, count: 1 });
    return acc;
  }, [] as { name: string; count: number }[]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Trade Journal</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Track, analyze, and learn from every trade</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-navy-800 text-white rounded-lg text-sm font-medium hover:bg-navy-700 transition-colors"
        >
          <Plus size={16} /> New Entry
        </button>
      </div>

      {showForm && (
        <div className={`rounded-xl p-6 shadow-sm mb-6 ${cardBg}`}>
          <h3 className="font-semibold mb-4">New Journal Entry</h3>
          <div className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Daily Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What happened in the market today? How did your trades go?"
                rows={3}
                className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none ${inputBg}`}
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Lessons Learned</label>
              <textarea
                value={lessons}
                onChange={e => setLessons(e.target.value)}
                placeholder="What did you learn today? What would you do differently?"
                rows={2}
                className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none ${inputBg}`}
              />
            </div>
            <div className="flex items-center gap-6">
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Day Rating</label>
                <div className="flex gap-1 mt-1">
                  {([1, 2, 3, 4, 5] as const).map(r => (
                    <button key={r} onClick={() => setRating(r)}>
                      <Star size={20} className={r <= rating ? 'text-gold-400 fill-gold-400' : isDark ? 'text-gray-600' : 'text-gray-300'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Followed Plan?</label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setFollowedPlan(true)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${followedPlan ? 'bg-emerald-100 text-emerald-700' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                  >
                    <CheckCircle size={14} /> Yes
                  </button>
                  <button
                    onClick={() => setFollowedPlan(false)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${!followedPlan ? 'bg-red-100 text-red-700' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                  >
                    <XCircle size={14} /> No
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-navy-800 text-white rounded-lg text-sm font-medium hover:bg-navy-700 transition-colors"
            >
              Save Entry
            </button>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className={`rounded-xl p-5 shadow-sm ${cardBg}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Trades</p>
          <p className="text-2xl font-bold mt-1">{metrics.totalTrades}</p>
        </div>
        <div className={`rounded-xl p-5 shadow-sm ${cardBg}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Win Rate</p>
          <p className="text-2xl font-bold mt-1">{metrics.winRate.toFixed(1)}%</p>
        </div>
        <div className={`rounded-xl p-5 shadow-sm ${cardBg}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Return</p>
          <p className={`text-2xl font-bold mt-1 ${metrics.totalReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatCurrency(metrics.totalReturn)}
          </p>
        </div>
        <div className={`rounded-xl p-5 shadow-sm ${cardBg}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Journal Entries</p>
          <p className="text-2xl font-bold mt-1">{journalEntries.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Emotion Distribution */}
        <div className={`rounded-xl p-6 shadow-sm ${cardBg}`}>
          <h3 className="font-semibold mb-4">Trading Emotions</h3>
          {emotionData.length === 0 ? (
            <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Make trades to see emotion data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={emotionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {emotionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Strategy Distribution */}
        <div className={`rounded-xl p-6 shadow-sm ${cardBg}`}>
          <h3 className="font-semibold mb-4">Strategies Used</h3>
          {strategyData.length === 0 ? (
            <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Tag trades with strategies to see data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={strategyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#f0f0f0'} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0F3A6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Trade History */}
      <div className={`rounded-xl p-6 shadow-sm ${cardBg}`}>
        <h3 className="font-semibold mb-4">Trade History</h3>
        {trades.length === 0 ? (
          <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No trades yet. Start paper trading to build your journal.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  <th className="text-left py-2 px-3 font-medium">Date</th>
                  <th className="text-left py-2 px-3 font-medium">Type</th>
                  <th className="text-left py-2 px-3 font-medium">Symbol</th>
                  <th className="text-right py-2 px-3 font-medium">Shares</th>
                  <th className="text-right py-2 px-3 font-medium">Price</th>
                  <th className="text-right py-2 px-3 font-medium">Total</th>
                  <th className="text-left py-2 px-3 font-medium">Strategy</th>
                  <th className="text-left py-2 px-3 font-medium">Emotion</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(trade => (
                  <tr key={trade.id} className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <td className="py-3 px-3">{formatDate(trade.date)}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${trade.type === 'buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium">{trade.symbol}</td>
                    <td className="py-3 px-3 text-right">{trade.shares}</td>
                    <td className="py-3 px-3 text-right">{formatCurrency(trade.price)}</td>
                    <td className="py-3 px-3 text-right font-medium">{formatCurrency(trade.total)}</td>
                    <td className="py-3 px-3">{trade.strategy || '—'}</td>
                    <td className="py-3 px-3 capitalize">{trade.emotion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Journal Entries */}
      {journalEntries.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold">Journal Entries</h3>
          {journalEntries.map(entry => (
            <div key={entry.id} className={`rounded-xl p-6 shadow-sm ${cardBg}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <BookOpen size={16} className="text-gold-400" />
                  <span className="text-sm font-medium">{formatDate(entry.date)}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(r => (
                      <Star key={r} size={12} className={r <= entry.rating ? 'text-gold-400 fill-gold-400' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${entry.followedPlan ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {entry.followedPlan ? 'Followed Plan' : 'Deviated from Plan'}
                </span>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{entry.notes}</p>
              {entry.lessonsLearned && (
                <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-amber-50'}`}>
                  <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gold-400' : 'text-amber-700'}`}>Lessons Learned</p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-amber-800'}`}>{entry.lessonsLearned}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
