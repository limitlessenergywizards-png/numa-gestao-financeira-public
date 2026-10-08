'use client';

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  status: "success" | "warning" | "danger";
  showPercentage?: boolean;
  suffix?: string;
}

export function GaugeChart({ 
  value, 
  max, 
  label, 
  status, 
  showPercentage = true,
  suffix = ""
}: GaugeChartProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);
  const animatedPercentage = Math.min((animatedValue / max) * 100, 100);
  
  // Animate value on mount
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setAnimatedValue(value);
        clearInterval(timer);
      } else {
        setAnimatedValue(current);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);

  const getGradient = () => {
    if (status === "success") return "from-emerald-400 via-green-500 to-green-600";
    if (status === "warning") return "from-amber-400 via-orange-500 to-orange-600";
    return "from-red-400 via-rose-500 to-rose-600";
  };

  const getGlowColor = () => {
    if (status === "success") return "shadow-emerald-500/30";
    if (status === "warning") return "shadow-amber-500/30";
    return "shadow-rose-500/30";
  };

  const getTextColor = () => {
    if (status === "success") return "text-success";
    if (status === "warning") return "text-warning";
    return "text-destructive";
  };

  // Calculate stroke dasharray for the arc
  const radius = 40;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center group">
      {/* Gauge Container with value inside */}
      <div className="relative w-40 h-28">
        <svg 
          viewBox="0 0 100 60" 
          className="w-full h-full"
        >
          {/* Background Arc with subtle glow */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.3"
          />
          
          {/* Gradient Definition */}
          <defs>
            <linearGradient id={`gauge-gradient-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
              {status === "success" && (
                <>
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </>
              )}
              {status === "warning" && (
                <>
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ea580c" />
                </>
              )}
              {status === "danger" && (
                <>
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="50%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#be123c" />
                </>
              )}
            </linearGradient>
            
            {/* Glow filter */}
            <filter id={`glow-${status}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Animated Progress Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={`url(#gauge-gradient-${status})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
            filter={`url(#glow-${status})`}
          />
          
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick, i) => {
            const angle = (tick / 100) * Math.PI;
            const x1 = 50 - Math.cos(angle) * 32;
            const y1 = 50 - Math.sin(angle) * 32;
            const x2 = 50 - Math.cos(angle) * 28;
            const y2 = 50 - Math.sin(angle) * 28;
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1"
                opacity="0.4"
              />
            );
          })}
        </svg>
        
        {/* Value Display - centered inside the arc */}
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <div className="bg-card/95 backdrop-blur-sm px-3 py-1 rounded-md border shadow-sm">
            <span className={cn(
              "text-lg font-bold tabular-nums", 
              getTextColor()
            )}>
              {showPercentage 
                ? `${animatedPercentage.toFixed(0)}%` 
                : `${animatedValue.toFixed(1)}${suffix}`
              }
            </span>
          </div>
        </div>
      </div>
      
      {/* Label - clearly separated below with more prominence */}
      <p className="text-sm text-foreground/80 mt-2 font-semibold tracking-wide">{label}</p>
    </div>
  );
}
