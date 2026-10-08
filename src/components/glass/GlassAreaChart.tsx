'use client';

import { memo, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GlassCard } from "./GlassCard";
import { GlassTooltip } from "./GlassTooltip";
import { cn } from "@/lib/utils";
import { type PeriodType, PERIOD_SHORT_LABELS } from "@/lib/periodUtils";

interface ChartDataPoint {
  month: string;
  receitas: number;
  despesas: number;
}

interface GlassAreaChartProps {
  data?: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  className?: string;
  selectedPeriod?: PeriodType;
  onPeriodChange?: (p: PeriodType) => void;
}

const emptyData: ChartDataPoint[] = [];

type FilterType = "all" | "receitas" | "despesas";

const PERIOD_SUBTITLES: Record<PeriodType, string> = {
  day: "Receitas e despesas do dia",
  week: "Receitas e despesas da semana",
  month: "Receitas e despesas do mês",
  quarter: "Receitas e despesas do trimestre",
  semester: "Receitas e despesas do semestre",
  year: "Receitas e despesas do ano",
};

// Static arrays moved OUTSIDE component — no re-creation on render
const PERIODS: PeriodType[] = ["day", "week", "month", "year"];
const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "receitas", label: "Receitas" },
  { value: "despesas", label: "Despesas" },
];

export const GlassAreaChart = memo(function GlassAreaChart({
  data = emptyData,
  title = "Estatísticas",
  subtitle,
  className,
  selectedPeriod: externalPeriod,
  onPeriodChange,
}: GlassAreaChartProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  // Use external period if provided, otherwise use internal state
  const [internalPeriod, setInternalPeriod] = useState<PeriodType>("month");
  const period = externalPeriod ?? internalPeriod;

  // Dynamic subtitle based on period
  const displaySubtitle = subtitle ?? PERIOD_SUBTITLES[period];

  const handlePeriodChange = useCallback((p: PeriodType) => {
    if (onPeriodChange) {
      onPeriodChange(p);
    } else {
      setInternalPeriod(p);
    }
  }, [onPeriodChange]);

  return (
    <GlassCard variant="default" padding="lg" shine className={cn("", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{displaySubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 dark:bg-glass-elevated/50">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  period === p
                    ? "bg-gold-500 text-numa-deep"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {PERIOD_SHORT_LABELS[p]}
              </button>
            ))}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 dark:bg-glass-elevated/50">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                  filter === f.value
                    ? "bg-background dark:bg-glass-highlight text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {/* Gold gradient fill */}
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C5A059" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#C5A059" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#C5A059" stopOpacity={0} />
              </linearGradient>

              {/* Green gradient fill */}
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7DC4B4" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#7DC4B4" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#7DC4B4" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsla(168 30% 20% / 0.3)"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(168 15% 55%)", fontSize: 12 }}
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(168 15% 55%)", fontSize: 12 }}
              tickFormatter={(v) => `${v / 1000}k`}
              dx={-10}
            />

            <Tooltip
              content={({ active, payload, label }) => (
                <GlassTooltip
                  active={active}
                  payload={payload?.map((p) => ({
                    value: p.value as number,
                    name: p.name === "receitas" ? "Receitas" : "Despesas",
                    color: p.name === "receitas" ? "#C5A059" : "#7DC4B4",
                  }))}
                  label={label}
                />
              )}
            />

            {/* Despesas (below) */}
            {(filter === "all" || filter === "despesas") && (
              <Area
                type="monotone"
                dataKey="despesas"
                stroke="#7DC4B4"
                strokeWidth={2}
                fill="url(#greenGradient)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "#7DC4B4",
                  stroke: "#0A1512",
                  strokeWidth: 2,
                }}
              />
            )}

            {/* Receitas (on top) */}
            {(filter === "all" || filter === "receitas") && (
              <Area
                type="monotone"
                dataKey="receitas"
                stroke="#C5A059"
                strokeWidth={2}
                fill="url(#goldGradient)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "#C5A059",
                  stroke: "#0A1512",
                  strokeWidth: 2,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border dark:border-glass-border">
        {[
          { color: "#C5A059", label: "Receitas" },
          { color: "#7DC4B4", label: "Despesas" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
});

GlassAreaChart.displayName = 'GlassAreaChart';
