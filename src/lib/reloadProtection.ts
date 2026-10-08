/**
 * Reload Protection Library
 *
 * Prevents infinite reload loops by tracking reload attempts and enforcing limits.
 * Used by ErrorBoundary, LazyLoadErrorBoundary, and Service Worker hooks.
 */

const RELOAD_HISTORY_KEY = 'numa:reload_history';
const GLOBAL_RELOAD_COUNT_KEY = 'numa:global_reload_count';
const MAX_RELOADS_PER_WINDOW = 5; // Maximum reloads allowed in time window
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const FORCE_STOP_THRESHOLD = 10; // Emergency stop after 10 reloads

interface ReloadEntry {
  timestamp: number;
  reason: string;
  pathname: string;
}

/**
 * Gets the reload history from sessionStorage
 */
function getReloadHistory(): ReloadEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = sessionStorage.getItem(RELOAD_HISTORY_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored) as ReloadEntry[];
    const now = Date.now();

    // Filter out entries older than the time window
    return history.filter(entry => (now - entry.timestamp) < WINDOW_MS);
  } catch {
    return [];
  }
}

/**
 * Saves the reload history to sessionStorage
 */
function saveReloadHistory(history: ReloadEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(RELOAD_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Gets global reload count (across all reasons)
 */
function getGlobalReloadCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const count = sessionStorage.getItem(GLOBAL_RELOAD_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Increments global reload count
 */
function incrementGlobalReloadCount(): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getGlobalReloadCount();
    sessionStorage.setItem(GLOBAL_RELOAD_COUNT_KEY, (current + 1).toString());
  } catch {
    // Ignore storage errors
  }
}

/**
 * Checks if it's safe to reload based on recent history
 *
 * @param reason - The reason for the reload (e.g., 'chunk_error', 'service_worker')
 * @returns true if safe to reload, false if threshold exceeded
 */
export function canSafelyReload(reason: string): boolean {
  const history = getReloadHistory();
  const globalCount = getGlobalReloadCount();

  // Emergency stop - too many reloads total
  if (globalCount >= FORCE_STOP_THRESHOLD) {
    return false;
  }

  // Check if we've exceeded the limit for this time window
  if (history.length >= MAX_RELOADS_PER_WINDOW) {
    return false;
  }

  // Check for rapid successive reloads (same reason within 30 seconds)
  const recentSameReason = history.filter(
    entry => entry.reason === reason && (Date.now() - entry.timestamp) < 30000
  );

  if (recentSameReason.length >= 3) {
    return false;
  }

  return true;
}

/**
 * Records a reload attempt in history
 * Call this BEFORE actually reloading
 *
 * @param reason - The reason for the reload
 */
export function recordReload(reason: string): void {
  if (typeof window === 'undefined') return;
  const history = getReloadHistory();
  const newEntry: ReloadEntry = {
    timestamp: Date.now(),
    reason,
    pathname: window.location.pathname,
  };

  history.push(newEntry);
  saveReloadHistory(history);
  incrementGlobalReloadCount();
}

/**
 * Clears the reload history
 * Call this when the app successfully loads/navigates
 */
export function clearReloadHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(RELOAD_HISTORY_KEY);
    sessionStorage.removeItem(GLOBAL_RELOAD_COUNT_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if reload protection is disabled (for debugging)
 */
export function isProtectionDisabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('numa:disable_reload_protection') === 'true';
  } catch {
    return false;
  }
}
