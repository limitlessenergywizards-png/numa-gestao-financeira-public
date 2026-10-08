'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  target_metric: string;
  target_value: number;
  reward_xp: number;
  reward_badge: string | null;
  starts_at: string;
  ends_at: string;
  // Participant data
  current_value?: number;
  completed_at?: string | null;
  rank?: number;
  joined?: boolean;
}

interface LeaderboardEntry {
  user_id: string;
  company_id: string;
  profile_name?: string;
  current_value: number;
  rank: number;
  completed_at: string | null;
}

export function useWeeklyChallenges() {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (!user?.id || !currentCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch active challenges
      const now = new Date().toISOString();
      const { data: challengesData, error: challengesError } = await supabase
        .from('weekly_challenges')
        .select('id, title, description, challenge_type, target_metric, target_value, reward_xp, reward_badge, starts_at, ends_at, is_active, created_at')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now);

      if (challengesError) throw challengesError;

      if (!challengesData || challengesData.length === 0) {
        setChallenges([]);
        setLoading(false);
        return;
      }

      // Fetch user's participation in these challenges
      const { data: participations, error: partError } = await supabase
        .from('challenge_participants')
        .select('id, challenge_id, user_id, company_id, current_value, completed_at, created_at')
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .in('challenge_id', challengesData.map(c => c.id));

      if (partError) throw partError;

      // Merge data
      const mergedChallenges = challengesData.map(challenge => {
        const participation = participations?.find(p => p.challenge_id === challenge.id);
        return {
          ...challenge,
          target_metric: challenge.target_metric ?? '',
          reward_badge: challenge.reward_badge ?? null,
          current_value: participation?.current_value || 0,
          completed_at: participation?.completed_at || null,
          rank: 0,
          joined: !!participation,
        };
      });

      setChallenges(mergedChallenges);
    } catch (err) {
      console.error('Error fetching challenges:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentCompany?.id]);

  const joinChallenge = async (challengeId: string): Promise<boolean> => {
    if (!user?.id || !currentCompany?.id) return false;

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          company_id: currentCompany.id,
        });

      if (error) {
        if (error.code === '23505') return true; // Already joined
        throw error;
      }

      await fetchChallenges();
      return true;
    } catch (err) {
      console.error('Error joining challenge:', err);
      return false;
    }
  };

  const updateProgress = async (challengeId: string, value: number): Promise<boolean> => {
    if (!user?.id || !currentCompany?.id) return false;

    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return false;

      const isCompleted = value >= challenge.target_value;

      const { error } = await supabase
        .from('challenge_participants')
        .update({
          current_value: value,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id);

      if (error) throw error;

      await fetchChallenges();
      return true;
    } catch (err) {
      console.error('Error updating progress:', err);
      return false;
    }
  };

  const fetchLeaderboard = async (challengeId: string): Promise<LeaderboardEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('user_id, company_id, current_value, rank, completed_at')
        .eq('challenge_id', challengeId)
        .order('current_value', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      return [];
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id || !currentCompany?.id) return;

    const channelName = `challenge-updates-${user.id}-${currentCompany.id}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_participants',
        },
        () => {
          fetchChallenges();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe().then(() => {
        supabase.removeChannel(channel);
      }).catch(() => {
        supabase.removeChannel(channel);
      });
    };
  }, [user?.id, currentCompany?.id, fetchChallenges]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return {
    challenges,
    loading,
    joinChallenge,
    updateProgress,
    fetchLeaderboard,
    refetch: fetchChallenges,
  };
}
