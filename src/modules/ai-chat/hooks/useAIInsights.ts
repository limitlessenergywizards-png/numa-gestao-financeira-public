'use client';

import { useState, useCallback } from 'react';
import { callEdgeFunction } from '@/lib/supabase/edge-functions';
import { EDGE_FUNCTIONS } from '@/lib/api-endpoints';
import { useLanguage } from '@/contexts/LanguageContext';

interface FinancialStats {
  totalReceivables: number;
  totalPayables: number;
  paidReceivables: number;
  paidPayables: number;
  overdueReceivables: number;
  overduePayables: number;
}

interface Milestone {
  title: string;
  type: string;
  xp: number;
}

interface SuggestedMission {
  title: string;
  description: string;
  type: string;
  target: number;
  xp: number;
}

export function useAIInsights() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsight = useCallback(async (
    archetype: string,
    stats: FinancialStats,
    level?: number,
    totalXP?: number
  ): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const data = await callEdgeFunction<{ result?: string; fallback?: string }>(EDGE_FUNCTIONS.ANALYZE_PERSONALITY, {
        body: {
          type: 'insight',
          archetype,
          userData: { stats, level, totalXP },
          language
        },
        fallbackMessage: 'Erro ao gerar insight',
      });

      return data?.result || 'Continue sua jornada financeira com sabedoria.';
    } catch (err) {
      console.error('Error generating insight:', err);
      setError('Erro ao gerar insight');
      return 'Continue monitorando suas finanças para alcançar seus objetivos.';
    } finally {
      setLoading(false);
    }
  }, [language]);

  const generateNarrative = useCallback(async (
    archetype: string,
    milestone: Milestone
  ): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const data = await callEdgeFunction<{ result?: string; fallback?: string }>(EDGE_FUNCTIONS.ANALYZE_PERSONALITY, {
        body: {
          type: 'narrative',
          archetype,
          userData: { milestone },
          language
        },
        fallbackMessage: 'Erro ao gerar narrativa',
      });

      return data?.result || `Parabéns pela conquista: ${milestone.title}!`;
    } catch (err) {
      console.error('Error generating narrative:', err);
      setError('Erro ao gerar narrativa');
      return `Uma nova conquista foi alcançada: ${milestone.title}`;
    } finally {
      setLoading(false);
    }
  }, [language]);

  const suggestMissions = useCallback(async (
    archetype: string,
    stats: FinancialStats,
    level?: number,
    recentActivity?: string
  ): Promise<SuggestedMission[]> => {
    setLoading(true);
    setError(null);

    try {
      const data = await callEdgeFunction<{ result?: SuggestedMission[]; fallback?: SuggestedMission[] }>(EDGE_FUNCTIONS.ANALYZE_PERSONALITY, {
        body: {
          type: 'missions',
          archetype,
          userData: { stats, level, recentActivity },
          language
        },
        fallbackMessage: 'Erro ao sugerir missões',
      });

      return Array.isArray(data?.result) ? data.result : [];
    } catch (err) {
      console.error('Error suggesting missions:', err);
      setError('Erro ao sugerir missões');
      return [];
    } finally {
      setLoading(false);
    }
  }, [language]);

  return {
    generateInsight,
    generateNarrative,
    suggestMissions,
    loading,
    error
  };
}
