import { describe, it, expect, vi } from 'vitest';

// Mock Supabase client BEFORE imports
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

import { breakEvenEngine, BreakEvenComponents, BreakEvenResult } from '../breakEvenEngine';

const calc = (overrides: Partial<BreakEvenComponents> = {}): BreakEvenResult =>
  breakEvenEngine.calculateBreakEven({
    totalRevenue: 0,
    fixedCosts: 0,
    variableCosts: 0,
    variableCostPercentage: 0,
    ...overrides,
  });

describe('BreakEvenEngine', () => {
  // ================================================================
  // calculateBreakEven()
  // ================================================================
  describe('calculateBreakEven()', () => {
    it('standard case: Revenue 100K, fixed 30K, variable 40K', () => {
      const result = calc({
        totalRevenue: 100_000,
        fixedCosts: 30_000,
        variableCosts: 40_000,
      });

      expect(result.contributionMargin).toBe(60_000);
      expect(result.contributionMarginPercentage).toBe(60);
      expect(result.breakEvenPoint).toBe(50_000); // 30000 / 0.6
      expect(result.netProfit).toBe(30_000); // 60000 - 30000
      expect(result.netMarginPercentage).toBe(30);
      expect(result.safetyMargin).toBe(50_000); // 100000 - 50000
      expect(result.safetyMarginPercentage).toBe(50);
      expect(result.revenueAboveBreakeven).toBe(50_000);
      expect(result.breakevenCoveragePercentage).toBe(200);
    });

    it('at break-even: netProfit = 0, safetyMargin = 0', () => {
      // Revenue = 50K, fixed 30K, variable 20K
      // Contribution margin = 30K, CM% = 60%
      // Break-even = 30000 / 0.6 = 50000 (= revenue)
      const result = calc({
        totalRevenue: 50_000,
        fixedCosts: 30_000,
        variableCosts: 20_000,
      });

      expect(result.netProfit).toBe(0);
      expect(result.safetyMargin).toBe(0);
      expect(result.safetyMarginPercentage).toBe(0);
      expect(result.revenueAboveBreakeven).toBe(0);
      expect(result.breakevenCoveragePercentage).toBe(100);
    });

    it('below break-even: negative profit, revenueAboveBreakeven clamped to 0', () => {
      // Revenue = 40K, fixed 30K, variable 20K
      // CM = 20K, CM% = 50%
      // BE = 30000 / 0.5 = 60000 > revenue
      const result = calc({
        totalRevenue: 40_000,
        fixedCosts: 30_000,
        variableCosts: 20_000,
      });

      expect(result.netProfit).toBeLessThan(0);
      expect(result.safetyMargin).toBeLessThan(0);
      expect(result.revenueAboveBreakeven).toBe(0); // clamped by Math.max(0, ...)
    });

    it('zero revenue: all fields = 0 (division-by-zero guards)', () => {
      const result = calc({
        totalRevenue: 0,
        fixedCosts: 10_000,
        variableCosts: 5_000,
      });

      expect(result.contributionMarginPercentage).toBe(0);
      expect(result.breakEvenPoint).toBe(0);
      expect(result.netMarginPercentage).toBe(0);
      expect(result.safetyMarginPercentage).toBe(0);
      expect(result.breakevenCoveragePercentage).toBe(0);
    });

    it('zero variable costs: contribution margin = total revenue', () => {
      const result = calc({
        totalRevenue: 100_000,
        fixedCosts: 30_000,
        variableCosts: 0,
      });

      expect(result.contributionMargin).toBe(100_000);
      expect(result.contributionMarginPercentage).toBe(100);
      expect(result.breakEvenPoint).toBe(30_000);
    });

    it('100% variable costs: contribution margin = 0, breakEvenPoint = 0', () => {
      const result = calc({
        totalRevenue: 100_000,
        fixedCosts: 0,
        variableCosts: 100_000,
      });

      expect(result.contributionMargin).toBe(0);
      expect(result.contributionMarginPercentage).toBe(0);
      expect(result.breakEvenPoint).toBe(0); // division by zero guard
    });

    it('no costs at all: 100% profit', () => {
      const result = calc({
        totalRevenue: 100_000,
        fixedCosts: 0,
        variableCosts: 0,
      });

      expect(result.netProfit).toBe(100_000);
      expect(result.netMarginPercentage).toBe(100);
    });
  });

  // ================================================================
  // calculateHealthScore()
  // ================================================================
  describe('calculateHealthScore()', () => {
    const makeResult = (
      netMarginPercentage: number,
      safetyMarginPercentage: number,
      contributionMarginPercentage: number,
    ): BreakEvenResult => ({
      breakEvenPoint: 0,
      contributionMargin: 0,
      contributionMarginPercentage,
      netProfit: 0,
      netMarginPercentage,
      safetyMargin: 0,
      safetyMarginPercentage,
      revenueAboveBreakeven: 0,
      breakevenCoveragePercentage: 0,
    });

    it('perfect score: net>=20, safety>=30, contribution>=50 → 100', () => {
      expect(breakEvenEngine.calculateHealthScore(makeResult(20, 30, 50))).toBe(100);
    });

    it('minimum score: all zero or negative → 0', () => {
      expect(breakEvenEngine.calculateHealthScore(makeResult(-5, -10, 0))).toBe(0);
    });

    it('net margin 12%, safety 15%, contribution 35% → 55', () => {
      // net 12% → 30pts, safety 15% → 15pts, contribution 35% → 20pts = 65
      // Wait, let me check thresholds:
      // net 12%: >=10 → 30pts
      // safety 15%: >=10 → 15pts
      // contribution 35%: >=30 → 20pts
      // Total: 30 + 15 + 20 = 65
      expect(breakEvenEngine.calculateHealthScore(makeResult(12, 15, 35))).toBe(65);
    });

    it('net margin thresholds: 20→40, 10→30, 5→20, 1→10, 0→0', () => {
      expect(breakEvenEngine.calculateHealthScore(makeResult(20, 0, 0))).toBe(40);
      expect(breakEvenEngine.calculateHealthScore(makeResult(10, 0, 0))).toBe(30);
      expect(breakEvenEngine.calculateHealthScore(makeResult(5, 0, 0))).toBe(20);
      expect(breakEvenEngine.calculateHealthScore(makeResult(1, 0, 0))).toBe(10);
      expect(breakEvenEngine.calculateHealthScore(makeResult(0, 0, 0))).toBe(0);
    });

    it('safety margin thresholds: 30→30, 20→25, 10→15, 1→5, 0→0', () => {
      expect(breakEvenEngine.calculateHealthScore(makeResult(0, 30, 0))).toBe(30);
      expect(breakEvenEngine.calculateHealthScore(makeResult(0, 20, 0))).toBe(25);
      expect(breakEvenEngine.calculateHealthScore(makeResult(0, 10, 0))).toBe(15);
      expect(breakEvenEngine.calculateHealthScore(makeResult(0, 1, 0))).toBe(5);
      expect(breakEvenEngine.calculateHealthScore(makeResult(0, 0, 0))).toBe(0);
    });

    it('contribution margin thresholds: 50→30, 40→25, 30→20, 20→10, 19→0', () => {
      expect(breakEvenEngine.calculateHealthScore(makeResult(0, 0, 50))).toBe(30);
      expect(breakEvenEngine.calculateHealthScore(makeResult(0, 0, 40))).toBe(25);
      expect(breakEvenEngine.calculateHealthScore(makeResult(0, 0, 30))).toBe(20);
      expect(breakEvenEngine.calculateHealthScore(makeResult(0, 0, 20))).toBe(10);
      expect(breakEvenEngine.calculateHealthScore(makeResult(0, 0, 19))).toBe(0);
    });

    it('score is clamped between 0 and 100', () => {
      const score = breakEvenEngine.calculateHealthScore(makeResult(100, 100, 100));
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  // ================================================================
  // getHealthStatus()
  // ================================================================
  describe('getHealthStatus()', () => {
    it('80+ → excelente', () => {
      expect(breakEvenEngine.getHealthStatus(80)).toBe('excelente');
      expect(breakEvenEngine.getHealthStatus(95)).toBe('excelente');
      expect(breakEvenEngine.getHealthStatus(100)).toBe('excelente');
    });

    it('60-79 → saudavel', () => {
      expect(breakEvenEngine.getHealthStatus(60)).toBe('saudavel');
      expect(breakEvenEngine.getHealthStatus(79)).toBe('saudavel');
    });

    it('40-59 → estavel', () => {
      expect(breakEvenEngine.getHealthStatus(40)).toBe('estavel');
      expect(breakEvenEngine.getHealthStatus(59)).toBe('estavel');
    });

    it('20-39 → atencao', () => {
      expect(breakEvenEngine.getHealthStatus(20)).toBe('atencao');
      expect(breakEvenEngine.getHealthStatus(39)).toBe('atencao');
    });

    it('<20 → critico', () => {
      expect(breakEvenEngine.getHealthStatus(19)).toBe('critico');
      expect(breakEvenEngine.getHealthStatus(0)).toBe('critico');
    });
  });
});
