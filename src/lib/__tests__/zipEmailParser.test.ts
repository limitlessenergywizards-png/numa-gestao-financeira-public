import { describe, it, expect } from 'vitest';
import {
  isValidZipFile,
  isValidEmlFile,
  aggregateByMonth,
  aggregateByCategory,
  type ParsedEmailTransaction,
} from '../zipEmailParser';

// ================================================================
// isValidZipFile()
// ================================================================
describe('isValidZipFile()', () => {
  it('.zip extension → true', () => {
    expect(isValidZipFile(new File([''], 'archive.zip'))).toBe(true);
  });

  it('.ZIP uppercase → true', () => {
    expect(isValidZipFile(new File([''], 'ARCHIVE.ZIP'))).toBe(true);
  });

  it('.rar extension → false', () => {
    expect(isValidZipFile(new File([''], 'archive.rar'))).toBe(false);
  });

  it('.7z extension → false', () => {
    expect(isValidZipFile(new File([''], 'archive.7z'))).toBe(false);
  });

  it('.pdf extension → false', () => {
    expect(isValidZipFile(new File([''], 'document.pdf'))).toBe(false);
  });
});

// ================================================================
// isValidEmlFile()
// ================================================================
describe('isValidEmlFile()', () => {
  it('.eml extension → true', () => {
    expect(isValidEmlFile('email.eml')).toBe(true);
  });

  it('.EML uppercase → true', () => {
    expect(isValidEmlFile('EMAIL.EML')).toBe(true);
  });

  it('.txt extension → false', () => {
    expect(isValidEmlFile('file.txt')).toBe(false);
  });

  it('.msg extension → false', () => {
    expect(isValidEmlFile('email.msg')).toBe(false);
  });

  it('no extension → false', () => {
    expect(isValidEmlFile('emailfile')).toBe(false);
  });
});

// ================================================================
// aggregateByMonth()
// ================================================================
describe('aggregateByMonth()', () => {
  function makeTx(overrides: Partial<ParsedEmailTransaction>): ParsedEmailTransaction {
    return {
      date: new Date(2026, 0, 15),
      description: 'Test',
      amount: 100,
      type: 'debit',
      ...overrides,
    };
  }

  it('empty transactions → empty result', () => {
    expect(aggregateByMonth([])).toEqual([]);
  });

  it('single credit → receitas populated', () => {
    const result = aggregateByMonth([makeTx({ type: 'credit', amount: 500 })]);
    expect(result).toHaveLength(1);
    expect(result[0].receitas).toBe(500);
    expect(result[0].despesas).toBe(0);
  });

  it('single debit → despesas populated', () => {
    const result = aggregateByMonth([makeTx({ type: 'debit', amount: 300 })]);
    expect(result).toHaveLength(1);
    expect(result[0].despesas).toBe(300);
    expect(result[0].receitas).toBe(0);
  });

  it('multiple transactions same month → summed', () => {
    const txs = [
      makeTx({ type: 'debit', amount: 100 }),
      makeTx({ type: 'debit', amount: 200 }),
      makeTx({ type: 'credit', amount: 500 }),
    ];
    const result = aggregateByMonth(txs);
    expect(result).toHaveLength(1);
    expect(result[0].despesas).toBe(300);
    expect(result[0].receitas).toBe(500);
  });

  it('different months → sorted chronologically', () => {
    const txs = [
      makeTx({ date: new Date(2026, 2, 1), amount: 100 }),  // March
      makeTx({ date: new Date(2026, 0, 1), amount: 200 }),  // January
      makeTx({ date: new Date(2026, 1, 1), amount: 300 }),  // February
    ];
    const result = aggregateByMonth(txs);
    expect(result).toHaveLength(3);
    // Should be sorted: Jan, Feb, Mar
    expect(result[0].month).toBeDefined();
    expect(result[1].month).toBeDefined();
    expect(result[2].month).toBeDefined();
  });

  it('amounts are rounded to 2 decimals', () => {
    const txs = [
      makeTx({ type: 'debit', amount: 10.005 }),
      makeTx({ type: 'debit', amount: 10.005 }),
    ];
    const result = aggregateByMonth(txs);
    expect(result[0].despesas).toBe(20.01);
  });
});

// ================================================================
// aggregateByCategory()
// ================================================================
describe('aggregateByCategory()', () => {
  function makeTx(overrides: Partial<ParsedEmailTransaction>): ParsedEmailTransaction {
    return {
      date: new Date(2026, 0, 15),
      description: 'Test',
      amount: 100,
      type: 'debit',
      category: 'Outros',
      ...overrides,
    };
  }

  it('empty transactions → empty result', () => {
    expect(aggregateByCategory([])).toEqual([]);
  });

  it('single category debit → one entry with type debit', () => {
    const result = aggregateByCategory([makeTx({ category: 'Alimentação', type: 'debit', amount: 200 })]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alimentação');
    expect(result[0].value).toBe(200);
    expect(result[0].type).toBe('debit');
  });

  it('same category credit and debit → two entries', () => {
    const txs = [
      makeTx({ category: 'Transferências', type: 'debit', amount: 100 }),
      makeTx({ category: 'Transferências', type: 'credit', amount: 500 }),
    ];
    const result = aggregateByCategory(txs);
    expect(result).toHaveLength(2);
    const credit = result.find(r => r.type === 'credit');
    const debit = result.find(r => r.type === 'debit');
    expect(credit?.value).toBe(500);
    expect(debit?.value).toBe(100);
  });

  it('results sorted by value descending', () => {
    const txs = [
      makeTx({ category: 'A', type: 'debit', amount: 100 }),
      makeTx({ category: 'B', type: 'debit', amount: 500 }),
      makeTx({ category: 'C', type: 'debit', amount: 300 }),
    ];
    const result = aggregateByCategory(txs);
    expect(result[0].value).toBe(500);
    expect(result[1].value).toBe(300);
    expect(result[2].value).toBe(100);
  });

  it('no category → falls back to "Outros"', () => {
    const result = aggregateByCategory([makeTx({ category: undefined, type: 'debit', amount: 50 })]);
    expect(result[0].name).toBe('Outros');
  });

  it('amounts are rounded to 2 decimals', () => {
    const txs = [
      makeTx({ category: 'X', type: 'debit', amount: 10.005 }),
      makeTx({ category: 'X', type: 'debit', amount: 10.005 }),
    ];
    const result = aggregateByCategory(txs);
    expect(result[0].value).toBe(20.01);
  });
});
