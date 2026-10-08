'use client';

/**
 * useFinancialDataPrefetch - Warm cache on sidebar mount
 *
 * Pre-fetches reference data AND core financial data into React Query cache
 * so navigating to any financial page is INSTANT.
 *
 * Phase 1 (1.5s): Reference data (suppliers, customers, bank accounts, etc.)
 * Phase 2 (2.5s): Core page data (payables, receivables) - the big queries
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import {
    BANK_ACCOUNTS_KEYS,
    CHART_ACCOUNTS_KEYS,
    CUSTOMERS_KEYS,
    SUPPLIERS_KEYS,
    PAYABLES_KEYS,
    RECEIVABLES_KEYS,
    STALE_TIMES,
    GC_TIMES,
} from '@/lib/queryKeys';

export function useFinancialDataPrefetch(): void {
    const queryClient = useQueryClient();
    const { currentCompany } = useCompany();
    const companyId = currentCompany?.id;

    useEffect(() => {
        if (!companyId) return;

        // Phase 1: Reference data (lightweight, needed by all pages)
        const phase1 = setTimeout(() => {
            // Bank accounts
            queryClient.prefetchQuery({
                queryKey: BANK_ACCOUNTS_KEYS.list(companyId, false),
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from('bank_accounts')
                        .select('id, name, current_balance')
                        .eq('company_id', companyId)
                        .eq('is_active', true)
                        .order('name');
                    if (error) throw error;
                    return data || [];
                },
                staleTime: STALE_TIMES.REFERENCE,
            });

            // Suppliers (used by payables filter dropdown)
            queryClient.prefetchQuery({
                queryKey: SUPPLIERS_KEYS.active(companyId),
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from('suppliers')
                        .select('id, name')
                        .eq('company_id', companyId)
                        .eq('is_active', true)
                        .order('name');
                    if (error) throw error;
                    return data || [];
                },
                staleTime: STALE_TIMES.REFERENCE,
            });

            // Customers (used by receivables filter dropdown)
            queryClient.prefetchQuery({
                queryKey: CUSTOMERS_KEYS.active(companyId),
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from('customers')
                        .select('id, name')
                        .eq('company_id', companyId)
                        .eq('is_active', true)
                        .order('name');
                    if (error) throw error;
                    return data || [];
                },
                staleTime: STALE_TIMES.REFERENCE,
            });

            // Expense categories (used by payables page filter)
            queryClient.prefetchQuery({
                queryKey: ['categories', 'expense', companyId],
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from('categories')
                        .select('id, name, type, color, icon')
                        .eq('company_id', companyId)
                        .eq('is_active', true)
                        .in('type', ['despesa', 'ambos'])
                        .order('name')
                        .limit(200);
                    if (error) throw error;
                    return data || [];
                },
                staleTime: STALE_TIMES.REFERENCE,
            });
        }, 1500);

        // Phase 2: Core page data (heavier queries, staggered to avoid network congestion)
        const phase2 = setTimeout(() => {
            // Payables - MUST match fetchPayables() in usePayablesQuery.ts exactly
            queryClient.prefetchQuery({
                queryKey: PAYABLES_KEYS.list(companyId),
                queryFn: async () => {
                    const { data, error } = await supabase
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
                    if (error) throw error;
                    return data || [];
                },
                staleTime: STALE_TIMES.FINANCIAL,
                gcTime: GC_TIMES.FINANCIAL,
            });

            // Receivables - MUST match fetchReceivables() in useReceivablesQuery.ts exactly
            queryClient.prefetchQuery({
                queryKey: RECEIVABLES_KEYS.list(companyId),
                queryFn: async () => {
                    const { data, error } = await supabase
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
                    if (error) throw error;
                    return data || [];
                },
                staleTime: STALE_TIMES.FINANCIAL,
                gcTime: GC_TIMES.FINANCIAL,
            });
        }, 2500);

        return () => {
            clearTimeout(phase1);
            clearTimeout(phase2);
        };
    }, [companyId, queryClient]);
}
