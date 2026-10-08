import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setCache,
  getCache,
  invalidateCache,
  invalidateAllCaches,
  hasCacheEntry,
  getCacheOrFetch,
  TTL,
  CACHE_KEYS,
} from '../sessionCache';

// ================================================================
// Setup: ensure sessionStorage is available (jsdom provides it)
// ================================================================
beforeEach(() => {
  sessionStorage.clear();
});

// ================================================================
// TTL & CACHE_KEYS constants
// ================================================================
describe('TTL constants', () => {
  it('USER_CONTEXT is 15 minutes', () => {
    expect(TTL.USER_CONTEXT).toBe(15 * 60 * 1000);
  });

  it('PROFILE is 30 minutes', () => {
    expect(TTL.PROFILE).toBe(30 * 60 * 1000);
  });

  it('ROLES is 1 hour', () => {
    expect(TTL.ROLES).toBe(60 * 60 * 1000);
  });

  it('SHORT is 5 minutes', () => {
    expect(TTL.SHORT).toBe(5 * 60 * 1000);
  });
});

describe('CACHE_KEYS', () => {
  it('has expected keys', () => {
    expect(CACHE_KEYS.USER_CONTEXT).toBe('user_context');
    expect(CACHE_KEYS.DASHBOARD_PREFETCH).toBe('dashboard_prefetch');
    expect(CACHE_KEYS.LAST_COMPANY_ID).toBe('last_company_id');
  });
});

// ================================================================
// setCache() + getCache()
// ================================================================
describe('setCache() + getCache()', () => {
  it('stores and retrieves data', () => {
    setCache('test', { name: 'John' });
    expect(getCache('test')).toEqual({ name: 'John' });
  });

  it('stores string values', () => {
    setCache('str', 'hello');
    expect(getCache('str')).toBe('hello');
  });

  it('stores array values', () => {
    setCache('arr', [1, 2, 3]);
    expect(getCache('arr')).toEqual([1, 2, 3]);
  });

  it('non-existent key → null', () => {
    expect(getCache('nonexistent')).toBeNull();
  });

  it('expired entry → null', () => {
    // Manually write an expired entry to sessionStorage
    const entry = { data: 'old', expiresAt: Date.now() - 1000, version: 2 };
    sessionStorage.setItem('numa:expired', JSON.stringify(entry));
    expect(getCache('expired')).toBeNull();
  });

  it('custom TTL works', () => {
    setCache('custom', 'data', 1000); // 1 second TTL
    expect(getCache('custom')).toBe('data');
  });
});

// ================================================================
// invalidateCache()
// ================================================================
describe('invalidateCache()', () => {
  it('removes specific cache entry', () => {
    setCache('a', 'value-a');
    setCache('b', 'value-b');
    invalidateCache('a');
    expect(getCache('a')).toBeNull();
    expect(getCache('b')).toBe('value-b');
  });

  it('no error when invalidating non-existent key', () => {
    expect(() => invalidateCache('nonexistent')).not.toThrow();
  });
});

// ================================================================
// invalidateAllCaches()
// ================================================================
describe('invalidateAllCaches()', () => {
  it('removes all numa: prefixed entries', () => {
    setCache('a', 'data-a');
    setCache('b', 'data-b');
    setCache('c', 'data-c');
    invalidateAllCaches();
    expect(getCache('a')).toBeNull();
    expect(getCache('b')).toBeNull();
    expect(getCache('c')).toBeNull();
  });

  it('does not remove non-numa entries', () => {
    sessionStorage.setItem('other_key', 'other_value');
    setCache('test', 'data');
    invalidateAllCaches();
    expect(sessionStorage.getItem('other_key')).toBe('other_value');
    expect(getCache('test')).toBeNull();
  });
});

// ================================================================
// hasCacheEntry()
// ================================================================
describe('hasCacheEntry()', () => {
  it('existing entry → true', () => {
    setCache('exists', 'data');
    expect(hasCacheEntry('exists')).toBe(true);
  });

  it('non-existent entry → false', () => {
    expect(hasCacheEntry('nonexistent')).toBe(false);
  });
});

// ================================================================
// getCacheOrFetch()
// ================================================================
describe('getCacheOrFetch()', () => {
  it('returns cached data when available', async () => {
    setCache('cached', { id: 1 });
    const fetcher = vi.fn().mockResolvedValue({ id: 999 });
    const result = await getCacheOrFetch('cached', fetcher);
    expect(result.data).toEqual({ id: 1 });
    expect(result.fromCache).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('calls fetcher when cache is empty', async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 42 });
    const result = await getCacheOrFetch('empty', fetcher);
    expect(result.data).toEqual({ id: 42 });
    expect(result.fromCache).toBe(false);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('caches fetched data for subsequent calls', async () => {
    const fetcher = vi.fn().mockResolvedValue('fresh-data');
    await getCacheOrFetch('new', fetcher);
    // Now it should be cached
    expect(getCache('new')).toBe('fresh-data');
  });
});
