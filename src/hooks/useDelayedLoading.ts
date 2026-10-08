'use client';

/**
 * useDelayedLoading - Prevents loading state "flashes"
 * 
 * Shows loading state with a minimum display time to avoid jarring UX
 * when content loads very quickly.
 * 
 * @param isLoading - The actual loading state from data fetching
 * @param minDelay - Minimum time to show loading state (default: 300ms)
 * @returns Whether to show the loading UI
 * 
 * @example
 * const { data, isLoading } = useQuery(...);
 * const showLoading = useDelayedLoading(isLoading);
 * if (showLoading) return <Skeleton />;
 */

import { useState, useEffect, useRef } from 'react';

export function useDelayedLoading(isLoading: boolean, minDelay = 300): boolean {
  const [showLoading, setShowLoading] = useState(isLoading);
  const loadingStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Start loading immediately
      setShowLoading(true);
      loadingStartTime.current = Date.now();
    } else if (loadingStartTime.current !== null) {
      // Calculate remaining time to meet minimum delay
      const elapsed = Date.now() - loadingStartTime.current;
      const remainingDelay = Math.max(0, minDelay - elapsed);

      if (remainingDelay > 0) {
        const timer = setTimeout(() => {
          setShowLoading(false);
          loadingStartTime.current = null;
        }, remainingDelay);
        return () => clearTimeout(timer);
      } else {
        setShowLoading(false);
        loadingStartTime.current = null;
      }
    }
  }, [isLoading, minDelay]);

  return showLoading;
}
