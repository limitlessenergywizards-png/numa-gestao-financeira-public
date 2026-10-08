'use client';

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SpeedometerGaugeProps {
  value: number;
  label: string;
  previousValue?: number;
  size?: "sm" | "md" | "lg";
  color?: "amber" | "sky";
}

export function SpeedometerGauge({
  value,
  label,
  previousValue,
  size = "md",
  color = "amber",
}: SpeedometerGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Animate value on mount
  useEffect(() => {
    const duration = 1200;
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

  // Size configurations
  const sizeConfig = {
    sm: { width: 100, height: 60, fontSize: "text-lg", arcWidth: 8 },
    md: { width: 140, height: 85, fontSize: "text-2xl", arcWidth: 10 },
    lg: { width: 180, height: 110, fontSize: "text-3xl", arcWidth: 12 },
  };

  const config = sizeConfig[size];
  
  // SVG calculations
  const centerX = 50;
  const centerY = 50;
  const radius = 38;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  // Needle angle: -90deg (left) to 90deg (right) for 0% to 100%
  const needleAngle = -90 + (animatedValue / 100) * 180;

  // Color configurations
  const colorConfig = {
    amber: {
      primary: "#F59E0B",
      secondary: "#FBBF24",
      glow: "drop-shadow(0 0 6px rgba(245, 158, 11, 0.5))",
    },
    sky: {
      primary: "#0EA5E9",
      secondary: "#38BDF8",
      glow: "drop-shadow(0 0 6px rgba(14, 165, 233, 0.5))",
    },
  };

  const colorCfg = colorConfig[color];

  return (
    <div className="flex flex-col items-center">
      {/* Gauge Container */}
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
          {/* Gradient definitions */}
          <defs>
            {/* Tricolor gradient for background arc */}
            <linearGradient id={`gauge-bg-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
              <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22C55E" stopOpacity="0.3" />
            </linearGradient>

            {/* Active arc gradient */}
            <linearGradient id={`gauge-active-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colorCfg.secondary} />
              <stop offset="100%" stopColor={colorCfg.primary} />
            </linearGradient>

            {/* Glow filter */}
            <filter id={`gauge-glow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background arc with tricolor gradient */}
          <path
            d="M 10 50 A 38 38 0 0 1 90 50"
            fill="none"
            stroke={`url(#gauge-bg-${color})`}
            strokeWidth={config.arcWidth}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <path
            d="M 10 50 A 38 38 0 0 1 90 50"
            fill="none"
            stroke={`url(#gauge-active-${color})`}
            strokeWidth={config.arcWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter={`url(#gauge-glow-${color})`}
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (tick / 100) * Math.PI;
            const x1 = centerX - Math.cos(angle) * (radius - 8);
            const y1 = centerY - Math.sin(angle) * (radius - 8);
            const x2 = centerX - Math.cos(angle) * (radius - 4);
            const y2 = centerY - Math.sin(angle) * (radius - 4);
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted-foreground/40"
              />
            );
          })}

          {/* Needle */}
          <g
            transform={`rotate(${needleAngle}, ${centerX}, ${centerY})`}
            className="transition-transform duration-700 ease-out"
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          >
            {/* Needle body */}
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX}
              y2={centerY - radius + 10}
              stroke={colorCfg.primary}
              strokeWidth="2.5"
              strokeLinecap="round"
              filter={`url(#gauge-glow-${color})`}
            />
            {/* Needle tip glow */}
            <circle
              cx={centerX}
              cy={centerY - radius + 12}
              r="3"
              fill={colorCfg.primary}
              className="animate-pulse"
            />
          </g>

          {/* Center pivot */}
          <circle
            cx={centerX}
            cy={centerY}
            r="5"
            fill="hsl(var(--card))"
            stroke={colorCfg.primary}
            strokeWidth="2"
          />
        </svg>

        {/* Value display in center */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <div className="bg-card/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-border/50 shadow-sm">
            <span className={cn(config.fontSize, "font-bold tabular-nums",
              color === "amber" ? "text-amber-700 dark:text-amber-400" : "text-sky-700 dark:text-sky-400"
            )}>
              {Number.isInteger(animatedValue) ? animatedValue.toFixed(0) : animatedValue.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Label */}
      <p className="text-xs text-muted-foreground font-medium mt-2">{label}</p>

      {/* Trend badge */}
      {trend !== null && (
        <div className="flex items-center gap-1 mt-1">
          {isTrendPositive ? (
            <TrendingUp className="h-3 w-3 text-success" />
          ) : (
            <TrendingDown className="h-3 w-3 text-destructive" />
          )}
          <span
            className={cn(
              "text-[10px] font-medium",
              isTrendPositive ? "text-success" : "text-destructive"
            )}
          >
            {isTrendPositive ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
