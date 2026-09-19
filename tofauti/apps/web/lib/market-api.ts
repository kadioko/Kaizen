import type { MarketSnapshot } from '@/lib/types';

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

function apiUrl() {
  if (configuredApiUrl) return configuredApiUrl;
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) return 'http://localhost:8000';
  return null;
}

export function usesBrowserDemo() {
  return apiUrl() === null;
}

export function marketTransportLabel() {
  return usesBrowserDemo() ? 'SIMULATED REPLAY' : 'API STREAM CONNECTED';
}

export async function getSnapshot(symbol = 'GC'): Promise<MarketSnapshot> {
  const baseUrl = apiUrl();
  if (!baseUrl) throw new Error('No hosted market API is configured.');
  const response = await fetch(`${baseUrl}/api/snapshot/${symbol}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Market snapshot unavailable (${response.status}).`);
  return response.json() as Promise<MarketSnapshot>;
}

export function marketSocketUrl(symbol = 'GC') {
  const baseUrl = apiUrl();
  if (!baseUrl) return null;
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `/ws/market/${symbol}`;
  return url.toString();
}

export async function setDemoScenario(scenario: string) {
  const baseUrl = apiUrl();
  if (!baseUrl) return;
  const response = await fetch(`${baseUrl}/api/demo/scenario`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario }),
  });
  if (!response.ok) throw new Error('Could not change the demo scenario.');
}
