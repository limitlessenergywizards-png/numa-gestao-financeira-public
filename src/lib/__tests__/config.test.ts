import { describe, it, expect } from 'vitest';
import { APP_CONFIG, TIMING, PAGINATION, CACHE, UPLOAD, VALIDATION, FEATURES } from '../config';

describe('APP_CONFIG', () => {
  it('has application name', () => {
    expect(APP_CONFIG.NAME).toBe('Numa Gestão Financeira');
  });

  it('has short name', () => {
    expect(APP_CONFIG.SHORT_NAME).toBe('Numa');
  });

  it('has version string', () => {
    expect(APP_CONFIG.VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('has support email', () => {
    expect(APP_CONFIG.SUPPORT_EMAIL).toContain('@');
  });
});

describe('TIMING', () => {
  it('debounce delay is positive', () => {
    expect(TIMING.DEBOUNCE_DELAY).toBeGreaterThan(0);
  });

  it('toast duration is >= 2 seconds', () => {
    expect(TIMING.TOAST_DURATION).toBeGreaterThanOrEqual(2000);
  });

  it('animation speeds are ordered: FAST < NORMAL < SLOW', () => {
    expect(TIMING.ANIMATION.FAST).toBeLessThan(TIMING.ANIMATION.NORMAL);
    expect(TIMING.ANIMATION.NORMAL).toBeLessThan(TIMING.ANIMATION.SLOW);
  });
});

describe('PAGINATION', () => {
  it('default page size is 50', () => {
    expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(50);
  });

  it('page size options include default', () => {
    expect(PAGINATION.PAGE_SIZE_OPTIONS).toContain(PAGINATION.DEFAULT_PAGE_SIZE);
  });

  it('page size options are sorted ascending', () => {
    const opts = [...PAGINATION.PAGE_SIZE_OPTIONS];
    for (let i = 1; i < opts.length; i++) {
      expect(opts[i]).toBeGreaterThan(opts[i - 1]);
    }
  });

  it('virtual list threshold is positive', () => {
    expect(PAGINATION.VIRTUAL_LIST_THRESHOLD).toBeGreaterThan(0);
  });
});

describe('CACHE', () => {
  it('storage prefix is "numa_"', () => {
    expect(CACHE.STORAGE_PREFIX).toBe('numa_');
  });

  it('max age is 24 hours in ms', () => {
    expect(CACHE.MAX_AGE).toBe(86400000);
  });

  it('default stale time is 30 seconds', () => {
    expect(CACHE.DEFAULT_STALE_TIME).toBe(30000);
  });

  it('default GC time is 10 minutes', () => {
    expect(CACHE.DEFAULT_GC_TIME).toBe(600000);
  });
});

describe('UPLOAD', () => {
  it('max file size is 10MB', () => {
    expect(UPLOAD.MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
  });

  it('image types include jpeg and png', () => {
    expect(UPLOAD.IMAGE_TYPES).toContain('image/jpeg');
    expect(UPLOAD.IMAGE_TYPES).toContain('image/png');
  });

  it('document types include PDF', () => {
    expect(UPLOAD.DOCUMENT_TYPES).toContain('application/pdf');
  });
});

describe('VALIDATION', () => {
  it('min password length is at least 8', () => {
    expect(VALIDATION.MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(8);
  });

  it('max description length is positive', () => {
    expect(VALIDATION.MAX_DESCRIPTION_LENGTH).toBeGreaterThan(0);
  });

  it('max notes length > max description length', () => {
    expect(VALIDATION.MAX_NOTES_LENGTH).toBeGreaterThan(VALIDATION.MAX_DESCRIPTION_LENGTH);
  });
});

describe('FEATURES', () => {
  it('all feature flags are booleans', () => {
    Object.values(FEATURES).forEach(v => {
      expect(typeof v).toBe('boolean');
    });
  });

  it('has OCR, AI, Journey, and Push flags', () => {
    expect('OCR_ENABLED' in FEATURES).toBe(true);
    expect('AI_INSIGHTS_ENABLED' in FEATURES).toBe(true);
    expect('JOURNEY_ENABLED' in FEATURES).toBe(true);
    expect('PUSH_NOTIFICATIONS_ENABLED' in FEATURES).toBe(true);
  });
});
