'use client';

/**
 * useDateRange Hook
 * 
 * Manages date range selection with quick period filters.
 * Used in Transactions, CashFlow, Payables, Receivables.
 */

import { useState, useMemo, useCallback } from 'react';
import { 
  startOfDay, endOfDay, 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
  format,
  subMonths,
  subDays,
  subWeeks,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type QuickPeriod = 'today' | 'yesterday' | 'week' | 'last_week' | 'month' | 'last_month' | 'year' | 'custom';

export interface UseDateRangeOptions {
  initialPeriod?: QuickPeriod;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export interface UseDateRangeReturn {
  startDate: Date;
  endDate: Date;
  quickPeriod: QuickPeriod;
  setQuickPeriod: (period: QuickPeriod) => void;
  setCustomRange: (start: Date, end: Date) => void;
  startDateStr: string;
  endDateStr: string;
  label: string;
  isCustom: boolean;
}

export const PERIOD_LABELS: Record<QuickPeriod, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  week: 'Esta Semana',
  last_week: 'Semana Passada',
  month: 'Este Mês',
  last_month: 'Mês Passado',
  year: 'Este Ano',
  custom: 'Personalizado',
};

export function useDateRange(options: UseDateRangeOptions = {}): UseDateRangeReturn {
  const { initialPeriod = 'month', weekStartsOn = 0 } = options;
  
  const [quickPeriod, setQuickPeriodState] = useState<QuickPeriod>(initialPeriod);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    
    if (quickPeriod === 'custom' && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }

    switch (quickPeriod) {
      case 'today':
        return { startDate: startOfDay(now), endDate: endOfDay(now) };
      case 'yesterday': {
        const yesterday = subDays(now, 1);
        return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
      }
      case 'week':
        return { 
          startDate: startOfWeek(now, { weekStartsOn, locale: ptBR }), 
          endDate: endOfWeek(now, { weekStartsOn, locale: ptBR }) 
        };
      case 'last_week': {
        const lastWeek = subWeeks(now, 1);
        return { 
          startDate: startOfWeek(lastWeek, { weekStartsOn, locale: ptBR }), 
          endDate: endOfWeek(lastWeek, { weekStartsOn, locale: ptBR }) 
        };
      }
      case 'month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'last_month': {
        const lastMonth = subMonths(now, 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      }
      case 'year':
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  }, [quickPeriod, customStart, customEnd, weekStartsOn]);

  const setQuickPeriod = useCallback((period: QuickPeriod) => {
    setQuickPeriodState(period);
    if (period !== 'custom') {
      setCustomStart(null);
      setCustomEnd(null);
    }
  }, []);

  const setCustomRange = useCallback((start: Date, end: Date) => {
    setQuickPeriodState('custom');
    setCustomStart(start);
    setCustomEnd(end);
  }, []);

  const label = useMemo(() => {
    if (quickPeriod === 'custom') {
      return `${format(startDate, 'dd/MM/yy')} - ${format(endDate, 'dd/MM/yy')}`;
    }
    return PERIOD_LABELS[quickPeriod];
  }, [quickPeriod, startDate, endDate]);

  return {
    startDate,
    endDate,
    quickPeriod,
    setQuickPeriod,
    setCustomRange,
    startDateStr: format(startDate, 'yyyy-MM-dd'),
    endDateStr: format(endDate, 'yyyy-MM-dd'),
    label,
    isCustom: quickPeriod === 'custom',
  };
}
