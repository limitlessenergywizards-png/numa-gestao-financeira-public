
import { describe, it, expect, vi } from 'vitest';

// Mock Supabase client BEFORE imports
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: () => ({
            select: () => ({ eq: () => ({ single: () => ({ data: {}, error: null }) }) }),
            insert: () => ({ select: () => ({ single: () => ({ data: {}, error: null }) }) }),
            update: () => ({ eq: () => ({}) })
        })
    }
}));

import { debtCalculationEngine, Debt } from './debtCalculationEngine';

describe('DebtCalculationEngine', () => {
    const mockDebt: Debt = {
        id: 'test-1',
        company_id: 'test-company',
        name: 'Test Debt',
        description: null,
        creditor_name: 'Bank A',
        creditor_type: 'banco',
        debt_type: 'financiamento',
        original_amount: 10000,
        current_balance: 10000,
        interest_rate: 1.5,
        interest_period: 'mensal',
        interest_type: 'price',
        total_installments: 12,
        paid_amount: 0,
        paid_installments: 0,
        installment_amount: null,
        due_day: 10,
        status: 'active',
        contract_date: new Date().toISOString(),
        first_due_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        paid_off_at: null
    };

    it('should calculate PRICE schedule correctly', () => {
        const schedule = debtCalculationEngine.calculatePaymentSchedule({
            ...mockDebt,
            interest_type: 'price'
        });

        expect(schedule).toHaveLength(12);
        expect(schedule[0].installment_number).toBe(1);

        // Check if total payment is roughly constant (Price)
        const firstTotal = schedule[0].total;
        const lastTotal = schedule[11].total;
        expect(Math.abs(firstTotal - lastTotal)).toBeLessThan(1); // Small rounding diff allowed

        // Check if balance decreases
        expect(schedule[11].balance).toBeLessThan(1); // Close to 0
    });

    it('should calculate SAC schedule correctly', () => {
        const schedule = debtCalculationEngine.calculatePaymentSchedule({
            ...mockDebt,
            interest_type: 'sac'
        });

        expect(schedule).toHaveLength(12);

        // Check if principal amortization is constant (SAC)
        // Amortization = 10000 / 12 = 833.33
        const firstPrincipal = schedule[0].principal;
        const lastPrincipal = schedule[11].principal;
        expect(Math.abs(firstPrincipal - lastPrincipal)).toBeLessThan(1);
        expect(Math.abs(firstPrincipal - 833.33)).toBeLessThan(1);

        // Check if total payment decreases over time
        expect(schedule[0].total).toBeGreaterThan(schedule[11].total);
    });

    it('should calculate Priority Score', () => {
        const lowScore = debtCalculationEngine.calculatePriorityScore({
            ...mockDebt,
            interest_rate: 0.5
        });

        const highScore = debtCalculationEngine.calculatePriorityScore({
            ...mockDebt,
            interest_rate: 15,
            debt_type: 'cartao_credito_rotativo'
        });

        expect(highScore).toBeGreaterThan(lowScore);
    });

    // ================================================================
    // Simple Interest Schedule
    // ================================================================
    describe('Simple Interest Schedule', () => {
        it('produces constant amortization', () => {
            const schedule = debtCalculationEngine.calculatePaymentSchedule({
                ...mockDebt,
                interest_type: 'simples',
            });

            expect(schedule).toHaveLength(12);
            const firstPrincipal = schedule[0].principal;
            const lastPrincipal = schedule[11].principal;
            expect(Math.abs(firstPrincipal - lastPrincipal)).toBeLessThan(1);
            expect(Math.abs(firstPrincipal - 833.33)).toBeLessThan(1);
        });

        it('interest decreases as balance decreases', () => {
            const schedule = debtCalculationEngine.calculatePaymentSchedule({
                ...mockDebt,
                interest_type: 'simples',
            });

            expect(schedule[0].interest).toBeGreaterThan(schedule[11].interest);
        });

        it('final balance is approximately zero', () => {
            const schedule = debtCalculationEngine.calculatePaymentSchedule({
                ...mockDebt,
                interest_type: 'simples',
            });

            expect(schedule[11].balance).toBeLessThan(1);
        });
    });

    // ================================================================
    // Compound Interest Schedule
    // ================================================================
    describe('Compound Interest Schedule', () => {
        it('always produces 12 installments', () => {
            const schedule = debtCalculationEngine.calculatePaymentSchedule({
                ...mockDebt,
                interest_type: 'composto',
            });

            expect(schedule).toHaveLength(12);
        });

        it('balance decreases and stays non-negative', () => {
            const schedule = debtCalculationEngine.calculatePaymentSchedule({
                ...mockDebt,
                interest_type: 'composto',
            });

            expect(schedule[0].balance).toBeGreaterThan(schedule[11].balance);
            schedule.forEach(s => expect(s.balance).toBeGreaterThanOrEqual(0));
        });

        it('principal is 5% of current balance', () => {
            const schedule = debtCalculationEngine.calculatePaymentSchedule({
                ...mockDebt,
                interest_type: 'composto',
            });

            // First installment: principal ≈ 10000 * 0.05 = 500
            expect(Math.abs(schedule[0].principal - 500)).toBeLessThan(1);
        });
    });

    // ================================================================
    // Price with installment_amount override
    // ================================================================
    it('Price schedule uses installment_amount when provided', () => {
        const schedule = debtCalculationEngine.calculatePaymentSchedule({
            ...mockDebt,
            interest_type: 'price',
            installment_amount: 1000,
        });

        expect(schedule).toHaveLength(12);
        expect(schedule[0].total).toBeCloseTo(1000, 0);
    });

    // ================================================================
    // convertToMonthlyRate()
    // ================================================================
    describe('convertToMonthlyRate()', () => {
        it('mensal: passthrough (rate unchanged)', () => {
            const result = debtCalculationEngine.convertToMonthlyRate(1.5, 'mensal');
            expect(result.toNumber()).toBeCloseTo(1.5, 10);
        });

        it('anual: 12% → ~0.9489% monthly (compound conversion)', () => {
            const result = debtCalculationEngine.convertToMonthlyRate(12, 'anual');
            expect(result.toNumber()).toBeCloseTo(0.9489, 3);
        });

        it('diario: 0.1% daily → ~3.04% monthly', () => {
            const result = debtCalculationEngine.convertToMonthlyRate(0.1, 'diario');
            expect(result.toNumber()).toBeCloseTo(3.0437, 2);
        });

        it('zero rate: always 0 regardless of period', () => {
            expect(debtCalculationEngine.convertToMonthlyRate(0, 'mensal').toNumber()).toBe(0);
            expect(debtCalculationEngine.convertToMonthlyRate(0, 'anual').toNumber()).toBe(0);
            expect(debtCalculationEngine.convertToMonthlyRate(0, 'diario').toNumber()).toBe(0);
        });

        it('unknown period: passthrough (default case)', () => {
            const result = debtCalculationEngine.convertToMonthlyRate(5, 'unknown');
            expect(result.toNumber()).toBe(5);
        });
    });

    // ================================================================
    // simulateEarlyPayoff()
    // ================================================================
    describe('simulateEarlyPayoff()', () => {
        it('10% discount reduces final payoff', () => {
            const result = debtCalculationEngine.simulateEarlyPayoff(mockDebt, new Date(), 10);

            expect(result.currentBalance).toBe(10000);
            expect(result.discountAmount).toBe(1000);
            expect(result.finalPayoff).toBe(9000);
        });

        it('zero discount: finalPayoff equals currentBalance', () => {
            const result = debtCalculationEngine.simulateEarlyPayoff(mockDebt, new Date(), 0);

            expect(result.discountAmount).toBe(0);
            expect(result.finalPayoff).toBe(10000);
        });

        it('100% discount: finalPayoff is zero', () => {
            const result = debtCalculationEngine.simulateEarlyPayoff(mockDebt, new Date(), 100);

            expect(result.discountAmount).toBe(10000);
            expect(result.finalPayoff).toBe(0);
        });

        it('interestSaved includes both future interest and discount', () => {
            const result = debtCalculationEngine.simulateEarlyPayoff(mockDebt, new Date(), 10);

            // interestSaved = totalFutureInterest + discountAmount (1000)
            expect(result.interestSaved).toBeGreaterThan(1000);
        });

        it('interestToDate is always 0 (simplified)', () => {
            const result = debtCalculationEngine.simulateEarlyPayoff(mockDebt, new Date(), 10);
            expect(result.interestToDate).toBe(0);
        });
    });

    // ================================================================
    // calculatePriorityScore() — expanded
    // ================================================================
    describe('calculatePriorityScore() — threshold tests', () => {
        it('rate >= 10%: 40 pts', () => {
            expect(debtCalculationEngine.calculatePriorityScore({
                ...mockDebt, interest_rate: 10,
            })).toBe(40);
        });

        it('rate >= 5% < 10%: 30 pts', () => {
            expect(debtCalculationEngine.calculatePriorityScore({
                ...mockDebt, interest_rate: 5,
            })).toBe(30);
        });

        it('rate >= 2% < 5%: 20 pts', () => {
            expect(debtCalculationEngine.calculatePriorityScore({
                ...mockDebt, interest_rate: 2,
            })).toBe(20);
        });

        it('rate >= 1% < 2%: 10 pts', () => {
            expect(debtCalculationEngine.calculatePriorityScore({
                ...mockDebt, interest_rate: 1,
            })).toBe(10);
        });

        it('rate < 1%: 0 pts for interest', () => {
            expect(debtCalculationEngine.calculatePriorityScore({
                ...mockDebt, interest_rate: 0.5,
            })).toBe(0);
        });

        it('overdue status: +30 pts', () => {
            expect(debtCalculationEngine.calculatePriorityScore({
                ...mockDebt, interest_rate: 0.5, status: 'overdue',
            })).toBe(30);
        });

        it('cartao_credito_rotativo: +20 pts', () => {
            expect(debtCalculationEngine.calculatePriorityScore({
                ...mockDebt, interest_rate: 0.5, debt_type: 'cartao_credito_rotativo',
            })).toBe(20);
        });

        it('cheque_especial: +20 pts', () => {
            expect(debtCalculationEngine.calculatePriorityScore({
                ...mockDebt, interest_rate: 0.5, debt_type: 'cheque_especial',
            })).toBe(20);
        });

        it('all factors combined: clamped at 100', () => {
            const score = debtCalculationEngine.calculatePriorityScore({
                ...mockDebt,
                interest_rate: 15,
                status: 'overdue',
                debt_type: 'cartao_credito_rotativo',
            });
            // 40 + 30 + 20 = 90
            expect(score).toBe(90);
            expect(score).toBeLessThanOrEqual(100);
        });
    });
});
