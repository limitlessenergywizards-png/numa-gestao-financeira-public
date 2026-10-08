import { describe, it, expect } from 'vitest';
import {
  SupabaseError,
  handleSupabaseError,
  handleQueryError,
  isSupabaseError,
  isErrorCode,
  isDuplicateError,
  isNotFoundError,
  isPermissionError,
  ErrorCodes,
} from '../handleError';

// Helper to create a mock PostgrestError
function mockPgError(overrides: Partial<{ message: string; code: string; details: string | null; hint: string | null }> = {}) {
  return {
    message: overrides.message ?? 'test error',
    code: overrides.code ?? '42000',
    details: overrides.details ?? null,
    hint: overrides.hint ?? null,
  };
}

// ================================================================
// SupabaseError class
// ================================================================
describe('SupabaseError', () => {
  it('creates with correct properties', () => {
    const err = new SupabaseError(mockPgError({ message: 'duplicate', code: '23505', details: 'Key exists', hint: 'Try upsert' }));
    expect(err.message).toBe('duplicate');
    expect(err.code).toBe('23505');
    expect(err.details).toBe('Key exists');
    expect(err.hint).toBe('Try upsert');
    expect(err.name).toBe('SupabaseError');
  });

  it('is instance of Error', () => {
    const err = new SupabaseError(mockPgError());
    expect(err).toBeInstanceOf(Error);
  });
});

// ================================================================
// handleSupabaseError()
// ================================================================
describe('handleSupabaseError()', () => {
  it('throws SupabaseError for valid PostgrestError', () => {
    expect(() => handleSupabaseError(mockPgError({ code: '23505' }))).toThrow(SupabaseError);
  });

  it('throws generic Error for null', () => {
    expect(() => handleSupabaseError(null)).toThrow('Erro desconhecido');
  });
});

// ================================================================
// handleQueryError()
// ================================================================
describe('handleQueryError()', () => {
  it('SupabaseError with known code → mapped message', () => {
    const err = new SupabaseError(mockPgError({ code: '23505' }));
    expect(handleQueryError(err)).toBe('Registro duplicado. Este item já existe.');
  });

  it('SupabaseError code 42501 → permission denied message', () => {
    const err = new SupabaseError(mockPgError({ code: '42501' }));
    expect(handleQueryError(err)).toContain('permissão');
  });

  it('SupabaseError code PGRST116 → not found message', () => {
    const err = new SupabaseError(mockPgError({ code: 'PGRST116' }));
    expect(handleQueryError(err)).toContain('não encontrado');
  });

  it('SupabaseError with unknown code → falls back to error.message', () => {
    const err = new SupabaseError(mockPgError({ code: '99999', message: 'custom msg' }));
    expect(handleQueryError(err)).toBe('custom msg');
  });

  it('SupabaseError with unknown code and empty message → fallback', () => {
    const err = new SupabaseError(mockPgError({ code: '99999', message: '' }));
    expect(handleQueryError(err)).toBe('Erro ao acessar o banco de dados');
  });

  it('plain Error → error message string', () => {
    expect(handleQueryError(new Error('something broke'))).toBe('something broke');
  });

  it('string error → string itself', () => {
    expect(handleQueryError('oops')).toBe('oops');
  });

  it('null → fallback message', () => {
    expect(handleQueryError(null)).toBe('Erro desconhecido');
  });
});

// ================================================================
// isSupabaseError()
// ================================================================
describe('isSupabaseError()', () => {
  it('SupabaseError → true', () => {
    const err = new SupabaseError(mockPgError());
    expect(isSupabaseError(err)).toBe(true);
  });

  it('plain Error → false', () => {
    expect(isSupabaseError(new Error('test'))).toBe(false);
  });

  it('string → false', () => {
    expect(isSupabaseError('error')).toBe(false);
  });

  it('null → false', () => {
    expect(isSupabaseError(null)).toBe(false);
  });
});

// ================================================================
// isErrorCode()
// ================================================================
describe('isErrorCode()', () => {
  it('matching code → true', () => {
    const err = new SupabaseError(mockPgError({ code: '23505' }));
    expect(isErrorCode(err, '23505')).toBe(true);
  });

  it('non-matching code → false', () => {
    const err = new SupabaseError(mockPgError({ code: '23505' }));
    expect(isErrorCode(err, '42501')).toBe(false);
  });

  it('non-SupabaseError → false', () => {
    expect(isErrorCode(new Error('test'), '23505')).toBe(false);
  });
});

// ================================================================
// Error code helpers
// ================================================================
describe('isDuplicateError()', () => {
  it('code 23505 → true', () => {
    expect(isDuplicateError(new SupabaseError(mockPgError({ code: '23505' })))).toBe(true);
  });

  it('other code → false', () => {
    expect(isDuplicateError(new SupabaseError(mockPgError({ code: '42501' })))).toBe(false);
  });
});

describe('isNotFoundError()', () => {
  it('code PGRST116 → true', () => {
    expect(isNotFoundError(new SupabaseError(mockPgError({ code: 'PGRST116' })))).toBe(true);
  });
});

describe('isPermissionError()', () => {
  it('code 42501 → true', () => {
    expect(isPermissionError(new SupabaseError(mockPgError({ code: '42501' })))).toBe(true);
  });
});

// ================================================================
// ErrorCodes constants
// ================================================================
describe('ErrorCodes', () => {
  it('has expected values', () => {
    expect(ErrorCodes.DUPLICATE).toBe('23505');
    expect(ErrorCodes.FOREIGN_KEY_VIOLATION).toBe('23503');
    expect(ErrorCodes.NOT_NULL_VIOLATION).toBe('23502');
    expect(ErrorCodes.NOT_FOUND).toBe('PGRST116');
    expect(ErrorCodes.PERMISSION_DENIED).toBe('42501');
  });
});
