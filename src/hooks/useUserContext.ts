'use client';

/**
 * useUserContext Hook
 * 
 * Enterprise-grade unified hook for fetching user context in a single RPC call.
 * Replaces the sequential queries in AuthContext and CompanyContext.
 * 
 * Features:
 * - Single RPC call for profile + roles + companies
 * - sessionStorage caching for instant F5/navigation
 * - Graceful fallback to individual queries if RPC fails
 * - Cache invalidation on signOut, company switch, profile update
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();
import {
  getCache,
  setCache,
  invalidateCache,
  invalidateAllCaches,
  CACHE_KEYS,
  TTL
} from '@/lib/sessionCache';

// Types
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  job_title: string | null;
  trial_started_at: string | null;
  current_streak: number | null;
  total_xp: number | null;
  guardian_level: number | null;
  current_title: string | null;
}

export interface CompanyData {
  id: string;
  name: string;
  trading_name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  logo_url: string | null;
  currency: string;
  currency_symbol: string;
  is_headquarters: boolean;
  parent_company_id: string | null;
  created_by: string | null;
}

export interface CompanyAssociation {
  company_id: string;
  is_default: boolean;
  role: string;
  company: CompanyData;
}

export type AppRole = 'admin' | 'editor' | 'viewer';

export interface UserContextData {
  profile: UserProfile | null;
  roles: AppRole[];
  companies: CompanyAssociation[];
  defaultCompanyId: string | null;
}

export interface UserContextState extends UserContextData {
  isLoading: boolean;
  isFromCache: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  invalidateUserCache: () => void;
}

interface CachedUserContext extends UserContextData {
  userId: string;
}

/**
 * Fetch user context via RPC
 */
async function fetchUserContextRPC(userId: string): Promise<UserContextData> {
  const { data, error } = await supabase.rpc('get_user_context', {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`RPC get_user_context failed: ${error.message}`);
  }

  // Parse the JSONB response - cast through unknown for safety
  const result = data as unknown as {
    profile: UserProfile | Record<string, never>;
    roles: AppRole[];
    companies: CompanyAssociation[];
    default_company_id: string | null;
  };

  return {
    profile: Object.keys(result.profile || {}).length > 0 ? result.profile as UserProfile : null,
    roles: result.roles || [],
    companies: result.companies || [],
    defaultCompanyId: result.default_company_id,
  };
}

/**
 * Fallback: fetch user context via individual queries
 * Used if RPC fails for any reason
 */
async function fetchUserContextFallback(userId: string): Promise<UserContextData> {
  // Fetch profile, roles, and companies in parallel
  const [profileResult, rolesResult, companiesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, user_id, full_name, avatar_url, phone, whatsapp_number, job_title, trial_started_at, current_streak, total_xp, guardian_level, current_title')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId),
    supabase
      .from('user_companies')
      .select(`
        company_id,
        is_default,
        role,
        company:companies(*)
      `)
      .eq('user_id', userId),
  ]);

  const profile = profileResult.data as UserProfile | null;
  const roles = (rolesResult.data || []).map(r => r.role as AppRole);

  // Transform and sort by company created_at ASC (first registered first)
  const companies: CompanyAssociation[] = (companiesResult.data || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((uc: any) => ({
      company_id: uc.company_id,
      is_default: uc.is_default,
      role: uc.role,
      company: uc.company as CompanyData,
    }))
    .sort((a, b) => {
      const aDate = (a.company as CompanyData & { created_at?: string })?.created_at || '';
      const bDate = (b.company as CompanyData & { created_at?: string })?.created_at || '';
      return aDate.localeCompare(bDate);
    });

  // Default: explicit is_default, fallback to first-registered company
  const defaultCompany = companies.find(c => c.is_default) || companies[0];

  return {
    profile,
    roles,
    companies,
    defaultCompanyId: defaultCompany?.company_id || null,
  };
}

/**
 * Main hook for user context
 */
export function useUserContext(userId: string | null): UserContextState {
  const [state, setState] = useState<UserContextState>({
    profile: null,
    roles: [],
    companies: [],
    defaultCompanyId: null,
    isLoading: true,
    isFromCache: false,
    error: null,
    refresh: async () => { },
    invalidateUserCache: () => { },
  });

  const fetchingRef = useRef(false);

  const fetchContext = useCallback(async (skipCache: boolean = false) => {
    if (!userId) {
      setState(prev => ({
        ...prev,
        profile: null,
        roles: [],
        companies: [],
        defaultCompanyId: null,
        isLoading: false,
        isFromCache: false,
        error: null,
      }));
      return;
    }

    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      // Check cache first (unless skipCache)
      if (!skipCache) {
        const cached = getCache<CachedUserContext>(CACHE_KEYS.USER_CONTEXT);
        if (cached && cached.userId === userId) {
          setState(prev => ({
            ...prev,
            profile: cached.profile,
            roles: cached.roles,
            companies: cached.companies,
            defaultCompanyId: cached.defaultCompanyId,
            isLoading: false,
            isFromCache: true,
            error: null,
          }));
          fetchingRef.current = false;
          // Background refresh to ensure data freshness
          setTimeout(() => fetchContext(true), 100);
          return;
        }
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      let contextData: UserContextData;

      try {
        // Try RPC first
        contextData = await fetchUserContextRPC(userId);
      } catch (rpcError) {
        console.warn('[useUserContext] RPC failed, using fallback:', rpcError);
        // Fallback to individual queries
        contextData = await fetchUserContextFallback(userId);
      }

      // Cache the result
      const cacheData: CachedUserContext = {
        ...contextData,
        userId,
      };
      setCache(CACHE_KEYS.USER_CONTEXT, cacheData, TTL.USER_CONTEXT);

      setState(prev => ({
        ...prev,
        ...contextData,
        isLoading: false,
        isFromCache: false,
        error: null,
      }));
    } catch (error) {
      console.error('[useUserContext] Failed to fetch context:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isFromCache: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    // Force a clear of the cache key first
    invalidateCache(CACHE_KEYS.USER_CONTEXT);

    // Reset fetching ref in case it got stuck (safety valve)
    if (fetchingRef.current) {
      console.warn('[useUserContext] Resetting stuck fetching ref during refresh');
      fetchingRef.current = false;
    }

    // Force fetch skipping cache
    await fetchContext(true);
  }, [fetchContext]);

  const invalidateUserCache = useCallback(() => {
    invalidateCache(CACHE_KEYS.USER_CONTEXT);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  return {
    ...state,
    refresh,
    invalidateUserCache,
  };
}

/**
 * Utility to invalidate user context cache
 * Exported for use in signOut, profile updates, etc.
 */
export function clearUserContextCache(): void {
  invalidateCache(CACHE_KEYS.USER_CONTEXT);
}

/**
 * Utility to clear all app caches
 * Exported for use in signOut
 */
export function clearAllCaches(): void {
  invalidateAllCaches();
}
