/**
 * GradientMetricCard - Reusable metric card with gradient background
 * 
 * Standardized design for KPI cards across the application.
 * Features vibrant gradients, decorative circles, and optional trends.
 */

import { memo } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GradientMetricCardProps {
  /** Card title (e.g., "Entradas", "Saldo") */
  title: string;
  /** Formatted value to display */
  value: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Tailwind gradient classes (e.g., "from-emerald-500 to-emerald-600") */
  gradient: string;
  /** Optional trend indicator */
  trend?: {
    value: number;
    /** If true, negative trend is shown as positive (e.g., for expenses) */
    invertPositive?: boolean;
  };
  /** Additional CSS classes */
  className?: string;
}

export const GradientMetricCard = memo(function GradientMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  trend,
  className,
}: GradientMetricCardProps) {
  const showTrend = trend !== undefined && trend.value !== 0;
  const isPositiveTrend = trend?.invertPositive 
    ? trend.value < 0 
    : (trend?.value ?? 0) > 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-4 border-0 shadow-lg",
        `bg-gradient-to-br ${gradient}`,
        className
      )}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/90">
            {title}
          </span>
          <div className="p-1.5 rounded-lg bg-white/20">
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="text-2xl font-bold tabular-nums text-white">
          {value}
        </div>

        <div className="flex items-center gap-1 mt-1 min-h-[1.25rem]">
          {showTrend ? (
            <>
              {isPositiveTrend ? (
                <TrendingUp className="h-3 w-3 text-white/80" />
              ) : (
                <TrendingDown className="h-3 w-3 text-white/80" />
              )}
              <span className="text-xs font-medium text-white/80">
                {isPositiveTrend ? '+' : ''}{trend!.value.toFixed(1)}%
              </span>
            </>
          ) : subtitle ? (
            <span className="text-xs text-white/70">
              {subtitle}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
});
