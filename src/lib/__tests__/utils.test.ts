import { describe, it, expect } from 'vitest';
import { cn, formatCurrency } from '../utils';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const condition = false;
    const result = cn('base', condition && 'hidden', 'visible');
    expect(result).toContain('base');
    expect(result).toContain('visible');
    expect(result).not.toContain('hidden');
  });

  it('merges Tailwind conflicts (twMerge)', () => {
    // twMerge should resolve conflicting Tailwind classes
    const result = cn('p-4', 'p-8');
    expect(result).toBe('p-8');
  });

  it('handles undefined and null values', () => {
    const result = cn('foo', undefined, null, 'bar');
    expect(result).toBe('foo bar');
  });

  it('handles empty string', () => {
    const result = cn('');
    expect(result).toBe('');
  });

  it('handles no arguments', () => {
    expect(cn()).toBe('');
  });
});

describe('formatCurrency()', () => {
  it('formats positive value in BRL', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('R$');
    expect(result).toContain('1.500');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('R$');
    expect(result).toContain('0,00');
  });

  it('formats negative value', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('R$');
    expect(result).toContain('500');
  });

  it('formats decimal values', () => {
    const result = formatCurrency(99.99);
    expect(result).toContain('99,99');
  });

  it('formats large numbers with dot separator', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1.000.000');
  });
});
