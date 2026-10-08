'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { ACHIEVEMENTS, Achievement } from '@/modules/onboarding/services/achievementDefinitions';

interface UnlockedAchievement {
  achievement_id: string;
  unlocked_at: string;
}

export function useAchievements() {
  const { user } = useAuth();
  const { currentCompany: selectedCompany } = useCompany();
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    if (!user?.id || !selectedCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id)
        .eq('company_id', selectedCompany.id);

      if (error) throw error;

      const ids = new Set(data?.map(a => a.achievement_id) || []);
      setUnlockedIds(ids);

      // Find recently unlocked (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recent = (data || [])
        .filter(a => new Date(a.unlocked_at) > sevenDaysAgo)
        .map(a => ACHIEVEMENTS.find(ach => ach.id === a.achievement_id))
        .filter(Boolean) as Achievement[];

      setRecentlyUnlocked(recent);

    } catch (err) {
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedCompany?.id]);

  const unlockAchievement = async (achievementId: string): Promise<Achievement | null> => {
    if (!user?.id || !selectedCompany?.id) return null;
    if (unlockedIds.has(achievementId)) return null;

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return null;

    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          company_id: selectedCompany.id,
          achievement_id: achievementId
        });

      if (error) {
        if (error.code === '23505') return null; // Already exists
        throw error;
      }

      // Create milestone
      await supabase
        .from('journey_milestones')
        .insert({
          user_id: user.id,
          company_id: selectedCompany.id,
          milestone_type: 'achievement',
          title: achievement.name,
          description: achievement.description,
          narrative: `Uma nova conquista foi desbloqueada: "${achievement.name}". ${achievement.description}`,
          icon: achievement.icon,
          xp_earned: achievement.xpReward
        });

      setUnlockedIds(prev => new Set([...prev, achievementId]));
      setRecentlyUnlocked(prev => [achievement, ...prev]);

      return achievement;

    } catch (err) {
      console.error('Error unlocking achievement:', err);
      return null;
    }
  };

  const checkAchievementConditions = async () => {
    if (!user?.id || !selectedCompany?.id) return [];

    const newlyUnlocked: Achievement[] = [];

    try {
      // Check various conditions
      for (const achievement of ACHIEVEMENTS) {
        if (unlockedIds.has(achievement.id)) continue;

        let conditionMet = false;

        switch (achievement.condition.type) {
          case 'total_transactions': {
            const { count } = await supabase
              .from('transactions')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', selectedCompany.id)
              .eq('is_deleted', false);
            conditionMet = (count || 0) >= achievement.condition.value;
            break;
          }
          case 'revenue_categories': {
            const { data } = await supabase
              .from('transactions')
              .select('chart_account_id')
              .eq('company_id', selectedCompany.id)
              .eq('is_deleted', false)
              .eq('type', 'entrada');
            const uniqueCategories = new Set(data?.map(t => t.chart_account_id).filter(Boolean));
            conditionMet = uniqueCategories.size >= achievement.condition.value;
            break;
          }
          // Add more condition checks as needed
        }

        if (conditionMet) {
          const unlocked = await unlockAchievement(achievement.id);
          if (unlocked) newlyUnlocked.push(unlocked);
        }
      }

    } catch (err) {
      console.error('Error checking achievements:', err);
    }

    return newlyUnlocked;
  };

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const allAchievements = ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlockedIds.has(a.id)
  }));

  const unlockedAchievements = allAchievements.filter(a => a.unlocked);
  const lockedAchievements = allAchievements.filter(a => !a.unlocked);

  return {
    allAchievements,
    unlockedAchievements,
    lockedAchievements,
    recentlyUnlocked,
    loading,
    unlockAchievement,
    checkAchievementConditions,
    refetch: fetchAchievements,
    unlockedCount: unlockedIds.size,
    totalCount: ACHIEVEMENTS.length
  };
}
