import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatItem {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { 
    value: number; 
    direction: "up" | "down";
    label?: string;
  };
  color?: "success" | "warning" | "destructive" | "info" | "primary" | "muted" | "teal" | "brand";
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
  variant?: "default" | "vibrant";
}

const colorVariants = {
  success: {
    icon: "bg-success/10 text-success",
    value: "text-success",
    gradient: "bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700",
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    value: "text-warning",
    gradient: "bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600",
  },
  destructive: {
    icon: "bg-destructive/10 text-destructive",
    value: "text-destructive",
    gradient: "bg-gradient-to-br from-rose-500 via-rose-600 to-red-700",
  },
  info: {
    icon: "bg-info/10 text-info",
    value: "text-info",
    gradient: "bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600",
  },
  primary: {
    icon: "bg-primary/10 text-primary",
    value: "text-primary",
    gradient: "bg-gradient-to-br from-primary via-primary/90 to-primary/80",
  },
  muted: {
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
    gradient: "bg-gradient-to-br from-muted via-muted/90 to-muted/80",
  },
  teal: {
    icon: "bg-teal-500/10 text-teal-500",
    value: "text-teal-500",
    gradient: "bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700",
  },
  brand: {
    icon: "bg-brand/10 text-brand",
    value: "text-brand",
    gradient: "bg-gradient-to-br from-brand via-brand/90 to-brand/80",
  },
};

export function StatsGrid({ stats, columns = 4, className, variant = "default" }: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const colorScheme = colorVariants[stat.color || "primary"];

        if (variant === "vibrant") {
          return (
            <div
              key={index}
              className={cn(
                "relative p-4 rounded-xl border transition-transform duration-300 hover:scale-[1.02] overflow-hidden shadow-lg animate-fade-in",
                colorScheme.gradient
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Decorative circle */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 right-0 w-12 h-12 bg-white/5 rounded-full translate-y-4 translate-x-4" />
              
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/80">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  {stat.description && (
                    <p className="text-xs text-white/70">{stat.description}</p>
                  )}
                  {stat.trend && (
                    <div className="flex items-center gap-1">
                      {stat.trend.direction === "up" ? (
                        <TrendingUp className="h-3 w-3 text-white/90" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-white/90" />
                      )}
                      <span className="text-xs font-medium text-white/90">
                        {stat.trend.value > 0 ? "+" : ""}{stat.trend.value}%
                      </span>
                      {stat.trend.label && (
                        <span className="text-xs text-white/70">
                          {stat.trend.label}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-white/20">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          );
        }

        return (
          <Card 
            key={index} 
            className="hover:shadow-md transition-shadow duration-200 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className={cn("text-2xl font-bold", colorScheme.value)}>
                    {stat.value}
                  </p>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  )}
                  {stat.trend && (
                    <div className="flex items-center gap-1">
                      {stat.trend.direction === "up" ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className={cn(
                        "text-xs font-medium",
                        stat.trend.direction === "up" ? "text-success" : "text-destructive"
                      )}>
                        {stat.trend.value > 0 ? "+" : ""}{stat.trend.value}%
                      </span>
                      {stat.trend.label && (
                        <span className="text-xs text-muted-foreground">
                          {stat.trend.label}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className={cn("p-2.5 rounded-lg", colorScheme.icon)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
