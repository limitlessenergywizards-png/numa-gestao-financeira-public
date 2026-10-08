import { memo } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { AnimatedCurrency } from "@/components/ui/animated-currency";

interface HeroMetricCardProps {
  label: string;
  value: number;
  previousValue?: number;
  format: "currency" | "percent";
  color: "emerald" | "amber" | "sky" | "destructive";
  icon: LucideIcon;
  currencySymbol?: string;
  delay?: number;
  children?: React.ReactNode;
}

// Color classes defined outside component to prevent re-creation
const colorClasses = {
  emerald: {
    border: "border-emerald-600/50 dark:border-emerald-500/40",
    glow: "shadow-[0_0_25px_rgba(16,185,129,0.15),0_0_50px_rgba(16,185,129,0.05)] dark:shadow-[0_0_25px_rgba(16,185,129,0.25),0_0_50px_rgba(16,185,129,0.1)]",
    iconBg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    valueColor: "text-emerald-700 dark:text-emerald-400",
  },
  amber: {
    border: "border-amber-600/50 dark:border-amber-500/40",
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.15),0_0_50px_rgba(245,158,11,0.05)] dark:shadow-[0_0_25px_rgba(245,158,11,0.25),0_0_50px_rgba(245,158,11,0.1)]",
    iconBg: "bg-amber-500/15 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    valueColor: "text-amber-700 dark:text-amber-400",
  },
  sky: {
    border: "border-sky-600/50 dark:border-sky-500/40",
    glow: "shadow-[0_0_25px_rgba(14,165,233,0.15),0_0_50px_rgba(14,165,233,0.05)] dark:shadow-[0_0_25px_rgba(14,165,233,0.25),0_0_50px_rgba(14,165,233,0.1)]",
    iconBg: "bg-sky-500/15 dark:bg-sky-500/20",
    iconColor: "text-sky-600 dark:text-sky-400",
    valueColor: "text-sky-700 dark:text-sky-400",
  },
  destructive: {
    border: "border-destructive/50 dark:border-destructive/40",
    glow: "shadow-[0_0_25px_rgba(239,68,68,0.15),0_0_50px_rgba(239,68,68,0.05)] dark:shadow-[0_0_25px_rgba(239,68,68,0.25),0_0_50px_rgba(239,68,68,0.1)]",
    iconBg: "bg-destructive/15 dark:bg-destructive/20",
    iconColor: "text-destructive",
    valueColor: "text-destructive",
  },
} as const;

export const HeroMetricCard = memo(function HeroMetricCard({
  label,
  value,
  previousValue,
  format,
  color,
  icon: Icon,
  currencySymbol = "R$",
  delay = 0,
  children,
}: HeroMetricCardProps) {
  // Calculate trend
  const trend = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / Math.abs(previousValue)) * 100
    : null;

  const isTrendPositive = trend !== null && trend >= 0;

  const classes = colorClasses[color];

  const renderValue = () => {
    if (format === "currency") {
      return (
        <AnimatedCurrency
          value={value}
          symbol={currencySymbol}
          size="2xl"
          className={classes.valueColor}
        />
      );
    }
    // percent format - use simple animated display
    return (
      <span className={cn("text-2xl md:text-3xl font-bold tabular-nums", classes.valueColor)}>
        {Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}%
      </span>
    );
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 min-h-[180px]",
        "bg-card/80 backdrop-blur-xl",
        "border transition-[transform,box-shadow] duration-300",
        "hover:shadow-2xl hover:-translate-y-1",
        "animate-fade-in",
        classes.border,
        classes.glow
      )}
      style={{ animationDelay: `${delay * 1000}ms`, animationFillMode: 'backwards' }}
    >
      {/* Background gradient decoration */}
      <div
        className={cn(
          "absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl",
          color === "emerald" && "bg-emerald-500",
          color === "amber" && "bg-amber-500",
          color === "sky" && "bg-sky-500",
          color === "destructive" && "bg-destructive"
        )}
      />

      {/* Header with icon and label */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("p-2.5 rounded-xl", classes.iconBg)}>
          <Icon className={cn("h-5 w-5", classes.iconColor)} />
        </div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          {label}
        </span>
      </div>

      {/* Value display */}
      {children ? (
        <div className="flex flex-col items-center justify-center flex-1">
          {children}
        </div>
      ) : (
        <div className="space-y-2">
          {renderValue()}

          {/* Trend badge */}
          {trend !== null && (
            <div className="flex items-center gap-1.5">
              {isTrendPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  isTrendPositive ? "text-success" : "text-destructive"
                )}
              >
                {isTrendPositive ? "+" : ""}
                {trend.toFixed(1)}% vs mês anterior
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
