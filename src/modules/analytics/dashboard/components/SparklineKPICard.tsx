'use client';

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SparklineData {
  date: string;
  value: number;
}

interface SparklineKPICardProps {
  title: string;
  value: number;
  currencySymbol: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  sparklineData: SparklineData[];
  count?: number;
  countLabel?: string;
  type: "overdue" | "month" | "income" | "expense";
  animationDelay?: string;
}

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  return (
    <span>
      {prefix}
      {value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

export function SparklineKPICard({
  title,
  value,
  currencySymbol,
  icon: Icon,
  color,
  bgColor,
  sparklineData,
  count,
  countLabel,
  type,
  animationDelay = "0s",
}: SparklineKPICardProps) {
  // Calculate trend
  const trend = useMemo(() => {
    if (!sparklineData || sparklineData.length < 2) return 0;
    const latest = sparklineData[sparklineData.length - 1].value;
    const previous = sparklineData[sparklineData.length - 2].value;
    if (previous === 0) return 0;
    return ((latest - previous) / previous) * 100;
  }, [sparklineData]);

  // Generate sparkline SVG path
  const { linePath, areaPath, points } = useMemo(() => {
    if (!sparklineData || sparklineData.length === 0) {
      return { linePath: "", areaPath: "", points: [] };
    }

    const width = 80;
    const height = 32;
    const padding = 2;
    const values = sparklineData.map((d) => d.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const pts = values.map((v, i) => ({
      x: padding + (i / (values.length - 1 || 1)) * (width - padding * 2),
      y: padding + (1 - (v - min) / range) * (height - padding * 2),
    }));

    const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaD = `${lineD} L ${pts[pts.length - 1]?.x || 0} ${height} L ${pts[0]?.x || 0} ${height} Z`;

    return { linePath: lineD, areaPath: areaD, points: pts };
  }, [sparklineData]);

  const getTrendColor = () => {
    // For expenses/overdue, negative trend is good
    const isInverse = type === "expense" || type === "overdue";
    if (Math.abs(trend) < 1) return "text-muted-foreground bg-muted/50";
    if (isInverse) {
      return trend < 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10";
    }
    return trend > 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10";
  };

  const getSparklineColor = () => {
    if (type === "overdue") return "hsl(0, 84%, 55%)";
    if (type === "expense") return "hsl(0, 84%, 55%)";
    if (type === "income") return "hsl(142, 76%, 36%)";
    return "hsl(217, 91%, 60%)";
  };

  const getGradientId = `sparkline-gradient-${title.replace(/\s+/g, "-")}`;

  return (
    <Card
      className="glass-card card-hover animate-fade-in overflow-hidden relative group"
      style={{ animationDelay }}
    >
      {/* Background gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20",
          type === "overdue"
            ? "bg-gradient-to-br from-destructive to-red-400"
            : type === "expense"
            ? "bg-gradient-to-br from-warning to-amber-400"
            : type === "income"
            ? "bg-gradient-to-br from-success to-emerald-400"
            : "bg-gradient-to-br from-primary to-blue-400"
        )}
      />

      {/* Animated glow effect */}
      <div
        className={cn(
          "absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl transition-transform group-hover:scale-150",
          bgColor
        )}
      />

      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg",
            bgColor,
            "backdrop-blur-sm border border-white/20"
          )}
        >
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight">
              <AnimatedNumber value={value} prefix={`${currencySymbol} `} />
            </div>
            {count !== undefined && countLabel && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span
                  className={cn(
                    "inline-block w-2 h-2 rounded-full animate-pulse",
                    bgColor.replace("/10", "")
                  )}
                />
                {count} {countLabel}
              </p>
            )}
          </div>

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 1 && (
            <div className="flex flex-col items-end gap-1">
              <svg width="80" height="32" className="overflow-visible">
                <defs>
                  <linearGradient id={getGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={getSparklineColor()} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={getSparklineColor()} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Area fill */}
                <path d={areaPath} fill={`url(#${getGradientId})`} />
                {/* Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={getSparklineColor()}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* End dot */}
                {points.length > 0 && (
                  <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r="3"
                    fill={getSparklineColor()}
                    className="animate-pulse"
                  />
                )}
              </svg>

              {/* Trend badge */}
              <Badge
                variant="outline"
                className={cn("text-xs gap-0.5 px-1.5 py-0 h-5", getTrendColor())}
              >
                {trend > 1 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend < -1 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {Math.abs(trend).toFixed(0)}%
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
