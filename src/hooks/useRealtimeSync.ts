'use client';

/**
 * useRealtimeSync — Generic Supabase Realtime hook for cache invalidation.
 *
 * Subscribes to postgres_changes on one or more tables and invalidates
 * the specified React Query keys when events arrive. Includes debouncing,
 * company-scoped server-side filtering, and automatic reconnection.
 *
 * Use this for new tables or modules that need realtime sync.
 * The existing `useFinancialRealtime` hook covers core financial tables
 * and should NOT be replaced — it has domain-specific cascade logic.
 */

import { useEffect, useRef, useState } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const RECONNECT_DELAY_MS = 5000;
const DEFAULT_DEBOUNCE_MS = 1000;

interface TableSubscription {
  /** Supabase table name */
  table: string;
  /** Query keys to invalidate when this table changes */
  invalidateKeys: readonly (readonly unknown[])[];
  /** Optional: custom handler instead of key invalidation */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvent?: (payload: any, queryClient: QueryClient) => void;
}

interface UseRealtimeSyncConfig {
  /** Channel name prefix (will be suffixed with companyId) */
  channelName: string;
  /** Company ID for server-side filtering */
  companyId: string | null | undefined;
  /** Table subscriptions */
  tables: TableSubscription[];
  /** Debounce interval in ms (default: 1000) */
  debounceMs?: number;
  /** Enable/disable the subscription */
  enabled?: boolean;
}

export function useRealtimeSync({
  channelName,
  companyId,
  tables,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  enabled = true,
}: UseRealtimeSyncConfig) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  const companyIdRef = useRef(companyId);
  companyIdRef.current = companyId;

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Stable serialization of tables config to avoid unnecessary re-subscriptions
  const tablesKey = tables.map((t) => t.table).join(',');

  useEffect(() => {
    if (!enabled || !companyId) {
      if (channelRef.current) {
        channelRef.current.unsubscribe().catch(console.error);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
      return;
    }

    if (isSubscribedRef.current && channelRef.current) return;

    const fullChannelName = `${channelName}-${companyId}`;
    const channel = supabase.channel(fullChannelName);

    const debouncedInvalidate = (
      table: string,
      handler: (qc: QueryClient, id: string) => void,
    ) => {
      if (debounceTimers.current[table]) {
        clearTimeout(debounceTimers.current[table]);
      }
      debounceTimers.current[table] = setTimeout(() => {
        const id = companyIdRef.current;
        if (id) handler(queryClientRef.current, id);
      }, debounceMs);
    };

    for (const sub of tables) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: sub.table,
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          // Client-side safety filter
          const record = payload.new as Record<string, unknown> | undefined;
          if (record?.company_id && record.company_id !== companyId) return;

          if (sub.onEvent) {
            debouncedInvalidate(sub.table, (qc) => sub.onEvent!(payload, qc));
          } else {
            debouncedInvalidate(sub.table, (qc, id) => {
              for (const key of sub.invalidateKeys) {
                qc.invalidateQueries({
                  queryKey: [...key],
                  predicate: (q) => q.queryKey.includes(id),
                });
              }
            });
          }
        },
      );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false;
        if (channelRef.current) {
          const dead = channelRef.current;
          channelRef.current = null;
          dead.unsubscribe().catch(console.error);
          supabase.removeChannel(dead);
        }
        reconnectTimerRef.current = setTimeout(() => {
          setReconnectCount((c) => c + 1);
        }, RECONNECT_DELAY_MS);
      }
    });

    channelRef.current = channel;

    return () => {
      isSubscribedRef.current = false;
      Object.values(debounceTimers.current).forEach(clearTimeout);
      debounceTimers.current = {};
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (channelRef.current) {
        const ch = channelRef.current;
        channelRef.current = null;
        ch.unsubscribe().catch(console.error);
        supabase.removeChannel(ch);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, enabled, tablesKey, channelName, reconnectCount, debounceMs]);
}
