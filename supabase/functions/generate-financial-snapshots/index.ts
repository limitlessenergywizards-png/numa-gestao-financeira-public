import { startOfMonth, subMonths } from 'https://esm.sh/date-fns@2.30.0'
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { successResponse, errorResponse } from "../_shared/responses.ts";

const log = createLogger("GENERATE-FINANCIAL-SNAPSHOTS");

// Minimal interface for what we need to calculate
interface BreakEvenComponents {
    totalRevenue: number;
    fixedCosts: number;
    variableCosts: number;
    variableCostPercentage: number;
}

Deno.serve(async (req: Request) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // IRON GATE: Scheduled function — only service_role can invoke
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!token || token !== serviceRoleKey) {
        log('Unauthorized attempt to invoke generate-financial-snapshots')
        return errorResponse('Not found', 404, corsHeaders)
    }

    try {
        const supabaseClient = createAdminClient()

        log('Starting monthly financial health snapshot generation...')

        // 1. Determine reference month (previous month)
        const referenceDate = new Date();
        // If running on the 1st of the month, we want the PREVIOUS month's data.
        const lastMonth = subMonths(referenceDate, 1);
        const startOfLastMonth = startOfMonth(lastMonth);

        // 2. Get all active companies
        const { data: companies, error: companiesError } = await supabaseClient
            .from('companies')
            .select('id')
            .eq('status', 'active');

        if (companiesError) throw companiesError;

        let processedCount = 0;
        const errors = [];

        // 3. Process each company
        for (const company of companies) {
            try {
                log(`Processing company ${company.id} for ${startOfLastMonth.toISOString()}`);

                // Invoke the engine logic.
                // Since we can't easily import the TypeScript class from the frontend here,
                // we will replicate the essential logic for the snapshot generation.

                // A. Collect Data
                const { data: transactions, error: txError } = await supabaseClient
                    .from('transactions')
                    .select(`
                    amount,
                    type,
                    category:categories(
                        cost_type,
                        variable_percentage
                    )
                `)
                    .eq('company_id', company.id)
                    .eq('nature', 'realizado')
                    .gte('transaction_date', startOfLastMonth.toISOString())
                    .lt('transaction_date', startOfMonth(referenceDate).toISOString()); // Up to start of current month

                if (txError) throw txError;

                let totalRevenue = 0;
                let fixedCosts = 0;
                let variableCosts = 0;

                // B. Calculate Components
                for (const t of transactions || []) {
                    const amount = Number(t.amount);
                    if (t.type === 'entrada') {
                        totalRevenue += amount;
                    } else if (t.type === 'saida') {
                        // @ts-ignore
                        const costType = t.category?.cost_type;
                        // @ts-ignore
                        const variablePercentage = t.category?.variable_percentage || 0;

                        if (costType === 'fixo') {
                            fixedCosts += amount;
                        } else if (costType === 'variavel') {
                            variableCosts += amount;
                        } else if (costType === 'misto') {
                            variableCosts += amount * (variablePercentage / 100);
                            fixedCosts += amount * (1 - variablePercentage / 100);
                        } else {
                            // Default to fixed if unknown
                            fixedCosts += amount;
                        }
                    }
                }

                const variableCostPercentage = totalRevenue > 0 ? (variableCosts / totalRevenue) * 100 : 0;

                // C. Calculate Indicators
                const contributionMargin = totalRevenue - variableCosts;
                const contributionMarginPercentage = totalRevenue > 0 ? (contributionMargin / totalRevenue) * 100 : 0;

                const breakEvenPoint = contributionMarginPercentage > 0
                    ? fixedCosts / (contributionMarginPercentage / 100)
                    : 0;

                const netProfit = contributionMargin - fixedCosts;
                const netMarginPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

                const safetyMargin = totalRevenue - breakEvenPoint;
                const safetyMarginPercentage = totalRevenue > 0 ? (safetyMargin / totalRevenue) * 100 : 0;

                const revenueAboveBreakeven = Math.max(0, totalRevenue - breakEvenPoint);
                const breakevenCoveragePercentage = breakEvenPoint > 0 ? (totalRevenue / breakEvenPoint) * 100 : 0;

                // Health Score Logic replication
                let score = 0;
                if (netMarginPercentage >= 20) score += 40;
                else if (netMarginPercentage >= 10) score += 30;
                else if (netMarginPercentage >= 5) score += 20;
                else if (netMarginPercentage > 0) score += 10;

                if (safetyMarginPercentage >= 30) score += 30;
                else if (safetyMarginPercentage >= 20) score += 25;
                else if (safetyMarginPercentage >= 10) score += 15;
                else if (safetyMarginPercentage > 0) score += 5;

                if (contributionMarginPercentage >= 50) score += 30;
                else if (contributionMarginPercentage >= 40) score += 25;
                else if (contributionMarginPercentage >= 30) score += 20;
                else if (contributionMarginPercentage >= 20) score += 10;

                score = Math.min(100, Math.max(0, score));

                let healthStatus = 'critico';
                if (score >= 80) healthStatus = 'excelente';
                else if (score >= 60) healthStatus = 'saudavel';
                else if (score >= 40) healthStatus = 'estavel';
                else if (score >= 20) healthStatus = 'atencao';

                // D. Comparison with Previous Month
                // (Skipping for MVP Edge Function brevity to avoid extra DB calls, usually handled by client or refined later)

                // E. Save Snapshot
                const { error: upsertError } = await supabaseClient
                    .from('financial_health_snapshots')
                    .upsert({
                        company_id: company.id,
                        reference_month: startOfLastMonth.toISOString(),
                        total_revenue: totalRevenue,
                        fixed_costs: fixedCosts,
                        variable_costs: variableCosts,
                        variable_cost_percentage: variableCostPercentage,
                        contribution_margin: contributionMargin,
                        contribution_margin_percentage: contributionMarginPercentage,
                        break_even_point: breakEvenPoint,
                        gross_margin: contributionMargin, // simplified
                        gross_margin_percentage: contributionMarginPercentage, // simplified
                        net_profit: netProfit,
                        net_margin_percentage: netMarginPercentage,
                        revenue_above_breakeven: revenueAboveBreakeven,
                        breakeven_coverage_percentage: breakevenCoveragePercentage,
                        safety_margin: safetyMargin,
                        safety_margin_percentage: safetyMarginPercentage,
                        health_score: score,
                        health_status: healthStatus,
                        calculated_at: new Date().toISOString(),
                        calculation_source: 'automatic_job'
                    }, {
                        onConflict: 'company_id,reference_month'
                    });

                if (upsertError) throw upsertError;

                processedCount++;

            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                const logId = crypto.randomUUID();
                log(`Processing error [${logId}] for company ${company.id}`, errorMessage);
                errors.push({ company_id: company.id, error_reference: logId });
            }
        }

        return successResponse({
            success: true,
            processed: processedCount,
            errors: errors
        }, corsHeaders)

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const logId = crypto.randomUUID();
        log(`FATAL ERROR [${logId}]`, errorMessage);

        return errorResponse("Internal Server Error", 500, corsHeaders)
    }
})
