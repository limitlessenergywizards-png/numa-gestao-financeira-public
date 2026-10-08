'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  format,
  getMonth,
  getYear,
  subMonths,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CashFlowFilters } from './useCashFlowQueries';

// ============================================
// TYPES
// ============================================

interface UseCashFlowFiltersReturn {
  filters: CashFlowFilters;
  selectedMonth: number | null;
  selectedYear: number;

  // Actions
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setBankAccount: (id: string) => void;
  setViewType: (type: CashFlowFilters['viewType']) => void;
  setNature: (nature: CashFlowFilters['nature']) => void;
  setMonth: (month: number | null) => void;
  setYear: (year: number) => void;
  clearFilters: () => void;

  // Derived
  periodLabel: string;
}

// ============================================
// HELPERS
// ============================================

function getDefaultFilters(): CashFlowFilters {
  const now = new Date();
  return {
    startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
    bankAccountId: 'all',
    viewType: 'ambos',
    nature: 'all',
  };
}

// ============================================
// HOOK
// ============================================

export function useCashFlowFilters(): UseCashFlowFiltersReturn {
  const [filters, setFilters] = useState<CashFlowFilters>(getDefaultFilters);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(getMonth(new Date()));
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));

  // Individual setters with proper memoization
  const setStartDate = useCallback((date: string) => {
    setFilters(prev => ({ ...prev, startDate: date }));
    setSelectedMonth(null); // Clear quick filter when manual date set
  }, []);

  const setEndDate = useCallback((date: string) => {
    setFilters(prev => ({ ...prev, endDate: date }));
    setSelectedMonth(null);
  }, []);

  const setBankAccount = useCallback((id: string) => {
    setFilters(prev => ({ ...prev, bankAccountId: id }));
  }, []);

  const setViewType = useCallback((type: CashFlowFilters['viewType']) => {
    setFilters(prev => ({ ...prev, viewType: type }));
  }, []);

  const setMonth = useCallback((month: number | null) => {
    setSelectedMonth(month);
    if (month !== null) {
      const date = new Date(selectedYear, month, 1);
      setFilters(prev => ({
        ...prev,
        startDate: format(startOfMonth(date), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(date), 'yyyy-MM-dd'),
      }));
    }
  }, [selectedYear]);

  const setYear = useCallback((year: number) => {
    setSelectedYear(year);
    if (selectedMonth !== null) {
      const date = new Date(year, selectedMonth, 1);
      setFilters(prev => ({
        ...prev,
        startDate: format(startOfMonth(date), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(date), 'yyyy-MM-dd'),
      }));
    }
  }, [selectedMonth]);

  const clearFilters = useCallback(() => {
    setFilters(getDefaultFilters());
    setSelectedMonth(getMonth(new Date()));
    setSelectedYear(getYear(new Date()));
  }, []);

  // Derived period label
  const periodLabel = useMemo(() => {
    return format(parseISO(filters.startDate), "MMMM 'de' yyyy", { locale: ptBR });
  }, [filters.startDate]);

  const setNature = useCallback((nature: CashFlowFilters['nature']) => {
    setFilters(prev => ({ ...prev, nature }));
  }, []);

  return {
    filters,
    selectedMonth,
    selectedYear,
    setStartDate,
    setEndDate,
    setBankAccount,
    setViewType,
    setNature,
    setMonth,
    setYear,
    clearFilters,
    periodLabel,
  };
}

// ============================================
// COMPARISON DATA HOOK (extracted from inline IIFE)
// ============================================

interface MonthlyComparisonData {
  month: string;
  monthLabel: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

export function useComparisonData(
  transactions: { date: string; type: 'entrada' | 'saida'; amount: number }[],
  saldoInicial: number,
  monthsBack: number = 6
): MonthlyComparisonData[] {
  return useMemo(() => {
    const months: MonthlyComparisonData[] = [];
    let accumulated = saldoInicial;

    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMM/yy', { locale: ptBR });

      const monthTxs = transactions.filter(t => {
        const txDate = parseISO(t.date);
        return txDate >= monthStart && txDate <= monthEnd;
      });

      const entradas = monthTxs
        .filter(t => t.type === 'entrada')
        .reduce((sum, t) => sum + t.amount, 0);
      const saidas = monthTxs
        .filter(t => t.type === 'saida')
        .reduce((sum, t) => sum + t.amount, 0);
      const saldo = entradas - saidas;
      accumulated += saldo;

      months.push({
        month: monthKey,
        monthLabel,
        entradas,
        saidas,
        saldo,
        saldoAcumulado: accumulated,
      });
    }

    return months;
  }, [transactions, saldoInicial, monthsBack]);
}
