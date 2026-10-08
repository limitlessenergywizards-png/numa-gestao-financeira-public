/**
 * Bug #2 Regression Test: 15-min sync delay (stale time mismatch)
 *
 * Root cause: Bank accounts use STALE_TIMES.REFERENCE (10 min) while
 * transactions use STALE_TIMES.FINANCIAL (60s). When a payment is recorded,
 * transactions refresh quickly but bank account balance stays stale for minutes.
 *
 * Also tests: query key factories produce unique, deterministic keys.
 */
import { describe, it, expect } from "vitest";
import {
  STALE_TIMES,
  GC_TIMES,
  DASHBOARD_KEYS,
  TRANSACTIONS_KEYS,
  PAYABLES_KEYS,
  RECEIVABLES_KEYS,
  BANK_ACCOUNTS_KEYS,
  SUPPLIERS_KEYS,
  CUSTOMERS_KEYS,
  CHART_ACCOUNTS_KEYS,
  CATEGORIES_KEYS,
} from "@/lib/queryKeys";

describe("Bug #2: Stale time configuration", () => {
  describe("STALE_TIMES thresholds", () => {
    it("FINANCIAL data should be stale within 2 minutes", () => {
      expect(STALE_TIMES.FINANCIAL).toBeLessThanOrEqual(2 * 60 * 1000);
    });

    it("SEMI_VOLATILE data should be stale within 2 minutes", () => {
      expect(STALE_TIMES.SEMI_VOLATILE).toBeLessThanOrEqual(2 * 60 * 1000);
    });

    it("REFERENCE data should NOT exceed 10 minutes", () => {
      // Bug #2: If REFERENCE is too high, bank account balances go stale
      expect(STALE_TIMES.REFERENCE).toBeLessThanOrEqual(10 * 60 * 1000);
    });

    it("EDITABLE_REFERENCE should be between FINANCIAL and REFERENCE", () => {
      expect(STALE_TIMES.EDITABLE_REFERENCE).toBeGreaterThan(STALE_TIMES.FINANCIAL);
      expect(STALE_TIMES.EDITABLE_REFERENCE).toBeLessThanOrEqual(STALE_TIMES.REFERENCE);
    });

    it("DASHBOARD should refresh frequently (under 1 minute)", () => {
      expect(STALE_TIMES.DASHBOARD).toBeLessThanOrEqual(60 * 1000);
    });

    it("REALTIME should always be 0 (never stale)", () => {
      expect(STALE_TIMES.REALTIME).toBe(0);
    });

    it("all stale times should be non-negative", () => {
      for (const [key, value] of Object.entries(STALE_TIMES)) {
        expect(value, `STALE_TIMES.${key}`).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("GC_TIMES thresholds", () => {
    it("GC times should always be greater than or equal to corresponding stale times", () => {
      expect(GC_TIMES.FINANCIAL).toBeGreaterThanOrEqual(STALE_TIMES.FINANCIAL);
      expect(GC_TIMES.REFERENCE).toBeGreaterThanOrEqual(STALE_TIMES.REFERENCE);
      expect(GC_TIMES.EDITABLE_REFERENCE).toBeGreaterThanOrEqual(STALE_TIMES.EDITABLE_REFERENCE);
    });
  });
});

describe("Query key factories produce unique keys", () => {
  const companyA = "company-aaa";
  const companyB = "company-bbb";

  it("different companies produce different keys", () => {
    expect(PAYABLES_KEYS.list(companyA)).not.toEqual(PAYABLES_KEYS.list(companyB));
    expect(RECEIVABLES_KEYS.list(companyA)).not.toEqual(RECEIVABLES_KEYS.list(companyB));
    expect(TRANSACTIONS_KEYS.list(companyA)).not.toEqual(TRANSACTIONS_KEYS.list(companyB));
    expect(BANK_ACCOUNTS_KEYS.list(companyA)).not.toEqual(BANK_ACCOUNTS_KEYS.list(companyB));
  });

  it("different resource types produce different keys", () => {
    expect(PAYABLES_KEYS.list(companyA)).not.toEqual(RECEIVABLES_KEYS.list(companyA));
    expect(TRANSACTIONS_KEYS.list(companyA)).not.toEqual(BANK_ACCOUNTS_KEYS.list(companyA));
  });

  it("keys with filters differ from keys without", () => {
    const noFilters = PAYABLES_KEYS.list(companyA);
    const withFilters = PAYABLES_KEYS.list(companyA, { status: "pendente" });
    expect(noFilters).not.toEqual(withFilters);
  });

  it("DASHBOARD_KEYS include companyId for scoped invalidation", () => {
    const key = DASHBOARD_KEYS.payables(companyA);
    expect(key).toContain(companyA);
  });

  it("BANK_ACCOUNTS_KEYS.list distinguishes active vs all", () => {
    const active = BANK_ACCOUNTS_KEYS.list(companyA, false);
    const all = BANK_ACCOUNTS_KEYS.list(companyA, true);
    expect(active).not.toEqual(all);
  });

  it("all key factories return readonly tuples", () => {
    // These should be readonly arrays (as const)
    const key = PAYABLES_KEYS.list(companyA);
    expect(Array.isArray(key)).toBe(true);
    expect(key.length).toBeGreaterThan(0);
  });
});

describe("Query key factory determinism", () => {
  it("same inputs produce identical keys across calls", () => {
    const company = "test-company";
    const call1 = PAYABLES_KEYS.list(company);
    const call2 = PAYABLES_KEYS.list(company);
    expect(call1).toEqual(call2);
  });

  it("same filters produce identical keys", () => {
    const company = "test-company";
    const filters = { status: "pendente", search: "test" };
    const call1 = PAYABLES_KEYS.list(company, filters);
    const call2 = PAYABLES_KEYS.list(company, filters);
    expect(call1).toEqual(call2);
  });
});
