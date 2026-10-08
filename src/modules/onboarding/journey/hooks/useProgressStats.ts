'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { startOfWeek, startOfMonth, subDays, format } from 'date-fns';

interface DailyXP {
  date: string;
  xp: number;
}

interface ProgressStats {
  // XP stats
  weeklyXP: number;
  monthlyXP: number;
  totalXP: number;
  dailyXPHistory: DailyXP[];
  
  // Achievement stats
  weeklyAchievements: number;
  monthlyAchievements: number;
  totalAchievements: number;
  
  // Mission stats
  weeklyMissions: number;
  monthlyMissions: number;
  
  // Streak stats
  currentStreak: number;
  longestStreak: number;
  
  // Comparison with goals
  xpGoalProgress: number;
  missionsGoalProgress: number;
}

export function useProgressStats() {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user?.id || !currentCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);
      const thirtyDaysAgo = subDays(now, 30);

      // Fetch profile for XP and streak
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp, current_streak, longest_streak')
        .eq('user_id', user.id)
        .single();

      // Fetch milestones for XP history
      const { data: milestones } = await supabase
        .from('journey_milestones')
        .select('xp_earned, unlocked_at')
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .gte('unlocked_at', thirtyDaysAgo.toISOString())
        .order('unlocked_at', { ascending: true });

      // Fetch achievements
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('unlocked_at')
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id);

      // Fetch completed missions
      const { data: missions } = await supabase
        .from('daily_missions')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .eq('status', 'completed');

      // Calculate daily XP history
      const dailyXPMap = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(now, i), 'yyyy-MM-dd');
        dailyXPMap.set(date, 0);
      }

      milestones?.forEach(m => {
        if (m.unlocked_at && m.xp_earned) {
          const date = format(new Date(m.unlocked_at), 'yyyy-MM-dd');
          if (dailyXPMap.has(date)) {
            dailyXPMap.set(date, (dailyXPMap.get(date) || 0) + m.xp_earned);
          }
        }
      });

      const dailyXPHistory = Array.from(dailyXPMap.entries()).map(([date, xp]) => ({
        date,
        xp,
      }));

      // Calculate weekly/monthly stats
      const weeklyXP = milestones
        ?.filter(m => m.unlocked_at && new Date(m.unlocked_at) >= weekStart)
        .reduce((sum, m) => sum + (m.xp_earned || 0), 0) || 0;

      const monthlyXP = milestones
        ?.filter(m => m.unlocked_at && new Date(m.unlocked_at) >= monthStart)
        .reduce((sum, m) => sum + (m.xp_earned || 0), 0) || 0;

      const weeklyAchievements = achievements
        ?.filter(a => a.unlocked_at && new Date(a.unlocked_at) >= weekStart)
        .length || 0;

      const monthlyAchievements = achievements
        ?.filter(a => a.unlocked_at && new Date(a.unlocked_at) >= monthStart)
        .length || 0;

      const weeklyMissions = missions
        ?.filter(m => m.completed_at && new Date(m.completed_at) >= weekStart)
        .length || 0;

      const monthlyMissions = missions
        ?.filter(m => m.completed_at && new Date(m.completed_at) >= monthStart)
        .length || 0;

      // Goals (configurable, using defaults)
      const weeklyXPGoal = 500;
      const weeklyMissionsGoal = 7;

      setStats({
        weeklyXP,
        monthlyXP,
        totalXP: profile?.total_xp || 0,
        dailyXPHistory,
        weeklyAchievements,
        monthlyAchievements,
        totalAchievements: achievements?.length || 0,
        weeklyMissions,
        monthlyMissions,
        currentStreak: profile?.current_streak || 0,
        longestStreak: profile?.longest_streak || 0,
        xpGoalProgress: Math.min((weeklyXP / weeklyXPGoal) * 100, 100),
        missionsGoalProgress: Math.min((weeklyMissions / weeklyMissionsGoal) * 100, 100),
      });
    } catch (err) {
      console.error('Error fetching progress stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentCompany?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    refetch: fetchStats,
  };
}
