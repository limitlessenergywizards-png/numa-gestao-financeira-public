'use client';

/**
 * DashboardPrefetchProvider
 * 
 * Triggers OPTIMISTIC prefetch of dashboard data using cached companyId
 * BEFORE auth completes. This eliminates the data waterfall.
 * 
 * Flow:
 * 1. On mount: Read companyId from sessionStorage cache
 * 2. If found: Prefetch immediately (parallel with auth)
 * 3. When auth completes: Validate company, refetch if changed
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useOptimisticPrefetch } from '@/hooks/useOptimisticPrefetch';

export function DashboardPrefetchProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { currentCompany, isLoading: companyLoading } = useCompany();
  const { 
    prefetchDashboardData, 
    invalidateAndRefetch,
    getOptimisticCompanyId 
  } = useOptimisticPrefetch();
  
  const optimisticCompanyIdRef = useRef<string | null>(null);
  const hasTriggeredOptimisticRef = useRef(false);

  // Phase 1: Optimistic prefetch on mount (BEFORE auth completes)
  useEffect(() => {
    if (hasTriggeredOptimisticRef.current) return;

    const optimisticCompanyId = getOptimisticCompanyId();
    if (optimisticCompanyId) {
      hasTriggeredOptimisticRef.current = true;
      optimisticCompanyIdRef.current = optimisticCompanyId;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('🚀 [DashboardPrefetchProvider] Optimistic prefetch triggered for:', optimisticCompanyId);
      }
      
      prefetchDashboardData(optimisticCompanyId);
    }
  }, [getOptimisticCompanyId, prefetchDashboardData]);

  // Phase 2: Validate when auth completes
  useEffect(() => {
    // Only run after auth and company context are both loaded
    if (authLoading || companyLoading) return;
    if (!user) return;
    
    // If company is now known
    if (currentCompany?.id) {
      const optimisticId = optimisticCompanyIdRef.current;
      
      // If optimistic ID was wrong, invalidate and refetch with correct company
      if (optimisticId && optimisticId !== currentCompany.id) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔄 [DashboardPrefetchProvider] Company changed, invalidating:', {
            optimistic: optimisticId,
            actual: currentCompany.id,
          });
        }
        invalidateAndRefetch(currentCompany.id);
      } 
      // If we didn't prefetch optimistically, do it now
      else if (!optimisticId) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('📦 [DashboardPrefetchProvider] No optimistic cache, prefetching now:', currentCompany.id);
        }
        prefetchDashboardData(currentCompany.id);
      }
      // If optimistic was correct, data is already cached - nothing to do!
      else if (process.env.NODE_ENV !== 'production') {
        console.log('✅ [DashboardPrefetchProvider] Optimistic cache was correct, data ready!');
      }
    }
  }, [authLoading, companyLoading, user, currentCompany?.id, invalidateAndRefetch, prefetchDashboardData]);

  return <>{children}</>;
}
