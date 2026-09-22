export interface OfficialMacroEvent {
  id: string;
  title: string;
  date: string;
  duration_days: number;
  severity: 'HIGH';
  expected_volatility_impact: 'HIGH';
  impact_basis: string;
  source_name: 'Federal Reserve';
  source_url: string;
  timing_note: string;
}

export interface OfficialMacroSchedule {
  source_name: 'Federal Reserve';
  source_url: string;
  fetched_at: string;
  events: OfficialMacroEvent[];
  coverage_note: string;
  impact_boundary: string;
}

export class OfficialMacroUnavailable extends Error {
  retrySeconds: number;

  constructor(message: string, retrySeconds = 900) {
    super(message);
    this.retrySeconds = retrySeconds;
  }
}

export async function getOfficialMacroSchedule(signal?: AbortSignal): Promise<OfficialMacroSchedule> {
  const response = await fetch('/api/macro/us-risk', { cache: 'no-store', signal });
  if (!response.ok) throw new OfficialMacroUnavailable('The official macro schedule is temporarily unavailable. No mock events are displayed.');
  return response.json() as Promise<OfficialMacroSchedule>;
}
