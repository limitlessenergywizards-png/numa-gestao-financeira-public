'use client';

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SparklineData {
  value: number;
  date?: string;
}

interface SparklineCardProps {
  title: string;
  value: number;
  prefix?: string;
  data: SparklineData[];
  trend: number;
  color?: "success" | "destructive" | "warning" | "primary";
  showSparkline?: boolean;
}

export function SparklineCard({ 
  title, 
  value, 
  prefix = "",
  data, 
  trend, 
  color = "primary",
  showSparkline = true,
}: SparklineCardProps) {
  const isPositive = trend >= 0;
  
  // Vibrant gradient background classes
  const gradientClasses = {
    success: "bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 border-emerald-400/30",
    destructive: "bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 border-rose-400/30", 
    warning: "bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 border-amber-400/30",
    primary: "bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 border-teal-400/30",
  };

  const formattedValue = `${prefix}${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Generate SVG path for sparkline
  const sparklinePath = useMemo(() => {
    if (!showSparkline || data.length < 2) return "";
    
    const width = 80;
    const height = 32;
    const padding = 2;
    
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    const points = values.map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });
    
    return `M ${points.join(" L ")}`;
  }, [data, showSparkline]);

  // Generate area path
  const areaPath = useMemo(() => {
    if (!showSparkline || data.length < 2) return "";
    
    const width = 80;
    const height = 32;
    const padding = 2;
    
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    const points = values.map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });
    
    return `M ${padding},${height} L ${points.join(" L ")} L ${80 - padding},${height} Z`;
  }, [data, showSparkline]);

  return (
    <Card className={cn(
      "overflow-hidden relative shadow-lg transition-transform hover:scale-[1.02]",
      gradientClasses[color]
    )}>
      {/* Decorative circle */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
      
      <CardContent className="p-4 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <p className="text-sm text-white/80 font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-white">
              {formattedValue}
            </p>
            <div className="flex items-center gap-1.5">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-medium border-0",
                  isPositive 
                    ? "bg-white/20 text-white" 
                    : "bg-white/20 text-white"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {isPositive ? "+" : ""}{trend.toFixed(1)}%
              </Badge>
            </div>
          </div>
          
          {/* Sparkline */}
          {showSparkline && data.length >= 2 && (
            <div className="shrink-0">
              <svg width="80" height="32" className="overflow-visible">
                {/* Area fill */}
                <path
                  d={areaPath}
                  fill="white"
                  opacity={0.15}
                />
                {/* Line */}
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                />
              </svg>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
