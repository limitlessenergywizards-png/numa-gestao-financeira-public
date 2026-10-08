/**
 * Period Utilities
 * 
 * Provides date range calculations for dashboard period filters.
 */

import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter,
  startOfYear, endOfYear,
  format,
  getMonth,
  setMonth
} from 'date-fns';

export type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year';

export interface DateRange {
  start: string;  // 'yyyy-MM-dd'
  end: string;    // 'yyyy-MM-dd'
}

/**
 * Calculate date range based on the selected period
 */
export function getDateRange(period: PeriodType): DateRange {
  const now = new Date();

  switch (period) {
    case 'day':
      return {
        start: format(startOfDay(now), 'yyyy-MM-dd'),
        end: format(endOfDay(now), 'yyyy-MM-dd'),
      };
    case 'week':
      return {
        start: format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        end: format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
      };
    case 'month':
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    case 'quarter':
      return {
        start: format(startOfQuarter(now), 'yyyy-MM-dd'),
        end: format(endOfQuarter(now), 'yyyy-MM-dd'),
      };
    case 'semester': {
      const currentMonth = getMonth(now);
      const isFirstSemester = currentMonth < 6;
      const startMonth = isFirstSemester ? 0 : 6; // January or July
      const endMonth = isFirstSemester ? 5 : 11; // June or December

      return {
        start: format(startOfMonth(setMonth(now, startMonth)), 'yyyy-MM-dd'),
        end: format(endOfMonth(setMonth(now, endMonth)), 'yyyy-MM-dd'),
      };
    }
    case 'year':
      return {
        start: format(startOfYear(now), 'yyyy-MM-dd'),
        end: format(endOfYear(now), 'yyyy-MM-dd'),
      };
  }
}

/** Period labels in Portuguese */
export const PERIOD_LABELS: Record<PeriodType, string> = {
  day: 'Dia',
  week: 'Semana',
  month: 'Mês',
  quarter: 'Trimestre',
  semester: 'Semestre',
  year: 'Ano',
};

/** Period short labels for compact display */
export const PERIOD_SHORT_LABELS: Record<PeriodType, string> = {
  day: 'D',
  week: 'S',
  month: 'M',
  quarter: 'T',
  semester: 'S',
  year: 'A',
};
