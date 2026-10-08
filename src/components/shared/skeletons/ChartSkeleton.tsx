/**
 * ChartSkeleton - Loading skeleton for chart components
 * 
 * Displays an animated placeholder mimicking chart layouts
 * (bar charts, line charts, pie charts) while data loads.
 * 
 * @param variant - Type of chart skeleton (default: "bar")
 * @param height - Height of the skeleton (default: 300)
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartSkeletonProps {
  variant?: "bar" | "line" | "pie" | "area";
  height?: number;
  className?: string;
}

export function ChartSkeleton({ 
  variant = "bar", 
  height = 300,
  className 
}: ChartSkeletonProps) {
  if (variant === "pie") {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }}>
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
    );
  }

  if (variant === "line" || variant === "area") {
    return (
      <div className={cn("w-full space-y-4", className)} style={{ height }}>
        {/* Y-axis labels */}
        <div className="flex gap-4 h-full">
          <div className="flex flex-col justify-between py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-12" />
            ))}
          </div>
          
          {/* Chart area with line */}
          <div className="flex-1 relative border-l border-b border-border">
            <Skeleton 
              className="absolute bottom-0 left-0 right-0 h-1/2 rounded-none opacity-30" 
            />
            <div className="absolute inset-0 flex items-end justify-around pb-4 px-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="w-2 rounded-full"
                  style={{ height: `${30 + Math.random() * 50}%` }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-around pl-16 pr-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    );
  }

  // Bar chart (default)
  return (
    <div className={cn("w-full space-y-4", className)} style={{ height }}>
      {/* Y-axis labels */}
      <div className="flex gap-4 h-full">
        <div className="flex flex-col justify-between py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-12" />
          ))}
        </div>
        
        {/* Bars */}
        <div className="flex-1 flex items-end justify-around gap-2 border-l border-b border-border pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-1">
              <Skeleton 
                className="w-6 rounded-t"
                style={{ height: `${40 + Math.random() * 40}%` }}
              />
              <Skeleton 
                className="w-6 rounded-t"
                style={{ height: `${30 + Math.random() * 50}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-around pl-16 pr-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-10" />
        ))}
      </div>
    </div>
  );
}
