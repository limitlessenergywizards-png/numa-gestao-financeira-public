'use client';

/**
 * useOptimisticPrefetch - Pre-Auth Data Loading
 * 
 * Triggers dashboard data prefetch BEFORE auth completes by reading
 * companyId from sessionStorage cache. This eliminates the data waterfall
 * where queries only start after auth → company context completes.
 * 
 * Flow:
 * 1. On mount: Check sessionStorage for cached user_context
 * 2. If cache hit with companyId: Trigger prefetch immediately
 * 3. When auth completes: Validate company, invalidate if changed
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCache, setCache, CACHE_KEYS, TTL } from '@/lib/sessionCache';
import { dashboardKeys, STALE_TIMES, GC_TIMES } from '@/lib/queryKeys';

interface CachedUserContext {
  userId: string;
  defaultCompanyId: string | null;
}

/**
 * Prefetch all critical dashboard data for a given company
 */
export function useOptimisticPrefetch() {
  const queryClient = useQueryClient();
  const prefetchedCompanyRef = useRef<string | null>(null);
  const hasPrefetchedRef = useRef(false);

  const prefetchDashboardData = useCallback(async (companyId: string) => {
    if (!companyId || prefetchedCompanyRef.current === companyId) {
      return;
    }

    prefetchedCompanyRef.current = companyId;

    // Save last used company for next session
    setCache(CACHE_KEYS.LAST_COMPANY_ID, companyId, TTL.COMPANIES);

    const prefetchPromises = [
      // Receivables — MUST match useDashboardQueries exactly (no status filter)
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

      // Payables — MUST match useDashboardQueries exactly (neq cancelado, no status filter)
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

      // Income chart of accounts
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

      // Expense chart of accounts
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
    ];

    try {
      await Promise.allSettled(prefetchPromises);
      if (process.env.NODE_ENV !== 'production') {
        console.log('📦 [OptimisticPrefetch] Dashboard data prefetched for company:', companyId);
      }
    } catch (error) {
      // Fail silently - prefetching is an optimization
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[OptimisticPrefetch] Prefetch failed:', error);
      }
    }
  }, [queryClient]);

  const invalidateAndRefetch = useCallback((newCompanyId: string) => {
    // If company changed, clear old cache and refetch
    if (prefetchedCompanyRef.current && prefetchedCompanyRef.current !== newCompanyId) {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      prefetchedCompanyRef.current = null;
    }
    prefetchDashboardData(newCompanyId);
  }, [queryClient, prefetchDashboardData]);

  /**
   * Get optimistic companyId from cache
   * Returns companyId if found in sessionStorage, null otherwise
   */
  const getOptimisticCompanyId = useCallback((): string | null => {
    // Try last used company first (reflects actual selection, not just default)
    const lastCompanyId = getCache<string>(CACHE_KEYS.LAST_COMPANY_ID);
    if (lastCompanyId) {
      return lastCompanyId;
    }

    // Fallback to default from user context cache
    const cachedContext = getCache<CachedUserContext>(CACHE_KEYS.USER_CONTEXT);
    return cachedContext?.defaultCompanyId ?? null;
  }, []);

  /**
   * Trigger optimistic prefetch on mount
   * This runs BEFORE auth completes, using cached companyId
   */
  const triggerOptimisticPrefetch = useCallback(() => {
    if (hasPrefetchedRef.current) return;

    const optimisticCompanyId = getOptimisticCompanyId();
    if (optimisticCompanyId) {
      hasPrefetchedRef.current = true;
      prefetchDashboardData(optimisticCompanyId);
    }
  }, [getOptimisticCompanyId, prefetchDashboardData]);

  return {
    prefetchDashboardData,
    invalidateAndRefetch,
    getOptimisticCompanyId,
    triggerOptimisticPrefetch,
  };
}

/**
 * Hook to run optimistic prefetch on app mount
 * Should be placed high in the component tree
 */
export function useOptimisticPrefetchOnMount() {
  const { triggerOptimisticPrefetch } = useOptimisticPrefetch();

  useEffect(() => {
    // Run immediately on mount, before auth completes
    triggerOptimisticPrefetch();
  }, [triggerOptimisticPrefetch]);
}
