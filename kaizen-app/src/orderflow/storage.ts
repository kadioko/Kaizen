export const COMMANDER_STORAGE_VERSION = 1;
export const COMMANDER_STORAGE_KEY = `kaizen.orderflow.commander.v${COMMANDER_STORAGE_VERSION}`;

export function loadCommanderState<T>(fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(COMMANDER_STORAGE_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function saveCommanderState<T>(state: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(COMMANDER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

export function clearCommanderState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(COMMANDER_STORAGE_KEY);
}
