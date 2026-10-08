import { describe, it, expect } from 'vitest';
import {
  exportToTotvs,
  generateTotvsReport,
  type TotvsExportOptions,
  type TotvsTransaction,
  type TotvsCompany,
} from '../exportTotvs';

// ================================================================
// Helpers
// ================================================================
const company: TotvsCompany = {
  code: 'EMP001',
  name: 'Test Company',
  branch: '01',
};

function makeTx(overrides: Partial<TotvsTransaction> = {}): TotvsTransaction {
  return {
    id: 'tx-1',
    date: '2026-03-15',
    description: 'Pagamento fornecedor',
    amount: 1500.00,
    type: 'saida',
    accountCode: '3.1.01',
    accountName: 'Despesas Operacionais',
    ...overrides,
  };
}

function makeOptions(overrides: Partial<TotvsExportOptions> = {}): TotvsExportOptions {
  return {
    format: 'csv',
    company,
    period: { startDate: '2026-03-01', endDate: '2026-03-31' },
    transactions: [makeTx()],
    ...overrides,
  };
}

// ================================================================
// exportToTotvs() — CT2 format
// ================================================================
describe('exportToTotvs() CT2 format', () => {
  it('generates CT2 header with company code', () => {
    const result = exportToTotvs(makeOptions({ format: 'ct2' }));
    expect(result).toContain('CT2|EMP001|01|LANÇAMENTOS CONTÁBEIS|');
  });

  it('generates CT2 footer with transaction count', () => {
    const result = exportToTotvs(makeOptions({ format: 'ct2' }));
    expect(result).toContain('CT2|EMP001|01|FIM|1|');
  });

  it('saida → D (Débito)', () => {
    const result = exportToTotvs(makeOptions({
      format: 'ct2',
      transactions: [makeTx({ type: 'saida' })],
    }));
    const lines = result.split('\r\n');
    const dataLine = lines[1]; // First data line after header
    expect(dataLine).toContain('|D|');
  });

  it('entrada → C (Crédito)', () => {
    const result = exportToTotvs(makeOptions({
      format: 'ct2',
      transactions: [makeTx({ type: 'entrada' })],
    }));
    const lines = result.split('\r\n');
    const dataLine = lines[1];
    expect(dataLine).toContain('|C|');
  });

  it('truncates description at 40 chars', () => {
    const longDesc = 'A'.repeat(60);
    const result = exportToTotvs(makeOptions({
      format: 'ct2',
      transactions: [makeTx({ description: longDesc })],
    }));
    // Each pipe-delimited field — description field should be max 40
    const lines = result.split('\r\n');
    const dataLine = lines[1];
    const parts = dataLine.split('|');
    const descField = parts.find(p => p.startsWith('AAA'));
    expect(descField?.length).toBeLessThanOrEqual(40);
  });

  it('includes account code and amount', () => {
    const result = exportToTotvs(makeOptions({
      format: 'ct2',
      transactions: [makeTx({ accountCode: '3.1.01', amount: 1500 })],
    }));
    expect(result).toContain('3.1.01');
    expect(result).toContain('1500.00');
  });

  it('multiple transactions → sequential line numbers', () => {
    const result = exportToTotvs(makeOptions({
      format: 'ct2',
      transactions: [makeTx({ id: '1' }), makeTx({ id: '2' }), makeTx({ id: '3' })],
    }));
    expect(result).toContain('000001');
    expect(result).toContain('000002');
    expect(result).toContain('000003');
  });
});

// ================================================================
// exportToTotvs() — CT5 format
// ================================================================
describe('exportToTotvs() CT5 format', () => {
  it('generates CT5 header', () => {
    const result = exportToTotvs(makeOptions({ format: 'ct5' }));
    expect(result).toContain('CT5|EMP001|01|RATEIO CONTABIL|');
  });

  it('generates CT5 footer', () => {
    const result = exportToTotvs(makeOptions({ format: 'ct5' }));
    expect(result).toContain('CT5|EMP001|01|FIM|1|');
  });

  it('includes 100% percentage field', () => {
    const result = exportToTotvs(makeOptions({ format: 'ct5' }));
    expect(result).toContain('100.00');
  });
});

// ================================================================
// exportToTotvs() — CSV format
// ================================================================
describe('exportToTotvs() CSV format', () => {
  it('includes company metadata comment', () => {
    const result = exportToTotvs(makeOptions({ format: 'csv' }));
    expect(result).toContain('# Empresa: Test Company (EMP001)');
  });

  it('includes period in header', () => {
    const result = exportToTotvs(makeOptions({ format: 'csv' }));
    expect(result).toContain('2026-03-01 a 2026-03-31');
  });

  it('includes CSV column header', () => {
    const result = exportToTotvs(makeOptions({ format: 'csv' }));
    expect(result).toContain('DATA;CONTA_DEBITO;CONTA_CREDITO;VALOR;HISTORICO;DOCUMENTO;CENTRO_CUSTO;FILIAL');
  });

  it('saida → account code in CONTA_DEBITO', () => {
    const result = exportToTotvs(makeOptions({
      format: 'csv',
      transactions: [makeTx({ type: 'saida', accountCode: '3.1.01' })],
    }));
    const dataLines = result.split('\r\n').filter(l => !l.startsWith('#') && !l.startsWith('DATA') && l.trim());
    expect(dataLines[0]).toMatch(/^2026-03-15;3\.1\.01;/);
  });

  it('entrada → account code in CONTA_CREDITO', () => {
    const result = exportToTotvs(makeOptions({
      format: 'csv',
      transactions: [makeTx({ type: 'entrada', accountCode: '4.1.01' })],
    }));
    const dataLines = result.split('\r\n').filter(l => !l.startsWith('#') && !l.startsWith('DATA') && l.trim());
    expect(dataLines[0]).toContain(';4.1.01;');
  });

  it('uses semicolon as separator', () => {
    const result = exportToTotvs(makeOptions({ format: 'csv' }));
    const dataLines = result.split('\r\n').filter(l => !l.startsWith('#') && !l.startsWith('DATA') && l.trim());
    const fields = dataLines[0].split(';');
    expect(fields.length).toBe(8);
  });

  it('formats amount with comma as decimal separator', () => {
    const result = exportToTotvs(makeOptions({
      format: 'csv',
      transactions: [makeTx({ amount: 1234.56 })],
    }));
    expect(result).toContain('1234,56');
  });
});

// ================================================================
// exportToTotvs() — Protheus format
// ================================================================
describe('exportToTotvs() Protheus format', () => {
  it('formats date as YYYYMMDD', () => {
    const result = exportToTotvs(makeOptions({
      format: 'protheus',
      transactions: [makeTx({ date: '2026-03-15' })],
    }));
    expect(result).toContain('20260315');
  });

  it('saida → type 1 (Débito)', () => {
    const result = exportToTotvs(makeOptions({
      format: 'protheus',
      transactions: [makeTx({ type: 'saida' })],
    }));
    // In Protheus: 1=Débito, 2=Crédito
    expect(result).toContain('1');
  });

  it('entrada → type 2 (Crédito)', () => {
    const result = exportToTotvs(makeOptions({
      format: 'protheus',
      transactions: [makeTx({ type: 'entrada' })],
    }));
    expect(result).toContain('2');
  });

  it('value formatted as 15-digit padded integer (cents)', () => {
    const result = exportToTotvs(makeOptions({
      format: 'protheus',
      transactions: [makeTx({ amount: 1500 })],
    }));
    // 1500 * 100 = 150000, padded to 15 digits
    expect(result).toContain('000000000150000');
  });

  it('generates counterpart entry when counterpartCode present', () => {
    const result = exportToTotvs(makeOptions({
      format: 'protheus',
      transactions: [makeTx({ counterpartCode: '1.1.01' })],
    }));
    const lines = result.split('\r\n');
    expect(lines.length).toBe(2); // Main + counterpart
    expect(lines[1]).toContain('1.1.01');
  });
});

// ================================================================
// exportToTotvs() — format dispatch
// ================================================================
describe('exportToTotvs() format dispatch', () => {
  it('csv is the default format', () => {
    const result = exportToTotvs(makeOptions({ format: 'csv' }));
    expect(result).toContain('DATA;CONTA_DEBITO');
  });

  it('ct2 format dispatched correctly', () => {
    const result = exportToTotvs(makeOptions({ format: 'ct2' }));
    expect(result).toContain('CT2|');
  });

  it('ct5 format dispatched correctly', () => {
    const result = exportToTotvs(makeOptions({ format: 'ct5' }));
    expect(result).toContain('CT5|');
  });
});

// ================================================================
// generateTotvsReport()
// ================================================================
describe('generateTotvsReport()', () => {
  it('counts transactions', () => {
    const report = generateTotvsReport(makeOptions({
      transactions: [makeTx(), makeTx(), makeTx()],
    }));
    expect(report.transactionCount).toBe(3);
  });

  it('sums debits (saida)', () => {
    const report = generateTotvsReport(makeOptions({
      transactions: [
        makeTx({ type: 'saida', amount: 100 }),
        makeTx({ type: 'saida', amount: 200 }),
      ],
    }));
    expect(report.totalDebits).toBe(300);
    expect(report.totalCredits).toBe(0);
  });

  it('sums credits (entrada)', () => {
    const report = generateTotvsReport(makeOptions({
      transactions: [
        makeTx({ type: 'entrada', amount: 500 }),
        makeTx({ type: 'entrada', amount: 300 }),
      ],
    }));
    expect(report.totalCredits).toBe(800);
    expect(report.totalDebits).toBe(0);
  });

  it('groups by account code', () => {
    const report = generateTotvsReport(makeOptions({
      transactions: [
        makeTx({ accountCode: '3.1.01', type: 'saida', amount: 100 }),
        makeTx({ accountCode: '3.1.01', type: 'saida', amount: 200 }),
        makeTx({ accountCode: '4.1.01', type: 'entrada', amount: 500 }),
      ],
    }));
    expect(report.accountSummary['3.1.01'].debits).toBe(300);
    expect(report.accountSummary['4.1.01'].credits).toBe(500);
  });

  it('empty transactions → zeros', () => {
    const report = generateTotvsReport(makeOptions({ transactions: [] }));
    expect(report.totalDebits).toBe(0);
    expect(report.totalCredits).toBe(0);
    expect(report.transactionCount).toBe(0);
    expect(Object.keys(report.accountSummary)).toHaveLength(0);
  });
});
