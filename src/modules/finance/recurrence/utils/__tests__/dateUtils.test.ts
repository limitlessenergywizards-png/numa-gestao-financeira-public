import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateNextDueDate, shouldGenerateTransaction } from '../dateUtils';

describe('calculateNextDueDate()', () => {
  it('no lastGeneratedDate → returns startDate', () => {
    const start = new Date('2024-06-15');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = calculateNextDueDate(null, start, 'monthly' as any, 15);
    expect(result).toEqual(start);
  });

  it('daily → adds 1 day', () => {
    const last = new Date('2024-03-10');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = calculateNextDueDate(last, new Date('2024-01-01'), 'daily' as any, 10);
    expect(result.toISOString().slice(0, 10)).toBe('2024-03-11');
  });

  it('weekly → adds 7 days', () => {
    const last = new Date('2024-03-10');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = calculateNextDueDate(last, new Date('2024-01-01'), 'weekly' as any, 10);
    expect(result.toISOString().slice(0, 10)).toBe('2024-03-17');
  });

  it('biweekly → adds 14 days', () => {
    const last = new Date('2024-03-01');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = calculateNextDueDate(last, new Date('2024-01-01'), 'biweekly' as any, 1);
    expect(result.toISOString().slice(0, 10)).toBe('2024-03-15');
  });

  it('monthly → adds 1 month', () => {
    const last = new Date(2024, 0, 15); // Jan 15 local time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = calculateNextDueDate(last, new Date(2024, 0, 1), 'monthly' as any, 15);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(15);
  });

  it('bimonthly → adds 2 months', () => {
    const last = new Date('2024-01-10');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = calculateNextDueDate(last, new Date('2024-01-01'), 'bimonthly' as any, 10);
    expect(result.getMonth()).toBe(2); // March
  });

  it('quarterly → adds 3 months', () => {
    const last = new Date('2024-01-10');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = calculateNextDueDate(last, new Date('2024-01-01'), 'quarterly' as any, 10);
    expect(result.getMonth()).toBe(3); // April
  });

  it('semiannual → adds 6 months', () => {
    const last = new Date('2024-01-10');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = calculateNextDueDate(last, new Date('2024-01-01'), 'semiannual' as any, 10);
    expect(result.getMonth()).toBe(6); // July
  });

  it('annual → adds 1 year', () => {
    const last = new Date('2024-03-15');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = calculateNextDueDate(last, new Date('2024-01-01'), 'annual' as any, 15);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(2); // March
  });

  it('monthly handles month-end clamping (Jan 31 → Feb 28/29)', () => {
    const last = new Date('2024-01-31');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = calculateNextDueDate(last, new Date('2024-01-01'), 'monthly' as any, 31);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBeLessThanOrEqual(29); // Feb 2024 is leap year
  });
});

describe('shouldGenerateTransaction()', () => {
  const NOW = new Date('2024-06-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function makeRecurrence(overrides: Record<string, any> = {}) {
    return {
      id: '1',
      company_id: 'c1',
      name: 'Aluguel',
      amount: 2000,
      type: 'saida',
      category_id: 'cat1',
      bank_account_id: null,
      frequency: 'monthly',
      start_date: '2024-01-15',
      end_date: null,
      day_of_month: 15,
      last_generated_date: '2024-05-15',
      status: 'active',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }

  it('active recurrence with due date today → returns date', () => {
    const rec = makeRecurrence({ last_generated_date: '2024-05-15' });
    // Next date after 2024-05-15 monthly = 2024-06-15 = today
    const result = shouldGenerateTransaction(rec);
    expect(result).not.toBeNull();
  });

  it('active recurrence with due date in past → returns date', () => {
    const rec = makeRecurrence({ last_generated_date: '2024-04-15' });
    // Next date after 2024-04-15 monthly = 2024-05-15, which is in the past
    const result = shouldGenerateTransaction(rec);
    expect(result).not.toBeNull();
  });

  it('active recurrence with due date in future → returns null', () => {
    const rec = makeRecurrence({ last_generated_date: '2024-06-15' });
    // Next date after 2024-06-15 monthly = 2024-07-15, which is in future
    const result = shouldGenerateTransaction(rec);
    expect(result).toBeNull();
  });

  it('paused status → returns null', () => {
    const rec = makeRecurrence({ status: 'paused' });
    expect(shouldGenerateTransaction(rec)).toBeNull();
  });

  it('ended status → returns null', () => {
    const rec = makeRecurrence({ status: 'ended' });
    expect(shouldGenerateTransaction(rec)).toBeNull();
  });

  it('end_date before next due date → returns null', () => {
    const rec = makeRecurrence({
      last_generated_date: '2024-05-15',
      end_date: '2024-06-10', // before next due 2024-06-15
    });
    expect(shouldGenerateTransaction(rec)).toBeNull();
  });

  it('no last_generated_date → uses start_date', () => {
    const rec = makeRecurrence({
      start_date: '2024-06-15',
      last_generated_date: null,
    });
    // start_date is today → should generate
    const result = shouldGenerateTransaction(rec);
    expect(result).not.toBeNull();
  });

  it('start_date in past with no last_generated → returns start_date', () => {
    const rec = makeRecurrence({
      start_date: '2024-03-01',
      last_generated_date: null,
    });
    const result = shouldGenerateTransaction(rec);
    expect(result).not.toBeNull();
  });
});
