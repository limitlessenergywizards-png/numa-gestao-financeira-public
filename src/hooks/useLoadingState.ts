'use client';

import { useState, useRef, useCallback, useEffect } from "react";

interface UseLoadingStateOptions {
  timeout?: number; // Timeout in ms (default: 30000)
  onTimeout?: () => void;
}

interface UseLoadingStateReturn {
  isLoading: boolean;
  isTimedOut: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

/**
 * Hook for managing loading state with timeout protection
 * Prevents infinite loading and double-submit issues
 */
export function useLoadingState(
  options: UseLoadingStateOptions = {}
): UseLoadingStateReturn {
  const { timeout = 30000, onTimeout } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startLoading = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setIsTimedOut(false);

    // Clear any existing timeout
    clearTimeoutRef();

    // Set new timeout
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsTimedOut(true);
          onTimeout?.();
        }
      }, timeout);
    }
  }, [timeout, onTimeout, clearTimeoutRef]);

  const stopLoading = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setIsLoading(false);
    clearTimeoutRef();
  }, [clearTimeoutRef]);

  /**
   * Wrapper that handles loading state automatically
   * Returns null if the operation times out or fails
   */
  const withLoading = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      // Prevent double-submit
      if (isLoading) {
        console.warn("[useLoadingState] Operation already in progress");
        return null;
      }

      startLoading();
      
      try {
        const result = await fn();
        stopLoading();
        return result;
      } catch (error) {
        stopLoading();
        throw error;
      }
    },
    [isLoading, startLoading, stopLoading]
  );

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      clearTimeoutRef();
    };
  }, [clearTimeoutRef]);

  return {
    isLoading,
    isTimedOut,
    startLoading,
    stopLoading,
    withLoading,
  };
}
