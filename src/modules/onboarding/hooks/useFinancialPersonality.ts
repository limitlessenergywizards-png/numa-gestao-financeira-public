'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { ARCHETYPES, analyzeStrengths, analyzeGrowthAreas } from '@/modules/onboarding/services/personalityAnalyzer';
import { getLevelFromXP } from '@/modules/onboarding/services/achievementDefinitions';
import type { Json } from '@/integrations/supabase/types';

interface FinancialPersonality {
  id: string;
  archetype: string;
  archetype_score: Record<string, number>;
  quiz_answers: { questionId: string; optionIndex: number }[];
  strengths: string[];
  growth_areas: string[];
  last_analysis_at: string | null;
}

interface UserProgress {
  level: number;
  title: string;
  totalXP: number;
  progress: number;
  nextLevelXP: number;
}

export function useFinancialPersonality() {
  const { user } = useAuth();
  const { currentCompany: selectedCompany } = useCompany();
  const [personality, setPersonality] = useState<FinancialPersonality | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonality = useCallback(async () => {
    if (!user?.id || !selectedCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch personality
      const { data: personalityData, error: personalityError } = await supabase
        .from('financial_personality')
        .select('id, user_id, company_id, archetype, archetype_score, quiz_answers, strengths, growth_areas, last_analysis_at, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('company_id', selectedCompany.id)
        .maybeSingle();

      if (personalityError) throw personalityError;

      if (personalityData) {
        setPersonality({
          id: personalityData.id,
          archetype: personalityData.archetype,
          archetype_score: (personalityData.archetype_score as Record<string, number>) || {},
          quiz_answers: (personalityData.quiz_answers as { questionId: string; optionIndex: number }[]) || [],
          strengths: personalityData.strengths || [],
          growth_areas: personalityData.growth_areas || [],
          last_analysis_at: personalityData.last_analysis_at
        });
      }

      // Fetch user progress
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_xp, guardian_level, current_title')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        const levelInfo = getLevelFromXP(profileData.total_xp || 0);
        setUserProgress({
          level: levelInfo.level,
          title: levelInfo.title,
          totalXP: profileData.total_xp || 0,
          progress: levelInfo.progress,
          nextLevelXP: levelInfo.nextLevelXP
        });
      }

    } catch (err) {
      console.error('Error fetching personality:', err);
      setError('Erro ao carregar personalidade financeira');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedCompany?.id]);

  useEffect(() => {
    fetchPersonality();
  }, [fetchPersonality]);

  const saveQuizResults = async (
    archetypeId: string,
    scores: Record<string, number>,
    answers: { questionId: string; optionIndex: number }[]
  ) => {
    if (!user?.id || !selectedCompany?.id) return;

    const strengths = analyzeStrengths(archetypeId);
    const growthAreas = analyzeGrowthAreas(archetypeId);

    try {
      const { data, error } = await supabase
        .from('financial_personality')
        .upsert({
          user_id: user.id,
          company_id: selectedCompany.id,
          archetype: archetypeId,
          archetype_score: scores as unknown as Json,
          quiz_answers: answers as unknown as Json,
          strengths,
          growth_areas: growthAreas,
          last_analysis_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,company_id'
        })
        .select()
        .single();

      if (error) throw error;

      // Award XP for completing quiz
      await addXP(50, 'Completou o quiz de descoberta do arquétipo');

      setPersonality({
        id: data.id,
        archetype: data.archetype,
        archetype_score: scores,
        quiz_answers: answers,
        strengths,
        growth_areas: growthAreas,
        last_analysis_at: data.last_analysis_at
      });

      return data;
    } catch (err) {
      console.error('Error saving quiz results:', err);
      throw err;
    }
  };

  const addXP = async (amount: number, reason: string) => {
    if (!user?.id || !selectedCompany?.id) return;

    try {
      // Get current XP
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp, guardian_level')
        .eq('user_id', user.id)
        .single();

      const currentXP = profile?.total_xp || 0;
      const newXP = currentXP + amount;
      const newLevelInfo = getLevelFromXP(newXP);

      // Update profile
      await supabase
        .from('profiles')
        .update({
          total_xp: newXP,
          guardian_level: newLevelInfo.level,
          current_title: newLevelInfo.title
        })
        .eq('user_id', user.id);

      // Create milestone if leveled up
      if (newLevelInfo.level > (profile?.guardian_level || 1)) {
        await supabase
          .from('journey_milestones')
          .insert({
            user_id: user.id,
            company_id: selectedCompany.id,
            milestone_type: 'level_up',
            title: `Alcançou Nível ${newLevelInfo.level}`,
            description: `Você agora é um ${newLevelInfo.title}!`,
            narrative: `Com dedicação e foco, você ascendeu a um novo patamar em sua jornada financeira. O título de "${newLevelInfo.title}" agora é seu por direito.`,
            icon: '⬆️',
            xp_earned: amount
          });
      }

      // Update local state
      setUserProgress({
        level: newLevelInfo.level,
        title: newLevelInfo.title,
        totalXP: newXP,
        progress: newLevelInfo.progress,
        nextLevelXP: newLevelInfo.nextLevelXP
      });

    } catch (err) {
      console.error('Error adding XP:', err);
    }
  };

  const getArchetypeInfo = () => {
    if (!personality?.archetype) return null;
    return ARCHETYPES[personality.archetype];
  };

  return {
    personality,
    userProgress,
    loading,
    error,
    saveQuizResults,
    addXP,
    getArchetypeInfo,
    hasCompletedQuiz: !!personality?.archetype && personality.quiz_answers.length > 0,
    refetch: fetchPersonality
  };
}
