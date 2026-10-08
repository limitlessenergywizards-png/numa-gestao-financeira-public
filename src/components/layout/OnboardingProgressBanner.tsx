'use client';

import { memo } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { useOnboardingProgress } from "@/modules/onboarding/hooks/useOnboardingProgress";
import { Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SETTINGS_ROUTES } from "@/lib/routes";

interface OnboardingProgressBannerProps {
  className?: string;
}

export const OnboardingProgressBanner = memo(function OnboardingProgressBanner({
  className
}: OnboardingProgressBannerProps) {
  const router = useRouter();
  const {
    progress,
    isLoading,
    isComplete,
    completedSteps,
    totalSteps,
    percentage
  } = useOnboardingProgress();

  // Don't show if loading, complete, or no progress data
  if (isLoading || isComplete || !progress) return null;

  // Don't show if all steps are done
  if (percentage === 100) return null;

  const handleClick = () => {
    router.push(SETTINGS_ROUTES.ONBOARDING);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left p-3 rounded-xl bg-brand/10 border border-brand/20 hover:bg-brand/15 transition-colors group",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand" />
          <span className="text-xs font-medium text-brand">
            Configure seu Numa
          </span>
        </div>
        <span className="text-xs text-brand/70">
          {completedSteps}/{totalSteps}
        </span>
      </div>

      <Progress value={percentage} className="h-1.5 mb-2" />

      <div className="flex items-center justify-between">
        <span className="text-xs text-brand/70">
          {percentage < 50 ? "Começando..." : percentage < 100 ? "Quase lá!" : "Concluído!"}
        </span>
        <ChevronRight className="w-3 h-3 text-brand/70 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
});

OnboardingProgressBanner.displayName = "OnboardingProgressBanner";