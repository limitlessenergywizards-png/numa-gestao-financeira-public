'use client';

/**
 * useFinancialRealtime - Supabase Realtime hook for financial data
 *
 * Listens to real-time changes on transactions, payables, receivables,
 * bank_accounts, payment_records, and orcamentos tables and automatically
 * invalidates ONLY the affected React Query caches (targeted, not nuclear).
 *
 * Uses server-side filtering via `filter: company_id=eq.{id}` so only
 * events for the current company are delivered.
 */

import { useEffect, useRef, useState } from 'react';
import { useQueryClient, QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  TRANSACTIONS_KEYS,
  PAYABLES_KEYS,
  RECEIVABLES_KEYS,
  BANK_ACCOUNTS_KEYS,
  BUDGETS_KEYS,
  DASHBOARD_KEYS,
  CASH_FLOW_KEYS,
  FINANCIAL_INDICATORS_KEYS,
} from '@/lib/queryKeys';

const RECONNECT_DELAY_MS = 5000;
const DEBOUNCE_MS = 1000;

// ── Targeted invalidation per table ──────────────────────────────────
// Each table change only invalidates queries that actually depend on it.
// This replaces the old nuclear `invalidateFinancialQueries` that invalidated
// EVERY query containing the companyId on ANY table change.

function invalidateTransactions(qc: QueryClient, companyId: string) {
  qc.invalidateQueries({ queryKey: [...TRANSACTIONS_KEYS.all], predicate: (q) => q.queryKey.includes(companyId) });
  qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.transactions(companyId), exact: false });
  qc.invalidateQueries({ queryKey: CASH_FLOW_KEYS.all, predicate: (q) => q.queryKey.includes(companyId) });
  qc.invalidateQueries({ queryKey: FINANCIAL_INDICATORS_KEYS.all, predicate: (q) => q.queryKey.includes(companyId) });
}

function invalidatePayables(qc: QueryClient, companyId: string) {
  qc.invalidateQueries({ queryKey: [...PAYABLES_KEYS.all], predicate: (q) => q.queryKey.includes(companyId) });
  qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.payables(companyId), exact: false });
  qc.invalidateQueries({ queryKey: CASH_FLOW_KEYS.all, predicate: (q) => q.queryKey.includes(companyId) });
  qc.invalidateQueries({ queryKey: FINANCIAL_INDICATORS_KEYS.all, predicate: (q) => q.queryKey.includes(companyId) });
}

function invalidateReceivables(qc: QueryClient, companyId: string) {
  qc.invalidateQueries({ queryKey: [...RECEIVABLES_KEYS.all], predicate: (q) => q.queryKey.includes(companyId) });
  qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.receivables(companyId), exact: false });
  qc.invalidateQueries({ queryKey: CASH_FLOW_KEYS.all, predicate: (q) => q.queryKey.includes(companyId) });
  qc.invalidateQueries({ queryKey: FINANCIAL_INDICATORS_KEYS.all, predicate: (q) => q.queryKey.includes(companyId) });
}

function invalidateBankAccounts(qc: QueryClient, companyId: string) {
  qc.invalidateQueries({ queryKey: [...BANK_ACCOUNTS_KEYS.all], predicate: (q) => q.queryKey.includes(companyId) });
  qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.bankAccounts(companyId), exact: false });
}

function invalidatePaymentRecords(qc: QueryClient, companyId: string) {
  // Payment records affect both payables and receivables
  qc.invalidateQueries({ queryKey: [...PAYABLES_KEYS.all], predicate: (q) => q.queryKey.includes(companyId) });
  qc.invalidateQueries({ queryKey: [...RECEIVABLES_KEYS.all], predicate: (q) => q.queryKey.includes(companyId) });
  qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.payables(companyId), exact: false });
  qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.receivables(companyId), exact: false });
  qc.invalidateQueries({ queryKey: CASH_FLOW_KEYS.all, predicate: (q) => q.queryKey.includes(companyId) });
  qc.invalidateQueries({ queryKey: FINANCIAL_INDICATORS_KEYS.all, predicate: (q) => q.queryKey.includes(companyId) });
}

function invalidateBudgets(qc: QueryClient, companyId: string) {
  qc.invalidateQueries({ queryKey: [...BUDGETS_KEYS.all], predicate: (q) => q.queryKey.includes(companyId) });
}

export function useFinancialRealtime(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store refs to avoid re-subscribing when queryClient/companyId reference changes
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  const companyIdRef = useRef(companyId);
  companyIdRef.current = companyId;

  // Single debounce timer per table to batch rapid-fire events
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!companyId) {
      if (channelRef.current) {
        channelRef.current.unsubscribe().then(() => {
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
        });
        isSubscribedRef.current = false;
      }
      return;
    }

    if (isSubscribedRef.current && channelRef.current) {
      return;
    }

    // Stable channel name — no Date.now() to avoid duplicate channels on re-render
    const channelName = `financial-${companyId}`;
    const channel = supabase.channel(channelName);

    // Debounced handler: batches rapid events per table into one invalidation
    const debouncedInvalidate = (table: string, handler: (qc: QueryClient, id: string) => void) => {
      if (debounceTimers.current[table]) {
        clearTimeout(debounceTimers.current[table]);
      }
      debounceTimers.current[table] = setTimeout(() => {
        const id = companyIdRef.current;
        if (id) handler(queryClientRef.current, id);
      }, DEBOUNCE_MS);
    };

    // Client-side safety filter
    const filterAndHandle = (payload: any, table: string, handler: (qc: QueryClient, id: string) => void) => {
      const record = payload.new;
      if (record && record.company_id && record.company_id !== companyId) return;
      debouncedInvalidate(table, handler);
    };

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `company_id=eq.${companyId}` },
        (payload) => filterAndHandle(payload, 'transactions', invalidateTransactions)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payables', filter: `company_id=eq.${companyId}` },
        (payload) => filterAndHandle(payload, 'payables', invalidatePayables)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'receivables', filter: `company_id=eq.${companyId}` },
        (payload) => filterAndHandle(payload, 'receivables', invalidateReceivables)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bank_accounts', filter: `company_id=eq.${companyId}` },
        (payload) => filterAndHandle(payload, 'bank_accounts', invalidateBankAccounts)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_records', filter: `company_id=eq.${companyId}` },
        (payload) => filterAndHandle(payload, 'payment_records', invalidatePaymentRecords)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orcamentos', filter: `company_id=eq.${companyId}` },
        (payload) => filterAndHandle(payload, 'orcamentos', invalidateBudgets)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isSubscribedRef.current = false;
          if (channelRef.current) {
            const deadChannel = channelRef.current;
            channelRef.current = null;
            deadChannel.unsubscribe().catch(console.error);
            supabase.removeChannel(deadChannel);
          }
          reconnectTimerRef.current = setTimeout(() => {
            setReconnectCount((c) => c + 1);
          }, RECONNECT_DELAY_MS);
        }
      });

    channelRef.current = channel;

    return () => {
      isSubscribedRef.current = false;
      // Clear all debounce timers
      Object.values(debounceTimers.current).forEach(clearTimeout);
      debounceTimers.current = {};
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (channelRef.current) {
        const channelToRemove = channelRef.current;
        channelRef.current = null;
        channelToRemove.unsubscribe().catch(console.error);
        supabase.removeChannel(channelToRemove);
      }
    };
    // Only re-subscribe when companyId changes or reconnection is needed
    // Handlers use refs so they don't need to be in deps
  }, [companyId, reconnectCount]);
}