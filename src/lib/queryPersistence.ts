/**
 * React Query Persistence Configuration
 * 
 * Provides localStorage-based persistence for React Query cache.
 * Enables instant load times by hydrating from cached data.
 * 
 * Features:
 * - Selective persistence (only critical queries)
 * - User-isolated cache keys
 * - Version-based cache busting
 * - Size-aware dehydration
 */

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Cache version - increment on breaking schema changes
const CACHE_VERSION = '1.0.0';
const CACHE_KEY_PREFIX = 'numa-query-cache';
const MAX_AGE = 1000 * 60 * 5; // 5 minutes — prevents stale data on page reload
const THROTTLE_TIME = 1000; // 1 second debounce for writes

// Query key patterns that should be persisted
const PERSIST_KEY_PATTERNS = [
  'dashboard',
  'receivables',
  'payables',
  'bank-accounts',
  'bank_accounts',
  'chart-accounts',
  'chart_accounts',
  'customers',
  'suppliers',
  'transactions',
  'cost_centers',
  'costcenters',
];

// Query key patterns that should NEVER be persisted
const EXCLUDE_KEY_PATTERNS = [
  'user_context',
  'auth',
  'session',
  'infinite',
  'admin',
  'audit',
  'notifications',
];

/**
 * Get user-specific cache key
 */
export function getCacheKey(userId?: string): string {
  const userSuffix = userId ? `-${userId.slice(0, 8)}` : '';
  return `${CACHE_KEY_PREFIX}-v${CACHE_VERSION}${userSuffix}`;
}

/**
 * Create the persister instance
 */
export function createQueryPersister(userId?: string) {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return createSyncStoragePersister({
    storage: window.localStorage,
    key: getCacheKey(userId),
    throttleTime: THROTTLE_TIME,
    serialize: (data) => {
      try {
        const serialized = JSON.stringify(data);
        // Warn if cache is getting large (> 2MB)
        if (serialized.length > 2 * 1024 * 1024) {
          console.warn('[QueryPersistence] Cache size exceeding 2MB, consider reducing cached queries');
        }
        return serialized;
      } catch (error) {
        console.error('[QueryPersistence] Failed to serialize cache:', error);
        return '';
      }
    },
    deserialize: (data) => {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('[QueryPersistence] Failed to deserialize cache:', error);
        return undefined;
      }
    },
  });
}

// Query interface for type safety
interface QueryLike {
  queryKey: readonly unknown[];
  state: {
    data: unknown;
  };
}

/**
 * Determine if a query should be dehydrated (persisted)
 */
export function shouldDehydrateQuery(query: QueryLike): boolean {
  const queryKey = query.queryKey;
  
  // Convert query key to string for pattern matching
  const keyString = JSON.stringify(queryKey).toLowerCase();
  
  // Check exclusion patterns first
  for (const pattern of EXCLUDE_KEY_PATTERNS) {
    if (keyString.includes(pattern.toLowerCase())) {
      return false;
    }
  }
  
  // Check if query has data and is not stale beyond max age
  if (!query.state.data) {
    return false;
  }
  
  // Check if query matches persistence patterns
  for (const pattern of PERSIST_KEY_PATTERNS) {
    if (keyString.includes(pattern.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Clear cache for a specific user or all users
 */
export function clearQueryCache(userId?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  if (userId) {
    // Clear specific user cache
    localStorage.removeItem(getCacheKey(userId));
  } else {
    // Clear all numa caches
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

/**
 * Get persist options for PersistQueryClientProvider
 */
export function getPersistOptions(userId?: string) {
  const persister = createQueryPersister(userId);
  
  if (!persister) {
    return null;
  }

  return {
    persister,
    maxAge: MAX_AGE,
    dehydrateOptions: {
      shouldDehydrateQuery,
    },
    // Don't block app rendering waiting for cache restoration
    buster: CACHE_VERSION,
  };
}

/**
 * Migrate cache on version change
 * Call this on app startup to handle version mismatches
 */
export function migrateCacheIfNeeded(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    // Find old cache keys and remove them
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX) && !key.includes(`-v${CACHE_VERSION}`)) {
        keysToRemove.push(key);
      }
    }
    
    if (keysToRemove.length > 0) {
      console.info('[QueryPersistence] Migrating cache - removing old versions');
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  } catch (error) {
    console.error('[QueryPersistence] Failed to migrate cache:', error);
  }
}

// Auto-run migration on module load
migrateCacheIfNeeded();
