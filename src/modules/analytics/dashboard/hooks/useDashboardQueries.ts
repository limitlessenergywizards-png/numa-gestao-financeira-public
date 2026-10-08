'use client';

/**
 * useDashboardQueries - Unified Dashboard Data Hook
 * 
 * Provides all dashboard data through React Query with unified query keys.
 * Designed to work with useOptimisticPrefetch for cache hits.
 * 
 * Now supports optional date range filtering for period-based queries.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { dashboardKeys, STALE_TIMES, GC_TIMES } from '@/lib/queryKeys';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { DateRange } from '@/lib/periodUtils';

interface Receivable {
  id: string;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  chart_account_id: string | null;
}

interface Payable {
  id: string;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  chart_account_id: string | null;
}

interface BankAccount {
  id: string;
  name: string;
  bank_name: string | null;
  current_balance: number;
  is_active: boolean;
}

interface ChartAccount {
  id: string;
  name: string;
  type: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  transaction_date: string;
  bank_account_id: string;
  nature: 'realizado' | 'previsao';
}

/**
 * Unified Dashboard Queries Hook
 * 
 * @param companyId - The company ID to fetch data for
 * @param dateRange - Optional date range for period filtering
 */
export function useDashboardQueries(
  companyId: string | null | undefined,
  dateRange?: DateRange,
  options?: { minimal?: boolean }
) {
  const enabled = !!companyId;
  const minimal = options?.minimal ?? false;

  // Core receivables query - with optional period filtering
  const receivablesQuery = useQuery({
    queryKey: enabled ? dashboardKeys.receivables(companyId, dateRange) : ['disabled'],
    queryFn: async () => {
      let query = supabase
        .from('receivables')
        .select('id, total_amount, paid_amount, due_date, status, chart_account_id')
        .eq('company_id', companyId!)
        .eq('is_deleted', false);

      // Apply date range filter if provided
      if (dateRange) {
        query = query
          .gte('due_date', dateRange.start)
          .lte('due_date', dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Receivable[];
    },
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
    // refetchOnMount REMOVED — staleTime handles freshness, 'always' defeats prefetch cache
  });

  // Core payables query - with optional period filtering
  const payablesQuery = useQuery({
    queryKey: enabled ? dashboardKeys.payables(companyId, dateRange) : ['disabled'],
    queryFn: async () => {
      let query = supabase
        .from('payables')
        .select('id, total_amount, paid_amount, due_date, status, chart_account_id')
        .eq('company_id', companyId!)
        .eq('is_deleted', false)
        .neq('status', 'cancelado');

      // Apply date range filter if provided
      if (dateRange) {
        query = query
          .gte('due_date', dateRange.start)
          .lte('due_date', dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Payable[];
    },
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
    // refetchOnMount REMOVED — staleTime handles freshness, 'always' defeats prefetch cache
  });

  // Bank accounts - matches prefetch
  const bankAccountsQuery = useQuery({
    queryKey: enabled ? dashboardKeys.bankAccounts(companyId) : ['disabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, name, bank_name, current_balance, is_active')
        .eq('company_id', companyId!)
        .eq('is_active', true);

      if (error) throw error;
      return (data ?? []) as BankAccount[];
    },
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
    // refetchOnMount REMOVED — staleTime handles freshness, 'always' defeats prefetch cache
  });

  // Income chart of accounts - matches prefetch
  const incomeAccountsQuery = useQuery({
    queryKey: enabled && !minimal ? dashboardKeys.chartAccountsIncome(companyId) : ['disabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('id, name, type')
        .eq('company_id', companyId!)
        .eq('type', 'receita');

      if (error) throw error;
      return (data ?? []) as ChartAccount[];
    },
    enabled: enabled && !minimal,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  // Expense chart of accounts - matches prefetch
  const expenseAccountsQuery = useQuery({
    queryKey: enabled && !minimal ? dashboardKeys.chartAccountsExpense(companyId) : ['disabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('id, name, type')
        .eq('company_id', companyId!)
        .in('type', ['despesa', 'custo']);

      if (error) throw error;
      return (data ?? []) as ChartAccount[];
    },
    enabled: enabled && !minimal,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  // Recent transactions - for the list widget (always limited)
  const transactionsRecentQuery = useQuery({
    queryKey: enabled && !minimal ? dashboardKeys.transactionsRecent(companyId!, dateRange ? { start: dateRange.start, end: dateRange.end } : undefined) : ['disabled'],
    queryFn: async ({ signal }) => {
      let query = supabase
        .from('transactions')
        .select('id, description, amount, type, transaction_date, bank_account_id, nature')
        .eq('company_id', companyId!)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
        .limit(50);

      // Apply date range filter if provided
      if (dateRange) {
        query = query.gte('transaction_date', dateRange.start).lte('transaction_date', dateRange.end);
      }

      if (signal) query = query.abortSignal(signal);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
    enabled: enabled && !minimal,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  // Total Financials (Receitas vs Despesas vs Totais) - SERVER SIDE RPC
  // Defined before transactionsSummaryQuery so the fallback can check isError.
  const financialTotalsQuery = useQuery({
    queryKey: ['dashboard', 'financial_totals', companyId, dateRange?.start, dateRange?.end],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_financial_totals', {
          p_company_id: companyId!,
          p_start_date: dateRange!.start,
          p_end_date: dateRange!.end,
        });

      if (error || !data || data.length === 0) {
        throw new Error(error?.message ?? 'RPC get_financial_totals returned empty');
      }

      const result = data[0];
      return {
        receitas: Number(result.receitas || 0),
        despesas: Number(result.despesas || 0),
        receivables_total: Number(result.receivables_total || 0),
        receivables_received: Number(result.receivables_received || 0),
        payables_total: Number(result.payables_total || 0),
        payables_paid: Number(result.payables_paid || 0),
        current_balance: Number(result.current_balance || 0),
        isRpc: true,
      };
    },
    enabled: !!companyId && !!dateRange && !minimal,
    staleTime: STALE_TIMES.FINANCIAL,
    retry: false, // Don't retry if RPC doesn't exist
  });

  // Transactions Summary - FALLBACK ONLY (fires when RPC fails)
  // When RPC succeeds, this query never runs, saving a full table scan.
  const transactionsSummaryQuery = useQuery({
    queryKey: ['dashboard', 'transactions', 'summary', companyId, dateRange?.start, dateRange?.end],
    queryFn: async ({ signal }) => {
      let query = supabase
        .from('transactions')
        .select('amount, type, nature')
        .eq('company_id', companyId!)
        .eq('is_deleted', false)
        .eq('nature', 'realizado');

      if (dateRange) {
        query = query.gte('transaction_date', dateRange.start).lte('transaction_date', dateRange.end);
      }

      if (signal) query = query.abortSignal(signal);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Pick<Transaction, 'amount' | 'type' | 'nature'>[];
    },
    enabled: enabled && !minimal && financialTotalsQuery.isError,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  // Calculate totals from the full summary dataset
  const financialTotals = useMemo(() => {
    const summaryData = transactionsSummaryQuery.data ?? [];

    const receitas = summaryData
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const despesas = summaryData
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { receitas, despesas };
  }, [transactionsSummaryQuery.data]);

  // Last month receivables - aggregated sum for trend comparison
  const lastMonthDates = {
    start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    end: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
  };

  // PERF: Single query fetches ALL receivables up to last month end, then splits client-side.
  // Before: 2 Supabase calls (monthly + overdue). After: 1 call.
  const lastMonthReceivablesSumQuery = useQuery({
    queryKey: enabled && !minimal ? dashboardKeys.receivablesLastMonthSum(companyId) : ['disabled'],
    queryFn: async () => {
      if (!companyId) return { monthly: 0, overdue: 0 };

      const { data, error } = await supabase
        .from('receivables')
        .select('total_amount, paid_amount, due_date')
        .eq('company_id', companyId)
        .eq('is_deleted', false)
        .lte('due_date', lastMonthDates.end);

      if (error) throw error;

      let monthly = 0;
      let overdue = 0;
      for (const item of data ?? []) {
        const remaining = item.total_amount - item.paid_amount;
        if (item.due_date >= lastMonthDates.start) {
          monthly += remaining;
        } else {
          overdue += remaining;
        }
      }

      return { monthly, overdue };
    },
    enabled: enabled && !minimal,
    staleTime: STALE_TIMES.HISTORICAL,
    gcTime: GC_TIMES.HISTORICAL,
  });

  // PERF: Same optimization for payables — 2 queries → 1 query.
  const lastMonthPayablesSumQuery = useQuery({
    queryKey: enabled && !minimal ? dashboardKeys.payablesLastMonthSum(companyId) : ['disabled'],
    queryFn: async () => {
      if (!companyId) return { monthly: 0, overdue: 0 };

      const { data, error } = await supabase
        .from('payables')
        .select('total_amount, paid_amount, due_date')
        .eq('company_id', companyId)
        .eq('is_deleted', false)
        .lte('due_date', lastMonthDates.end);

      if (error) throw error;

      let monthly = 0;
      let overdue = 0;
      for (const item of data ?? []) {
        const remaining = item.total_amount - item.paid_amount;
        if (item.due_date >= lastMonthDates.start) {
          monthly += remaining;
        } else {
          overdue += remaining;
        }
      }

      return { monthly, overdue };
    },
    enabled: enabled && !minimal,
    staleTime: STALE_TIMES.HISTORICAL,
    gcTime: GC_TIMES.HISTORICAL,
  });

  // Aggregated loading state
  const isLoading =
    receivablesQuery.isLoading ||
    payablesQuery.isLoading ||
    bankAccountsQuery.isLoading ||
    transactionsRecentQuery.isLoading;

  // Check if any core query is fetching
  const isFetching =
    receivablesQuery.isFetching ||
    payablesQuery.isFetching ||
    bankAccountsQuery.isFetching ||
    transactionsRecentQuery.isFetching;

  return {
    // Core data
    receivables: receivablesQuery.data ?? [],
    payables: payablesQuery.data ?? [],
    bankAccounts: bankAccountsQuery.data ?? [],
    incomeAccounts: incomeAccountsQuery.data ?? [],
    expenseAccounts: expenseAccountsQuery.data ?? [],
    transactions: transactionsRecentQuery.data ?? [], // Return the limited list for UI

    // KPIs
    financialTotals,

    // Trend data (aggregated sums)
    lastMonthReceivablesSum: lastMonthReceivablesSumQuery.data ?? { monthly: 0, overdue: 0 },
    lastMonthPayablesSum: lastMonthPayablesSumQuery.data ?? { monthly: 0, overdue: 0 },

    // Loading states
    isLoading,
    isFetching,

    // Individual query states for fine-grained control
    queries: {
      receivables: receivablesQuery,
      payables: payablesQuery,
      bankAccounts: bankAccountsQuery,
      incomeAccounts: incomeAccountsQuery,
      expenseAccounts: expenseAccountsQuery,
      transactions: transactionsRecentQuery,
      transactionsSummary: transactionsSummaryQuery, // Keep for fallback/legacy if needed
      financialTotals: financialTotalsQuery,
      lastMonthReceivablesSum: lastMonthReceivablesSumQuery,
      lastMonthPayablesSum: lastMonthPayablesSumQuery,
    },
  };
}
