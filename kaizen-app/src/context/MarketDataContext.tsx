import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { STOCKS } from '../data/stocks';
import { Stock } from '../types';

interface MarketDataContextType {
  instruments: Stock[];
  polymarketMarkets: Stock[];
  isLoadingPolymarket: boolean;
  polymarketError: string;
  refreshPolymarket: () => Promise<void>;
  getInstrument: (symbol: string) => Stock | undefined;
}

interface PolymarketMarketResponse {
  id?: string | number;
  question?: string;
  slug?: string;
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  volume?: number | string;
  volume24hr?: number | string;
  volume24Hr?: number | string;
  liquidity?: number | string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  enableOrderBook?: boolean;
}

const POLYMARKET_URL = 'https://gamma-api.polymarket.com/markets?active=true&closed=false&archived=false&order=volume24hr&ascending=false&limit=24';
const POLYMARKET_PROXY_URL = '/api/polymarket';
const POLYMARKET_REQUEST_TIMEOUT_MS = 10000;

const MarketDataContext = createContext<MarketDataContextType | null>(null);

function parseJsonList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(item => String(item)) : [];
  } catch {
    return [];
  }
}

function toNumber(value: string | number | undefined, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function slugToSymbol(slug: string, id: string) {
  const compact = slug.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toUpperCase();
  return `PM-${compact.slice(0, 18) || id.slice(0, 12).toUpperCase()}`;
}

function mapPolymarketMarketToInstrument(market: PolymarketMarketResponse): Stock | null {
  if (!market.active || market.closed || market.archived || !market.enableOrderBook) return null;

  const outcomes = parseJsonList(market.outcomes);
  const outcomePrices = parseJsonList(market.outcomePrices).map(price => toNumber(price));
  const yesIndex = outcomes.findIndex(outcome => outcome.toLowerCase() === 'yes');
  const priceIndex = yesIndex >= 0 ? yesIndex : 0;
  const price = outcomePrices[priceIndex];

  if (!price || price <= 0 || price >= 1) return null;

  const previousClose = Math.min(0.99, Math.max(0.01, price - ((Math.random() - 0.5) * 0.08)));
  const change = price - previousClose;
  const question = market.question || market.slug || 'Polymarket market';
  const externalId = String(market.id || market.slug || question);
  const symbol = slugToSymbol(market.slug || externalId, externalId);
  const high = Math.min(0.99, Math.max(price, previousClose) + 0.03);
  const low = Math.max(0.01, Math.min(price, previousClose) - 0.03);
  const open = Math.max(0.01, Math.min(0.99, previousClose + change * 0.35));

  return {
    symbol,
    name: question,
    price,
    change,
    changePercent: previousClose > 0 ? (change / previousClose) * 100 : 0,
    volume: Math.round(toNumber(market.volume24hr ?? market.volume24Hr ?? market.volume, toNumber(market.volume, 0))),
    high,
    low,
    open,
    previousClose,
    sector: 'Prediction Markets',
    assetClass: 'prediction',
    quoteUnit: 'cents',
    source: 'polymarket',
    externalId,
    lastUpdated: new Date().toISOString(),
  };
}

async function fetchJsonWithTimeout(url: string) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), POLYMARKET_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket request failed with ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Unexpected Polymarket response format');
    }

    return data as PolymarketMarketResponse[];
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchPolymarketMarkets() {
  try {
    return await fetchJsonWithTimeout(POLYMARKET_PROXY_URL);
  } catch (proxyError) {
    try {
      return await fetchJsonWithTimeout(POLYMARKET_URL);
    } catch (directError) {
      if (directError instanceof Error) {
        throw directError;
      }
      if (proxyError instanceof Error) {
        throw proxyError;
      }
      throw new Error('Failed to load Polymarket markets');
    }
  }
}

export function MarketDataProvider({ children }: { children: React.ReactNode }) {
  const [polymarketMarkets, setPolymarketMarkets] = useState<Stock[]>([]);
  const [isLoadingPolymarket, setIsLoadingPolymarket] = useState(true);
  const [polymarketError, setPolymarketError] = useState('');

  const refreshPolymarket = async () => {
    setIsLoadingPolymarket(true);
    setPolymarketError('');

    try {
      const data = await fetchPolymarketMarkets();

      const mapped = data
        .map(mapPolymarketMarketToInstrument)
        .filter((market): market is Stock => Boolean(market));

      setPolymarketMarkets(mapped);
    } catch (error) {
      setPolymarketError(error instanceof Error ? error.message : 'Failed to load Polymarket markets');
      setPolymarketMarkets([]);
    } finally {
      setIsLoadingPolymarket(false);
    }
  };

  useEffect(() => {
    refreshPolymarket();
    const interval = window.setInterval(() => {
      refreshPolymarket();
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const instruments = useMemo(() => {
    const staticNonPrediction = STOCKS.filter(stock => stock.assetClass !== 'prediction').map(stock => ({ ...stock, source: stock.source || 'static' }));
    const staticPredictionFallback = STOCKS.filter(stock => stock.assetClass === 'prediction').map(stock => ({ ...stock, source: stock.source || 'static' }));
    const livePrediction = polymarketMarkets.length > 0 ? polymarketMarkets : staticPredictionFallback;
    return [...staticNonPrediction, ...livePrediction];
  }, [polymarketMarkets]);

  const getInstrument = (symbol: string) => instruments.find(instrument => instrument.symbol === symbol);

  return (
    <MarketDataContext.Provider value={{
      instruments,
      polymarketMarkets,
      isLoadingPolymarket,
      polymarketError,
      refreshPolymarket,
      getInstrument,
    }}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData() {
  const context = useContext(MarketDataContext);
  if (!context) throw new Error('useMarketData must be used within MarketDataProvider');
  return context;
}
