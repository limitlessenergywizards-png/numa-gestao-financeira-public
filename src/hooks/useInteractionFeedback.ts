'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export type InteractionState = 'idle' | 'hover' | 'press' | 'loading' | 'success' | 'error';

interface UseInteractionFeedbackOptions {
  onSuccess?: () => void;
  onError?: () => void;
  successDuration?: number;
  errorDuration?: number;
}

export function useInteractionFeedback(options: UseInteractionFeedbackOptions = {}) {
  const { 
    onSuccess, 
    onError, 
    successDuration = 1500,
    errorDuration = 2000 
  } = options;
  
  const [state, setState] = useState<InteractionState>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Touch feedback handlers
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  const handlers = {
    onMouseEnter: useCallback(() => {
      if (state === 'idle') {
        setState('hover');
      }
    }, [state]),
    
    onMouseLeave: useCallback(() => {
      if (state === 'hover' || state === 'press') {
        setState('idle');
      }
    }, [state]),
    
    onMouseDown: useCallback(() => {
      if (state === 'hover' || state === 'idle') {
        setState('press');
      }
    }, [state]),
    
    onMouseUp: useCallback(() => {
      if (state === 'press') {
        setState('hover');
      }
    }, [state]),
    
    onFocus: useCallback(() => {
      if (state === 'idle') {
        setState('hover');
      }
    }, [state]),
    
    onBlur: useCallback(() => {
      if (state === 'hover') {
        setState('idle');
      }
    }, [state]),

    // Touch-specific handlers for instant feedback
    onTouchStart: useCallback(() => {
      setState('press');
      triggerHaptic('light');
    }, [triggerHaptic]),

    onTouchEnd: useCallback(() => {
      setState('idle');
    }, []),
  };

  const setLoading = useCallback(() => {
    clearTimeoutRef();
    setState('loading');
  }, [clearTimeoutRef]);

  const setSuccess = useCallback(() => {
    clearTimeoutRef();
    setState('success');
    onSuccess?.();
    
    timeoutRef.current = setTimeout(() => {
      setState('idle');
    }, successDuration);
  }, [clearTimeoutRef, onSuccess, successDuration]);

  const setError = useCallback(() => {
    clearTimeoutRef();
    setState('error');
    onError?.();
    
    timeoutRef.current = setTimeout(() => {
      setState('idle');
    }, errorDuration);
  }, [clearTimeoutRef, onError, errorDuration]);

  const reset = useCallback(() => {
    clearTimeoutRef();
    setState('idle');
  }, [clearTimeoutRef]);

  return {
    state,
    handlers,
    setLoading,
    setSuccess,
    setError,
    reset,
    isIdle: state === 'idle',
    isHover: state === 'hover',
    isPress: state === 'press',
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
  };
}
