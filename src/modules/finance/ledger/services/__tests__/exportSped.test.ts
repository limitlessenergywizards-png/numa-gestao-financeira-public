import { describe, it, expect } from 'vitest';
import {
  exportToSped,
  type SpedExportOptions,
  type SpedCompany,
  type SpedTransaction,
  type SpedAccount,
  type SpedBalance,
} from '../exportSped';

// ================================================================
// Helpers
// ================================================================
const company: SpedCompany = {
  cnpj: '12.345.678/0001-90',
  name: 'Empresa Teste LTDA',
  uf: 'SP',
  stateRegistration: '123456789',
  city: 'São Paulo',
};

function makeTx(overrides: Partial<SpedTransaction> = {}): SpedTransaction {
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

function makeAccount(overrides: Partial<SpedAccount> = {}): SpedAccount {
  return {
    code: '3.1.01',
    name: 'Despesas Operacionais',
    type: 'A',
    nature: 'D',
    level: 3,
    ...overrides,
  };
}

function makeBalance(overrides: Partial<SpedBalance> = {}): SpedBalance {
  return {
    accountCode: '3.1.01',
    initialBalance: 0,
    debits: 1500,
    credits: 0,
    finalBalance: 1500,
    ...overrides,
  };
}

function makeOptions(overrides: Partial<SpedExportOptions> = {}): SpedExportOptions {
  return {
    company,
    period: { startDate: '2026-03-01', endDate: '2026-03-31' },
    transactions: [makeTx()],
    chartOfAccounts: [makeAccount()],
    balances: [makeBalance()],
    ...overrides,
  };
}

// ================================================================
// exportToSped() — Structure
// ================================================================
describe('exportToSped() structure', () => {
  it('starts with |0000|LECD| (opening record)', () => {
    const result = exportToSped(makeOptions());
    expect(result).toMatch(/^\|0000\|LECD\|/);
  });

  it('ends with |9999| (closing record)', () => {
    const result = exportToSped(makeOptions());
    const lines = result.split('\r\n');
    expect(lines[lines.length - 1]).toMatch(/^\|9999\|/);
  });

  it('uses CRLF line separators', () => {
    const result = exportToSped(makeOptions());
    expect(result).toContain('\r\n');
  });

  it('contains block 0 (opening)', () => {
    const result = exportToSped(makeOptions());
    expect(result).toContain('|0001|0|');
    expect(result).toMatch(/\|0990\|\d+\|/);
  });

  it('contains block I (accounting entries)', () => {
    const result = exportToSped(makeOptions());
    expect(result).toContain('|I001|0|');
    expect(result).toMatch(/\|I990\|\d+\|/);
  });

  it('contains block J (financial statements)', () => {
    const result = exportToSped(makeOptions());
    expect(result).toContain('|J001|');
    expect(result).toContain('|J990|');
  });

  it('contains block K (conglomerates)', () => {
    const result = exportToSped(makeOptions());
    expect(result).toContain('|K001|');
    expect(result).toContain('|K990|');
  });

  it('contains block 9 (control)', () => {
    const result = exportToSped(makeOptions());
    expect(result).toContain('|9001|0|');
    expect(result).toMatch(/\|9990\|\d+\|/);
  });
});

// ================================================================
// exportToSped() — Company data
// ================================================================
describe('exportToSped() company data', () => {
  it('includes company name in opening record', () => {
    const result = exportToSped(makeOptions());
    expect(result).toContain('Empresa Teste LTDA');
  });

  it('formats CNPJ (digits only, 14 chars)', () => {
    const result = exportToSped(makeOptions());
    expect(result).toContain('12345678000190');
  });

  it('includes state (UF)', () => {
    const result = exportToSped(makeOptions());
    const firstLine = result.split('\r\n')[0];
    expect(firstLine).toContain('|SP|');
  });

  it('includes state registration in 0007 record', () => {
    const result = exportToSped(makeOptions());
    expect(result).toContain('|0007|SP|123456789|');
  });

  it('defaults UF to SP when not provided', () => {
    const result = exportToSped(makeOptions({
      company: { cnpj: '11222333000144', name: 'Test' },
    }));
    expect(result).toContain('|SP|');
  });
});

// ================================================================
// exportToSped() — Date formatting
// ================================================================
describe('exportToSped() dates', () => {
  it('formats dates as ddMMyyyy', () => {
    const result = exportToSped(makeOptions({
      period: { startDate: '2026-03-01', endDate: '2026-03-31' },
    }));
    expect(result).toContain('01032026');
    expect(result).toContain('31032026');
  });
});

// ================================================================
// exportToSped() — Transactions
// ================================================================
describe('exportToSped() transactions', () => {
  it('generates I200 record per transaction', () => {
    const result = exportToSped(makeOptions({
      transactions: [makeTx(), makeTx({ id: 'tx-2' })],
    }));
    const i200Lines = result.split('\r\n').filter(l => l.startsWith('|I200|'));
    expect(i200Lines).toHaveLength(2);
  });

  it('generates I250 record for each entry', () => {
    const result = exportToSped(makeOptions());
    const i250Lines = result.split('\r\n').filter(l => l.startsWith('|I250|'));
    expect(i250Lines.length).toBeGreaterThanOrEqual(1);
  });

  it('saida → D (debit indicator) in I250', () => {
    const result = exportToSped(makeOptions({
      transactions: [makeTx({ type: 'saida' })],
    }));
    const i250Lines = result.split('\r\n').filter(l => l.startsWith('|I250|'));
    expect(i250Lines[0]).toContain('|D|');
  });

  it('entrada → C (credit indicator) in I250', () => {
    const result = exportToSped(makeOptions({
      transactions: [makeTx({ type: 'entrada' })],
    }));
    const i250Lines = result.split('\r\n').filter(l => l.startsWith('|I250|'));
    expect(i250Lines[0]).toContain('|C|');
  });

  it('counterpart generates second I250 with opposite indicator', () => {
    const result = exportToSped(makeOptions({
      transactions: [makeTx({ type: 'saida', counterpartCode: '1.1.01' })],
    }));
    const i250Lines = result.split('\r\n').filter(l => l.startsWith('|I250|'));
    expect(i250Lines).toHaveLength(2);
    expect(i250Lines[0]).toContain('|D|');  // Main entry: debit
    expect(i250Lines[1]).toContain('|C|');  // Counterpart: credit
    expect(i250Lines[1]).toContain('1.1.01');
  });

  it('formats amount with comma decimal (Brazilian)', () => {
    const result = exportToSped(makeOptions({
      transactions: [makeTx({ amount: 1234.56 })],
    }));
    expect(result).toContain('1234,56');
  });

  it('sequential lancamento numbers', () => {
    const result = exportToSped(makeOptions({
      transactions: [makeTx({ id: '1' }), makeTx({ id: '2' })],
    }));
    const i200Lines = result.split('\r\n').filter(l => l.startsWith('|I200|'));
    expect(i200Lines[0]).toContain('|000001|');
    expect(i200Lines[1]).toContain('|000002|');
  });
});

// ================================================================
// exportToSped() — Chart of accounts
// ================================================================
describe('exportToSped() chart of accounts', () => {
  it('generates I050 record per account', () => {
    const result = exportToSped(makeOptions({
      chartOfAccounts: [
        makeAccount({ code: '1' }),
        makeAccount({ code: '1.1' }),
        makeAccount({ code: '1.1.01' }),
      ],
    }));
    const i050Lines = result.split('\r\n').filter(l => l.startsWith('|I050|'));
    expect(i050Lines).toHaveLength(3);
  });

  it('includes account code and name', () => {
    const result = exportToSped(makeOptions({
      chartOfAccounts: [makeAccount({ code: '3.1.01', name: 'Despesas Op' })],
    }));
    const i050Lines = result.split('\r\n').filter(l => l.startsWith('|I050|'));
    expect(i050Lines[0]).toContain('3.1.01');
    expect(i050Lines[0]).toContain('Despesas Op');
  });
});

// ================================================================
// exportToSped() — Balances
// ================================================================
describe('exportToSped() balances', () => {
  it('generates I150 record per balance', () => {
    const result = exportToSped(makeOptions({
      balances: [makeBalance(), makeBalance({ accountCode: '4.1.01' })],
    }));
    const i150Lines = result.split('\r\n').filter(l => l.startsWith('|I150|'));
    expect(i150Lines).toHaveLength(2);
  });

  it('positive final balance → D indicator', () => {
    const result = exportToSped(makeOptions({
      balances: [makeBalance({ finalBalance: 1000 })],
    }));
    const i150Line = result.split('\r\n').find(l => l.startsWith('|I150|'));
    expect(i150Line).toContain('|D|');
  });

  it('negative final balance → C indicator', () => {
    const result = exportToSped(makeOptions({
      balances: [makeBalance({ finalBalance: -500 })],
    }));
    const i150Line = result.split('\r\n').find(l => l.startsWith('|I150|'));
    expect(i150Line).toContain('|C|');
  });
});

// ================================================================
// exportToSped() — Block 9 registry counts
// ================================================================
describe('exportToSped() registry counts', () => {
  it('9900 records count all register types', () => {
    const result = exportToSped(makeOptions());
    const reg9900Lines = result.split('\r\n').filter(l => l.startsWith('|9900|'));
    expect(reg9900Lines.length).toBeGreaterThan(5);
    // Should list counts for 0000, 0001, 0990, I001, I010, etc.
    const registeredTypes = reg9900Lines.map(l => l.split('|')[2]);
    expect(registeredTypes).toContain('0000');
    expect(registeredTypes).toContain('I001');
    expect(registeredTypes).toContain('9999');
  });

  it('book type defaults to G (Diário Geral)', () => {
    const result = exportToSped(makeOptions());
    expect(result).toContain('|I010|G|');
  });

  it('custom book type R (Razão)', () => {
    const result = exportToSped(makeOptions({ bookType: 'R' }));
    expect(result).toContain('|I010|R|');
  });

  it('layout version defaults to 0017', () => {
    const result = exportToSped(makeOptions());
    const firstLine = result.split('\r\n')[0];
    expect(firstLine).toContain('0017');
  });
});

// ================================================================
// exportToSped() — Participants
// ================================================================
describe('exportToSped() participants', () => {
  it('generates 0150 record for counterpart codes', () => {
    const result = exportToSped(makeOptions({
      transactions: [
        makeTx({ counterpartCode: '1.1.01' }),
        makeTx({ counterpartCode: '2.1.01' }),
      ],
    }));
    const p150Lines = result.split('\r\n').filter(l => l.startsWith('|0150|'));
    expect(p150Lines).toHaveLength(2);
  });

  it('deduplicates counterpart codes', () => {
    const result = exportToSped(makeOptions({
      transactions: [
        makeTx({ counterpartCode: '1.1.01' }),
        makeTx({ id: '2', counterpartCode: '1.1.01' }),
      ],
    }));
    const p150Lines = result.split('\r\n').filter(l => l.startsWith('|0150|'));
    expect(p150Lines).toHaveLength(1);
  });

  it('no counterpart → no 0150 records', () => {
    const result = exportToSped(makeOptions({
      transactions: [makeTx({ counterpartCode: undefined })],
    }));
    const p150Lines = result.split('\r\n').filter(l => l.startsWith('|0150|'));
    expect(p150Lines).toHaveLength(0);
  });
});
