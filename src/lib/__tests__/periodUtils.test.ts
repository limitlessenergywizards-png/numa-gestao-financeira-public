import { describe, it, expect } from 'vitest';
import {
  getDateRange,
  PERIOD_LABELS,
  PERIOD_SHORT_LABELS,
  type PeriodType,
} from '../periodUtils';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ================================================================
// getDateRange()
// ================================================================
describe('getDateRange()', () => {
  const periods: PeriodType[] = ['day', 'week', 'month', 'quarter', 'semester', 'year'];

  periods.forEach(period => {
    it(`${period}: returns start and end in yyyy-MM-dd format`, () => {
      const range = getDateRange(period);
      expect(range.start).toMatch(DATE_REGEX);
      expect(range.end).toMatch(DATE_REGEX);
    });

    it(`${period}: start <= end`, () => {
      const range = getDateRange(period);
      expect(range.start <= range.end).toBe(true);
    });
  });

  it('day: start === end (same day)', () => {
    const range = getDateRange('day');
    expect(range.start).toBe(range.end);
  });

  it('week: span is 7 days', () => {
    const range = getDateRange('week');
    const start = new Date(range.start + 'T00:00:00');
    const end = new Date(range.end + 'T00:00:00');
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(6); // Sun to Sat = 6 day difference
  });

  it('month: start is 1st, end is last day', () => {
    const range = getDateRange('month');
    const start = new Date(range.start + 'T00:00:00');
    const end = new Date(range.end + 'T00:00:00');
    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBeGreaterThanOrEqual(28);
  });

  it('quarter: span is ~90 days', () => {
    const range = getDateRange('quarter');
    const start = new Date(range.start + 'T00:00:00');
    const end = new Date(range.end + 'T00:00:00');
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(89);
    expect(diffDays).toBeLessThanOrEqual(92);
  });

  it('semester: start month is Jan or Jul', () => {
    const range = getDateRange('semester');
    const startMonth = new Date(range.start + 'T00:00:00').getMonth();
    expect([0, 6]).toContain(startMonth);
  });

  it('semester: end month is Jun or Dec', () => {
    const range = getDateRange('semester');
    const endMonth = new Date(range.end + 'T00:00:00').getMonth();
    expect([5, 11]).toContain(endMonth);
  });

  it('year: start is Jan 1, end is Dec 31', () => {
    const range = getDateRange('year');
    const start = new Date(range.start + 'T00:00:00');
    const end = new Date(range.end + 'T00:00:00');
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);
  });
});

// ================================================================
// PERIOD_LABELS
// ================================================================
describe('PERIOD_LABELS', () => {
  it('has all 6 period types', () => {
    const keys = Object.keys(PERIOD_LABELS);
    expect(keys).toHaveLength(6);
    expect(keys).toEqual(expect.arrayContaining(['day', 'week', 'month', 'quarter', 'semester', 'year']));
  });

  it('labels are in Portuguese', () => {
    expect(PERIOD_LABELS.day).toBe('Dia');
    expect(PERIOD_LABELS.month).toBe('Mês');
    expect(PERIOD_LABELS.year).toBe('Ano');
  });
});

// ================================================================
// PERIOD_SHORT_LABELS
// ================================================================
describe('PERIOD_SHORT_LABELS', () => {
  it('has all 6 period types', () => {
    const keys = Object.keys(PERIOD_SHORT_LABELS);
    expect(keys).toHaveLength(6);
  });

  it('each label is a single character', () => {
    Object.values(PERIOD_SHORT_LABELS).forEach(label => {
      expect(label).toHaveLength(1);
    });
  });

  it('correct abbreviations', () => {
    expect(PERIOD_SHORT_LABELS.day).toBe('D');
    expect(PERIOD_SHORT_LABELS.month).toBe('M');
    expect(PERIOD_SHORT_LABELS.year).toBe('A');
  });
});
