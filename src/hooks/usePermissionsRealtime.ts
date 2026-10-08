'use client';

/**
 * usePermissionsRealtime - Supabase Realtime hook for permission data
 *
 * Listens to real-time changes on user_companies and user_roles tables
 * and automatically invalidates the session cache + refreshes user context
 * when permissions change (e.g., admin changes a user's role).
 *
 * Follows the same pattern as useFinancialRealtime.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { invalidateCache, CACHE_KEYS } from '@/lib/sessionCache';
import { useAuthActions } from '@/contexts/AuthContext';
import { useDebouncedCallback } from '@/hooks/useDebounce';

const RECONNECT_DELAY_MS = 5000;
const DEBOUNCE_MS = 1000;

export function usePermissionsRealtime(userId: string | null) {
  const { refreshUserContext } = useAuthActions();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePermissionChangeCore = useCallback(() => {
    invalidateCache(CACHE_KEYS.USER_CONTEXT);
    refreshUserContext();
  }, [refreshUserContext]);

  const handlePermissionChange = useDebouncedCallback(handlePermissionChangeCore, DEBOUNCE_MS);

  useEffect(() => {
    if (!userId) {
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

    const channelName = `permissions-${userId}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_companies',
          filter: `user_id=eq.${userId}`,
        },
        () => handlePermissionChange()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`,
        },
        () => handlePermissionChange()
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
  }, [userId, reconnectCount, handlePermissionChange]);
}
