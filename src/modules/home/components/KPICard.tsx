import { memo } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  currencySymbol: string;
  icon: LucideIcon;
  colorClass: string;
  textColorClass?: string;
  variant?: "success" | "warning" | "danger" | "info" | "brand";
}

const variantStyles = {
  success: {
    bg: "bg-success/10 dark:bg-success/20",
    border: "border-success/30",
    text: "text-success",
    iconBg: "bg-success/20",
  },
  warning: {
    bg: "bg-warning/10 dark:bg-warning/20",
    border: "border-warning/30",
    text: "text-warning",
    iconBg: "bg-warning/20",
  },
  danger: {
    bg: "bg-destructive/10 dark:bg-destructive/20",
    border: "border-destructive/30",
    text: "text-destructive",
    iconBg: "bg-destructive/20",
  },
  info: {
    bg: "bg-info/10 dark:bg-info/20",
    border: "border-info/30",
    text: "text-info",
    iconBg: "bg-info/20",
  },
  brand: {
    bg: "bg-brand/10 dark:bg-brand/20",
    border: "border-brand/30",
    text: "text-brand",
    iconBg: "bg-brand/20",
  },
};

// Pure formatting function - defined outside component
const formatCurrency = (amount: number, currencySymbol: string) => {
  if (amount >= 1000000) {
    return `${currencySymbol} ${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `${currencySymbol} ${(amount / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const KPICard = memo(function KPICard({
  title,
  value,
  currencySymbol,
  icon: Icon,
  colorClass,
  textColorClass = "text-white",
  variant,
}: KPICardProps) {
  // Use semantic variant if provided, otherwise use colorClass
  if (variant) {
    const styles = variantStyles[variant];
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl p-5 transition-[transform,box-shadow] duration-300 hover:shadow-lg hover:-translate-y-0.5 border",
          styles.bg,
          styles.border
        )}
      >
        {/* Background decoration */}
        <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full", styles.iconBg, "opacity-50")} />
        <div className={cn("absolute -bottom-4 -right-4 w-16 h-16 rounded-full", styles.iconBg, "opacity-30")} />

        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className={cn("text-2xl font-bold tabular-nums", styles.text)}>
              {value > 0 ? formatCurrency(value, currencySymbol) : `${currencySymbol} 0,00`}
            </p>
          </div>
          <div className={cn("p-2 rounded-lg", styles.iconBg)}>
            <Icon className={cn("h-5 w-5", styles.text)} />
          </div>
        </div>
      </div>
    );
  }

  // Legacy colorClass support
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-5 transition-[transform,box-shadow] duration-300 hover:shadow-lg hover:-translate-y-0.5",
        colorClass
      )}
    >
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />

      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn("text-sm font-medium opacity-90", textColorClass)}>
            {title}
          </p>
          <p className={cn("text-2xl font-bold tabular-nums", textColorClass)}>
            {value > 0 ? formatCurrency(value, currencySymbol) : `${currencySymbol} 0,00`}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-white/20">
          <Icon className={cn("h-5 w-5", textColorClass)} />
        </div>
      </div>
    </div>
  );
});
