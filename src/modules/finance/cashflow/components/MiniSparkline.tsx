'use client';

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: 'emerald' | 'red' | 'neutral';
  showDot?: boolean;
  className?: string;
}

export function MiniSparkline({ 
  data, 
  width = 48, 
  height = 16,
  color = 'neutral',
  showDot = true,
  className
}: MiniSparklineProps) {
  const { linePath, areaPath, lastPoint, trend } = useMemo(() => {
    if (data.length < 2) {
      return { linePath: '', areaPath: '', lastPoint: null, trend: 'neutral' };
    }
    
    const padding = 2;
    const values = data;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    
    const points = values.map((v, i) => ({
      x: padding + (i / (values.length - 1)) * (width - padding * 2),
      y: height - padding - ((v - min) / range) * (height - padding * 2)
    }));
    
    // Create smooth curve using quadratic bezier
    let lineD = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      lineD += ` Q ${prev.x + (curr.x - prev.x) * 0.5},${prev.y} ${midX},${(prev.y + curr.y) / 2}`;
    }
    lineD += ` L ${points[points.length - 1].x},${points[points.length - 1].y}`;
    
    // Area path for gradient fill
    const areaD = `${lineD} L ${width - padding},${height} L ${padding},${height} Z`;
    
    // Determine trend
    const firstVal = values[0];
    const lastVal = values[values.length - 1];
    const trendDirection = lastVal > firstVal ? 'up' : lastVal < firstVal ? 'down' : 'neutral';
    
    return { 
      linePath: lineD, 
      areaPath: areaD, 
      lastPoint: points[points.length - 1],
      trend: trendDirection
    };
  }, [data, width, height]);
  
  const strokeColor = {
    emerald: 'rgb(16, 185, 129)',
    red: 'rgb(239, 68, 68)',
    neutral: 'rgb(156, 163, 175)'
  }[color];
  
  const fillColor = {
    emerald: 'rgba(16, 185, 129, 0.15)',
    red: 'rgba(239, 68, 68, 0.15)',
    neutral: 'rgba(156, 163, 175, 0.1)'
  }[color];

  if (data.length < 2) {
    return null;
  }
  
  return (
    <svg 
      width={width} 
      height={height} 
      className={cn("inline-block flex-shrink-0", className)}
      aria-label={`Tendência: ${trend === 'up' ? 'subindo' : trend === 'down' ? 'descendo' : 'estável'}`}
    >
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path 
        d={areaPath} 
        fill={`url(#gradient-${color})`}
      />
      <path 
        d={linePath} 
        fill="none" 
        stroke={strokeColor} 
        strokeWidth={1.5} 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && lastPoint && (
        <circle 
          cx={lastPoint.x} 
          cy={lastPoint.y} 
          r={2} 
          fill={strokeColor}
        />
      )}
    </svg>
  );
}
