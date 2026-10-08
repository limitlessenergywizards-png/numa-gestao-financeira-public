import { describe, it, expect, beforeEach } from 'vitest';
import {
  canSafelyReload,
  recordReload,
  clearReloadHistory,
  isProtectionDisabled,
} from '../reloadProtection';

// ================================================================
// Setup: clear storage before each test
// ================================================================
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

// ================================================================
// canSafelyReload()
// ================================================================
describe('canSafelyReload()', () => {
  it('first reload → true', () => {
    expect(canSafelyReload('chunk_error')).toBe(true);
  });

  it('after 4 reloads (different reasons) → still true (window limit is 5)', () => {
    for (let i = 0; i < 4; i++) {
      recordReload(`reason_${i}`);
    }
    expect(canSafelyReload('new_reason')).toBe(true);
  });

  it('after 5 reloads → false (window limit exceeded)', () => {
    for (let i = 0; i < 5; i++) {
      recordReload(`reason_${i}`);
    }
    expect(canSafelyReload('new_reason')).toBe(false);
  });

  it('after 10 global reloads → false (emergency stop)', () => {
    for (let i = 0; i < 10; i++) {
      recordReload(`reason_${i}`); // Different reasons to avoid same-reason limit
    }
    expect(canSafelyReload('new_reason')).toBe(false);
  });

  it('3+ same-reason reloads within 30s → false', () => {
    // Record 3 reloads with same reason (all within 30s since tests run fast)
    recordReload('sw_update');
    recordReload('sw_update');
    recordReload('sw_update');
    expect(canSafelyReload('sw_update')).toBe(false);
  });

  it('different reasons don\'t trigger same-reason limit', () => {
    recordReload('reason_a');
    recordReload('reason_b');
    recordReload('reason_c');
    expect(canSafelyReload('reason_d')).toBe(true);
  });
});

// ================================================================
// recordReload()
// ================================================================
describe('recordReload()', () => {
  it('increments reload count', () => {
    recordReload('test');
    recordReload('test');
    // After 2 reloads, should still allow more
    expect(canSafelyReload('test')).toBe(true);
  });

  it('stores reason in history', () => {
    recordReload('chunk_error');
    // The fact that same-reason check works proves it's stored
    recordReload('chunk_error');
    recordReload('chunk_error');
    expect(canSafelyReload('chunk_error')).toBe(false);
  });
});

// ================================================================
// clearReloadHistory()
// ================================================================
describe('clearReloadHistory()', () => {
  it('resets all limits', () => {
    // Hit the window limit
    for (let i = 0; i < 5; i++) {
      recordReload('test');
    }
    expect(canSafelyReload('test')).toBe(false);

    clearReloadHistory();
    expect(canSafelyReload('test')).toBe(true);
  });

  it('no error when clearing empty history', () => {
    expect(() => clearReloadHistory()).not.toThrow();
  });
});

// ================================================================
// isProtectionDisabled()
// ================================================================
describe('isProtectionDisabled()', () => {
  it('default → false', () => {
    expect(isProtectionDisabled()).toBe(false);
  });

  it('set to "true" in localStorage → true', () => {
    localStorage.setItem('numa:disable_reload_protection', 'true');
    expect(isProtectionDisabled()).toBe(true);
  });

  it('set to "false" in localStorage → false', () => {
    localStorage.setItem('numa:disable_reload_protection', 'false');
    expect(isProtectionDisabled()).toBe(false);
  });
});
