import { supabase } from "@/integrations/supabase/client";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { money, moneyAdd, moneySub, moneyMul, moneyDiv, moneyToNumber } from "@/lib/money";

export interface BreakEvenComponents {
    totalRevenue: number;
    fixedCosts: number;
    variableCosts: number;
    variableCostPercentage: number;
}

export interface BreakEvenResult {
    breakEvenPoint: number; // Em reais
    contributionMargin: number;
    contributionMarginPercentage: number;
    netProfit: number;
    netMarginPercentage: number;
    safetyMargin: number;
    safetyMarginPercentage: number;
    revenueAboveBreakeven: number;
    breakevenCoveragePercentage: number;
}

class BreakEvenEngine {

    /**
     * Calcula o ponto de equilíbrio e indicadores relacionados
     */
    calculateBreakEven(components: BreakEvenComponents): BreakEvenResult {
        const {
            totalRevenue,
            fixedCosts,
            variableCosts,
            variableCostPercentage
        } = components;

        // 1. Margem de Contribuição
        const contributionMargin = totalRevenue - variableCosts;
        const contributionMarginPercentage = totalRevenue > 0
            ? (contributionMargin / totalRevenue) * 100
            : 0;

        // 2. Ponto de Equilíbrio
        // PE = Custos Fixos / (Margem de Contribuição %)
        // Avoid division by zero
        const breakEvenPoint = contributionMarginPercentage > 0
            ? fixedCosts / (contributionMarginPercentage / 100)
            : 0; // Or infinity? 0 is safer for UI.

        // 3. Lucro Líquido
        const netProfit = contributionMargin - fixedCosts;
        const netMarginPercentage = totalRevenue > 0
            ? (netProfit / totalRevenue) * 100
            : 0;

        // 4. Margem de Segurança
        const safetyMargin = totalRevenue - breakEvenPoint;
        const safetyMarginPercentage = totalRevenue > 0
            ? (safetyMargin / totalRevenue) * 100
            : 0;

        // 5. Receita acima do PE
        const revenueAboveBreakeven = Math.max(0, totalRevenue - breakEvenPoint);

        // 6. Cobertura do PE
        const breakevenCoveragePercentage = breakEvenPoint > 0
            ? (totalRevenue / breakEvenPoint) * 100
            : 0;

        return {
            breakEvenPoint,
            contributionMargin,
            contributionMarginPercentage,
            netProfit,
            netMarginPercentage,
            safetyMargin,
            safetyMarginPercentage,
            revenueAboveBreakeven,
            breakevenCoveragePercentage
        };
    }

    /**
     * Coleta dados do mês para cálculo
     */
    async collectMonthlyData(
        companyId: string,
        referenceMonth: Date
    ): Promise<BreakEvenComponents> {
        const start = startOfMonth(referenceMonth).toISOString();
        const end = endOfMonth(referenceMonth).toISOString();

        // 1. Buscar todas as transações do mês (apenas realizadas)
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select(`
        *,
        category:categories(
            cost_type,
            variable_percentage,
            name
        )
      `)
            .eq('company_id', companyId)
            .eq('is_deleted', false)
            .eq('nature', 'realizado') // Apenas lançamentos reais
            .gte('transaction_date', start)
            .lte('transaction_date', end);

        if (error) throw error;

        // 2. Calcular receita total (usando Decimal para precisão)
        let revenueAcc = money(0);
        for (const t of transactions?.filter(t => t.type === 'entrada') || []) {
            revenueAcc = moneyAdd(revenueAcc, t.amount);
        }
        const totalRevenue = moneyToNumber(revenueAcc);

        // 3. Separar custos fixos e variáveis (usando Decimal)
        const expenses = transactions?.filter(t => t.type === 'saida') || [];

        let fixedAcc = money(0);
        let variableAcc = money(0);

        for (const expense of expenses) {
            const expenseCategory = (expense as Record<string, any>).category;
            const costType = expenseCategory?.cost_type;
            const variablePercentage = expenseCategory?.variable_percentage || 0;

            const amount = money(expense.amount);

            if (costType === 'fixo') {
                fixedAcc = fixedAcc.plus(amount);
            } else if (costType === 'variavel') {
                variableAcc = variableAcc.plus(amount);
            } else if (costType === 'misto') {
                // Despesa mista: parte fixa, parte variável
                const varPart = moneyMul(amount, moneyDiv(variablePercentage, 100));
                const fixPart = moneySub(amount, varPart);
                variableAcc = variableAcc.plus(varPart);
                fixedAcc = fixedAcc.plus(fixPart);
            } else {
                // Se não classificado, considera como fixo (conservador)
                fixedAcc = fixedAcc.plus(amount);
            }
        }

        const fixedCosts = moneyToNumber(fixedAcc);
        const variableCosts = moneyToNumber(variableAcc);

        // 4. Calcular % de custo variável sobre receita
        const calculatedVariableCostPercentage = totalRevenue > 0
            ? moneyToNumber(moneyDiv(moneyMul(variableCosts, 100), totalRevenue), 2)
            : 0;

        return {
            totalRevenue,
            fixedCosts,
            variableCosts,
            variableCostPercentage: calculatedVariableCostPercentage
        };
    }

    /**
     * Calcula score de saúde financeira (0-100)
     */
    calculateHealthScore(result: BreakEvenResult): number {
        let score = 0;

        // 1. Lucro (40 pontos)
        if (result.netMarginPercentage >= 20) {
            score += 40;
        } else if (result.netMarginPercentage >= 10) {
            score += 30;
        } else if (result.netMarginPercentage >= 5) {
            score += 20;
        } else if (result.netMarginPercentage > 0) {
            score += 10;
        }

        // 2. Margem de Segurança (30 pontos)
        if (result.safetyMarginPercentage >= 30) {
            score += 30;
        } else if (result.safetyMarginPercentage >= 20) {
            score += 25;
        } else if (result.safetyMarginPercentage >= 10) {
            score += 15;
        } else if (result.safetyMarginPercentage > 0) {
            score += 5;
        }

        // 3. Margem de Contribuição (30 pontos)
        if (result.contributionMarginPercentage >= 50) {
            score += 30;
        } else if (result.contributionMarginPercentage >= 40) {
            score += 25;
        } else if (result.contributionMarginPercentage >= 30) {
            score += 20;
        } else if (result.contributionMarginPercentage >= 20) {
            score += 10;
        }

        return Math.min(100, Math.max(0, score));
    }

    /**
     * Determina status de saúde baseado no score
     */
    getHealthStatus(score: number): "excelente" | "saudavel" | "estavel" | "atencao" | "critico" {
        if (score >= 80) return 'excelente';
        if (score >= 60) return 'saudavel';
        if (score >= 40) return 'estavel';
        if (score >= 20) return 'atencao';
        return 'critico';
    }

    /**
     * Gera snapshot mensal completo
     */
    async generateMonthlySnapshot(
        companyId: string,
        referenceMonth: Date
    ): Promise<void> {

        // 1. Coletar dados
        const components = await this.collectMonthlyData(companyId, referenceMonth);

        // 2. Calcular indicadores
        const result = this.calculateBreakEven(components);

        // 3. Calcular score de saúde
        const healthScore = this.calculateHealthScore(result);
        const healthStatus = this.getHealthStatus(healthScore);

        // 4. Buscar snapshot do mês anterior para comparação
        const previousMonth = subMonths(referenceMonth, 1);
        const { data: previousSnapshot } = await supabase
            .from('financial_health_snapshots')
            .select('id, company_id, reference_month, total_revenue, fixed_costs, variable_costs, contribution_margin, contribution_margin_percentage, gross_margin, gross_margin_percentage, net_profit, net_margin_percentage, break_even_point, break_even_units, safety_margin, safety_margin_percentage, variable_cost_percentage, revenue_above_breakeven, breakeven_coverage_percentage, health_score, health_status, revenue_growth_percentage, cost_growth_percentage, profit_growth_percentage, calculated_at')
            .eq('company_id', companyId)
            .eq('reference_month', startOfMonth(previousMonth).toISOString())
            .single();

        // 5. Calcular crescimento
        const revenueGrowth = previousSnapshot
            ? ((components.totalRevenue - previousSnapshot.total_revenue) / previousSnapshot.total_revenue) * 100
            : 0;

        const totalCosts = components.fixedCosts + components.variableCosts;
        const previousTotalCosts = previousSnapshot
            ? previousSnapshot.fixed_costs + previousSnapshot.variable_costs
            : 0;
        const costGrowth = previousSnapshot && previousTotalCosts > 0
            ? ((totalCosts - previousTotalCosts) / previousTotalCosts) * 100
            : 0;

        const profitGrowth = previousSnapshot && previousSnapshot.net_profit !== 0
            ? ((result.netProfit - previousSnapshot.net_profit) / Math.abs(previousSnapshot.net_profit)) * 100
            : 0;

        // 6. Coletar breakdown de custos por categoria (Omitted for MVP brevity, can be added later)
        // For now we will allow NULL in the DB for breakdowns or pass empty arrays if needed.
        // The DB allows nullable JSONB.

        // 7. Salvar snapshot
        const payload = {
            company_id: companyId,
            reference_month: startOfMonth(referenceMonth).toISOString(),

            // Componentes
            total_revenue: components.totalRevenue,
            fixed_costs: components.fixedCosts,
            variable_costs: components.variableCosts,
            variable_cost_percentage: components.variableCostPercentage,

            // Resultados
            contribution_margin: result.contributionMargin,
            contribution_margin_percentage: result.contributionMarginPercentage,
            break_even_point: result.breakEvenPoint,

            gross_margin: result.contributionMargin,
            gross_margin_percentage: result.contributionMarginPercentage,
            net_profit: result.netProfit,
            net_margin_percentage: result.netMarginPercentage,

            revenue_above_breakeven: result.revenueAboveBreakeven,
            breakeven_coverage_percentage: result.breakevenCoveragePercentage,
            safety_margin: result.safetyMargin,
            safety_margin_percentage: result.safetyMarginPercentage,

            // Saúde
            health_score: healthScore,
            health_status: healthStatus,

            // Comparação
            revenue_growth_percentage: revenueGrowth,
            cost_growth_percentage: costGrowth,
            profit_growth_percentage: profitGrowth,

            calculated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('financial_health_snapshots')
            .upsert(payload, {
                onConflict: 'company_id,reference_month'
            });

        if (error) throw error;
    }
}

export const breakEvenEngine = new BreakEvenEngine();
