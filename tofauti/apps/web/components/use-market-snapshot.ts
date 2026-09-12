'use client';

import { useEffect, useState } from 'react';
import type { MarketSnapshot } from '@/lib/types';
import { browserDemoSnapshot } from '@/lib/browser-demo';
import { getSnapshot, marketSocketUrl, usesBrowserDemo } from '@/lib/market-api';

export function useMarketSnapshot(symbol: 'GC' | 'MGC' = 'GC') {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [connection, setConnection] = useState<'live' | 'browser-demo' | 'reconnecting'>('reconnecting');

  useEffect(() => {
    if (usesBrowserDemo()) {
      let frame = 7;
      const replay = () => setSnapshot(browserDemoSnapshot('bearish_liquidity_sweep', frame++, symbol));
      replay();
      const timer = window.setInterval(replay, 900);
      return () => window.clearInterval(timer);
    }
    let active = true;
    let socket: WebSocket | undefined;
    let reconnectTimer: number | undefined;
    getSnapshot(symbol).then((next) => active && setSnapshot(next)).catch(() => active && setConnection('reconnecting'));
    const connect = () => {
      const url = marketSocketUrl(symbol);
      if (!url) return;
      socket = new WebSocket(url);
      socket.onopen = () => active && setConnection('live');
      socket.onmessage = (event) => active && setSnapshot(JSON.parse(event.data) as MarketSnapshot);
      socket.onclose = () => { if (active) { setConnection('reconnecting'); reconnectTimer = window.setTimeout(connect, 1500); } };
      socket.onerror = () => socket?.close();
    };
    connect();
    return () => { active = false; socket?.close(); if (reconnectTimer) window.clearTimeout(reconnectTimer); };
  }, [symbol]);

  return { snapshot, connection: usesBrowserDemo() ? 'browser-demo' : connection };
}
