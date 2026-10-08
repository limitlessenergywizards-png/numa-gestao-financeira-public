/**
 * Supabase Error Handling Utilities
 * 
 * Provides centralized error handling for all Supabase operations.
 */

import { PostgrestError } from '@supabase/supabase-js';
import { getErrorMessage } from '@/lib/errorUtils';

/**
 * Custom error class for Supabase/Postgrest errors
 */
export class SupabaseError extends Error {
  code: string;
  details: string | null;
  hint: string | null;

  constructor(error: PostgrestError) {
    super(error.message);
    this.name = 'SupabaseError';
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
}

/**
 * Error code to user-friendly message mapping
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Postgres constraint violations
  '23505': 'Registro duplicado. Este item já existe.',
  '23503': 'Referência inválida. O registro relacionado não existe.',
  '23502': 'Campo obrigatório não preenchido.',
  '23514': 'Valor inválido para o campo.',
  
  // PostgREST errors
  'PGRST116': 'Registro não encontrado.',
  'PGRST301': 'Erro de conexão com o banco de dados.',
  'PGRST204': 'Erro de autenticação.',
  
  // RLS errors
  '42501': 'Você não tem permissão para realizar esta ação.',
  '42P01': 'Tabela não encontrada.',
  
  // Auth errors
  '22P02': 'ID inválido fornecido.',
};

/**
 * Throws a SupabaseError for the given PostgrestError
 * Use this in API functions to ensure consistent error handling
 */
export function handleSupabaseError(error: PostgrestError | null): never {
  if (!error) {
    throw new Error('Erro desconhecido ao acessar o banco de dados');
  }
  throw new SupabaseError(error);
}

/**
 * Converts any error to a user-friendly message string
 * Use this when displaying errors to users
 */
export function handleQueryError(error: unknown): string {
  if (error instanceof SupabaseError) {
    // Check for specific error codes first
    const mappedMessage = ERROR_MESSAGES[error.code];
    if (mappedMessage) {
      return mappedMessage;
    }
    
    // Fallback to the error message
    return error.message || 'Erro ao acessar o banco de dados';
  }
  
  return getErrorMessage(error);
}

/**
 * Type guard to check if an error is a SupabaseError
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return error instanceof SupabaseError;
}

/**
 * Check if error is a specific Postgres error code
 */
export function isErrorCode(error: unknown, code: string): boolean {
  if (isSupabaseError(error)) {
    return error.code === code;
  }
  return false;
}

/**
 * Common error code checks
 */
export const ErrorCodes = {
  DUPLICATE: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  NOT_FOUND: 'PGRST116',
  PERMISSION_DENIED: '42501',
} as const;

/**
 * Helper to check for specific common errors
 */
export function isDuplicateError(error: unknown): boolean {
  return isErrorCode(error, ErrorCodes.DUPLICATE);
}

export function isNotFoundError(error: unknown): boolean {
  return isErrorCode(error, ErrorCodes.NOT_FOUND);
}

export function isPermissionError(error: unknown): boolean {
  return isErrorCode(error, ErrorCodes.PERMISSION_DENIED);
}
