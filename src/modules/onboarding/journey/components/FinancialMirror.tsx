'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ARCHETYPES } from '@/modules/onboarding/services/personalityAnalyzer';
import { useAIInsights } from '@/modules/ai-chat/hooks/useAIInsights';
import { getLevelFromXP } from '@/modules/onboarding/services/achievementDefinitions';
import { cn } from '@/lib/utils';

interface FinancialMirrorProps {
  archetype: string | null;
  totalXP?: number;
  className?: string;
}

interface FinancialStats {
  totalReceivables: number;
  totalPayables: number;
  paidReceivables: number;
  paidPayables: number;
  overdueReceivables: number;
  overduePayables: number;
}

export function FinancialMirror({ archetype, totalXP = 0, className }: FinancialMirrorProps) {
  const { user } = useAuth();
  const { currentCompany: selectedCompany } = useCompany();
  const { t } = useLanguage();
  const { generateInsight, loading: aiLoading } = useAIInsights();
  
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string>('');
  const [isAIInsight, setIsAIInsight] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [user?.id, selectedCompany?.id]);

  const fetchStats = async () => {
    if (!user?.id || !selectedCompany?.id) return;

    setLoading(true);
    try {
      // Fetch receivables
      const { data: receivables } = await supabase
        .from('receivables')
        .select('total_amount, paid_amount, status')
        .eq('company_id', selectedCompany.id);

      // Fetch payables
      const { data: payables } = await supabase
        .from('payables')
        .select('total_amount, paid_amount, status')
        .eq('company_id', selectedCompany.id);

      const calcStats: FinancialStats = {
        totalReceivables: receivables?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0,
        totalPayables: payables?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0,
        paidReceivables: receivables?.filter(r => r.status === 'pago').reduce((sum, r) => sum + Number(r.total_amount), 0) || 0,
        paidPayables: payables?.filter(p => p.status === 'pago').reduce((sum, p) => sum + Number(p.total_amount), 0) || 0,
        overdueReceivables: receivables?.filter(r => r.status === 'pendente').length || 0,
        overduePayables: payables?.filter(p => p.status === 'pendente').length || 0
      };

      setStats(calcStats);
      
      // Generate insight - try AI first, fallback to local
      if (archetype) {
        await fetchAIInsight(calcStats);
      } else {
        generateLocalInsight(calcStats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsight = async (statsData: FinancialStats) => {
    if (!archetype) {
      generateLocalInsight(statsData);
      return;
    }

    try {
      const levelInfo = getLevelFromXP(totalXP);
      const aiInsightText = await generateInsight(archetype, statsData, levelInfo.level, totalXP);
      setInsight(aiInsightText);
      setIsAIInsight(true);
    } catch (err) {
      console.error('AI insight failed, using local:', err);
      generateLocalInsight(statsData);
    }
  };

  const generateLocalInsight = (statsData: FinancialStats) => {
    const archetypeInfo = archetype ? ARCHETYPES[archetype] : null;
    const receivableRate = statsData.totalReceivables > 0 
      ? (statsData.paidReceivables / statsData.totalReceivables * 100).toFixed(0)
      : 0;

    let insightText = '';

    if (statsData.overdueReceivables > 0 || statsData.overduePayables > 0) {
      insightText = `Percebo que há ${statsData.overdueReceivables + statsData.overduePayables} título(s) pendentes. `;
      if (archetypeInfo) {
        insightText += `Como ${archetypeInfo.name}, você sabe que atenção aos detalhes é fundamental. `;
      }
      insightText += 'Considere revisar esses itens para manter sua saúde financeira em dia.';
    } else if (Number(receivableRate) >= 80) {
      insightText = `Excelente! Sua taxa de recebimento está em ${receivableRate}%. `;
      if (archetypeInfo) {
        insightText += `Isso reflete sua natureza de ${archetypeInfo.name.toLowerCase()}. `;
      }
      insightText += 'Continue mantendo esse ritmo consistente.';
    } else if (Number(receivableRate) < 50) {
      insightText = `Sua taxa de recebimento está em ${receivableRate}%. `;
      insightText += 'Este pode ser um ponto de atenção. Considere implementar políticas de cobrança mais efetivas.';
    } else {
      insightText = 'Seu fluxo financeiro está equilibrado. ';
      if (archetypeInfo) {
        insightText += `Como ${archetypeInfo.name}, continue aplicando sua sabedoria para manter esse balanço.`;
      }
    }

    setInsight(insightText);
    setIsAIInsight(false);
  };

  const handleRefresh = async () => {
    if (stats && archetype) {
      setLoading(true);
      await fetchAIInsight(stats);
      setLoading(false);
    } else {
      fetchStats();
    }
  };

  if (loading && !stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">🪞 {t('journey.financialMirror')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-violet-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            🪞 {t('journey.financialMirror')}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={aiLoading}
            aria-label="Atualizar espelho financeiro"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.totalReceivables > 0 
                  ? Math.round(stats.paidReceivables / stats.totalReceivables * 100)
                  : 0}%
              </div>
              <div className="text-xs text-muted-foreground">{t('journey.receivingRate')}</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalPayables > 0 
                  ? Math.round(stats.paidPayables / stats.totalPayables * 100)
                  : 0}%
              </div>
              <div className="text-xs text-muted-foreground">{t('journey.paymentRate')}</div>
            </div>
          </div>
        )}

        {/* Insight */}
        <div className="relative p-4 rounded-lg bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-500/20">
          <div className="absolute top-3 right-3 flex items-center gap-1">
            {isAIInsight && (
              <span className="text-[10px] text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded">
                IA
              </span>
            )}
            <Sparkles className="h-4 w-4 text-violet-500 opacity-50" />
          </div>
          
          {aiLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('journey.loadingInsight')}</span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-foreground/90 italic pr-12">
              "{insight}"
            </p>
          )}
        </div>

        {/* Reflection Questions */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            {t('journey.reflectionQuestions')}:
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span>🤔</span>
              <span>O que você pode fazer hoje para melhorar seus números?</span>
            </li>
            <li className="flex items-start gap-2">
              <span>💭</span>
              <span>Quais hábitos financeiros você gostaria de desenvolver?</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
