import { FunctionsHttpError } from '@supabase/supabase-js';
import { createClient } from './browser';
import { getEdgeFunctionErrorMessage } from '@/lib/errorUtils';
import type { EdgeFunctionName } from '@/lib/api-endpoints';

/**
 * Error thrown by callEdgeFunction when the edge function fails.
 * Carries the function name and original error for debugging.
 */
export class EdgeFunctionError extends Error {
  readonly functionName: string;
  readonly originalError: unknown;

  constructor(message: string, functionName: string, originalError: unknown) {
    super(message);
    this.name = 'EdgeFunctionError';
    this.functionName = functionName;
    this.originalError = originalError;
  }
}

/**
 * Low-level edge function invoker. Returns `{ data, error }` without throwing.
 * Use this when you need no-throw semantics (e.g. fallback to defaults on error).
 *
 * Automatically retries once on 401 after refreshing the session.
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: EdgeFunctionName,
  options?: { body?: Record<string, unknown> }
): Promise<{ data: T | null; error: Error | null }> {
  const client = createClient();

  const result = await client.functions.invoke<T>(functionName, options);

  if (
    result.error instanceof FunctionsHttpError &&
    result.error.context.status === 401
  ) {
    const { error: refreshError } = await client.auth.refreshSession();
    if (!refreshError) {
      return client.functions.invoke<T>(functionName, options);
    }
  }

  return result;
}

/**
 * High-level edge function caller. Throws EdgeFunctionError on failure.
 * Use this for the common invoke-check-throw pattern.
 *
 * @example
 * ```ts
 * const data = await callEdgeFunction<MyResponse>(EDGE_FUNCTIONS.AI_CHAT, {
 *   body: { messages },
 *   fallbackMessage: 'Erro ao enviar mensagem',
 * });
 * ```
 */
export async function callEdgeFunction<T = unknown>(
  functionName: EdgeFunctionName,
  options?: {
    body?: Record<string, unknown>;
    fallbackMessage?: string;
  }
): Promise<T> {
  const { fallbackMessage, ...invokeOptions } = options ?? {};

  const { data, error } = await invokeEdgeFunction<T>(functionName, invokeOptions);

  if (error) {
    const msg = await getEdgeFunctionErrorMessage(error, fallbackMessage);
    throw new EdgeFunctionError(msg, functionName, error);
  }

  if (data && typeof data === 'object' && 'error' in data && (data as Record<string, unknown>).error) {
    const msg = String((data as Record<string, unknown>).error);
    throw new EdgeFunctionError(msg, functionName, null);
  }

  return data as T;
}
