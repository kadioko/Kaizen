'use client';

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import type { MarketSnapshot } from '@/lib/types';
import { browserDemoSnapshot, type Scenario } from '@/lib/browser-demo';
import { getSnapshot, marketSocketUrl, usesBrowserDemo } from '@/lib/market-api';
import { parseSnapshot } from '@/lib/market-validation';

function useMarketStream(symbol: 'GC' | 'MGC', scenario: Scenario) {
  const [result, setResult] = useState<{ key: string; snapshot: MarketSnapshot } | null>(null);
  const [connection, setConnection] = useState('connecting');
  const [error, setError] = useState('');
  const key = symbol + scenario;
  useEffect(() => {
    if (usesBrowserDemo()) {
      let frame = 0;
      const replay = () => setResult({ key, snapshot: browserDemoSnapshot(scenario, frame++, symbol) });
      replay();
      const timer = window.setInterval(replay, 900);
      return () => window.clearInterval(timer);
    }
    let active = true;
    let socket: WebSocket | undefined;
    let reconnectTimer: number | undefined;
    let lastMessage = 0;
    let attempt = 0;
    const controller = new AbortController();
    const accept = (snapshot: MarketSnapshot) => {
      if (!active) return;
      setResult({ key, snapshot });
      setError('');
      lastMessage = Date.now();
    };
    getSnapshot(symbol, controller.signal).then(accept).catch(() => {
      if (active) setError('Market service unavailable. Waiting for a valid snapshot.');
    });
    const connect = () => {
      if (!active) return;
      const url = marketSocketUrl(symbol);
      if (!url) return;
      socket = new WebSocket(url);
      lastMessage = Date.now();
      socket.onopen = () => active && setConnection('awaiting-data');
      socket.onmessage = (event) => {
        try {
          const snapshot = parseSnapshot(JSON.parse(event.data), symbol);
          accept(snapshot);
          if (active) { attempt = 0; setConnection('connected'); }
        } catch {
          if (active) setError('Invalid stream data rejected. Reconnecting.');
          socket?.close();
        }
      };
      socket.onclose = () => {
        if (!active) return;
        setConnection('reconnecting');
        reconnectTimer = window.setTimeout(connect, Math.min(30_000, 1000 * 2 ** Math.min(attempt++, 5)));
      };
      socket.onerror = () => socket?.close();
    };
    connect();
    const watchdog = window.setInterval(() => {
      if (Date.now() - lastMessage > 15_000) {
        setConnection('stale');
        setError('No recent stream update. Last snapshot is retained for reference.');
        if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
      }
    }, 3000);
    return () => { active = false; controller.abort(); socket?.close(); window.clearTimeout(reconnectTimer); window.clearInterval(watchdog); };
  }, [key, scenario, symbol]);

  return { snapshot: result?.key === key ? result.snapshot : null, connection: usesBrowserDemo() ? 'browser-demo' : connection, error: usesBrowserDemo() ? '' : error };
}

type Workspace = ReturnType<typeof useMarketStream> & {
  symbol: 'GC' | 'MGC';
  scenario: Scenario;
  setSymbol: (symbol: 'GC' | 'MGC') => void;
  setScenario: (scenario: Scenario) => void;
};
const MarketContext = createContext<Workspace | null>(null);

export function MarketWorkspaceProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbol] = useState<'GC' | 'MGC'>('GC');
  const [scenario, setScenario] = useState<Scenario>('bearish_liquidity_sweep');
  const stream = useMarketStream(symbol, scenario);
  return createElement(MarketContext.Provider, { value: { ...stream, symbol, scenario, setSymbol, setScenario } }, children);
}

export function useMarketSnapshot() {
  const workspace = useContext(MarketContext);
  if (!workspace) throw new Error('Market workspace provider is missing.');
  return workspace;
}
