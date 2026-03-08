import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { useTheme } from '../context/ThemeContext';
import { STOCKS } from '../data/stocks';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { Alert } from '../types';

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
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState('AAPL');
  const [alertType, setAlertType] = useState<Alert['type']>('price_above');
  const [value, setValue] = useState('');

  const cardBg = isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100';
  const inputBg = isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900';

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

  const activeAlerts = alerts.filter(a => a.active && !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Alerts</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Set price levels and technical signals to watch</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-navy-800 text-white rounded-lg text-sm font-medium hover:bg-navy-700 transition-colors"
        >
          <Plus size={16} /> New Alert
        </button>
      </div>

      {showForm && (
        <div className={`rounded-xl p-6 shadow-sm mb-6 ${cardBg}`}>
          <h3 className="font-semibold mb-4">Create Alert</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Stock</label>
              <select
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none ${inputBg}`}
              >
                {STOCKS.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Alert Type</label>
              <select
                value={alertType}
                onChange={e => setAlertType(e.target.value as Alert['type'])}
                className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none ${inputBg}`}
              >
                {ALERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {alertType.includes('price') ? 'Price ($)' : alertType.includes('rsi') ? 'RSI Value' : 'Threshold'}
              </label>
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={alertType.includes('price') ? '0.00' : '0'}
                className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none ${inputBg}`}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreate}
                disabled={!value}
                className="w-full py-2 bg-navy-800 text-white rounded-lg text-sm font-medium hover:bg-navy-700 transition-colors disabled:opacity-50"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={`rounded-xl p-5 shadow-sm ${cardBg}`}>
          <div className="flex items-center gap-2 mb-1">
            <Bell size={16} className="text-gold-400" />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Active Alerts</span>
          </div>
          <p className="text-2xl font-bold">{activeAlerts.length}</p>
        </div>
        <div className={`rounded-xl p-5 shadow-sm ${cardBg}`}>
          <div className="flex items-center gap-2 mb-1">
            <Bell size={16} className="text-emerald-500" />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Triggered</span>
          </div>
          <p className="text-2xl font-bold">{triggeredAlerts.length}</p>
        </div>
        <div className={`rounded-xl p-5 shadow-sm ${cardBg}`}>
          <div className="flex items-center gap-2 mb-1">
            <Bell size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total</span>
          </div>
          <p className="text-2xl font-bold">{alerts.length}</p>
        </div>
      </div>

      {/* Active Alerts */}
      <div className={`rounded-xl p-6 shadow-sm mb-6 ${cardBg}`}>
        <h3 className="font-semibold mb-4">Active Alerts</h3>
        {activeAlerts.length === 0 ? (
          <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            No active alerts. Create one to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map(alert => {
              const stock = STOCKS.find(s => s.symbol === alert.symbol);
              const typeInfo = ALERT_TYPES.find(t => t.value === alert.type)!;
              const Icon = typeInfo.icon;
              return (
                <div key={alert.id} className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-navy-50'}`}>
                      <Icon size={18} className="text-navy-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{alert.symbol} — {typeInfo.label}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Target: {alert.type.includes('price') ? formatCurrency(alert.value) : alert.value}
                        {stock && ` | Current: ${formatCurrency(stock.price)}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-200 text-gray-400'}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`p-4 rounded-lg text-xs ${isDark ? 'bg-gray-900/50 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
        Alerts are simulated for paper trading purposes. In a live environment, alerts would trigger in real-time
        based on market data feeds.
      </div>
    </div>
  );
}
