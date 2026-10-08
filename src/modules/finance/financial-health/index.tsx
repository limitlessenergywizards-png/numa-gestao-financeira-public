'use client';

import { Button } from "@/components/ui/button";
import { BreakEvenChart } from "./components/BreakEvenChart";
import { HealthScoreCard } from "./components/HealthScoreCard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startOfMonth } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { breakEvenEngine } from "./services/breakEvenEngine";

export default function FinancialHealth() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [currentDate] = useState(new Date());

    // Fetch current company
    const { data: userCompany } = useQuery({
        queryKey: ["user_company"],
        queryFn: async () => {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) return null;

            const { data } = await supabase
                .from('user_companies')
                .select('company_id')
                .eq('user_id', userData.user.id)
                .eq('is_default', true)
                .single();
            return data;
        }
    });

    // Fetch Snapshot
    const { data: snapshot, isLoading } = useQuery({
        queryKey: ["financial_health_snapshot", userCompany?.company_id, startOfMonth(currentDate).toISOString()],
        enabled: !!userCompany?.company_id,
        queryFn: async () => {
            if (!userCompany?.company_id) return null;

            const { data, error } = await supabase
                .from('financial_health_snapshots')
                .select('id, company_id, reference_month, total_revenue, fixed_costs, variable_costs, contribution_margin, contribution_margin_percentage, gross_margin, gross_margin_percentage, net_profit, net_margin_percentage, break_even_point, break_even_units, safety_margin, safety_margin_percentage, variable_cost_percentage, revenue_above_breakeven, breakeven_coverage_percentage, health_score, health_status, revenue_growth_percentage, cost_growth_percentage, profit_growth_percentage, calculated_at')
                .eq('company_id', userCompany.company_id)
                .eq('reference_month', startOfMonth(currentDate).toISOString())
                .maybeSingle(); // Use maybeSingle to avoid error if not found

            if (error) throw error;
            return data;
        },
    });

    // Recalculate Mutation
    const recalculateMutation = useMutation({
        mutationFn: async () => {
            if (!userCompany?.company_id) throw new Error("Empresa não identificada");
            await breakEvenEngine.generateMonthlySnapshot(userCompany.company_id, currentDate);
        },
        onSuccess: () => {
            toast({ title: "Indicadores atualizados com sucesso!" });
            queryClient.invalidateQueries({ queryKey: ["financial_health_snapshot"] });
        },
        onError: (error) => {
            toast({ title: "Erro ao atualizar indicadores", description: error.message, variant: "destructive" });
        }
    });

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando indicadores...</div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Saúde Financeira</h1>
                    <p className="text-muted-foreground">
                        Indicadores estratégicos e análise de ponto de equilíbrio.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => recalculateMutation.mutate()}
                        disabled={recalculateMutation.isPending}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
                        Recalcular Agora
                    </Button>
                </div>
            </div>

            {!snapshot ? (
                <div className="p-12 text-center border rounded-lg bg-muted/10">
                    <h3 className="text-lg font-semibold mb-2">Nenhum dado calculado para este mês</h3>
                    <p className="text-muted-foreground mb-4">Clique em "Recalcular Agora" para gerar os indicadores baseados nas suas transações.</p>
                    <Button onClick={() => recalculateMutation.mutate()} disabled={recalculateMutation.isPending}>
                        Gerar Indicadores
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Health Score */}
                    <div className="lg:col-span-1">
                        <HealthScoreCard
                            score={snapshot.health_score || 0}
                            status={snapshot.health_status || 'atencao'}
                            metrics={{
                                profitScore: calculateScorePortion(snapshot.net_margin_percentage, 'profit'),
                                safetyScore: calculateScorePortion(snapshot.safety_margin_percentage || 0, 'safety'),
                                contributionScore: calculateScorePortion(snapshot.contribution_margin_percentage, 'contribution')
                            }}
                        />

                        {/* Insights/Alerts could go here */}
                        <div className="mt-6 space-y-4">
                            {(snapshot.health_status === 'critico' || snapshot.health_status === 'atencao') && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                                    <strong>Atenção:</strong> Sua empresa está operando abaixo do potencial ideal. Verifique seus custos fixos.
                                </div>
                            )}
                            {(snapshot.health_status === 'excelente' || snapshot.health_status === 'saudavel') && (
                                <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800">
                                    <strong>Parabéns:</strong> Sua saúde financeira está sólida. É um bom momento para planejar investimentos.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Break Even Chart & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <BreakEvenChart
                            breakEvenPoint={snapshot.break_even_point}
                            fixedCosts={snapshot.fixed_costs}
                            variableCosts={snapshot.variable_costs}
                            totalRevenue={snapshot.total_revenue}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper utility to roughly reverse-engineer the score components for visualization
// Since we don't store individual score components, we re-evaluate logic for UI display only
function calculateScorePortion(percentage: number, type: 'profit' | 'safety' | 'contribution'): number {
    if (type === 'profit') { // Max 40
        if (percentage >= 20) return 40;
        if (percentage >= 10) return 30;
        if (percentage >= 5) return 20;
        if (percentage > 0) return 10;
        return 0;
    }
    if (type === 'safety') { // Max 30
        if (percentage >= 30) return 30;
        if (percentage >= 20) return 25;
        if (percentage >= 10) return 15;
        if (percentage > 0) return 5;
        return 0;
    }
    if (type === 'contribution') { // Max 30
        if (percentage >= 50) return 30;
        if (percentage >= 40) return 25;
        if (percentage >= 30) return 20;
        if (percentage >= 20) return 10;
        return 0;
    }
    return 0;
}
