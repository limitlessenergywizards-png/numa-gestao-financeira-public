/**
 * TableSkeleton - Loading skeleton for data tables
 * 
 * Displays animated placeholder rows mimicking a table layout
 * while data is being fetched.
 * 
 * @param rows - Number of skeleton rows to display (default: 5)
 * @param columns - Number of columns per row (default: 5)
 * @param showHeader - Whether to show header skeleton (default: true)
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 5, 
  showHeader = true,
  className 
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex gap-4 pb-2 border-b border-border">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton 
              key={`header-${i}`} 
              className={cn(
                "h-4",
                i === 0 ? "w-8" : i === 1 ? "w-32" : "w-24"
              )} 
            />
          ))}
        </div>
      )}

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className="flex items-center gap-4 py-3"
        >
          {/* Checkbox column */}
          <Skeleton className="h-4 w-4 rounded-sm" />
          
          {/* Data columns */}
          {Array.from({ length: columns - 1 }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                "h-4",
                colIndex === 0 ? "w-20" : // Date
                colIndex === 1 ? "w-40 flex-1" : // Description
                colIndex === 2 ? "w-24" : // Amount
                "w-20" // Status/Actions
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
