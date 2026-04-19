import React, { useState } from 'react';
import { Activity, BarChart3, Bell, Plus, Sparkles, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { useMarketData } from '../context/MarketDataContext';
import { useTheme } from '../context/ThemeContext';
import { formatInstrumentQuote, getInstrumentCategory } from '../utils/helpers';
import { Alert } from '../types';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

const ALERT_TYPES: { value: Alert['type']; label: string; icon: React.ElementType }[] = [
  { value: 'price_above', label: 'Price Above', icon: TrendingUp },
  { value: 'price_below', label: 'Price Below', icon: TrendingDown },
  { value: 'volume_spike', label: 'Volume Spike', icon: BarChart3 },
  { value: 'rsi_overbought', label: 'RSI Overbought (>70)', icon: Activity },
  { value: 'rsi_oversold', label: 'RSI Oversold (<30)', icon: Activity },
  { value: 'macd_cross', label: 'MACD Crossover', icon: Activity },
];

export default function Alerts() {
  const { isDark } = useTheme();
  const { alerts, addAlert, removeAlert } = useTrading();
  const { instruments } = useMarketData();
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState('AAPL');
  const [alertType, setAlertType] = useState<Alert['type']>('price_above');
  const [value, setValue] = useState('');

  const handleCreate = () => {
    if (!value) return;
    addAlert({
      symbol,
      type: alertType,
      value: parseFloat(value),
      active: true,
    });
    setValue('');
    setShowForm(false);
  };

  const activeAlerts = alerts.filter((alert) => alert.active && !alert.triggered);
  const triggeredAlerts = alerts.filter((alert) => alert.triggered);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-navy-950 to-slate-900 text-white shadow-[0_35px_100px_-48px_rgba(15,58,107,0.95)]">
        <CardContent className="relative p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_42%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.25fr_0.95fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">
                <Sparkles size={14} />
                Trigger Desk
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight sm:text-5xl">
                Build the watchlist that protects your attention.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Alerts now feel like an operating surface instead of a basic list, with clearer counts, cleaner trigger setup, and more readable pending signals.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active</p>
                <p className="mt-2 text-3xl font-semibold">{activeAlerts.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Triggered</p>
                <p className="mt-2 text-3xl font-semibold">{triggeredAlerts.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
                <p className="mt-2 text-3xl font-semibold">{alerts.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">Alerts</h2>
          <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Set market triggers across stocks, prediction markets, forex, and crypto.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          {showForm ? 'Close alert form' : 'New alert'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create alert</CardTitle>
            <CardDescription>Build a watchlist trigger using live market quotes and technical thresholds.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Market</label>
                <select
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                  className={`mt-1 w-full rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                >
                  {instruments.map((instrument) => (
                    <option key={instrument.symbol} value={instrument.symbol}>
                      {instrument.symbol} - {instrument.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Alert type</label>
                <select
                  value={alertType}
                  onChange={(event) => setAlertType(event.target.value as Alert['type'])}
                  className={`mt-1 w-full rounded-[1.1rem] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                >
                  {ALERT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {alertType.includes('price') ? 'Price ($)' : alertType.includes('rsi') ? 'RSI value' : 'Threshold'}
                </label>
                <Input
                  type="number"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={alertType.includes('price') ? '0.00' : '0'}
                  className="mt-1 rounded-[1.1rem]"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreate} disabled={!value} className="w-full">
                  Create alert
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Active alerts', value: activeAlerts.length, tone: 'text-gold-500' },
          { label: 'Triggered', value: triggeredAlerts.length, tone: 'text-emerald-500' },
          { label: 'Total alerts', value: alerts.length, tone: isDark ? 'text-slate-400' : 'text-slate-500' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight">{item.value}</p>
                </div>
                <Bell size={18} className={item.tone} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active alerts</CardTitle>
          <CardDescription>Monitor pending triggers and remove setups that no longer fit your plan.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <p className={`py-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No active alerts. Create one to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => {
                const instrument = instruments.find((item) => item.symbol === alert.symbol);
                const typeInfo = ALERT_TYPES.find((type) => type.value === alert.type)!;
                const Icon = typeInfo.icon;
                const category = instrument ? getInstrumentCategory(instrument) : 'stock';

                return (
                  <div key={alert.id} className={`flex items-center justify-between rounded-[1.35rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-navy-50 text-navy-700'}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{alert.symbol} - {typeInfo.label}</p>
                          <Badge variant={category === 'prediction' ? 'gold' : 'outline'}>{category}</Badge>
                        </div>
                        <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Target: {alert.type.includes('price') ? formatInstrumentQuote(instrument || { quoteUnit: 'usd' }, alert.value) : alert.value}
                          {instrument && ` | Current: ${formatInstrumentQuote(instrument, instrument.price)}`}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => removeAlert(alert.id)} variant="ghost" size="icon">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className={`rounded-[1.2rem] border p-4 text-xs ${isDark ? 'border-white/10 bg-white/5 text-slate-400' : 'border-slate-200 bg-white/70 text-slate-500'}`}>
        Alerts are simulated for paper trading. In a live environment, triggers would fire in real time from market data feeds.
      </div>
    </div>
  );
}
