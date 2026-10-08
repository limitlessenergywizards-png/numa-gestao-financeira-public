/**
 * CardGridSkeleton - Loading skeleton for KPI/metric card grids
 * 
 * Displays animated placeholder cards mimicking dashboard metrics
 * while data is being fetched.
 * 
 * @param cards - Number of skeleton cards to display (default: 4)
 * @param columns - Grid columns on desktop (default: 4)
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardGridSkeletonProps {
  cards?: number;
  columns?: 2 | 3 | 4 | 5 | 6;
  showTrend?: boolean;
  className?: string;
}

const columnClasses = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
} as const;

export function CardGridSkeleton({ 
  cards = 4, 
  columns = 4,
  showTrend = true,
  className 
}: CardGridSkeletonProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 gap-4",
      columnClasses[columns],
      className
    )}>
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4 space-y-3">
            {/* Icon + Title row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-20" />
              </div>
              {showTrend && <Skeleton className="h-5 w-12 rounded-full" />}
            </div>
            
            {/* Value */}
            <Skeleton className="h-7 w-28" />
            
            {/* Subtitle/description */}
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * MetricCardSkeleton - Single metric card skeleton
 */
export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}
