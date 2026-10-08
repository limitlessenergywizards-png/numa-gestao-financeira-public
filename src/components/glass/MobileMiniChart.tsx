'use client';

import { memo, useState } from "react";
import { GlassCard } from "./GlassCard";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileMiniChartProps {
  value?: number;
  change?: { value: number; type: "increase" | "decrease" };
  currencySymbol?: string;
  onViewDetails?: () => void;
  className?: string;
}

type PeriodType = "D" | "S" | "M" | "A";

export const MobileMiniChart = memo(function MobileMiniChart({
  value = 2056,
  change = { value: 50, type: "decrease" },
  currencySymbol = "R$",
  onViewDetails,
  className,
}: MobileMiniChartProps) {
  const [period, setPeriod] = useState<PeriodType>("M");

  const periods: PeriodType[] = ["D", "S", "M", "A"];

  // Simple sparkline path
  const sparklinePath = "M0,50 Q20,30 40,45 T80,25 T120,40 T160,20 T200,35 T240,15";

  return (
    <GlassCard variant="default" padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Este Mês</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground tabular-nums">
              {currencySymbol} {value.toLocaleString("pt-BR")}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                change.type === "increase" ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {change.type === "increase" ? "↗" : "↘"} {change.value}%
            </span>
          </div>
        </div>

        {/* Period tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-glass-elevated/50">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "w-7 h-7 text-xs font-medium rounded-md transition-colors flex items-center justify-center",
                period === p
                  ? "bg-gold-500 text-numa-deep"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-16 mb-3">
        <svg
          viewBox="0 0 240 60"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C5A059" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#C5A059" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={`${sparklinePath} L240,60 L0,60 Z`}
            fill="url(#sparklineGradient)"
          />

          {/* Line */}
          <path
            d={sparklinePath}
            fill="none"
            stroke="#C5A059"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* End dot */}
          <circle cx="240" cy="15" r="4" fill="#C5A059" />
        </svg>
      </div>

      {/* View details link */}
      <button
        onClick={onViewDetails}
        className="w-full flex items-center justify-center gap-1 text-sm text-gold-400 hover:text-gold-300 transition-colors"
      >
        Ver estatísticas completas
        <ChevronRight className="w-4 h-4" />
      </button>
    </GlassCard>
  );
});

MobileMiniChart.displayName = 'MobileMiniChart';
