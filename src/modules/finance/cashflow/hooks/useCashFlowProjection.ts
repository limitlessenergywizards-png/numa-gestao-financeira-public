'use client';

import { useState, useCallback } from 'react';
import { callEdgeFunction } from '@/lib/supabase/edge-functions';
import { EDGE_FUNCTIONS } from '@/lib/api-endpoints';

export interface HistoricalData {
  weekNumber: number;
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface CategoryData {
  code: string;
  name: string;
  type: 'entrada' | 'saida';
  values: number[];
}

export interface WeeklyProjection {
  weekNumber: number;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

export interface CategoryProjection {
  code: string;
  values: number[];
}

export interface ProjectionScenario {
  name: string;
  description: string;
  multiplier: number;
  weeklyProjections: WeeklyProjection[];
  categoriesProjection: CategoryProjection[];
  totalEntradas: number;
  totalSaidas: number;
  finalBalance: number;
}

export interface ProjectionResult {
  scenarios: {
    optimistic: ProjectionScenario;
    realistic: ProjectionScenario;
    pessimistic: ProjectionScenario;
  };
  seasonalityInsights: string[];
  riskFactors: string[];
  opportunities: string[];
  confidence: number;
  analysisNarrative: string;
}

export type ScenarioType = 'optimistic' | 'realistic' | 'pessimistic';

// Local calculation methods (fallback)
function weightedMovingAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const weights = values.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * weights[i];
  }
  return totalWeight > 0 ? sum / totalWeight : 0;
}

function linearRegression(values: number[]): (x: number) => number {
  const n = values.length;
  if (n < 2) return () => values[0] || 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  values.forEach((y, x) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return () => values[n - 1];

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return (x: number) => Math.max(0, slope * x + intercept);
}

function gradientBoostingProject(values: number[], periodsAhead: number): number {
  if (values.length < 3) return values[values.length - 1] || 0;

  const wma = weightedMovingAverage(values.slice(-6));
  const lr = linearRegression(values);
  const trendValue = lr(values.length + periodsAhead - 1);
  const recentDiff = values.length >= 2
    ? values[values.length - 1] - values[values.length - 2]
    : 0;
  const momentumValue = (values[values.length - 1] || 0) + recentDiff * periodsAhead * 0.5;

  return Math.max(0, wma * 0.4 + trendValue * 0.35 + momentumValue * 0.25);
}

export function useCashFlowProjection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectionResult | null>(null);

  const generateLocalProjection = useCallback((
    historicalData: HistoricalData[],
    categories: CategoryData[],
    projectionWeeks: number,
    currentBalance: number
  ): ProjectionResult => {
    const buildScenario = (
      name: string,
      description: string,
      multiplier: number,
      adjustType: 'entrada' | 'saida' | 'both'
    ): ProjectionScenario => {
      const categoriesProjection: CategoryProjection[] = [];
      let totalEntradas = 0;
      let totalSaidas = 0;

      categories.forEach(cat => {
        const projectedValues: number[] = [];
        for (let i = 1; i <= projectionWeeks; i++) {
          let base = gradientBoostingProject(cat.values, i);

          if (adjustType === 'both' || cat.type === adjustType) {
            base *= multiplier;
          } else if (adjustType === 'entrada' && cat.type === 'saida') {
            base *= (2 - multiplier); // Reduce expenses for optimistic
          } else if (adjustType === 'saida' && cat.type === 'entrada') {
            base *= (2 - multiplier); // Reduce income for pessimistic
          }

          projectedValues.push(base);
        }

        categoriesProjection.push({ code: cat.code, values: projectedValues });
        const sum = projectedValues.reduce((a, b) => a + b, 0);
        if (cat.type === 'entrada') totalEntradas += sum;
        else totalSaidas += sum;
      });

      const lastWeekNumber = historicalData.length > 0
        ? Math.max(...historicalData.map(h => h.weekNumber))
        : 0;

      const weeklyProjections: WeeklyProjection[] = [];
      let runningBalance = currentBalance;

      for (let i = 0; i < projectionWeeks; i++) {
        let weekEntradas = 0;
        let weekSaidas = 0;

        categoriesProjection.forEach((cp, catIndex) => {
          const cat = categories[catIndex];
          if (cat.type === 'entrada') weekEntradas += cp.values[i] || 0;
          else weekSaidas += cp.values[i] || 0;
        });

        const saldo = weekEntradas - weekSaidas;
        runningBalance += saldo;

        weeklyProjections.push({
          weekNumber: lastWeekNumber + i + 1,
          entradas: weekEntradas,
          saidas: weekSaidas,
          saldo,
          saldoAcumulado: runningBalance
        });
      }

      return {
        name,
        description,
        multiplier,
        weeklyProjections,
        categoriesProjection,
        totalEntradas,
        totalSaidas,
        finalBalance: runningBalance
      };
    };

    return {
      scenarios: {
        optimistic: buildScenario("Otimista", "Crescimento de receitas e controle de custos", 1.18, 'entrada'),
        realistic: buildScenario("Realista", "Baseado na tendência atual", 1.0, 'both'),
        pessimistic: buildScenario("Pessimista", "Redução de receitas e aumento de custos", 0.82, 'entrada')
      },
      seasonalityInsights: ["Projeção calculada localmente sem análise de IA"],
      riskFactors: ["Volatilidade histórica pode afetar precisão"],
      opportunities: ["Tendência estável identificada nos dados"],
      confidence: 60,
      analysisNarrative: "Projeção gerada com métodos estatísticos locais (regressão linear + média móvel ponderada)."
    };
  }, []);

  const generateProjection = useCallback(async (
    historicalData: HistoricalData[],
    categories: CategoryData[],
    projectionWeeks: number,
    currentBalance: number,
    companyContext?: string
  ): Promise<ProjectionResult> => {
    setLoading(true);
    setError(null);

    try {
      const data = await callEdgeFunction<ProjectionResult>(EDGE_FUNCTIONS.ANALYZE_CASHFLOW_PROJECTION, {
        body: {
          historicalData,
          categories,
          projectionWeeks,
          currentBalance,
          companyContext
        },
        fallbackMessage: 'Erro ao gerar projeção de fluxo de caixa',
      });

      setResult(data);
      return data;
    } catch (err) {
      console.error('AI projection failed, using local fallback:', err);
      setError(err instanceof Error ? err.message : 'Erro genérico ao gerar projeção. Redefinindo para o fallback local.');

      // Use local calculation as fallback
      const localResult = generateLocalProjection(historicalData, categories, projectionWeeks, currentBalance);
      setResult(localResult);
      return localResult;
    } finally {
      setLoading(false);
    }
  }, [generateLocalProjection]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    generateProjection,
    generateLocalProjection,
    loading,
    error,
    result,
    reset
  };
}
