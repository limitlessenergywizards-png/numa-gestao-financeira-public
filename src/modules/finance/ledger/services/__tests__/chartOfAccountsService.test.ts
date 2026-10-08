/**
 * Bug #3 Regression Test: Chart of accounts not appearing after onboarding
 *
 * Root cause: seedChartOfAccounts does upsert without verifying rows
 * were actually inserted. Also, the function silently succeeds even if
 * zero rows were affected.
 *
 * Tests the seed function, template loading, and two-pass insert logic.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTemplate, getDefaultTemplate, TEMPLATES, TEMPLATE_KEYS } from "@/data/templates";

// Mock supabase before importing the service
const mockUpsert = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      upsert: mockUpsert,
      select: mockSelect,
    })),
  },
}));

// Import after mock is set up
import { seedChartOfAccounts, hasChartOfAccounts } from "../chartOfAccountsService";

describe("Bug #3: Chart of accounts seed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Template loading", () => {
    it("getTemplate returns correct template for valid keys", () => {
      for (const key of TEMPLATE_KEYS) {
        const template = getTemplate(key);
        expect(template, `Template '${key}' should exist`).toBeDefined();
        expect(template!.accounts.length).toBeGreaterThan(0);
        expect(template!.name).toBeTruthy();
      }
    });

    it("getTemplate returns undefined for invalid key", () => {
      expect(getTemplate("nonexistent")).toBeUndefined();
      expect(getTemplate("")).toBeUndefined();
    });

    it("getDefaultTemplate returns padrao template", () => {
      const defaultTmpl = getDefaultTemplate();
      expect(defaultTmpl).toBe(TEMPLATES.padrao);
      expect(defaultTmpl.name).toBe("Padrão Simplificado");
    });

    it("all templates have at least one root account (parent_id = null)", () => {
      for (const [key, template] of Object.entries(TEMPLATES)) {
        const rootAccounts = template.accounts.filter(a => !a.parentCode);
        expect(rootAccounts.length, `Template '${key}' should have root accounts`).toBeGreaterThan(0);
      }
    });

    it("all templates have valid DRE mappings", () => {
      for (const [key, template] of Object.entries(TEMPLATES)) {
        expect(
          Array.isArray(template.dreMapping),
          `Template '${key}' should have dreMapping array`
        ).toBe(true);
      }
    });

    it("child accounts reference existing parent codes", () => {
      for (const [key, template] of Object.entries(TEMPLATES)) {
        const allCodes = new Set(template.accounts.map(a => a.code));
        for (const account of template.accounts) {
          if (account.parentCode) {
            expect(
              allCodes.has(account.parentCode),
              `Template '${key}': account ${account.code} references missing parent ${account.parentCode}`
            ).toBe(true);
          }
        }
      }
    });
  });

  describe("seedChartOfAccounts", () => {
    it("uses padrao template when given invalid key", async () => {
      mockUpsert.mockResolvedValue({ data: [], error: null });

      await seedChartOfAccounts("company-1", "nonexistent-template");

      // Should still call upsert (used the default template)
      expect(mockUpsert).toHaveBeenCalled();
    });

    it("inserts root accounts before child accounts (two-pass)", async () => {
      const insertOrder: string[] = [];
      mockUpsert.mockImplementation((batch) => {
        const hasParents = batch.some((a: { parent_id: string | null }) => a.parent_id !== null);
        insertOrder.push(hasParents ? "children" : "roots");
        return Promise.resolve({ data: batch, error: null });
      });

      await seedChartOfAccounts("company-1", "padrao");

      // First calls should be roots, then children
      const firstChildIndex = insertOrder.indexOf("children");
      const lastRootIndex = insertOrder.lastIndexOf("roots");

      if (firstChildIndex !== -1 && lastRootIndex !== -1) {
        expect(lastRootIndex).toBeLessThan(firstChildIndex);
      }
    });

    it("throws error when upsert fails for root accounts", async () => {
      mockUpsert.mockResolvedValueOnce({
        data: null,
        error: { message: "Permission denied", code: "42501" },
      });

      await expect(seedChartOfAccounts("company-1", "padrao")).rejects.toEqual(
        expect.objectContaining({ message: "Permission denied" })
      );
    });

    it("throws error when upsert fails for child accounts", async () => {
      // First call (roots) succeeds
      mockUpsert.mockResolvedValueOnce({ data: [], error: null });
      // Second call (children) fails
      mockUpsert.mockResolvedValueOnce({
        data: null,
        error: { message: "FK violation", code: "23503" },
      });

      await expect(seedChartOfAccounts("company-1", "padrao")).rejects.toEqual(
        expect.objectContaining({ message: "FK violation" })
      );
    });

    it("generates unique IDs for each account", async () => {
      const allIds = new Set<string>();
      mockUpsert.mockImplementation((batch) => {
        for (const account of batch) {
          expect(allIds.has(account.id)).toBe(false);
          allIds.add(account.id);
        }
        return Promise.resolve({ data: batch, error: null });
      });

      await seedChartOfAccounts("company-1", "padrao");

      // Should have inserted all accounts from the template
      const template = getDefaultTemplate();
      expect(allIds.size).toBe(template.accounts.length);
    });

    it("sets company_id on all inserted accounts", async () => {
      const companyId = "test-company-123";
      mockUpsert.mockImplementation((batch) => {
        for (const account of batch) {
          expect(account.company_id).toBe(companyId);
        }
        return Promise.resolve({ data: batch, error: null });
      });

      await seedChartOfAccounts(companyId, "padrao");
    });

    it("uses onConflict company_id,code for upsert", async () => {
      mockUpsert.mockResolvedValue({ data: [], error: null });

      await seedChartOfAccounts("company-1", "padrao");

      // Every upsert call should include the onConflict option
      for (const call of mockUpsert.mock.calls) {
        const options = call[1];
        expect(options).toEqual({ onConflict: "company_id,code" });
      }
    });
  });

  describe("hasChartOfAccounts", () => {
    it("returns true when company has accounts", async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 42, error: null }),
      });

      const result = await hasChartOfAccounts("company-1");
      expect(result).toBe(true);
    });

    it("returns false when company has no accounts", async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      });

      const result = await hasChartOfAccounts("company-1");
      expect(result).toBe(false);
    });

    it("returns false on error (defensive)", async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: null,
          error: { message: "Connection failed" },
        }),
      });

      const result = await hasChartOfAccounts("company-1");
      expect(result).toBe(false);
    });
  });
});
