'use client';

import { Suspense, lazy, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { HealthScoreGauge } from './HealthScoreGauge';
import type { DRESummary, DREIndicators } from '../hooks/useDREData';
import type { DREAIAnalysis, DREAnalysisInput } from '../hooks/useDREAIInsights';

const DREAIInsights = lazy(() => import('./DREAIInsights').then(m => ({ default: m.DREAIInsights })));

const TabSkeleton = () => (
  <div className="space-y-4 p-6">
    <div className="h-[200px] w-full bg-muted animate-pulse rounded" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="h-[150px] bg-muted animate-pulse rounded" />
      <div className="h-[150px] bg-muted animate-pulse rounded" />
    </div>
  </div>
);

interface DREAnalysisTabProps {
  aiAnalysis: DREAIAnalysis | null;
  isLoadingAI: boolean;
  summary: DRESummary;
  indicators: DREIndicators;
  companyName?: string;
  fetchAnalysis: (input: DREAnalysisInput) => void;
}

export const DREAnalysisTab = memo(function DREAnalysisTab({
  aiAnalysis,
  isLoadingAI,
  summary,
  indicators,
  companyName,
  fetchAnalysis,
}: DREAnalysisTabProps) {
  const handleRefresh = () => {
    const revenueVariation = summary.previousGrossRevenue !== 0
      ? ((summary.grossRevenue - summary.previousGrossRevenue) / Math.abs(summary.previousGrossRevenue)) * 100
      : 0;
    const resultVariation = summary.previousNetResult !== 0
      ? ((summary.netResult - summary.previousNetResult) / Math.abs(summary.previousNetResult)) * 100
      : 0;

    fetchAnalysis({
      grossRevenue: summary.grossRevenue,
      costs: summary.costs,
      operationalExpenses: summary.operationalExpenses,
      netResult: summary.netResult,
      grossMargin: indicators.grossMargin,
      netMargin: indicators.netMargin,
      ebitda: indicators.ebitda,
      revenueVariation,
      resultVariation,
      companyContext: companyName,
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Health Score - shows first on mobile */}
        <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
          <HealthScoreGauge
            score={aiAnalysis?.healthScore || 50}
            size="lg"
          />
          <Card>
            <CardHeader className="p-3 sm:p-6 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Atualizar Análise
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 sm:h-9"
                onClick={handleRefresh}
                disabled={isLoadingAI}
              >
                {isLoadingAI ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    <span className="text-xs">Analisando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    <span className="text-xs">Gerar Nova Análise</span>
                  </>
                )}
              </Button>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 text-center">
                Powered by AI
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights - shows second on mobile */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <Suspense fallback={<TabSkeleton />}>
            <DREAIInsights analysis={aiAnalysis} isLoading={isLoadingAI} />
          </Suspense>
        </div>
      </div>
    </div>
  );
});
