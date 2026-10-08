'use client';

import { useState, useCallback } from "react";
import { callEdgeFunction } from "@/lib/supabase/edge-functions";
import { EDGE_FUNCTIONS } from "@/lib/api-endpoints";
import { DRESummary, DREIndicators } from "./useDREData";

export interface AIAlert {
  type: "warning" | "danger";
  message: string;
}

export interface AIRecommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface DREAIAnalysis {
  insight: string;
  alerts: AIAlert[];
  recommendations: AIRecommendation[];
  healthScore: number;
  summary?: string;
}

interface UseDREAIInsightsReturn {
  analysis: DREAIAnalysis | null;
  isLoading: boolean;
  error: string | null;
  fetchAnalysis: (dreData: DREAnalysisInput) => Promise<void>;
}

export interface DREAnalysisInput {
  grossRevenue: number;
  costs: number;
  operationalExpenses: number;
  netResult: number;
  grossMargin: number;
  netMargin: number;
  ebitda: number;
  revenueVariation: number;
  resultVariation: number;
  companyContext?: string;
}

// Fallback analysis when AI is unavailable
function generateFallbackAnalysis(data: DREAnalysisInput): DREAIAnalysis {
  const alerts: AIAlert[] = [];
  const recommendations: AIRecommendation[] = [];

  // Generate alerts based on data
  if (data.netMargin < 5) {
    alerts.push({
      type: "danger",
      message: "Margem líquida abaixo de 5% - situação crítica",
    });
  } else if (data.netMargin < 10) {
    alerts.push({
      type: "warning",
      message: "Margem líquida abaixo de 10% - atenção necessária",
    });
  }

  if (data.resultVariation < -10) {
    alerts.push({
      type: "danger",
      message: `Resultado caiu ${Math.abs(data.resultVariation).toFixed(1)}% em relação ao período anterior`,
    });
  }

  if (data.costs / data.grossRevenue > 0.6) {
    alerts.push({
      type: "warning",
      message: "Custos representam mais de 60% da receita",
    });
  }

  // Generate recommendations
  if (data.grossMargin < 30) {
    recommendations.push({
      title: "Revisar precificação",
      description: "A margem bruta está baixa. Considere revisar os preços ou negociar melhores condições com fornecedores.",
      priority: "high",
    });
  }

  if (data.operationalExpenses / data.grossRevenue > 0.3) {
    recommendations.push({
      title: "Otimizar despesas operacionais",
      description: "As despesas operacionais estão altas em relação à receita. Identifique oportunidades de redução.",
      priority: "medium",
    });
  }

  recommendations.push({
    title: "Monitorar fluxo de caixa",
    description: "Mantenha acompanhamento regular do fluxo de caixa para antecipar necessidades de capital.",
    priority: "low",
  });

  // Calculate health score
  let healthScore = 50;
  if (data.netMargin > 15) healthScore += 20;
  else if (data.netMargin > 10) healthScore += 10;
  else if (data.netMargin < 5) healthScore -= 15;

  if (data.grossMargin > 40) healthScore += 15;
  else if (data.grossMargin < 25) healthScore -= 10;

  if (data.resultVariation > 10) healthScore += 10;
  else if (data.resultVariation < -10) healthScore -= 15;

  healthScore = Math.max(0, Math.min(100, healthScore));

  // Generate insight
  const status = healthScore >= 70 ? "saudável" : healthScore >= 50 ? "estável" : "atenção";
  const trend = data.resultVariation > 0 ? "crescimento" : data.resultVariation < 0 ? "queda" : "estabilidade";

  const insight = `A empresa apresenta situação ${status} com margem líquida de ${data.netMargin.toFixed(1)}%. ` +
    `O período mostra ${trend} de ${Math.abs(data.resultVariation).toFixed(1)}% no resultado. ` +
    `${data.grossMargin > 35 ? "A margem bruta está em bom patamar." : "Há oportunidade de melhoria na margem bruta."}`;

  return {
    insight,
    alerts,
    recommendations,
    healthScore,
  };
}

export function useDREAIInsights(): UseDREAIInsightsReturn {
  const [analysis, setAnalysis] = useState<DREAIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async (dreData: DREAnalysisInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await callEdgeFunction<DREAIAnalysis & { fallback?: boolean; reference?: string }>(
        EDGE_FUNCTIONS.ANALYZE_DRE,
        {
          body: {
            dreData: {
              grossRevenue: dreData.grossRevenue,
              costs: dreData.costs,
              operationalExpenses: dreData.operationalExpenses,
              netResult: dreData.netResult,
              grossMargin: dreData.grossMargin,
              netMargin: dreData.netMargin,
              ebitda: dreData.ebitda,
              revenueVariation: dreData.revenueVariation,
              resultVariation: dreData.resultVariation,
            },
            companyContext: dreData.companyContext,
          },
          fallbackMessage: "Erro ao buscar análise de IA do DRE",
        },
      );

      // data.fallback is NOT an error — it means the AI returned a simplified response
      if (data.fallback) {
        setAnalysis(generateFallbackAnalysis(dreData));
        if (data.reference) {
          setError(`Análise simplificada (Ref: ${data.reference})`);
        } else {
          setError("Usando análise simplificada");
        }
      } else {
        setAnalysis(data as DREAIAnalysis);
      }
    } catch (err) {
      console.error("Error fetching AI analysis:", err);
      // Use fallback on error
      setAnalysis(generateFallbackAnalysis(dreData));
      setError("Usando análise simplificada (Sistema Indisponível)");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    analysis,
    isLoading,
    error,
    fetchAnalysis,
  };
}
