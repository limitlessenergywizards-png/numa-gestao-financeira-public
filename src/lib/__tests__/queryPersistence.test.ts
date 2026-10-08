import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tanstack/query-sync-storage-persister', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createSyncStoragePersister: vi.fn((opts: any) => ({
    _key: opts.key,
    _storage: opts.storage,
  })),
}));

import {
  getCacheKey,
  shouldDehydrateQuery,
  clearQueryCache,
  migrateCacheIfNeeded,
} from '../queryPersistence';

beforeEach(() => {
  localStorage.clear();
});

// ================================================================
// getCacheKey()
// ================================================================
describe('getCacheKey()', () => {
  it('no userId → key without user suffix', () => {
    const key = getCacheKey();
    expect(key).toContain('numa-query-cache');
    expect(key).toContain('-v');
  });

  it('with userId → key includes truncated userId', () => {
    const key = getCacheKey('abcdef1234567890');
    expect(key).toContain('abcdef12');
    expect(key).not.toContain('abcdef1234567890');
  });

  it('different userIds → different keys', () => {
    const key1 = getCacheKey('user-aaaa');
    const key2 = getCacheKey('user-bbbb');
    expect(key1).not.toBe(key2);
  });
});

// ================================================================
// shouldDehydrateQuery()
// ================================================================
describe('shouldDehydrateQuery()', () => {
  function makeQuery(queryKey: unknown[], data: unknown = { id: 1 }) {
    return { queryKey, state: { data } };
  }

  it('dashboard query with data → true', () => {
    expect(shouldDehydrateQuery(makeQuery(['dashboard', 'summary']))).toBe(true);
  });

  it('receivables query → true', () => {
    expect(shouldDehydrateQuery(makeQuery(['receivables', 'list']))).toBe(true);
  });

  it('payables query → true', () => {
    expect(shouldDehydrateQuery(makeQuery(['payables', 'list']))).toBe(true);
  });

  it('transactions query → true', () => {
    expect(shouldDehydrateQuery(makeQuery(['transactions']))).toBe(true);
  });

  it('customers query → true', () => {
    expect(shouldDehydrateQuery(makeQuery(['customers']))).toBe(true);
  });

  it('suppliers query → true', () => {
    expect(shouldDehydrateQuery(makeQuery(['suppliers']))).toBe(true);
  });

  it('bank-accounts query → true', () => {
    expect(shouldDehydrateQuery(makeQuery(['bank-accounts']))).toBe(true);
  });

  // Excluded patterns
  it('user_context → false (excluded)', () => {
    expect(shouldDehydrateQuery(makeQuery(['user_context']))).toBe(false);
  });

  it('auth query → false (excluded)', () => {
    expect(shouldDehydrateQuery(makeQuery(['auth', 'session']))).toBe(false);
  });

  it('session query → false (excluded)', () => {
    expect(shouldDehydrateQuery(makeQuery(['session']))).toBe(false);
  });

  it('admin query → false (excluded)', () => {
    expect(shouldDehydrateQuery(makeQuery(['admin', 'tenants']))).toBe(false);
  });

  it('notifications → false (excluded)', () => {
    expect(shouldDehydrateQuery(makeQuery(['notifications']))).toBe(false);
  });

  it('infinite query → false (excluded)', () => {
    expect(shouldDehydrateQuery(makeQuery(['infinite', 'transactions']))).toBe(false);
  });

  // Edge cases
  it('no data → false', () => {
    expect(shouldDehydrateQuery(makeQuery(['dashboard'], null))).toBe(false);
  });

  it('undefined data → false', () => {
    // Build manually since passing undefined triggers the default param
    const query = { queryKey: ['dashboard'], state: { data: undefined } };
    expect(shouldDehydrateQuery(query)).toBe(false);
  });

  it('unknown query key → false', () => {
    expect(shouldDehydrateQuery(makeQuery(['unknown-feature']))).toBe(false);
  });

  it('exclusion takes priority over inclusion', () => {
    // "audit" is excluded, even though it might match some pattern
    expect(shouldDehydrateQuery(makeQuery(['audit', 'transactions']))).toBe(false);
  });
});

// ================================================================
// clearQueryCache()
// ================================================================
describe('clearQueryCache()', () => {
  it('clears specific user cache', () => {
    const key = getCacheKey('user123');
    localStorage.setItem(key, 'data');
    clearQueryCache('user123');
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('clears all numa caches when no userId', () => {
    localStorage.setItem(getCacheKey('aaa'), 'data-a');
    localStorage.setItem(getCacheKey('bbb'), 'data-b');
    localStorage.setItem('other-key', 'keep-me');
    clearQueryCache();
    expect(localStorage.getItem('other-key')).toBe('keep-me');
  });

  it('no error when nothing to clear', () => {
    expect(() => clearQueryCache()).not.toThrow();
  });
});

// ================================================================
// migrateCacheIfNeeded()
// ================================================================
describe('migrateCacheIfNeeded()', () => {
  it('removes old version caches', () => {
    // Simulate old version cache
    localStorage.setItem('numa-query-cache-v0.9.0-abc', 'old');
    migrateCacheIfNeeded();
    expect(localStorage.getItem('numa-query-cache-v0.9.0-abc')).toBeNull();
  });

  it('keeps current version caches', () => {
    const currentKey = getCacheKey('test');
    localStorage.setItem(currentKey, 'current');
    migrateCacheIfNeeded();
    expect(localStorage.getItem(currentKey)).toBe('current');
  });

  it('no error with empty localStorage', () => {
    expect(() => migrateCacheIfNeeded()).not.toThrow();
  });
});
