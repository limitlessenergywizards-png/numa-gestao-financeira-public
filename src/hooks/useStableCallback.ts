'use client';

/**
 * useStableCallback Hook
 * 
 * Cria um callback estável que sempre executa a versão mais recente da função.
 * Útil para evitar re-renders causados por callbacks em useEffects.
 */

import { useRef, useCallback, useLayoutEffect } from 'react';

/**
 * Retorna uma função estável que sempre chama a versão mais recente do callback.
 * A referência da função retornada nunca muda.
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  // Usar useLayoutEffect para garantir que a ref é atualizada antes de qualquer efeito
  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Versão do useStableCallback que aceita dependências.
 * Atualiza o callback apenas quando as deps mudam.
 */
export function useStableCallbackWithDeps<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCallback = useCallback(callback, deps);
  return useStableCallback(memoizedCallback);
}

export default useStableCallback;
