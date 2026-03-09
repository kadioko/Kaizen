import React, { createContext, useContext, useState, useCallback } from 'react';
import { Position, Trade, Alert, JournalEntry } from '../types';
import { useMarketData } from './MarketDataContext';
import { generateId } from '../utils/helpers';

interface TradingContextType {
  balance: number;
  positions: Position[];
  trades: Trade[];
  alerts: Alert[];
  journalEntries: JournalEntry[];
  executeTrade: (symbol: string, shares: number, type: 'buy' | 'sell', notes?: string, strategy?: string, emotion?: Trade['emotion']) => boolean;
  addAlert: (alert: Omit<Alert, 'id' | 'triggered' | 'createdAt'>) => void;
  removeAlert: (id: string) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  getPerformanceMetrics: () => { totalTrades: number; winRate: number; avgWin: number; avgLoss: number; profitFactor: number; totalReturn: number; totalReturnPercent: number };
}

const INITIAL_BALANCE = 100000;

const TradingContext = createContext<TradingContextType | null>(null);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const { getInstrument } = useMarketData();
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('kaizen-balance');
    return saved ? parseFloat(saved) : INITIAL_BALANCE;
  });

  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('kaizen-positions');
    return saved ? JSON.parse(saved) : [];
  });

  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('kaizen-trades');
    return saved ? JSON.parse(saved) : [];
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('kaizen-alerts');
    return saved ? JSON.parse(saved) : [];
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('kaizen-journal');
    return saved ? JSON.parse(saved) : [];
  });

  const saveState = useCallback((key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, []);

  const executeTrade = useCallback((symbol: string, shares: number, type: 'buy' | 'sell', notes?: string, strategy?: string, emotion?: Trade['emotion']): boolean => {
    const stock = getInstrument(symbol);
    if (!stock) return false;

    const total = stock.price * shares;

    if (type === 'buy') {
      if (total > balance) return false;

      const existingPosition = positions.find(p => p.symbol === symbol);
      let newPositions: Position[];

      if (existingPosition) {
        const totalShares = existingPosition.shares + shares;
        const avgPrice = ((existingPosition.entryPrice * existingPosition.shares) + (stock.price * shares)) / totalShares;
        newPositions = positions.map(p =>
          p.symbol === symbol ? { ...p, shares: totalShares, entryPrice: avgPrice, currentPrice: stock.price } : p
        );
      } else {
        newPositions = [...positions, {
          id: generateId(),
          symbol,
          name: stock.name,
          shares,
          entryPrice: stock.price,
          currentPrice: stock.price,
          entryDate: new Date().toISOString(),
          type: 'long',
        }];
      }

      setPositions(newPositions);
      setBalance(b => { const nb = b - total; localStorage.setItem('kaizen-balance', nb.toString()); return nb; });
      saveState('kaizen-positions', newPositions);
    } else {
      const position = positions.find(p => p.symbol === symbol);
      if (!position || position.shares < shares) return false;

      let newPositions: Position[];
      if (position.shares === shares) {
        newPositions = positions.filter(p => p.symbol !== symbol);
      } else {
        newPositions = positions.map(p =>
          p.symbol === symbol ? { ...p, shares: p.shares - shares, currentPrice: stock.price } : p
        );
      }

      setPositions(newPositions);
      setBalance(b => { const nb = b + total; localStorage.setItem('kaizen-balance', nb.toString()); return nb; });
      saveState('kaizen-positions', newPositions);
    }

    const trade: Trade = {
      id: generateId(),
      symbol,
      name: stock.name,
      type,
      shares,
      price: stock.price,
      total,
      date: new Date().toISOString(),
      notes,
      strategy,
      emotion,
    };

    const newTrades = [trade, ...trades];
    setTrades(newTrades);
    saveState('kaizen-trades', newTrades);

    return true;
  }, [balance, positions, trades, saveState, getInstrument]);

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'triggered' | 'createdAt'>) => {
    const newAlert: Alert = {
      ...alert,
      id: generateId(),
      triggered: false,
      createdAt: new Date().toISOString(),
    };
    const newAlerts = [newAlert, ...alerts];
    setAlerts(newAlerts);
    saveState('kaizen-alerts', newAlerts);
  }, [alerts, saveState]);

  const removeAlert = useCallback((id: string) => {
    const newAlerts = alerts.filter(a => a.id !== id);
    setAlerts(newAlerts);
    saveState('kaizen-alerts', newAlerts);
  }, [alerts, saveState]);

  const addJournalEntry = useCallback((entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = { ...entry, id: generateId() };
    const newEntries = [newEntry, ...journalEntries];
    setJournalEntries(newEntries);
    saveState('kaizen-journal', newEntries);
  }, [journalEntries, saveState]);

  const getPerformanceMetrics = useCallback(() => {
    const closedTrades = trades.filter(t => t.type === 'sell');
    const wins = closedTrades.filter(t => {
      const buyTrade = trades.find(bt => bt.symbol === t.symbol && bt.type === 'buy' && new Date(bt.date) < new Date(t.date));
      return buyTrade ? t.price > buyTrade.price : false;
    });

    const totalReturn = positions.reduce((sum, p) => sum + ((p.currentPrice - p.entryPrice) * p.shares), 0);

    return {
      totalTrades: trades.length,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      avgWin: wins.length > 0 ? wins.reduce((s, t) => s + t.total, 0) / wins.length : 0,
      avgLoss: 0,
      profitFactor: 0,
      totalReturn,
      totalReturnPercent: (totalReturn / INITIAL_BALANCE) * 100,
    };
  }, [trades, positions]);

  return (
    <TradingContext.Provider value={{
      balance, positions, trades, alerts, journalEntries,
      executeTrade, addAlert, removeAlert, addJournalEntry, getPerformanceMetrics,
    }}>
      {children}
    </TradingContext.Provider>
  );
}

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) throw new Error('useTrading must be used within TradingProvider');
  return context;
};
