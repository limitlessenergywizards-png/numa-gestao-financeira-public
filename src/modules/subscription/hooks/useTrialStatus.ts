'use client';

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/modules/subscription/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, addDays, parseISO, startOfDay } from "date-fns";

export type UrgencyLevel = "normal" | "warning" | "danger" | "critical";

export interface TrialStatus {
  isOnTrial: boolean;
  isTrialExpired: boolean;
  daysRemaining: number;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  hasActiveSubscription: boolean;
  urgencyLevel: UrgencyLevel;
  isLoading: boolean;
}

const TRIAL_DURATION_DAYS = 3;

function calculateUrgencyLevel(daysRemaining: number): UrgencyLevel {
  if (daysRemaining <= 0) return "critical";
  if (daysRemaining <= 1) return "danger";
  if (daysRemaining <= 2) return "warning";
  return "normal";
}

export function useTrialStatus(): TrialStatus {
  const { user } = useAuth();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-trial", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("trial_started_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching trial status:", error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const trialStatus = useMemo(() => {
    // If user has active subscription, trial doesn't matter
    if (isSubscribed) {
      return {
        isOnTrial: false,
        isTrialExpired: false,
        daysRemaining: 0,
        trialStartedAt: null,
        trialEndsAt: null,
        hasActiveSubscription: true,
        urgencyLevel: "normal" as UrgencyLevel,
        isLoading: false,
      };
    }

    // If no profile data yet, return loading state
    if (!profileData?.trial_started_at) {
      return {
        isOnTrial: false,
        isTrialExpired: false,
        daysRemaining: TRIAL_DURATION_DAYS,
        trialStartedAt: null,
        trialEndsAt: null,
        hasActiveSubscription: false,
        urgencyLevel: "normal" as UrgencyLevel,
        isLoading: profileLoading || subscriptionLoading,
      };
    }

    const trialStartedAt = parseISO(profileData.trial_started_at);
    const trialEndsAt = addDays(trialStartedAt, TRIAL_DURATION_DAYS);
    const today = startOfDay(new Date());
    const endOfTrial = startOfDay(trialEndsAt);

    const daysRemaining = Math.max(0, differenceInDays(endOfTrial, today));
    const isTrialExpired = daysRemaining <= 0;
    const isOnTrial = !isTrialExpired;
    const urgencyLevel = calculateUrgencyLevel(daysRemaining);

    return {
      isOnTrial,
      isTrialExpired,
      daysRemaining,
      trialStartedAt,
      trialEndsAt,
      hasActiveSubscription: false,
      urgencyLevel,
      isLoading: false,
    };
  }, [profileData, isSubscribed, profileLoading, subscriptionLoading]);

  return {
    ...trialStatus,
    isLoading: profileLoading || subscriptionLoading,
  };
}
