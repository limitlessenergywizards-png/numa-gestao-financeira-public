'use client';

/**
 * usePrefetchRoute — Hover/Focus Prefetching
 *
 * Prefetches query data when the user HOVERS or FOCUSES a navigation link.
 * By the time they click, the data is already in the React Query cache.
 *
 * This eliminates the perceived loading time between page navigations.
 *
 * Usage:
 *   const { prefetchHandlers } = usePrefetchRoute();
 *   <Link {...prefetchHandlers(MAIN_ROUTES.PAYABLES)}>Contas a Pagar</Link>
 */

import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import {
    PAYABLES_KEYS,
    RECEIVABLES_KEYS,
    TRANSACTIONS_KEYS,
    DASHBOARD_KEYS,
    STALE_TIMES,
    GC_TIMES,
} from '@/lib/queryKeys';
import { MAIN_ROUTES } from '@/lib/routes';

// Map of route patterns to their prefetch functions
type PrefetchFn = (companyId: string, queryClient: ReturnType<typeof useQueryClient>) => void;

const ROUTE_PREFETCH_MAP: Record<string, PrefetchFn> = {
    // MUST match fetchPayables() in usePayablesQuery.ts exactly
    [MAIN_ROUTES.PAYABLES]: (companyId, qc) => {
        qc.prefetchQuery({
            queryKey: PAYABLES_KEYS.list(companyId),
            queryFn: async () => {
                const { data } = await supabase
                    .from('payables')
                    .select(`
                        id, company_id, supplier_id, category_id, chart_account_id, cost_center_id,
                        description, document_number, issue_date, due_date, total_amount, paid_amount,
                        status, installment_number, total_installments, notes,
                        supplier:suppliers(name),
                        chart_account:chart_of_accounts(name, code, cost_type, dre_category),
                        category:categories(name),
                        is_debt_payment
                    `)
                    .eq('company_id', companyId)
                    .eq('is_deleted', false)
                    .order('due_date', { ascending: true });
                return data ?? [];
            },
            staleTime: STALE_TIMES.FINANCIAL,
            gcTime: GC_TIMES.FINANCIAL,
        });
    },

    // MUST match fetchReceivables() in useReceivablesQuery.ts exactly
    [MAIN_ROUTES.RECEIVABLES]: (companyId, qc) => {
        qc.prefetchQuery({
            queryKey: RECEIVABLES_KEYS.list(companyId),
            queryFn: async () => {
                const { data } = await supabase
                    .from('receivables')
                    .select(`
                        id, company_id, customer_id, category_id, chart_account_id,
                        description, document_number, issue_date, due_date, total_amount, paid_amount,
                        status, installment_number, total_installments, notes, recurrence,
                        bank_account_id, payment_method,
                        customer:customers(name),
                        chart_account:chart_of_accounts(name, code, cost_type, dre_category),
                        category:categories(name, type, color, icon),
                        bank_account:bank_accounts(name)
                    `)
                    .eq('company_id', companyId)
                    .eq('is_deleted', false)
                    .order('due_date', { ascending: true });
                return data ?? [];
            },
            staleTime: STALE_TIMES.FINANCIAL,
            gcTime: GC_TIMES.FINANCIAL,
        });
    },

    [MAIN_ROUTES.TRANSACTIONS]: (companyId, qc) => {
        qc.prefetchQuery({
            queryKey: TRANSACTIONS_KEYS.list(companyId),
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
        });
    },

    // MUST match useDashboardQueries exactly (no status filter)
    [MAIN_ROUTES.HOME]: (companyId, qc) => {
        qc.prefetchQuery({
            queryKey: DASHBOARD_KEYS.receivables(companyId),
            queryFn: async () => {
                const { data } = await supabase
                    .from('receivables')
                    .select('id, total_amount, paid_amount, due_date, status, chart_account_id')
                    .eq('company_id', companyId);
                return data ?? [];
            },
            staleTime: STALE_TIMES.FINANCIAL,
        });
        qc.prefetchQuery({
            queryKey: DASHBOARD_KEYS.payables(companyId),
            queryFn: async () => {
                const { data } = await supabase
                    .from('payables')
                    .select('id, total_amount, paid_amount, due_date, status, chart_account_id')
                    .eq('company_id', companyId)
                    .neq('status', 'cancelado');
                return data ?? [];
            },
            staleTime: STALE_TIMES.FINANCIAL,
        });
    },
};

export function usePrefetchRoute() {
    const queryClient = useQueryClient();
    const { currentCompany } = useCompany();
    const companyId = currentCompany?.id;
    const prefetchedRef = useRef<Set<string>>(new Set());

    const prefetch = useCallback((route: string) => {
        if (!companyId) return;
        // Don't prefetch the same route twice per session
        if (prefetchedRef.current.has(route)) return;

        const prefetchFn = ROUTE_PREFETCH_MAP[route];
        if (prefetchFn) {
            prefetchedRef.current.add(route);
            prefetchFn(companyId, queryClient);
        }
    }, [companyId, queryClient]);

    const prefetchHandlers = useCallback((route: string) => ({
        onMouseEnter: () => prefetch(route),
        onFocus: () => prefetch(route),
    }), [prefetch]);

    return { prefetch, prefetchHandlers };
}
