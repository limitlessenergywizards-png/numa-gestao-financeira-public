'use client';

/**
 * useTransactionsRealtime
 * 
 * Subscribes to Supabase Realtime changes on the `transactions` table
 * and instantly invalidates React Query caches so the UI refreshes
 * in under 1 second — no page reload required.
 *
 * Accepts an optional `onRealtimeChange` callback to also refresh
 * local-state data (e.g. useTransactionsData's refetch).
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyState } from '@/contexts/CompanyContext';
import { invalidateFinancialQueries } from '@/lib/queryInvalidation';

export function useTransactionsRealtime(onRealtimeChange?: () => void) {
    const queryClient = useQueryClient();
    const { currentCompany } = useCompanyState();

    // Store callback in ref to avoid re-subscribing when the callback reference changes
    const onChangeRef = useRef(onRealtimeChange);
    useEffect(() => {
        onChangeRef.current = onRealtimeChange;
    });

    useEffect(() => {
        if (!currentCompany?.id) return;

        const channel = supabase
            .channel(`transactions-realtime-${currentCompany.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'transactions',
                    filter: `company_id=eq.${currentCompany.id}`,
                },
                (_payload) => {
                    // Invalidate financial queries for this company only
                    if (currentCompany?.id) {
                        invalidateFinancialQueries(queryClient, currentCompany.id);
                    }
                    // Also refresh local-state data if a callback was provided
                    onChangeRef.current?.();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentCompany?.id, queryClient]);
}
