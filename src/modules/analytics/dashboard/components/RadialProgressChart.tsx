'use client';

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface RadialProgressData {
  name: string;
  value: number;
  color: string;
}

interface RadialProgressChartProps {
  data: RadialProgressData[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}

export function RadialProgressChart({ 
  data, 
  centerLabel, 
  centerValue,
  size = 160
}: RadialProgressChartProps) {
  const [animatedData, setAnimatedData] = useState<RadialProgressData[]>(
    data.map(d => ({ ...d, value: 0 }))
  );

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    let current = 0;
    
    const timer = setInterval(() => {
      current++;
      const progress = current / steps;
      
      setAnimatedData(data.map(d => ({
        ...d,
        value: d.value * Math.min(progress, 1)
      })));
      
      if (current >= steps) {
        clearInterval(timer);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [data]);

  const rings = useMemo(() => {
    const baseRadius = (size / 2) - 20;
    const ringWidth = 12;
    const gap = 4;
    
    return animatedData.map((item, index) => {
      const radius = baseRadius - (index * (ringWidth + gap));
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (item.value / 100) * circumference;
      
      return {
        ...item,
        radius,
        circumference,
        strokeDashoffset,
        ringWidth
      };
    });
  }, [animatedData, size]);

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="relative">
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <defs>
            {data.map((item, index) => (
              <linearGradient 
                key={`gradient-${index}`}
                id={`radial-gradient-${index}`} 
                x1="0%" 
                y1="0%" 
                x2="100%" 
                y2="0%"
              >
                <stop offset="0%" stopColor={item.color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={item.color} stopOpacity="1" />
              </linearGradient>
            ))}
            
            {/* Glow filter */}
            <filter id="radial-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {rings.map((ring, index) => (
            <g key={ring.name}>
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={ring.radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={ring.ringWidth}
                opacity="0.2"
              />
              {/* Progress circle with gradient */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={ring.radius}
                fill="none"
                stroke={`url(#radial-gradient-${index})`}
                strokeWidth={ring.ringWidth}
                strokeLinecap="round"
                strokeDasharray={ring.circumference}
                strokeDashoffset={ring.strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
                filter="url(#radial-glow)"
              />
            </g>
          ))}
        </svg>
        
        {/* Center value badge - positioned below the graph for better readability */}
        {centerValue && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl rounded-full px-5 py-2 min-w-[80px] text-center z-10">
            <span className="text-xl font-bold text-foreground tabular-nums">{centerValue}</span>
          </div>
        )}
      </div>
      
      {/* Label below badge */}
      {centerLabel && (
        <span className="text-xs text-muted-foreground mt-5 font-medium">{centerLabel}</span>
      )}
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div 
              className="h-2 w-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
