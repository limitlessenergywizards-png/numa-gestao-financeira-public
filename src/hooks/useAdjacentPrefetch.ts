'use client';

/**
 * useAdjacentPrefetch - Contextual Route Prefetching
 * 
 * Automatically prefetches adjacent/related routes when user
 * navigates to a page, anticipating their next likely action.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getAdjacentRoutes } from '@/lib/routeModuleMap';
import { prefetchRoutes } from '@/hooks/useRoutePrefetch';

/**
 * Hook that prefetches adjacent routes based on current location
 * Should be used once at the app/layout level
 */
export function useAdjacentPrefetch(): void {
  const pathname = usePathname();

  useEffect(() => {
    const currentPath = pathname;
    const adjacentRoutes = getAdjacentRoutes(currentPath);
    
    if (adjacentRoutes.length > 0) {
      // Small delay to let the current page render first
      const timeoutId = setTimeout(() => {
        prefetchRoutes(adjacentRoutes);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [pathname]);
}

/**
 * Prefetch critical routes on app initialization
 * Should be called once when app loads
 */
export function prefetchCriticalRoutes(): void {
  // These are the most commonly accessed routes
  const criticalRoutes = [
    '/inicio',
    '/dashboard',
    '/financeiro/transacoes',
  ];
  
  // Use a longer delay on initial load to not compete with app hydration
  setTimeout(() => {
    prefetchRoutes(criticalRoutes);
  }, 2000);
}
