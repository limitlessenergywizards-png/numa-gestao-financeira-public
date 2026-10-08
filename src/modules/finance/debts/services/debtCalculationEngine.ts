
import { addMonths, getDaysInMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import Decimal from 'decimal.js';
import { money, moneyMax0, moneySub, moneyAdd, moneyMul, moneyDiv, moneyRound, moneyToNumber } from '@/lib/money';

export interface Debt {
    id: string;
    company_id: string;
    name: string;
    description: string | null;
    creditor_name: string;
    creditor_type: string;
    debt_type: string;
    original_amount: number;
    current_balance: number;
    paid_amount: number;
    paid_installments: number;
    status: string;
    interest_rate: number;
    interest_period: 'mensal' | 'anual' | 'diario';
    interest_type: 'simples' | 'composto' | 'price' | 'sac';
    total_installments: number | null;
    installment_amount?: number;
    due_day: number | null;
    contract_date: string | null;
    first_due_date: string | null;
    paid_off_at: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface PaymentSchedule {
    installment_number: number;
    due_date: Date;
    principal: number;
    interest: number;
    total: number;
    balance: number;
}

/**
 * AUDIT FIX: All monetary arithmetic now uses Decimal.js
 * with Banker's Rounding (ROUND_HALF_EVEN) to prevent
 * floating-point drift across payment schedule iterations.
 */
export class DebtCalculationEngine {

    /**
     * Calcula o cronograma completo de pagamentos de uma dívida
     */
    calculatePaymentSchedule(debt: Debt): PaymentSchedule[] {
        // If due_day is null, default to 1
        const dueDay = debt.due_day || 1;

        switch (debt.interest_type) {
            case 'price':
                return this.calculatePriceSchedule(debt, dueDay);
            case 'sac':
                return this.calculateSACSchedule(debt, dueDay);
            case 'composto':
                return this.calculateCompoundInterestSchedule(debt, dueDay);
            case 'simples':
                return this.calculateSimpleInterestSchedule(debt, dueDay);
            default:
                console.warn(`Tipo de juros não suportado: ${debt.interest_type}, usando Price como fallback`);
                return this.calculatePriceSchedule(debt, dueDay);
        }
    }

    /**
     * Sistema Price (Parcelas Fixas)
     * PMT = PV × [i × (1 + i)^n] / [(1 + i)^n - 1]
     */
    private calculatePriceSchedule(debt: Debt, dueDay: number): PaymentSchedule[] {
        const schedule: PaymentSchedule[] = [];
        const monthlyRate = this.convertToMonthlyRate(debt.interest_rate, debt.interest_period);
        const n = debt.total_installments || 12;

        // Calcular valor da parcela (PMT)
        const pmt = debt.installment_amount
            ? money(debt.installment_amount)
            : this.calculatePMT(
                money(debt.current_balance),
                monthlyRate,
                n - debt.paid_installments
            );

        let balance = money(debt.current_balance);
        let currentDate = new Date();

        const remainingInstallments = n - debt.paid_installments;

        for (let i = 1; i <= remainingInstallments; i++) {
            // Juros do período
            const interest = moneyRound(moneyMul(balance, moneyDiv(monthlyRate, 100)));

            // Amortização do principal
            const principal = moneyRound(moneySub(pmt, interest));

            // Novo saldo
            balance = moneyMax0(moneySub(balance, principal));

            // Data de vencimento
            const dueDate = this.calculateDueDate(currentDate, i, dueDay);

            schedule.push({
                installment_number: debt.paid_installments + i,
                due_date: dueDate,
                principal: moneyToNumber(principal),
                interest: moneyToNumber(interest),
                total: moneyToNumber(pmt),
                balance: moneyToNumber(balance),
            });
        }

        return schedule;
    }

    /**
     * Sistema SAC (Amortização Constante)
     * Amortização = Saldo Inicial / Número de Parcelas
     * Juros = Saldo × Taxa
     * Parcela = Amortização + Juros
     */
    private calculateSACSchedule(debt: Debt, dueDay: number): PaymentSchedule[] {
        const schedule: PaymentSchedule[] = [];
        const monthlyRate = this.convertToMonthlyRate(debt.interest_rate, debt.interest_period);
        const n = debt.total_installments || 12;
        const remainingInstallments = n - debt.paid_installments;

        // Amortização constante
        const amortization = moneyRound(moneyDiv(debt.current_balance, remainingInstallments));

        let balance = money(debt.current_balance);
        let currentDate = new Date();

        for (let i = 1; i <= remainingInstallments; i++) {
            // Juros sobre o saldo atual
            const interest = moneyRound(moneyMul(balance, moneyDiv(monthlyRate, 100)));

            // Parcela = Amortização + Juros
            const total = moneyRound(moneyAdd(amortization, interest));

            // Novo saldo
            balance = moneyMax0(moneySub(balance, amortization));

            const dueDate = this.calculateDueDate(currentDate, i, dueDay);

            schedule.push({
                installment_number: debt.paid_installments + i,
                due_date: dueDate,
                principal: moneyToNumber(amortization),
                interest: moneyToNumber(interest),
                total: moneyToNumber(total),
                balance: moneyToNumber(balance),
            });
        }

        return schedule;
    }

    /**
     * Juros Compostos Simples (Ex: Cartão de Crédito)
     * Montante = Principal × (1 + taxa)^período
     */
    private calculateCompoundInterestSchedule(debt: Debt, dueDay: number): PaymentSchedule[] {
        const schedule: PaymentSchedule[] = [];
        const monthlyRate = this.convertToMonthlyRate(debt.interest_rate, debt.interest_period);

        let balance = money(debt.current_balance);
        let currentDate = new Date();

        for (let i = 1; i <= 12; i++) {
            const interest = moneyRound(moneyMul(balance, moneyDiv(monthlyRate, 100)));

            // Pagamento mínimo = juros + pequena amortização (5%)
            const minAmort = moneyRound(moneyMul(balance, new Decimal('0.05')));
            const minimumPayment = moneyRound(moneyAdd(interest, minAmort));
            const principal = minAmort;

            balance = moneyMax0(moneySub(balance, principal));

            const dueDate = this.calculateDueDate(currentDate, i, dueDay);

            schedule.push({
                installment_number: i,
                due_date: dueDate,
                principal: moneyToNumber(principal),
                interest: moneyToNumber(interest),
                total: moneyToNumber(minimumPayment),
                balance: moneyToNumber(balance),
            });
        }

        return schedule;
    }

    private calculateSimpleInterestSchedule(debt: Debt, dueDay: number): PaymentSchedule[] {
        const schedule: PaymentSchedule[] = [];
        const monthlyRate = this.convertToMonthlyRate(debt.interest_rate, debt.interest_period);
        const n = debt.total_installments || 12;
        const remainingInstallments = n - debt.paid_installments;

        let balance = money(debt.current_balance);
        let currentDate = new Date();

        const amortization = moneyRound(moneyDiv(debt.current_balance, remainingInstallments));

        for (let i = 1; i <= remainingInstallments; i++) {
            const interest = moneyRound(moneyMul(balance, moneyDiv(monthlyRate, 100)));
            const total = moneyRound(moneyAdd(amortization, interest));
            balance = moneyMax0(moneySub(balance, amortization));
            const dueDate = this.calculateDueDate(currentDate, i, dueDay);

            schedule.push({
                installment_number: debt.paid_installments + i,
                due_date: dueDate,
                principal: moneyToNumber(amortization),
                interest: moneyToNumber(interest),
                total: moneyToNumber(total),
                balance: moneyToNumber(balance),
            });
        }
        return schedule;
    }

    /**
     * Calcula valor da parcela (PMT) no sistema Price
     * Returns Decimal for precision
     */
    private calculatePMT(pv: Decimal, rate: Decimal, n: number): Decimal {
        if (rate.isZero()) return moneyRound(pv.dividedBy(n));

        const monthlyRate = rate.dividedBy(100);
        const onePlusR = monthlyRate.plus(1);
        const power = onePlusR.pow(n);
        // PMT = PV × [i × (1+i)^n] / [(1+i)^n - 1]
        return moneyRound(pv.times(monthlyRate.times(power)).dividedBy(power.minus(1)));
    }

    /**
     * Converte taxa de juros para mensal (returns Decimal)
     */
    convertToMonthlyRate(rate: number, period: string): Decimal {
        const r = money(rate);
        switch (period) {
            case 'mensal':
                return r;
            case 'anual':
                // (1 + r/100)^(1/12) - 1, then *100
                return r.dividedBy(100).plus(1).pow(new Decimal(1).dividedBy(12)).minus(1).times(100);
            case 'diario':
                // (1 + r/100)^30 - 1, then *100
                return r.dividedBy(100).plus(1).pow(30).minus(1).times(100);
            default:
                return r;
        }
    }

    /**
     * Calcula data de vencimento baseada no dia preferido
     */
    private calculateDueDate(startDate: Date, monthsAhead: number, preferredDay: number): Date {
        const date = addMonths(startDate, monthsAhead);

        // Ajustar para o dia preferido
        const lastDayOfMonth = getDaysInMonth(date);
        const targetDay = Math.min(preferredDay, lastDayOfMonth);

        date.setDate(targetDay);
        return date;
    }

    /**
     * Calcula prioridade de pagamento (0-100)
     * Quanto maior o score, mais urgente é pagar
     */
    calculatePriorityScore(debt: Debt): number {
        let score = 0;

        // 1. Taxa de juros (0-40 pontos)
        const monthlyRate = moneyToNumber(this.convertToMonthlyRate(debt.interest_rate, debt.interest_period));
        if (monthlyRate >= 10) {
            score += 40;
        } else if (monthlyRate >= 5) {
            score += 30;
        } else if (monthlyRate >= 2) {
            score += 20;
        } else if (monthlyRate >= 1) {
            score += 10;
        }

        // 2. Status de atraso (0-30 pontos)
        if (debt.status === 'overdue') {
            score += 30;
        }

        // 3. Debt Type Urgency
        if (debt.debt_type === 'cartao_credito_rotativo' || debt.debt_type === 'cheque_especial') {
            score += 20;
        }

        return Math.min(100, score);
    }

    /**
     * Simula quitação antecipada
     */
    simulateEarlyPayoff(
        debt: Debt,
        payoffDate: Date,
        discountPercentage: number = 0
    ): {
        currentBalance: number;
        interestToDate: number;
        discountAmount: number;
        finalPayoff: number;
        interestSaved: number;
    } {
        const schedule = this.calculatePaymentSchedule(debt);

        const currentBalance = money(debt.current_balance);

        // Total interest if we continue to pay according to schedule
        const totalFutureInterest = schedule.reduce(
            (sum, s) => moneyAdd(sum, s.interest),
            money(0)
        );

        // Aplicar desconto
        const discountAmount = moneyRound(moneyMul(currentBalance, moneyDiv(discountPercentage, 100)));
        const finalPayoff = moneyRound(moneySub(currentBalance, discountAmount));

        return {
            currentBalance: moneyToNumber(currentBalance),
            interestToDate: 0, // Simplified
            discountAmount: moneyToNumber(discountAmount),
            finalPayoff: moneyToNumber(finalPayoff),
            interestSaved: moneyToNumber(moneyAdd(totalFutureInterest, discountAmount)),
        };
    }

    /**
     * Atualiza saldo devedor e recalcula métricas
     */
    async updateDebtBalance(debtId: string, paymentAmount: number): Promise<void> {
        // Buscar dívida
        const { data: debt, error } = await supabase
            .from('debts')
            .select('id, company_id, name, description, creditor_name, creditor_type, debt_type, original_amount, current_balance, paid_amount, paid_installments, status, interest_rate, interest_period, interest_type, total_installments, installment_amount, due_day, contract_date, first_due_date, paid_off_at, priority_score, created_at, updated_at')
            .eq('id', debtId)
            .single();

        if (error || !debt) throw new Error('Dívida não encontrada');

        // Calcular novo saldo com precisão
        const newBalance = moneyToNumber(moneyMax0(moneySub(debt.current_balance, paymentAmount)));
        const paidAmount = moneyToNumber(moneyAdd(debt.paid_amount || 0, paymentAmount));

        // Incrementar parcelas pagas
        const paidInstallments = (debt.paid_installments || 0) + 1;

        // Verificar se quitou
        const status = newBalance === 0 ? 'paid_off' : debt.status;

        // Atualizar
        await supabase
            .from('debts')
            .update({
                current_balance: newBalance,
                paid_amount: paidAmount,
                paid_installments: paidInstallments,
                status: status,
                paid_off_at: status === 'paid_off' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', debtId);
    }
}

export const debtCalculationEngine = new DebtCalculationEngine();
