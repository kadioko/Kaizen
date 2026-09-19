export interface GoldSpotBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface GoldSpotReference {
  provider: 'Twelve Data';
  market: 'XAU/USD';
  asset_class: 'spot_reference';
  price: number;
  as_of: string;
  fetched_at: string;
  freshness_seconds: number;
  freshness: 'CURRENT' | 'STALE';
  bars: GoldSpotBar[];
  limitations: string[];
}

export async function getGoldSpotReference(signal?: AbortSignal): Promise<GoldSpotReference> {
  const response = await fetch('/api/reference/gold', { cache: 'no-store', signal });
  if (!response.ok) throw new Error('Gold spot reference is temporarily unavailable.');
  return response.json() as Promise<GoldSpotReference>;
}
