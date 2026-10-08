'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FINANCIAL_INDICATORS_KEYS, STALE_TIMES, GC_TIMES } from '@/lib/queryKeys';
import { format, subMonths, getDay, getDate, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from '@/lib/periodUtils';

interface TransactionRow {
  transaction_date: string;
  type: string;
  amount: number;
}

export interface MismatchDataPoint {
  label: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface CashMismatchResult {
  weeklyMismatch: MismatchDataPoint[];
  monthlyMismatch: MismatchDataPoint[];
  isLoading: boolean;
  hasData: boolean;
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function useCashMismatch(companyId: string | null | undefined, dateRange?: DateRange): CashMismatchResult {
  const enabled = !!companyId;

  // Buscar transações dos últimos 6 meses
  const transactionsQuery = useQuery({
    queryKey: enabled
      ? [...FINANCIAL_INDICATORS_KEYS.cashMismatch(companyId), dateRange?.start, dateRange?.end]
      : ['disabled'],
    queryFn: async () => {
      const startDate = dateRange?.start || format(subMonths(new Date(), 6), 'yyyy-MM-dd');
      const endDate = dateRange?.end || format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('transactions')
        .select('transaction_date, type, amount')
        .eq('company_id', companyId!)
        .eq('is_deleted', false)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: true });

      if (error) throw error;
      return (data ?? []) as TransactionRow[];
    },
    enabled,
    staleTime: STALE_TIMES.HISTORICAL,
    gcTime: GC_TIMES.HISTORICAL,
  });

  const { weeklyMismatch, monthlyMismatch, hasData } = useMemo(() => {
    const transactions = transactionsQuery.data ?? [];

    if (transactions.length === 0) {
      return {
        weeklyMismatch: [],
        monthlyMismatch: [],
        hasData: false,
      };
    }

    // --- Descasamento Semanal ---
    // Acumular entradas/saídas por dia da semana
    const weekAccum: Record<number, { entradas: number; saidas: number; count: number }> = {};
    for (let i = 0; i < 7; i++) {
      weekAccum[i] = { entradas: 0, saidas: 0, count: 0 };
    }

    // --- Descasamento Mensal ---
    // Acumular entradas/saídas por dia do mês (1-31)
    const monthAccum: Record<number, { entradas: number; saidas: number; count: number }> = {};
    for (let d = 1; d <= 31; d++) {
      monthAccum[d] = { entradas: 0, saidas: 0, count: 0 };
    }

    // Contar meses distintos para calcular médias
    const monthsSet = new Set<string>();

    transactions.forEach((t) => {
      const date = new Date(t.transaction_date + 'T12:00:00'); // Evita timezone issues
      const dayOfWeek = getDay(date); // 0=Dom, 6=Sáb
      const dayOfMonth = getDate(date); // 1-31
      const monthKey = format(date, 'yyyy-MM');

      monthsSet.add(monthKey);

      const amount = Number(t.amount);

      if (t.type === 'entrada') {
        weekAccum[dayOfWeek].entradas += amount;
        monthAccum[dayOfMonth].entradas += amount;
      } else {
        weekAccum[dayOfWeek].saidas += amount;
        monthAccum[dayOfMonth].saidas += amount;
      }

      weekAccum[dayOfWeek].count++;
      monthAccum[dayOfMonth].count++;
    });

    const totalMonths = Math.max(monthsSet.size, 1);

    // Média semanal
    const weekly: MismatchDataPoint[] = [];
    // Reordenar: Seg(1) a Dom(0)
    const dayOrder = [1, 2, 3, 4, 5, 6, 0];
    for (const dayIdx of dayOrder) {
      const acc = weekAccum[dayIdx];
      const avgEntradas = acc.entradas / totalMonths;
      const avgSaidas = acc.saidas / totalMonths;
      weekly.push({
        label: WEEK_DAYS[dayIdx],
        entradas: Math.round(avgEntradas * 100) / 100,
        saidas: Math.round(avgSaidas * 100) / 100,
        saldo: Math.round((avgEntradas - avgSaidas) * 100) / 100,
      });
    }

    // Média mensal (só dias com dados)
    const monthly: MismatchDataPoint[] = [];
    for (let d = 1; d <= 31; d++) {
      const acc = monthAccum[d];
      if (acc.count === 0) continue;
      const avgEntradas = acc.entradas / totalMonths;
      const avgSaidas = acc.saidas / totalMonths;
      monthly.push({
        label: String(d),
        entradas: Math.round(avgEntradas * 100) / 100,
        saidas: Math.round(avgSaidas * 100) / 100,
        saldo: Math.round((avgEntradas - avgSaidas) * 100) / 100,
      });
    }

    return {
      weeklyMismatch: weekly,
      monthlyMismatch: monthly,
      hasData: true,
    };
  }, [transactionsQuery.data]);

  return {
    weeklyMismatch,
    monthlyMismatch,
    isLoading: transactionsQuery.isLoading,
    hasData,
  };
}
