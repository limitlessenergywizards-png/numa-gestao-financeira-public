import { describe, it, expect, vi } from 'vitest';

// Mock Supabase client BEFORE imports
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }), maybeSingle: () => ({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: {}, error: null }) }) }),
      update: () => ({ eq: () => ({ eq: () => ({}) }) }),
    }),
  },
}));

// Mock Brazilian holidays
vi.mock('@/lib/brazilianHolidays', () => ({
  isBrazilianHoliday: vi.fn((date: Date) => {
    // Only treat Jan 1 and Dec 25 as holidays for testing
    const month = date.getMonth();
    const day = date.getDate();
    return (month === 0 && day === 1) || (month === 11 && day === 25);
  }),
}));

import { recurringEngine, RecurringTransaction } from '../recurringEngine';

// Access private methods
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const engine = recurringEngine as any;

// Factory for recurring transaction with defaults
const makeRecurring = (overrides: Partial<RecurringTransaction> = {}): RecurringTransaction => ({
  id: 'rec-1',
  company_id: 'company-1',
  name: 'Test Recurrence',
  amount: 1000,
  category_id: 'cat-1',
  type: 'despesa',
  frequency: 'mensal',
  start_date: '2026-03-15',
  end_date: null,
  day_of_month: null,
  occurrence_limit: null,
  occurrence_count: 0,
  status: 'active',
  create_as_forecast: false,
  forecast_confidence: 100,
  skip_weekends: false,
  skip_holidays: false,
  ...overrides,
});

describe('RecurringEngine', () => {
  // ================================================================
  // calculateNextDate()
  // ================================================================
  describe('calculateNextDate()', () => {
    const jan1 = new Date(2026, 0, 1); // Jan 1, 2026

    it('diaria: +1 day', () => {
      const result = engine.calculateNextDate(jan1, makeRecurring({ frequency: 'diaria' }));
      expect(result.getDate()).toBe(2);
      expect(result.getMonth()).toBe(0);
    });

    it('semanal: +7 days', () => {
      const result = engine.calculateNextDate(jan1, makeRecurring({ frequency: 'semanal' }));
      expect(result.getDate()).toBe(8);
    });

    it('quinzenal: +15 days', () => {
      const result = engine.calculateNextDate(jan1, makeRecurring({ frequency: 'quinzenal' }));
      expect(result.getDate()).toBe(16);
    });

    it('mensal: +1 month', () => {
      const result = engine.calculateNextDate(jan1, makeRecurring({ frequency: 'mensal' }));
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(1);
    });

    it('bimestral: +2 months', () => {
      const result = engine.calculateNextDate(jan1, makeRecurring({ frequency: 'bimestral' }));
      expect(result.getMonth()).toBe(2); // March
    });

    it('trimestral: +3 months', () => {
      const result = engine.calculateNextDate(jan1, makeRecurring({ frequency: 'trimestral' }));
      expect(result.getMonth()).toBe(3); // April
    });

    it('semestral: +6 months', () => {
      const result = engine.calculateNextDate(jan1, makeRecurring({ frequency: 'semestral' }));
      expect(result.getMonth()).toBe(6); // July
    });

    it('anual: +12 months', () => {
      const result = engine.calculateNextDate(jan1, makeRecurring({ frequency: 'anual' }));
      expect(result.getFullYear()).toBe(2027);
      expect(result.getMonth()).toBe(0);
    });

    it('personalizada (dias): custom_interval_value=10', () => {
      const result = engine.calculateNextDate(jan1, makeRecurring({
        frequency: 'personalizada',
        custom_interval_value: 10,
        custom_interval_unit: 'dias',
      }));
      expect(result.getDate()).toBe(11);
    });

    it('personalizada (semanas): custom_interval_value=2', () => {
      const result = engine.calculateNextDate(jan1, makeRecurring({
        frequency: 'personalizada',
        custom_interval_value: 2,
        custom_interval_unit: 'semanas',
      }));
      expect(result.getDate()).toBe(15); // +14 days
    });

    it('personalizada (meses): custom_interval_value=3', () => {
      const result = engine.calculateNextDate(jan1, makeRecurring({
        frequency: 'personalizada',
        custom_interval_value: 3,
        custom_interval_unit: 'meses',
      }));
      expect(result.getMonth()).toBe(3); // April
    });

    it('default fallback: +1 month', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = engine.calculateNextDate(jan1, makeRecurring({ frequency: 'unknown' as any }));
      expect(result.getMonth()).toBe(1); // February
    });
  });

  // ================================================================
  // addMonthsPreservingDay()
  // ================================================================
  describe('addMonthsPreservingDay()', () => {
    it('day_of_month=31 from Jan → Feb: clamps to Feb 28', () => {
      const jan31 = new Date(2026, 0, 31);
      const result = engine.addMonthsPreservingDay(jan31, 1, 31);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28); // Feb has 28 days in 2026
    });

    it('day_of_month=31 from Jan → Feb in leap year: clamps to Feb 29', () => {
      const jan31 = new Date(2028, 0, 31); // 2028 is a leap year
      const result = engine.addMonthsPreservingDay(jan31, 1, 31);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(29);
    });

    it('day_of_month=15: always lands on 15th', () => {
      const jan15 = new Date(2026, 0, 15);
      const result = engine.addMonthsPreservingDay(jan15, 1, 15);
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(1);
    });

    it('no preferredDay (null): uses date-fns default', () => {
      const jan15 = new Date(2026, 0, 15);
      const result = engine.addMonthsPreservingDay(jan15, 1, null);
      expect(result.getMonth()).toBe(1); // February
    });

    it('adding multiple months preserves day', () => {
      const jan10 = new Date(2026, 0, 10);
      const result = engine.addMonthsPreservingDay(jan10, 6, 10);
      expect(result.getMonth()).toBe(6); // July
      expect(result.getDate()).toBe(10);
    });
  });

  // ================================================================
  // adjustForHolidays()
  // ================================================================
  describe('adjustForHolidays()', () => {
    // 2026-03-07 is a Saturday, 2026-03-08 is a Sunday

    it('Saturday + adjustment=after → Monday (+2)', async () => {
      const saturday = new Date(2026, 2, 7); // March 7, 2026 = Saturday
      const result = await engine.adjustForHolidays(saturday, true, false, 'after', 'c1');
      expect(result!.getDay()).toBe(1); // Monday
      expect(result!.getDate()).toBe(9);
    });

    it('Sunday + adjustment=after → Monday (+1)', async () => {
      const sunday = new Date(2026, 2, 8); // March 8, 2026 = Sunday
      const result = await engine.adjustForHolidays(sunday, true, false, 'after', 'c1');
      expect(result!.getDay()).toBe(1); // Monday
      expect(result!.getDate()).toBe(9);
    });

    it('Saturday + adjustment=before → Friday (-1)', async () => {
      const saturday = new Date(2026, 2, 7);
      const result = await engine.adjustForHolidays(saturday, true, false, 'before', 'c1');
      expect(result!.getDay()).toBe(5); // Friday
      expect(result!.getDate()).toBe(6);
    });

    it('Sunday + adjustment=before → Friday (-2)', async () => {
      const sunday = new Date(2026, 2, 8);
      const result = await engine.adjustForHolidays(sunday, true, false, 'before', 'c1');
      expect(result!.getDay()).toBe(5); // Friday
      expect(result!.getDate()).toBe(6);
    });

    it('Holiday + adjustment=skip → returns null', async () => {
      const newYear = new Date(2026, 0, 1); // Jan 1 = holiday
      const result = await engine.adjustForHolidays(newYear, false, true, 'skip', 'c1');
      expect(result).toBeNull();
    });

    it('Holiday + adjustment=after → next non-holiday', async () => {
      const newYear = new Date(2026, 0, 1); // Jan 1 = Thursday holiday
      const result = await engine.adjustForHolidays(newYear, false, true, 'after', 'c1');
      expect(result).not.toBeNull();
      expect(result!.getDate()).toBe(2); // Jan 2
    });

    it('Holiday + adjustment=before → previous non-holiday', async () => {
      const newYear = new Date(2026, 0, 1);
      const result = await engine.adjustForHolidays(newYear, false, true, 'before', 'c1');
      expect(result).not.toBeNull();
      expect(result!.getMonth()).toBe(11); // December of previous year
      expect(result!.getDate()).toBe(31);
    });

    it('no skipping → original date unchanged', async () => {
      const saturday = new Date(2026, 2, 7);
      const result = await engine.adjustForHolidays(saturday, false, false, null, 'c1');
      expect(result!.getDate()).toBe(7);
    });

    it('weekday non-holiday → unchanged', async () => {
      const tuesday = new Date(2026, 2, 10); // March 10, 2026 = Tuesday
      const result = await engine.adjustForHolidays(tuesday, true, true, 'after', 'c1');
      expect(result!.getDate()).toBe(10);
    });
  });

  // ================================================================
  // projectOccurrences() — integration
  // ================================================================
  describe('projectOccurrences()', () => {
    it('monthly recurrence produces approximately 3 occurrences in 3 months', async () => {
      const occurrences = await recurringEngine.projectOccurrences(
        makeRecurring({
          start_date: new Date().toISOString(),
          frequency: 'mensal',
          occurrence_count: 0,
        }),
        3,
      );

      // Should produce ~3 occurrences (including start date if within window)
      expect(occurrences.length).toBeGreaterThanOrEqual(2);
      expect(occurrences.length).toBeLessThanOrEqual(4);
    });

    it('occurrence_limit=5 → never more than 5 results', async () => {
      const occurrences = await recurringEngine.projectOccurrences(
        makeRecurring({
          start_date: new Date().toISOString(),
          frequency: 'semanal',
          occurrence_limit: 5,
          occurrence_count: 0,
        }),
        12,
      );

      expect(occurrences.length).toBeLessThanOrEqual(5);
    });

    it('end_date in past → all occurrences are past_due', async () => {
      const occurrences = await recurringEngine.projectOccurrences(
        makeRecurring({
          start_date: '2020-01-01',
          end_date: '2020-12-31',
          frequency: 'mensal',
          occurrence_count: 0,
        }),
        12,
      );

      // Engine still generates past occurrences, but marks them as past_due
      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach(occ => {
        expect(occ.is_past_due).toBe(true);
      });
    });

    it('occurrence_count=3 → starts from #4', async () => {
      const occurrences = await recurringEngine.projectOccurrences(
        makeRecurring({
          start_date: new Date().toISOString(),
          frequency: 'mensal',
          occurrence_count: 3,
        }),
        12,
      );

      if (occurrences.length > 0) {
        expect(occurrences[0].occurrence_number).toBe(4);
      }
    });

    it('each occurrence has expected shape', async () => {
      const occurrences = await recurringEngine.projectOccurrences(
        makeRecurring({
          start_date: new Date().toISOString(),
          frequency: 'mensal',
          occurrence_count: 0,
        }),
        3,
      );

      if (occurrences.length > 0) {
        const occ = occurrences[0];
        expect(occ).toHaveProperty('date');
        expect(occ).toHaveProperty('amount', 1000);
        expect(occ).toHaveProperty('occurrence_number');
        expect(occ).toHaveProperty('is_past_due');
        expect(occ.date).toBeInstanceOf(Date);
      }
    });
  });
});
