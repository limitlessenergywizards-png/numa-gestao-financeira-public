'use client';

/**
 * useAbortableFetch Hook
 * 
 * Hook para gerenciar requisições com cancelamento automático.
 * Previne race conditions quando múltiplas requisições são disparadas.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { isAbortError } from '@/lib/errorUtils';

interface UseAbortableFetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseAbortableFetchReturn<T> extends UseAbortableFetchState<T> {
  execute: (fetcher: (signal: AbortSignal) => Promise<T>) => Promise<void>;
  abort: () => void;
  reset: () => void;
}

export function useAbortableFetch<T>(
  initialData: T | null = null
): UseAbortableFetchReturn<T> {
  const [state, setState] = useState<UseAbortableFetchState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    abort();
    setState({
      data: initialData,
      isLoading: false,
      error: null,
    });
  }, [abort, initialData]);

  const execute = useCallback(async (
    fetcher: (signal: AbortSignal) => Promise<T>
  ) => {
    abortControllerRef.current?.abort();
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (isMountedRef.current) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      const result = await fetcher(controller.signal);
      
      if (!controller.signal.aborted && isMountedRef.current) {
        setState({
          data: result,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      
      if (isMountedRef.current) {
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    }
  }, []);

  return {
    ...state,
    execute,
    abort,
    reset,
  };
}

/**
 * Hook simplificado para fetch com dependências
 */
export function useFetchWithDeps<T>(
  fetcher: ((signal: AbortSignal) => Promise<T>) | null,
  deps: React.DependencyList,
  options?: {
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
): UseAbortableFetchState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseAbortableFetchState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const enabled = options?.enabled ?? true;

  const doFetch = useCallback(async () => {
    if (!fetcherRef.current || !enabled) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fetcherRef.current(controller.signal);
      
      if (!controller.signal.aborted) {
        setState({ data: result, isLoading: false, error: null });
        options?.onSuccess?.(result);
      }
    } catch (error) {
      if (isAbortError(error)) return;
      
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, isLoading: false, error: err });
      options?.onError?.(err);
    }
  }, [enabled, options]);

  useEffect(() => {
    doFetch();
    return () => abortControllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  return { ...state, refetch: doFetch };
}

export default useAbortableFetch;
