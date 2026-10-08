'use client';

/**
 * useRoutePrefetch - Enterprise Route Prefetching Hook
 * 
 * Manages intelligent prefetching with:
 * - Hover-based prefetching (100ms delay)
 * - Network-aware throttling
 * - Cache tracking to avoid duplicate requests
 * - Accessibility support (focus-based prefetch)
 */

import { useCallback, useRef } from 'react';
import { getRouteLoader, hasRouteLoader } from '@/lib/routeModuleMap';

// Global cache to track prefetched routes across all component instances
const prefetchedRoutes = new Set<string>();
const pendingPrefetches = new Map<string, number>();

// Network connection type detection
type ConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';

function getConnectionType(): ConnectionType {
  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: ConnectionType;
      saveData?: boolean;
    };
  };

  if (nav.connection?.saveData) {
    return 'slow-2g'; // Data saver mode - treat as slow
  }

  return nav.connection?.effectiveType || '4g';
}

function getPrefetchDelay(): number {
  const connectionType = getConnectionType();

  switch (connectionType) {
    case '4g':
      return 100; // Aggressive prefetching
    case '3g':
      return 300; // Conservative prefetching
    case '2g':
    case 'slow-2g':
      return -1; // Disabled - return -1 to indicate no prefetch
    default:
      return 150;
  }
}

function shouldPrefetch(): boolean {
  return getPrefetchDelay() > 0;
}

/**
 * Prefetch a route's module
 */
export function prefetchRoute(path: string): void {
  // Skip if already prefetched or no loader exists
  if (prefetchedRoutes.has(path) || !hasRouteLoader(path)) {
    return;
  }

  // Skip on slow connections
  if (!shouldPrefetch()) {
    return;
  }

  const loader = getRouteLoader(path);
  if (loader) {
    // Mark as prefetched immediately to prevent duplicate requests
    prefetchedRoutes.add(path);

    // Execute the dynamic import
    loader().catch((error) => {
      // Remove from cache on error so it can be retried
      prefetchedRoutes.delete(path);
      console.warn(`[Prefetch] Failed to prefetch ${path}:`, error);
    });
  }
}

/**
 * Check if a route has been prefetched
 */
export function isRoutePrefetched(path: string): boolean {
  return prefetchedRoutes.has(path);
}

/**
 * Get prefetch statistics (for debugging)
 */
export function getPrefetchStats() {
  return {
    prefetchedCount: prefetchedRoutes.size,
    prefetchedRoutes: Array.from(prefetchedRoutes),
    pendingCount: pendingPrefetches.size,
  };
}

export interface PrefetchHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
}

/**
 * Main hook for route prefetching (code + data)
 * Code prefetching handled here. Data prefetching handled in PrefetchLink via usePrefetchRoute.
 */
export function useRoutePrefetch(path: string): PrefetchHandlers {
  const timeoutRef = useRef<number | null>(null);


  const cancelPrefetch = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      pendingPrefetches.delete(path);
    }
  }, [path]);

  const schedulePrefetch = useCallback(() => {
    // Already prefetched - no action needed
    if (prefetchedRoutes.has(path)) {
      return;
    }

    // Already pending - no action needed
    if (pendingPrefetches.has(path)) {
      return;
    }

    const delay = getPrefetchDelay();

    // Disabled on slow connections
    if (delay < 0) {
      return;
    }

    // Schedule the prefetch
    timeoutRef.current = window.setTimeout(() => {
      prefetchRoute(path);
      pendingPrefetches.delete(path);
      timeoutRef.current = null;
    }, delay);

    pendingPrefetches.set(path, timeoutRef.current);
  }, [path]);

  const onMouseEnter = useCallback(() => {
    schedulePrefetch();
  }, [schedulePrefetch]);

  const onMouseLeave = useCallback(() => {
    cancelPrefetch();
  }, [cancelPrefetch]);

  const onFocus = useCallback(() => {
    // Immediate prefetch on focus for accessibility
    prefetchRoute(path);
  }, [path]);

  return {
    onMouseEnter,
    onMouseLeave,
    onFocus,
  };
}

/**
 * Prefetch multiple routes at once (for contextual prefetching)
 */
export function prefetchRoutes(paths: string[]): void {
  // Use requestIdleCallback for non-blocking prefetch
  const prefetchBatch = () => {
    paths.forEach((path, index) => {
      // Stagger prefetches to avoid network congestion
      setTimeout(() => prefetchRoute(path), index * 50);
    });
  };

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(prefetchBatch);
  } else {
    // Fallback for Safari
    setTimeout(prefetchBatch, 100);
  }
}
