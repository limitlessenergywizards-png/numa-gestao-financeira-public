
import { describe, it, expect, vi } from 'vitest';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {}
}));

import { debtPayoffPlanner } from './debtPayoffPlanner';
import { Debt } from './debtCalculationEngine';

describe('DebtPayoffPlanner', () => {
    const debtHighInterest: Debt = {
        id: 'high-interest',
        company_id: 'c1',
        name: 'Credit Card',
        description: null,
        creditor_name: 'Bank A',
        creditor_type: 'cartao_credito',
        debt_type: 'cartao_credito_rotativo',
        original_amount: 5000,
        current_balance: 5000,
        interest_rate: 10, // 10% a.m.
        interest_period: 'mensal',
        interest_type: 'composto',
        total_installments: null,
        paid_amount: 0,
        paid_installments: 0,
        due_day: 5,
        status: 'active',
        contract_date: null,
        first_due_date: null,
        created_at: null,
        updated_at: null,
        paid_off_at: null
    };

    const debtLowInterest: Debt = {
        ...debtHighInterest,
        id: 'low-interest',
        name: 'Student Loan',
        current_balance: 2000, // Lower balance
        interest_rate: 1, // 1% a.m.
        debt_type: 'financiamento'
    };

    it('AVALANCHE should prioritize high interest debt', () => {
        // Extra payment of 1000
        const result = debtPayoffPlanner.simulatePayoff(
            [debtHighInterest, debtLowInterest],
            1000,
            'avalanche'
        );

        expect(result.strategy).toBe('avalanche');

        // Month 1
        const month1 = result.projection[0];
        const highDebtState = month1.debts.find(d => d.id === 'high-interest');
        const lowDebtState = month1.debts.find(d => d.id === 'low-interest');

        // High interest debt should receive the bulk of extra payment
        // Minimums are calculated first. 
        // High Int Min ~ 500 (interest) + 150 (3% balance) = 650
        // Low Int Min ~ 20 (interest) + 60 (3% balance) = 80
        // Total Min ~ 730
        // Available Extra = 1000.
        // Avalanche means 1000 goes to High Interest.

        // Let's check if High Debt balance reduced significantly more than Low Debt (proportional to their mins)
        // Actually, let's just check the logic:
        // PayoffPlanner implementation sorts debts by rate descending.
        // It iterates debts.
        // Debt 1 (High): Gets Extra.

        expect(highDebtState?.payment).toBeGreaterThan(lowDebtState?.payment || 0);
    });

    it('SNOWBALL should prioritize lowest balance debt', () => {
        const result = debtPayoffPlanner.simulatePayoff(
            [debtHighInterest, debtLowInterest],
            1000,
            'snowball'
        );

        expect(result.strategy).toBe('snowball');

        const month1 = result.projection[0];
        const lowDebtState = month1.debts.find(d => d.id === 'low-interest');
        const highDebtState = month1.debts.find(d => d.id === 'high-interest');

        // Low balance debt (2000) should be prioritized over High balance (5000)
        // Even though High has much higher interest.

        // Check if Low Debt received the extra payment
        // Depending on minimums, it might be close.
        // Low Debt Balance 2000. High 5000.
        // Extra 1000.
        // Snowball sorts by balance asc.
        // Debt 1 (Low): Gets Extra.

        // Total payment on Low should be Min + Extra (limited by balance)
        // Total payment on High should be just Min.

        // If extra is huge, it might pay off Low and spill over to High.
        // Let's assert that Low Debt reduced by > 1000 (Min + Extra) or is Paid Off

        // Actually, simply checking if Low Debt balance is 0 or close to it in fewer months than High Debt?
        // Or checking that Low Debt is paid off BEFORE High Debt.

        // Find when Low Debt becomes 0
        const lowDebtPaidMonth = result.projection.findIndex(m =>
            m.debts.find(d => d.id === 'low-interest')?.balance === 0
        );

        const highDebtPaidMonth = result.projection.findIndex(m =>
            m.debts.find(d => d.id === 'high-interest')?.balance === 0
        );

        expect(lowDebtPaidMonth).toBeLessThan(highDebtPaidMonth);
    });

    // ================================================================
    // Interest Calculation Accuracy
    // ================================================================
    describe('Interest calculation accuracy', () => {
        it('month 1 interest matches expected value', () => {
            const debt: Debt = {
                ...debtHighInterest,
                interest_rate: 12,
                current_balance: 1000,
            };

            const result = debtPayoffPlanner.simulatePayoff([debt], 0, 'avalanche');
            const month1 = result.projection[0];
            const debtState = month1.debts.find(d => d.id === debt.id)!;

            // monthlyRate = 12 / 100 / 12 = 0.01
            // interest = 1000 * 0.01 = 10
            expect(debtState.interest).toBeCloseTo(10, 2);
        });

        it('zero interest rate: all interest = 0', () => {
            const debt: Debt = {
                ...debtHighInterest,
                interest_rate: 0,
                current_balance: 1000,
                installment_amount: 100,
            };

            const result = debtPayoffPlanner.simulatePayoff([debt], 0, 'avalanche');

            result.projection.forEach(month => {
                const debtState = month.debts.find(d => d.id === debt.id)!;
                expect(debtState.interest).toBe(0);
            });
        });
    });

    // ================================================================
    // Extra Payment Scenarios
    // ================================================================
    describe('Extra payment scenarios', () => {
        it('extra payment > total balance: pays off in 1 month', () => {
            const debt: Debt = {
                ...debtHighInterest,
                interest_rate: 12,
                current_balance: 100,
            };

            const result = debtPayoffPlanner.simulatePayoff([debt], 10000, 'avalanche');

            expect(result.totalMonths).toBe(1);
            expect(result.projection[0].debtsRemaining).toBe(0);
        });

        it('extra payment = 0: takes longer than with extra', () => {
            const debt: Debt = {
                ...debtHighInterest,
                interest_rate: 12,
                current_balance: 1000,
                installment_amount: 100,
            };

            const noExtra = debtPayoffPlanner.simulatePayoff([debt], 0, 'avalanche');
            const withExtra = debtPayoffPlanner.simulatePayoff([debt], 500, 'avalanche');

            expect(noExtra.totalMonths).toBeGreaterThan(withExtra.totalMonths);
        });
    });

    // ================================================================
    // Minimum Payment Logic
    // ================================================================
    describe('Minimum payment logic', () => {
        it('installment_amount set: uses it as minimum payment', () => {
            const debt: Debt = {
                ...debtHighInterest,
                interest_rate: 12,
                current_balance: 1000,
                installment_amount: 200,
            };

            const result = debtPayoffPlanner.simulatePayoff([debt], 0, 'avalanche');
            const debtState = result.projection[0].debts.find(d => d.id === debt.id)!;

            expect(debtState.payment).toBeCloseTo(200, 0);
        });

        it('no installment_amount: uses interest + 3% balance', () => {
            const debt: Debt = {
                ...debtHighInterest,
                interest_rate: 12,
                current_balance: 1000,
            };

            const result = debtPayoffPlanner.simulatePayoff([debt], 0, 'avalanche');
            const debtState = result.projection[0].debts.find(d => d.id === debt.id)!;

            // monthlyRate = 12/100/12 = 0.01, interest = 10
            // min = 10 + 1000 * 0.03 = 40
            expect(debtState.payment).toBeCloseTo(40, 0);
        });
    });

    // ================================================================
    // Edge Cases
    // ================================================================
    describe('Edge cases', () => {
        it('empty debts array: 0 months, empty projection', () => {
            const result = debtPayoffPlanner.simulatePayoff([], 1000, 'avalanche');

            expect(result.totalMonths).toBe(0);
            expect(result.projection).toHaveLength(0);
        });

        it('safety limit: stops at 360 months', () => {
            const debt: Debt = {
                ...debtHighInterest,
                interest_rate: 12,
                current_balance: 10000,
            };
            // No installment_amount → min = interest + 3% balance
            // Balance reduces ~3% per month → 10000 * 0.97^360 ≈ 0.17 > 0.01
            // Should hit the 360-month safety limit

            const result = debtPayoffPlanner.simulatePayoff([debt], 0, 'avalanche');

            expect(result.totalMonths).toBe(360);
        });

        it('debt with balance 0.01: filtered out (not processed)', () => {
            const debt: Debt = {
                ...debtHighInterest,
                current_balance: 0.01,
            };

            const result = debtPayoffPlanner.simulatePayoff([debt], 100, 'avalanche');

            // Balance 0.01 is not > 0.01, so hasDebt() is false → 0 months
            expect(result.totalMonths).toBe(0);
        });
    });

    // ================================================================
    // Projection Shape
    // ================================================================
    describe('Projection shape', () => {
        it('each month has expected properties', () => {
            const result = debtPayoffPlanner.simulatePayoff(
                [debtHighInterest], 1000, 'avalanche'
            );

            const month = result.projection[0];
            expect(month).toHaveProperty('date');
            expect(month).toHaveProperty('monthLabel');
            expect(month).toHaveProperty('totalBalance');
            expect(month).toHaveProperty('totalInterestPaid');
            expect(month).toHaveProperty('totalPrincipalPaid');
            expect(month).toHaveProperty('debtsRemaining');
            expect(month).toHaveProperty('debts');
            expect(month.date).toBeInstanceOf(Date);
        });

        it('debtFreeDate matches payoffDate', () => {
            const result = debtPayoffPlanner.simulatePayoff(
                [debtHighInterest], 1000, 'avalanche'
            );

            expect(result.debtFreeDate.getTime()).toBe(result.payoffDate.getTime());
        });
    });

    // ================================================================
    // Strategy Comparison
    // ================================================================
    it('avalanche has lower or equal total interest than snowball', () => {
        const avalanche = debtPayoffPlanner.simulatePayoff(
            [debtHighInterest, debtLowInterest], 1000, 'avalanche'
        );
        const snowball = debtPayoffPlanner.simulatePayoff(
            [debtHighInterest, debtLowInterest], 1000, 'snowball'
        );

        expect(avalanche.totalInterestPaid).toBeLessThanOrEqual(snowball.totalInterestPaid);
    });
});
