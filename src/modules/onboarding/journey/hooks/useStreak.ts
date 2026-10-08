'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  todayLogged: boolean;
}

interface StreakReward {
  days: number;
  bonusXP: number;
  badge?: string;
  label: string;
}

export const STREAK_REWARDS: StreakReward[] = [
  { days: 3, bonusXP: 10, label: '3 dias' },
  { days: 7, bonusXP: 50, badge: '🔥', label: 'Semana de Fogo' },
  { days: 14, bonusXP: 100, badge: '💪', label: '2 Semanas' },
  { days: 30, bonusXP: 200, badge: '⭐', label: 'Mês Dedicado' },
  { days: 60, bonusXP: 400, badge: '🌟', label: '2 Meses' },
  { days: 100, bonusXP: 1000, badge: '🏆', label: 'Centenário' },
  { days: 365, bonusXP: 5000, badge: '👑', label: 'Lenda do Ano' },
];

export function useStreak() {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    todayLogged: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak, last_activity_date')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const todayLogged = profile?.last_activity_date === today;

      setStreakData({
        currentStreak: profile?.current_streak || 0,
        longestStreak: profile?.longest_streak || 0,
        lastActivityDate: profile?.last_activity_date,
        todayLogged,
      });
    } catch (err) {
      console.error('Error fetching streak:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const logActivity = useCallback(async (): Promise<{ streakUpdated: boolean; bonus: number; newStreak: number }> => {
    if (!user?.id || !currentCompany?.id) {
      return { streakUpdated: false, bonus: 0, newStreak: 0 };
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Check if already logged today
      if (streakData.lastActivityDate === today) {
        return { streakUpdated: false, bonus: 0, newStreak: streakData.currentStreak };
      }

      // Calculate new streak
      let newStreak = 1;
      if (streakData.lastActivityDate === yesterday) {
        newStreak = streakData.currentStreak + 1;
      }

      const newLongest = Math.max(newStreak, streakData.longestStreak);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Log daily activity
      await supabase
        .from('daily_activity_log')
        .upsert({
          user_id: user.id,
          company_id: currentCompany.id,
          activity_date: today,
          activities_count: 1,
        }, {
          onConflict: 'user_id,company_id,activity_date',
        });

      // Check for streak bonus
      const reward = STREAK_REWARDS.find(r => r.days === newStreak);
      const bonus = reward?.bonusXP || 0;

      setStreakData({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityDate: today,
        todayLogged: true,
      });

      return { streakUpdated: true, bonus, newStreak };
    } catch (err) {
      console.error('Error logging activity:', err);
      return { streakUpdated: false, bonus: 0, newStreak: streakData.currentStreak };
    }
  }, [user?.id, currentCompany?.id, streakData]);

  const getNextReward = useCallback(() => {
    const nextReward = STREAK_REWARDS.find(r => r.days > streakData.currentStreak);
    if (!nextReward) return null;
    return {
      ...nextReward,
      daysRemaining: nextReward.days - streakData.currentStreak,
    };
  }, [streakData.currentStreak]);

  const getEarnedRewards = useCallback(() => {
    return STREAK_REWARDS.filter(r => r.days <= streakData.longestStreak);
  }, [streakData.longestStreak]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return {
    ...streakData,
    loading,
    logActivity,
    getNextReward,
    getEarnedRewards,
    refetch: fetchStreak,
  };
}
