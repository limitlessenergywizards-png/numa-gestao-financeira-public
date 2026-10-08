'use client';

import { useRouter } from "next/navigation";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { Clock, AlertTriangle, AlertCircle, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { UrgencyLevel } from "@/modules/subscription/hooks/useTrialStatus";

interface TrialBannerProps {
  daysRemaining: number;
  urgencyLevel: UrgencyLevel;
  className?: string;
}

const TRIAL_DURATION_DAYS = 3;

const urgencyConfig = {
  normal: {
    icon: Clock,
    bgClass: "bg-emerald-500/10 border-emerald-500/30",
    textClass: "text-emerald-400",
    progressClass: "bg-emerald-500",
    label: "Trial Gratuito",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-amber-500/10 border-amber-500/30",
    textClass: "text-amber-400",
    progressClass: "bg-amber-500",
    label: "Trial Expirando",
  },
  danger: {
    icon: AlertCircle,
    bgClass: "bg-red-500/10 border-red-500/30",
    textClass: "text-red-400",
    progressClass: "bg-red-500",
    label: "Últimos Dias!",
  },
  critical: {
    icon: XCircle,
    bgClass: "bg-red-500/15 border-red-500/40 animate-pulse",
    textClass: "text-red-400",
    progressClass: "bg-red-500",
    label: "Trial Expirado!",
  },
};

export function TrialBanner({ daysRemaining, urgencyLevel, className }: TrialBannerProps) {
  const router = useRouter();
  const config = urgencyConfig[urgencyLevel];
  const Icon = config.icon;

  const progressValue = Math.max(0, (daysRemaining / TRIAL_DURATION_DAYS) * 100);

  const getDaysText = () => {
    if (daysRemaining === 0) return "Último dia!";
    if (daysRemaining === 1) return "1 dia restante";
    return `${daysRemaining} dias restantes`;
  };

  return (
    <div
      className={cn(
        "mt-3 p-3 rounded-xl border transition-[background-color,border-color] duration-300",
        config.bgClass,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", config.textClass)} />
        <span className={cn("text-xs font-semibold uppercase tracking-wide", config.textClass)}>
          {config.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-2">
        <Progress
          value={progressValue}
          className="h-2 bg-background/50"
        />
        <div
          className={cn("absolute inset-0 h-2 rounded-full", config.progressClass)}
          style={{ width: `${progressValue}%` }}
        />
      </div>

      {/* Days remaining text */}
      <p className={cn("text-sm font-medium mb-3", config.textClass)}>
        {getDaysText()}
      </p>

      {/* CTA Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => router.push(PUBLIC_ROUTES.TRIAL_EXPIRED)}
        className={cn(
          "w-full gap-2 border-brand/40 hover:bg-brand/20 hover:border-brand/60",
          "text-brand hover:text-brand"
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Escolher Plano
      </Button>
    </div>
  );
}
