/**
 * Session Cache Manager
 * 
 * Enterprise-grade caching utility for sessionStorage with TTL support.
 * Used to cache user context data across page navigations, eliminating
 * redundant API calls on F5/navigation.
 */

const CACHE_PREFIX = 'numa:';
const CACHE_VERSION = 2;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  version: number;
}

/**
 * TTL defaults in milliseconds
 */
export const TTL = {
  USER_CONTEXT: 15 * 60 * 1000, // 15 minutes (Realtime handles active invalidation)
  PROFILE: 30 * 60 * 1000,      // 30 minutes
  ROLES: 60 * 60 * 1000,        // 1 hour
  COMPANIES: 15 * 60 * 1000,    // 15 minutes
  SHORT: 5 * 60 * 1000,         // 5 minutes
} as const;

/**
 * Cache keys
 */
export const CACHE_KEYS = {
  USER_CONTEXT: 'user_context',
  DASHBOARD_PREFETCH: 'dashboard_prefetch',
  LAST_COMPANY_ID: 'last_company_id',
} as const;

/**
 * Set a value in the session cache with TTL
 */
export function setCache<T>(key: string, data: T, ttlMs: number = TTL.USER_CONTEXT): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMs,
      version: CACHE_VERSION,
    };
    sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (error) {
    // sessionStorage might be full or disabled
    console.warn('[SessionCache] Failed to set cache:', error);
  }
}

/**
 * Get a value from the session cache
 * Returns null if expired or not found
 */
export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    
    // Check version
    if (entry.version !== CACHE_VERSION) {
      invalidateCache(key);
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      invalidateCache(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn('[SessionCache] Failed to get cache:', error);
    return null;
  }
}

/**
 * Invalidate a specific cache entry
 */
export function invalidateCache(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.warn('[SessionCache] Failed to invalidate cache:', error);
  }
}

/**
 * Invalidate all app caches
 */
export function invalidateAllCaches(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (error) {
    console.warn('[SessionCache] Failed to invalidate all caches:', error);
  }
}

/**
 * Check if a cache entry exists and is valid
 */
export function hasCacheEntry(key: string): boolean {
  return getCache(key) !== null;
}

/**
 * Get cache with fallback - returns cached data or executes fetcher
 */
export async function getCacheOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = TTL.USER_CONTEXT
): Promise<{ data: T; fromCache: boolean }> {
  const cached = getCache<T>(key);
  
  if (cached !== null) {
    return { data: cached, fromCache: true };
  }

  const data = await fetcher();
  setCache(key, data, ttlMs);
  
  return { data, fromCache: false };
}
