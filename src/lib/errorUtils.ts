/**
 * Error handling utilities for consistent error message extraction
 * across the application.
 */

import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

/**
 * Checks if an error is an AbortError (from AbortController.abort()).
 * Handles DOMException, Error, and plain objects robustly.
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error instanceof Error && error.name === 'AbortError') return true;
  if (error && typeof error === 'object' && 'name' in error && (error as { name: unknown }).name === 'AbortError') return true;
  // Supabase wraps AbortError — the original name ends up in the message
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (message.includes('AbortError') || message.includes('signal is aborted')) return true;
  return false;
}

/**
 * Extracts a human-readable error message from an unknown error type.
 * Use this in catch blocks instead of `error: any`.
 * 
 * @example
 * ```typescript
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   toast.error(getErrorMessage(error));
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Erro desconhecido';
}

/**
 * Type guard to check if an error has a specific error code.
 * Useful for handling Supabase/PostgreSQL errors.
 */
export function hasErrorCode(error: unknown, code: string): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: unknown }).code === code
  );
}

/**
 * Checks if an error is a network/connection error.
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('offline')
  );
}

/**
 * Checks if an error is an authentication error.
 */
export function isAuthError(error: unknown): boolean {
  if (hasErrorCode(error, 'PGRST301') || hasErrorCode(error, '401')) {
    return true;
  }
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('unauthorized') ||
    message.includes('authentication') ||
    message.includes('not authenticated') ||
    message.includes('jwt') ||
    message.includes('token')
  );
}

/**
 * Checks if an error is a permission/authorization error.
 */
export function isPermissionError(error: unknown): boolean {
  if (hasErrorCode(error, '403') || hasErrorCode(error, 'PGRST116')) {
    return true;
  }
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('permission') ||
    message.includes('forbidden') ||
    message.includes('not allowed') ||
    message.includes('access denied')
  );
}

/**
 * Extracts a user-friendly error message for RLS (Row Level Security) errors.
 * Use this for permission-related database errors in mutations.
 */
export function getRLSErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string };
    if (err.code === '42501' || err.message?.includes('row-level security')) {
      return 'Você não tem permissão para realizar esta ação. Verifique se você tem papel de editor ou administrador.';
    }
  }
  return getErrorMessage(error);
}

/**
 * Logs error with context for debugging while returning user-friendly message.
 */
export function logAndGetErrorMessage(
  error: unknown,
  context?: string
): string {
  const message = getErrorMessage(error);

  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error(error);
  }

  return message;
}

/**
 * Extracts the real error message from a Supabase Edge Function error.
 *
 * When an Edge Function returns non-2xx, the Supabase client wraps the response
 * in a FunctionsHttpError whose `.message` is always the generic
 * "Edge Function returned a non-2xx status code". The actual error details
 * are in `error.context` (an unconsumed Response object).
 */
export async function getEdgeFunctionErrorMessage(
  error: unknown,
  fallbackMessage = 'Erro ao processar requisição'
): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      return body?.error || body?.message || fallbackMessage;
    } catch {
      try {
        return (await error.context.text()) || fallbackMessage;
      } catch {
        return fallbackMessage;
      }
    }
  }

  if (error instanceof FunctionsRelayError) {
    return 'Erro de conexão com o servidor. Tente novamente.';
  }

  if (error instanceof FunctionsFetchError) {
    return 'Falha na conexão. Verifique sua internet e tente novamente.';
  }

  return getErrorMessage(error);
}
