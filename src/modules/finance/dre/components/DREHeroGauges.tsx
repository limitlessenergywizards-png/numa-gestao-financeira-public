'use client';

import { TrendingUp, TrendingDown, Target, Percent, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatPct } from "@/lib/formatters";
import { useEffect, useState } from "react";

interface DREHeroGaugesProps {
  grossMargin: number;
  previousGrossMargin?: number;
  ebitdaMargin: number;
  previousEbitdaMargin?: number;
  netMargin: number;
  previousNetMargin?: number;
  isLoading?: boolean;
}

interface GaugeData {
  label: string;
  value: number;
  previousValue?: number;
  icon: typeof Target;
  thresholds: { poor: number; good: number; excellent: number };
  index?: number;
}

function AnimatedGauge({
  value,
  label,
  previousValue,
  thresholds,
  icon: Icon,
  index = 0,
}: GaugeData) {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Animate value on mount
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const targetValue = Math.min(Math.max(value, 0), 100);
    const increment = targetValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        setAnimatedValue(targetValue);
        clearInterval(timer);
      } else {
        setAnimatedValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  // Calculate trend
  const trend = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / Math.abs(previousValue)) * 100
    : null;

  const isTrendPositive = trend !== null && trend >= 0;

  // Determine performance level
  const getPerformanceLevel = () => {
    if (value >= thresholds.excellent) return "excellent";
    if (value >= thresholds.good) return "good";
    return "poor";
  };

  const performanceLevel = getPerformanceLevel();

  // SVG calculations
  const centerX = 100;
  const centerY = 65; // Moved further up (was 75)
  const radius = 70;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  // Needle angle: -90deg (left) to 90deg (right)
  const needleAngle = -90 + (animatedValue / 100) * 180;

  // Vibrant gradient backgrounds based on performance
  const cardClasses = {
    excellent: "bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 border-emerald-400/30 shadow-lg",
    good: "bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 border-amber-400/30 shadow-lg",
    poor: "bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 border-rose-400/30 shadow-lg",
  };

  // Arc color based on performance - white for visibility on colored backgrounds
  const arcColors = {
    excellent: "stroke-white",
    good: "stroke-white",
    poor: "stroke-white",
  };

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'backwards' }}>
      <Card
        className={cn(
          "relative overflow-hidden border transition-[transform,box-shadow] duration-500 hover:shadow-xl hover:-translate-y-0.5",
          cardClasses[performanceLevel]
        )}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full" />

        <div className="relative px-4 pt-2 pb-4 sm:px-6 sm:pt-4 sm:pb-6 z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white/20">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-medium text-white/90 uppercase tracking-wide">
                {label}
              </span>
            </div>
          </div>

          {/* Gauge */}
          <div className="relative flex justify-center" style={{ height: 120 }}>
            <svg viewBox="0 0 200 110" className="w-full max-w-[200px] h-full overflow-visible">
              {/* Gradient definitions */}
              <defs>
                {/* Tricolor background gradient */}
                <linearGradient id={`gauge-bg-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity="0.2" />
                  <stop offset="40%" stopColor="hsl(var(--warning))" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.2" />
                </linearGradient>

                {/* Glow filter */}
                <filter id={`gauge-glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background arc - white with opacity */}
              <path
                d={`M 20 ${centerY} A 70 70 0 0 1 180 ${centerY}`}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Progress arc */}
              <path
                d={`M 20 ${centerY} A 70 70 0 0 1 180 ${centerY}`}
                fill="none"
                className={cn("transition-[stroke-dashoffset] duration-500", arcColors[performanceLevel])}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                filter={`url(#gauge-glow-${label})`}
              />

              {/* Tick marks */}
              {[0, 25, 50, 75, 100].map((tick) => {
                const angle = (tick / 100) * Math.PI;
                const x1 = centerX - Math.cos(angle) * (radius - 12);
                const y1 = centerY - Math.sin(angle) * (radius - 12);
                const x2 = centerX - Math.cos(angle) * (radius - 6);
                const y2 = centerY - Math.sin(angle) * (radius - 6);
                return (
                  <line
                    key={tick}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white/30"
                  />
                );
              })}

              {/* Needle */}
              <g
                transform={`rotate(${needleAngle}, ${centerX}, ${centerY})`}
                className="transition-transform duration-700 ease-out"
              >
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={centerX}
                  y2={centerY - radius + 18}
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Needle tip glow */}
                <circle
                  cx={centerX}
                  cy={centerY - radius + 20}
                  r="4"
                  className="animate-pulse fill-white"
                />
              </g>

              {/* Center pivot */}
              <circle
                cx={centerX}
                cy={centerY}
                r="8"
                fill="rgba(255,255,255,0.9)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2"
              />
            </svg>

            {/* Value display */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-bold tabular-nums text-white drop-shadow-md">
                {formatPct(animatedValue)}
              </span>
            </div>
          </div>

          {/* Trend indicator */}
          {trend !== null && (
            <div className="flex items-center justify-center mt-3 gap-1">
              {isTrendPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-white/80" />
              )}
              <span className="text-xs font-medium text-white">
                {isTrendPositive ? "+" : ""}
                {formatPct(trend)} vs anterior
              </span>
            </div>
          )}

          {/* Scale labels */}
          <div className="flex justify-between mt-2 px-2">
            <span className="text-[10px] text-white/70">0%</span>
            <span className="text-[10px] text-white/70">50%</span>
            <span className="text-[10px] text-white/70">100%</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function GaugeSkeleton() {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex justify-center">
        <Skeleton className="h-[120px] w-[200px] rounded-full" />
      </div>
      <Skeleton className="h-4 w-32 mx-auto mt-4" />
    </Card>
  );
}

export function DREHeroGauges({
  grossMargin,
  previousGrossMargin,
  ebitdaMargin,
  previousEbitdaMargin,
  netMargin,
  previousNetMargin,
  isLoading,
}: DREHeroGaugesProps) {
  const gauges: GaugeData[] = [
    {
      label: "Margem Bruta",
      value: grossMargin,
      previousValue: previousGrossMargin,
      icon: Percent,
      thresholds: { poor: 0, good: 20, excellent: 20 },
    },
    {
      label: "Margem Operacional",
      value: ebitdaMargin,
      previousValue: previousEbitdaMargin,
      icon: Target,
      thresholds: { poor: 0, good: 10, excellent: 10 },
    },
    {
      label: "Margem Líquida",
      value: netMargin,
      previousValue: previousNetMargin,
      icon: DollarSign,
      thresholds: { poor: 0, good: 10, excellent: 10 },
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <GaugeSkeleton />
        <GaugeSkeleton />
        <GaugeSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {gauges.map((gauge, index) => (
        <AnimatedGauge key={gauge.label} {...gauge} index={index} />
      ))}
    </div>
  );
}
