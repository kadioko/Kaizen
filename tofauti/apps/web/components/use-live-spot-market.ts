'use client';

import { useEffect, useState } from 'react';
import { getLiveSpotMarket, type LiveSpotMarket, LiveSpotUnavailable, type LiveSpotSymbol } from '@/lib/live-spot';

export function useLiveSpotMarket(initialMarket: LiveSpotSymbol = 'XAU/USD') {
  const [selectedMarket, setSelectedMarket] = useState<LiveSpotSymbol>(initialMarket);
  const [market, setMarket] = useState<LiveSpotMarket | null>(null);
  const [error, setError] = useState('');
  const [errorMarket, setErrorMarket] = useState<LiveSpotSymbol | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    const controller = new AbortController();
    const refresh = async () => {
      let retryMs = 300_000;
      try {
        if (document.visibilityState === 'hidden') return;
        const next = await getLiveSpotMarket(selectedMarket, AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]));
        if (active) {
          setMarket(next);
          setError('');
          setErrorMarket(selectedMarket);
          setNow(Date.now());
        }
      } catch (failure) {
        if (failure instanceof LiveSpotUnavailable) retryMs = failure.retrySeconds * 1000;
        if (active) {
          setError(failure instanceof LiveSpotUnavailable ? failure.message : 'This live spot reference is temporarily unavailable.');
          setErrorMarket(selectedMarket);
        }
      } finally {
        if (active) timer = window.setTimeout(() => void refresh(), retryMs);
      }
    };
    void refresh();
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      controller.abort();
      if (timer) window.clearTimeout(timer);
      window.clearInterval(clock);
    };
  }, [selectedMarket]);

  return {
    selectedMarket,
    setSelectedMarket,
    market: market?.market === selectedMarket ? market : null,
    error: errorMarket === selectedMarket ? error : '',
    now,
  };
}
