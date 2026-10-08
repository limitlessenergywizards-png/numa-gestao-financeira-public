'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useAnimation } from '@/contexts/AnimationContext';

interface UsePullToRefreshOptions {
  threshold?: number;
  maxPull?: number;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

interface PullState {
  pulling: boolean;
  pullDistance: number;
  refreshing: boolean;
  canRefresh: boolean;
}

/**
 * usePullToRefresh - Native pull-to-refresh for mobile
 * 
 * Features:
 * - Physics-based resistance as you pull
 * - Threshold before triggering refresh
 * - Loading state management
 * - Touch gesture handling
 * 
 * @example
 * const { pullState, containerRef, indicatorStyle } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await refetchData();
 *   },
 * });
 */
export const usePullToRefresh = ({
  threshold = 80,
  maxPull = 150,
  onRefresh,
  disabled = false,
}: UsePullToRefreshOptions) => {
  const { isEnabled } = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  const [pullState, setPullState] = useState<PullState>({
    pulling: false,
    pullDistance: 0,
    refreshing: false,
    canRefresh: false,
  });

  // Calculate resistance - harder to pull the further you go
  const calculatePullDistance = useCallback(
    (deltaY: number): number => {
      if (deltaY <= 0) return 0;
      // Apply resistance curve
      const resistance = 0.5;
      const adjustedDelta = deltaY * resistance;
      return Math.min(adjustedDelta, maxPull);
    },
    [maxPull]
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || pullState.refreshing) return;

      // Only start if we're at the top of the page
      const container = containerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop || window.scrollY;
      if (scrollTop > 0) return;

      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    },
    [disabled, pullState.refreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling.current || disabled || pullState.refreshing) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0) {
        // Prevent default scroll when pulling down
        e.preventDefault();

        const pullDistance = calculatePullDistance(deltaY);
        const canRefresh = pullDistance >= threshold;

        setPullState((prev) => ({
          ...prev,
          pulling: true,
          pullDistance,
          canRefresh,
        }));
      }
    },
    [disabled, pullState.refreshing, calculatePullDistance, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;

    isPulling.current = false;
    const { canRefresh, pullDistance } = pullState;

    if (canRefresh && pullDistance >= threshold) {
      // Trigger refresh
      setPullState((prev) => ({
        ...prev,
        pulling: false,
        refreshing: true,
        pullDistance: threshold, // Hold at threshold during refresh
      }));

      try {
        await onRefresh();
      } finally {
        setPullState({
          pulling: false,
          pullDistance: 0,
          refreshing: false,
          canRefresh: false,
        });
      }
    } else {
      // Reset without refresh
      setPullState({
        pulling: false,
        pullDistance: 0,
        refreshing: false,
        canRefresh: false,
      });
    }
  }, [pullState, threshold, onRefresh]);

  // Attach touch listeners
  useEffect(() => {
    if (!isEnabled || disabled) return;

    const container = containerRef.current || document;

    container.addEventListener('touchstart', handleTouchStart as EventListener, {
      passive: true,
    });
    container.addEventListener('touchmove', handleTouchMove as EventListener, {
      passive: false,
    });
    container.addEventListener('touchend', handleTouchEnd as EventListener, {
      passive: true,
    });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart as EventListener);
      container.removeEventListener('touchmove', handleTouchMove as EventListener);
      container.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [isEnabled, disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate indicator styles
  const indicatorStyle = {
    transform: `translateY(${pullState.pullDistance}px)`,
    opacity: Math.min(pullState.pullDistance / threshold, 1),
    transition: pullState.pulling ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out',
  };

  // Progress (0-1)
  const progress = Math.min(pullState.pullDistance / threshold, 1);

  return {
    containerRef,
    pullState,
    indicatorStyle,
    progress,
    isRefreshing: pullState.refreshing,
  };
};
