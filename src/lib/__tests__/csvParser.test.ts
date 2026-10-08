import { describe, it, expect } from 'vitest';
import { isNubankCSV, parseCSV, isValidCSVFile } from '../csvParser';

// ================================================================
// isNubankCSV()
// ================================================================
describe('isNubankCSV()', () => {
  it('valid Nubank header → true', () => {
    expect(isNubankCSV('Data,Valor,Identificador,Descrição\n')).toBe(true);
  });

  it('header with different casing → true', () => {
    expect(isNubankCSV('data,valor,identificador,descrição\n')).toBe(true);
  });

  it('header with extra spaces → true', () => {
    expect(isNubankCSV(' Data , Valor , Identificador , Descrição \n')).toBe(true);
  });

  it('unrelated CSV header → false', () => {
    expect(isNubankCSV('Name,Age,Email\n')).toBe(false);
  });

  it('empty string → false', () => {
    expect(isNubankCSV('')).toBe(false);
  });
});

// ================================================================
// parseCSV()
// ================================================================
describe('parseCSV()', () => {
  const validCSV = [
    'Data,Valor,Identificador,Descrição',
    '15/01/2026,-150.50,TX001,Compra no débito - Supermercado',
    '20/01/2026,3000.00,TX002,Transferência recebida pelo Pix - Maria - CPF',
  ].join('\n');

  it('parses valid CSV with 2 transactions', () => {
    const result = parseCSV(validCSV);
    expect(result.success).toBe(true);
    expect(result.transactions).toHaveLength(2);
  });

  it('sets bank info as Nubank', () => {
    const result = parseCSV(validCSV);
    expect(result.bankId).toBe('260');
    expect(result.bankName).toBe('Nubank');
    expect(result.accountType).toBe('CHECKING');
  });

  it('negative amount → debit', () => {
    const result = parseCSV(validCSV);
    const debit = result.transactions.find(t => t.fitid === 'TX001')!;
    expect(debit.type).toBe('debit');
    expect(debit.amount).toBe(150.50);
  });

  it('positive amount → credit', () => {
    const result = parseCSV(validCSV);
    const credit = result.transactions.find(t => t.fitid === 'TX002')!;
    expect(credit.type).toBe('credit');
    expect(credit.amount).toBe(3000.00);
  });

  it('cleans descriptions (Nubank patterns)', () => {
    const result = parseCSV(validCSV);
    const debit = result.transactions.find(t => t.fitid === 'TX001')!;
    expect(debit.description).toBe('Supermercado');

    const credit = result.transactions.find(t => t.fitid === 'TX002')!;
    expect(credit.description).toBe('Maria');
  });

  it('preserves original description as memo', () => {
    const result = parseCSV(validCSV);
    const debit = result.transactions.find(t => t.fitid === 'TX001')!;
    expect(debit.memo).toBe('Compra no débito - Supermercado');
  });

  it('tracks date range (startDate/endDate)', () => {
    const result = parseCSV(validCSV);
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
    expect(result.startDate!.getDate()).toBe(15);
    expect(result.endDate!.getDate()).toBe(20);
  });

  it('parses DD/MM/YYYY dates correctly', () => {
    const result = parseCSV(validCSV);
    const tx = result.transactions[0];
    expect(tx.date.getFullYear()).toBe(2026);
    expect(tx.date.getMonth()).toBe(0); // January (0-indexed)
    expect(tx.date.getDate()).toBe(15);
  });

  // Quoted fields (descriptions with commas)
  it('handles quoted descriptions containing commas', () => {
    const csv = [
      'Data,Valor,Identificador,Descrição',
      '01/02/2026,-50.00,TX003,"Loja A, B e C"',
    ].join('\n');
    const result = parseCSV(csv);
    expect(result.transactions[0].description).toBe('Loja A, B e C');
  });

  // Missing identifier → generates fallback fitid
  it('missing identifier → generates fallback fitid', () => {
    const csv = [
      'Data,Valor,Identificador,Descrição',
      '01/02/2026,-50.00,,Compra',
    ].join('\n');
    const result = parseCSV(csv);
    expect(result.transactions[0].fitid).toContain('csv-');
  });

  // Error cases
  it('empty content → error', () => {
    const result = parseCSV('');
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('header only (no data lines) → error', () => {
    const result = parseCSV('Data,Valor,Identificador,Descrição\n');
    expect(result.success).toBe(false);
  });

  it('unrecognized header → error', () => {
    const result = parseCSV('Name,Age\nJohn,30\n');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('não reconhecido');
  });

  it('invalid date → skipped with error', () => {
    const csv = [
      'Data,Valor,Identificador,Descrição',
      'invalid,-50.00,TX001,Compra',
    ].join('\n');
    const result = parseCSV(csv);
    expect(result.transactions).toHaveLength(0);
    expect(result.errors.some(e => e.includes('data inválida'))).toBe(true);
  });

  it('invalid amount → skipped with error', () => {
    const csv = [
      'Data,Valor,Identificador,Descrição',
      '01/02/2026,abc,TX001,Compra',
    ].join('\n');
    const result = parseCSV(csv);
    expect(result.transactions).toHaveLength(0);
    expect(result.errors.some(e => e.includes('valor inválido'))).toBe(true);
  });

  it('line with too few fields → skipped with error', () => {
    const csv = [
      'Data,Valor,Identificador,Descrição',
      '01/02/2026,-50.00',
    ].join('\n');
    const result = parseCSV(csv);
    expect(result.transactions).toHaveLength(0);
    expect(result.errors.some(e => e.includes('formato inválido'))).toBe(true);
  });
});

// ================================================================
// isValidCSVFile()
// ================================================================
describe('isValidCSVFile()', () => {
  function makeFile(name: string): File {
    return new File([''], name);
  }

  it('.csv → valid', () => {
    expect(isValidCSVFile(makeFile('extrato.csv'))).toBe(true);
  });

  it('.CSV (uppercase) → valid', () => {
    expect(isValidCSVFile(makeFile('extrato.CSV'))).toBe(true);
  });

  it('.ofx → invalid', () => {
    expect(isValidCSVFile(makeFile('extrato.ofx'))).toBe(false);
  });

  it('.pdf → invalid', () => {
    expect(isValidCSVFile(makeFile('extrato.pdf'))).toBe(false);
  });
});
