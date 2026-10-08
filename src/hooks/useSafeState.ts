'use client';

/**
 * useSafeState Hook
 * 
 * Versão do useState que previne updates em componentes desmontados.
 * Evita o warning "Can't perform a React state update on an unmounted component".
 */

import { useState, useRef, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

export function useSafeState<T>(initialState: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(initialState);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setSafeState = useCallback((value: SetStateAction<T>) => {
    if (isMountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState];
}

/**
 * Hook para verificar se componente está montado.
 * Útil para operações assíncronas.
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

export default useSafeState;
