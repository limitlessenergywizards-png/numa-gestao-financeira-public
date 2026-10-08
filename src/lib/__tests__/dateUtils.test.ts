import { describe, it, expect } from 'vitest';
import { addDays } from 'date-fns';
import {
  getOverdueDays,
  isOverdue,
  formatDateBR,
  formatDateWithWeekday,
  formatMonthYear,
  getDueStatus,
} from '../dateUtils';

// Helper: date string for a given offset from today.
// Appends T00:00:00 so new Date() parses as local time (not UTC).
function dateOffset(days: number): string {
  const d = addDays(new Date(), days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00`;
}

describe('getOverdueDays()', () => {
  it('far past date with pendente status → positive days', () => {
    expect(getOverdueDays('2020-01-01', 'pendente')).toBeGreaterThan(0);
  });

  it('far future date with pendente status → 0', () => {
    expect(getOverdueDays('2099-01-01', 'pendente')).toBe(0);
  });

  it('pago status → always 0 regardless of date', () => {
    expect(getOverdueDays('2020-01-01', 'pago')).toBe(0);
  });

  it('cancelado status → always 0 regardless of date', () => {
    expect(getOverdueDays('2020-01-01', 'cancelado')).toBe(0);
  });

  it('yesterday with pendente → 1 day overdue', () => {
    expect(getOverdueDays(dateOffset(-1), 'pendente')).toBe(1);
  });

  it('today with pendente → 0 (not overdue yet)', () => {
    expect(getOverdueDays(dateOffset(0), 'pendente')).toBe(0);
  });

  it('tomorrow with pendente → 0', () => {
    expect(getOverdueDays(dateOffset(1), 'pendente')).toBe(0);
  });
});

describe('isOverdue()', () => {
  it('past date + pendente → true', () => {
    expect(isOverdue('2020-01-01', 'pendente')).toBe(true);
  });

  it('future date + pendente → false', () => {
    expect(isOverdue('2099-01-01', 'pendente')).toBe(false);
  });

  it('past date + pago → false', () => {
    expect(isOverdue('2020-01-01', 'pago')).toBe(false);
  });

  it('today + pendente → false', () => {
    expect(isOverdue(dateOffset(0), 'pendente')).toBe(false);
  });
});

describe('formatDateBR()', () => {
  it('ISO string → dd/MM/yyyy', () => {
    expect(formatDateBR('2026-03-15')).toBe('15/03/2026');
  });

  it('Date object → dd/MM/yyyy', () => {
    expect(formatDateBR(new Date(2026, 2, 15))).toBe('15/03/2026');
  });

  it('single digit day/month gets zero-padded', () => {
    expect(formatDateBR('2026-01-05')).toBe('05/01/2026');
  });
});

describe('formatDateWithWeekday()', () => {
  it('returns string with weekday name in Portuguese', () => {
    // March 15, 2026 is a Sunday
    const result = formatDateWithWeekday('2026-03-15');
    expect(result).toContain('15');
    expect(result).toContain('março');
  });

  it('accepts Date object', () => {
    const result = formatDateWithWeekday(new Date(2026, 2, 15));
    expect(result).toContain('15');
  });
});

describe('formatMonthYear()', () => {
  it('returns "month de year" in Portuguese', () => {
    const result = formatMonthYear('2026-03-15');
    expect(result).toContain('março');
    expect(result).toContain('2026');
  });

  it('accepts Date object', () => {
    const result = formatMonthYear(new Date(2026, 0, 1));
    expect(result).toContain('janeiro');
    expect(result).toContain('2026');
  });
});

describe('getDueStatus()', () => {
  it('past date → overdue', () => {
    const result = getDueStatus('2020-01-01');
    expect(result.status).toBe('overdue');
    expect(result.daysCount).toBeLessThan(0);
    expect(result.daysInfo).toContain('atraso');
  });

  it('today → due_today', () => {
    const result = getDueStatus(dateOffset(0));
    expect(result.status).toBe('due_today');
    expect(result.daysCount).toBe(0);
    expect(result.daysInfo).toBe('vence hoje');
  });

  it('3 days from now → due_soon', () => {
    const result = getDueStatus(dateOffset(3));
    expect(result.status).toBe('due_soon');
    expect(result.daysCount).toBe(3);
    expect(result.daysInfo).toContain('3 dias');
  });

  it('7 days from now → due_soon (boundary)', () => {
    const result = getDueStatus(dateOffset(7));
    expect(result.status).toBe('due_soon');
    expect(result.daysCount).toBe(7);
  });

  it('8 days from now → future', () => {
    const result = getDueStatus(dateOffset(8));
    expect(result.status).toBe('future');
    expect(result.daysCount).toBe(8);
  });

  it('30 days from now → future', () => {
    const result = getDueStatus(dateOffset(30));
    expect(result.status).toBe('future');
    expect(result.daysCount).toBe(30);
  });

  it('accepts Date object', () => {
    const result = getDueStatus(new Date(2020, 0, 1));
    expect(result.status).toBe('overdue');
  });
});
