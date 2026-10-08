import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  validateEmail,
  validateRole,
  normalizeRole,
  generateCSVTemplate,
} from '../adminCsvParser';

// ================================================================
// parseCSV()
// ================================================================
describe('parseCSV()', () => {
  it('parses simple CSV with email and role', () => {
    const csv = 'email,role\njohn@test.com,admin\njane@test.com,viewer';
    const result = parseCSV(csv);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].email).toBe('john@test.com');
    expect(result.data[0].role).toBe('admin');
    expect(result.data[1].email).toBe('jane@test.com');
    expect(result.data[1].role).toBe('viewer');
    expect(result.errors).toHaveLength(0);
  });

  it('headers are case-insensitive', () => {
    const csv = 'Email,Role\ntest@a.com,admin';
    const result = parseCSV(csv);
    expect(result.data[0].email).toBe('test@a.com');
    expect(result.data[0].role).toBe('admin');
  });

  it('supports Portuguese headers (e-mail, perfil)', () => {
    const csv = 'e-mail,perfil\ntest@a.com,admin';
    const result = parseCSV(csv);
    expect(result.data[0].email).toBe('test@a.com');
    expect(result.data[0].role).toBe('admin');
  });

  it('supports "papel" as role header', () => {
    const csv = 'email,papel\ntest@a.com,editor';
    const result = parseCSV(csv);
    expect(result.data[0].role).toBe('editor');
  });

  it('defaults role to "viewer" when role column missing', () => {
    const csv = 'email\ntest@a.com';
    const result = parseCSV(csv);
    expect(result.data[0].role).toBe('viewer');
  });

  it('error when email column is missing', () => {
    const csv = 'name,role\nJohn,admin';
    const result = parseCSV(csv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('email');
  });

  it('empty file → error (no email column)', () => {
    const result = parseCSV('');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('email');
  });

  it('skips empty lines', () => {
    const csv = 'email,role\njohn@a.com,admin\n\njane@b.com,editor\n';
    const result = parseCSV(csv);
    expect(result.data).toHaveLength(2);
  });

  it('handles CRLF line endings', () => {
    const csv = 'email,role\r\njohn@a.com,admin\r\njane@b.com,viewer';
    const result = parseCSV(csv);
    expect(result.data).toHaveLength(2);
  });

  it('handles quoted fields with commas', () => {
    const csv = 'email,role,nome\njohn@a.com,admin,"Smith, John"';
    const result = parseCSV(csv);
    expect(result.data[0].nome).toBe('Smith, John');
  });

  it('handles escaped quotes inside quoted fields', () => {
    const csv = 'email,role,nome\njohn@a.com,admin,"John ""JJ"" Smith"';
    const result = parseCSV(csv);
    expect(result.data[0].nome).toBe('John "JJ" Smith');
  });

  it('preserves extra columns', () => {
    const csv = 'email,role,department,phone\njohn@a.com,admin,Engineering,555-1234';
    const result = parseCSV(csv);
    expect(result.data[0].department).toBe('Engineering');
    expect(result.data[0].phone).toBe('555-1234');
  });

  it('supports semicolon separator', () => {
    const csv = 'email;role\njohn@a.com;admin';
    const result = parseCSV(csv);
    expect(result.data[0].email).toBe('john@a.com');
    expect(result.data[0].role).toBe('admin');
  });

  it('returns parsed headers', () => {
    const csv = 'email,role,department\njohn@a.com,admin,IT';
    const result = parseCSV(csv);
    expect(result.headers).toEqual(['email', 'role', 'department']);
  });
});

// ================================================================
// validateEmail()
// ================================================================
describe('validateEmail()', () => {
  it('valid email → true', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('email with subdomain → true', () => {
    expect(validateEmail('user@sub.example.com')).toBe(true);
  });

  it('missing @ → false', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('missing domain → false', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('missing local part → false', () => {
    expect(validateEmail('@example.com')).toBe(false);
  });

  it('spaces → false', () => {
    expect(validateEmail('user @example.com')).toBe(false);
  });

  it('empty string → false', () => {
    expect(validateEmail('')).toBe(false);
  });
});

// ================================================================
// validateRole()
// ================================================================
describe('validateRole()', () => {
  it('"admin" → true', () => {
    expect(validateRole('admin')).toBe(true);
  });

  it('"editor" → true', () => {
    expect(validateRole('editor')).toBe(true);
  });

  it('"viewer" → true', () => {
    expect(validateRole('viewer')).toBe(true);
  });

  it('"ADMIN" (uppercase) → true (case insensitive)', () => {
    expect(validateRole('ADMIN')).toBe(true);
  });

  it('"manager" → false', () => {
    expect(validateRole('manager')).toBe(false);
  });

  it('empty string → false', () => {
    expect(validateRole('')).toBe(false);
  });
});

// ================================================================
// normalizeRole()
// ================================================================
describe('normalizeRole()', () => {
  it('"admin" → "admin"', () => {
    expect(normalizeRole('admin')).toBe('admin');
  });

  it('"administrador" → "admin"', () => {
    expect(normalizeRole('administrador')).toBe('admin');
  });

  it('"ADMIN" → "admin"', () => {
    expect(normalizeRole('ADMIN')).toBe('admin');
  });

  it('"editor" → "editor"', () => {
    expect(normalizeRole('editor')).toBe('editor');
  });

  it('"editar" → "editor"', () => {
    expect(normalizeRole('editar')).toBe('editor');
  });

  it('"viewer" → "viewer"', () => {
    expect(normalizeRole('viewer')).toBe('viewer');
  });

  it('unknown role → "viewer" (default)', () => {
    expect(normalizeRole('manager')).toBe('viewer');
  });

  it('empty string → "viewer"', () => {
    expect(normalizeRole('')).toBe('viewer');
  });

  it('whitespace trimmed', () => {
    expect(normalizeRole('  admin  ')).toBe('admin');
  });
});

// ================================================================
// generateCSVTemplate()
// ================================================================
describe('generateCSVTemplate()', () => {
  it('returns string with email,role header', () => {
    const template = generateCSVTemplate();
    expect(template).toContain('email,role');
  });

  it('contains example rows', () => {
    const template = generateCSVTemplate();
    expect(template).toContain('viewer');
    expect(template).toContain('admin');
  });

  it('is parseable by parseCSV', () => {
    const template = generateCSVTemplate();
    const result = parseCSV(template);
    expect(result.errors).toHaveLength(0);
    expect(result.data.length).toBeGreaterThan(0);
  });
});
