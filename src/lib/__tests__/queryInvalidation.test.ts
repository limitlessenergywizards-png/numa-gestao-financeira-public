import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  invalidateFinancialQueries,
  invalidatePayablesQueries,
  invalidateReceivablesQueries,
  invalidateCustomerQueries,
  invalidateSupplierQueries,
  invalidateBankAccountQueries,
  invalidateChartAccountQueries,
  invalidateBudgetQueries,
  invalidateDREQueries,
  invalidateAllQueries,
} from '../queryInvalidation';

function createMockQueryClient() {
  return {
    invalidateQueries: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('invalidateFinancialQueries()', () => {
  it('calls invalidateQueries with predicate', () => {
    const qc = createMockQueryClient();
    invalidateFinancialQueries(qc, 'company-123');
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(qc.invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ predicate: expect.any(Function) })
    );
  });

  it('predicate matches queries containing companyId', () => {
    const qc = createMockQueryClient();
    invalidateFinancialQueries(qc, 'c1');
    const call = qc.invalidateQueries.mock.calls[0][0];
    expect(call.predicate({ queryKey: ['transactions', 'c1', {}] })).toBe(true);
    expect(call.predicate({ queryKey: ['transactions', 'c2', {}] })).toBe(false);
  });

  it('predicate returns false for non-array keys', () => {
    const qc = createMockQueryClient();
    invalidateFinancialQueries(qc, 'c1');
    const call = qc.invalidateQueries.mock.calls[0][0];
    expect(call.predicate({ queryKey: 'not-array' })).toBe(false);
  });
});

describe('invalidatePayablesQueries()', () => {
  it('invalidates payables, dashboard, and cashflow queries', () => {
    const qc = createMockQueryClient();
    invalidatePayablesQueries(qc, 'c1');
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(3);
  });
});

describe('invalidateReceivablesQueries()', () => {
  it('invalidates receivables, dashboard, and cashflow queries', () => {
    const qc = createMockQueryClient();
    invalidateReceivablesQueries(qc, 'c1');
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(3);
  });
});

describe('invalidateCustomerQueries()', () => {
  it('invalidates customers, receivables, and dashboard queries', () => {
    const qc = createMockQueryClient();
    invalidateCustomerQueries(qc, 'c1');
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(3);
  });
});

describe('invalidateSupplierQueries()', () => {
  it('invalidates suppliers, payables, and dashboard queries', () => {
    const qc = createMockQueryClient();
    invalidateSupplierQueries(qc, 'c1');
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(3);
  });
});

describe('invalidateBankAccountQueries()', () => {
  it('invalidates bank accounts and dashboard queries', () => {
    const qc = createMockQueryClient();
    invalidateBankAccountQueries(qc, 'c1');
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(2);
  });
});

describe('invalidateChartAccountQueries()', () => {
  it('invalidates chart accounts and DRE queries', () => {
    const qc = createMockQueryClient();
    invalidateChartAccountQueries(qc, 'c1');
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(2);
  });
});

describe('invalidateBudgetQueries()', () => {
  it('invalidates budget and dashboard queries', () => {
    const qc = createMockQueryClient();
    invalidateBudgetQueries(qc, 'c1');
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(2);
  });
});

describe('invalidateDREQueries()', () => {
  it('invalidates only DRE queries', () => {
    const qc = createMockQueryClient();
    invalidateDREQueries(qc, 'c1');
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(1);
  });
});

describe('invalidateAllQueries()', () => {
  it('invalidates everything (no filters)', () => {
    const qc = createMockQueryClient();
    invalidateAllQueries(qc);
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(qc.invalidateQueries).toHaveBeenCalledWith();
  });
});
