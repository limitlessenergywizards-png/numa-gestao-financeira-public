'use client';

/**
 * useDashboardPrefetch - Critical Data Prefetching
 * 
 * @deprecated Use useOptimisticPrefetch instead for better performance.
 * This hook is kept for backward compatibility but delegates to the new optimistic prefetch.
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { dashboardKeys, STALE_TIMES, GC_TIMES } from '@/lib/queryKeys';

/**
 * Hook to prefetch critical dashboard data
 * Uses unified query keys for cache compatibility
 */
export const useDashboardPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchDashboardData = useCallback(async (companyId: string) => {
    if (!companyId) return;

    const prefetchPromises = [
      // Receivables — MUST match useDashboardQueries (no status filter)
      queryClient.prefetchQuery({
        queryKey: dashboardKeys.receivables(companyId),
        queryFn: async () => {
          const { data } = await supabase
            .from('receivables')
            .select('id, total_amount, paid_amount, due_date, status, chart_account_id')
            .eq('company_id', companyId);
          return data ?? [];
        },
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
      }),

      // Payables — MUST match useDashboardQueries (neq cancelado)
      queryClient.prefetchQuery({
        queryKey: dashboardKeys.payables(companyId),
        queryFn: async () => {
          const { data } = await supabase
            .from('payables')
            .select('id, total_amount, paid_amount, due_date, status, chart_account_id')
            .eq('company_id', companyId)
            .neq('status', 'cancelado');
          return data ?? [];
        },
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
      }),

      // Bank accounts — specific columns matching useDashboardQueries
      queryClient.prefetchQuery({
        queryKey: dashboardKeys.bankAccounts(companyId),
        queryFn: async () => {
          const { data } = await supabase
            .from('bank_accounts')
            .select('id, name, bank_name, current_balance, is_active')
            .eq('company_id', companyId)
            .eq('is_active', true);
          return data ?? [];
        },
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
      }),

      // Recent transactions — specific columns + limit matching useDashboardQueries
      queryClient.prefetchQuery({
        queryKey: dashboardKeys.transactionsRecent(companyId),
        queryFn: async () => {
          const { data } = await supabase
            .from('transactions')
            .select('id, description, amount, type, transaction_date, bank_account_id, nature')
            .eq('company_id', companyId)
            .eq('is_deleted', false)
            .order('transaction_date', { ascending: false })
            .limit(50);
          return data ?? [];
        },
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
      }),

      // Prefetch income chart of accounts
      queryClient.prefetchQuery({
        queryKey: dashboardKeys.chartAccountsIncome(companyId),
        queryFn: async () => {
          const { data } = await supabase
            .from('chart_of_accounts')
            .select('id, name, type')
            .eq('company_id', companyId)
            .eq('type', 'receita');
          return data ?? [];
        },
        staleTime: STALE_TIMES.REFERENCE,
        gcTime: GC_TIMES.REFERENCE,
      }),

      // Prefetch expense chart of accounts
      queryClient.prefetchQuery({
        queryKey: dashboardKeys.chartAccountsExpense(companyId),
        queryFn: async () => {
          const { data } = await supabase
            .from('chart_of_accounts')
            .select('id, name, type')
            .eq('company_id', companyId)
            .in('type', ['despesa', 'custo']);
          return data ?? [];
        },
        staleTime: STALE_TIMES.REFERENCE,
        gcTime: GC_TIMES.REFERENCE,
      }),
    ];

    try {
      await Promise.allSettled(prefetchPromises);
      if (process.env.NODE_ENV !== 'production') {
        console.log('📦 Dashboard data prefetched with unified keys');
      }
    } catch (error) {
      // Fail silently - prefetching is an optimization
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Prefetch failed:', error);
      }
    }
  }, [queryClient]);

  return { prefetchDashboardData };
};

/**
 * Hook to trigger prefetch after login
 * @deprecated Use DashboardPrefetchProvider instead
 */
export const usePrefetchOnLogin = (userId: string | null, companyId: string | null) => {
  const { prefetchDashboardData } = useDashboardPrefetch();

  // This is handled by DashboardPrefetchProvider now
  // Kept for backward compatibility
};

/**
 * Invalidate dashboard data (call after mutations)
 */
export const useInvalidateDashboard = () => {
  const queryClient = useQueryClient();

  return useCallback((companyId: string) => {
    // Invalidate all dashboard queries for this company
    queryClient.invalidateQueries({ queryKey: dashboardKeys.receivables(companyId) });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.payables(companyId) });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.bankAccounts(companyId) });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.transactions(companyId) });
  }, [queryClient]);
};
