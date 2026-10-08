'use client';

import { memo } from "react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import { type PeriodType, PERIOD_LABELS } from "@/lib/periodUtils";
import { AnimatedCurrency } from "@/components/ui/animated-currency";
import { currencyCompact } from "@/lib/formatters";

interface MobileBalanceHeroProps {
  totalBalance?: number;
  change?: { value: number; type: "increase" | "decrease" };
  receitas?: number;
  despesas?: number;
  economia?: number;
  currencySymbol?: string;
  className?: string;
  selectedPeriod?: PeriodType;
  onPeriodChange?: (period: PeriodType) => void;
}

export const MobileBalanceHero = memo(function MobileBalanceHero({
  totalBalance = 84300.23,
  change = { value: 42, type: "increase" },
  receitas = 12500,
  despesas = 8200,
  economia = 4300,
  currencySymbol = "R$",
  className,
  selectedPeriod = "month",
  onPeriodChange,
}: MobileBalanceHeroProps) {
  const periods: PeriodType[] = ["day", "week", "month", "year"];

  return (
    <GlassCard variant="warm" padding="lg" shine className={cn("", className)}>
      {/* Period Selector */}
      {onPeriodChange && (
        <div className="flex items-center justify-center gap-1 p-1 mb-4 rounded-lg bg-muted/50 dark:bg-glass-elevated/50">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={cn(
                "flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors",
                selectedPeriod === p
                  ? "bg-gold-500 text-numa-deep"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      )}

      {/* Main balance */}
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground mb-1">Resultado Líquido</p>
        <AnimatedCurrency
          value={totalBalance}
          symbol={currencySymbol}
          size="3xl"
          className="text-foreground"
        />

        {/* Change badge */}
        <div
          className={cn(
            "inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold",
            change.type === "increase"
              ? "bg-success/15 text-success"
              : "bg-destructive/15 text-destructive"
          )}
        >
          <span>{change.type === "increase" ? "↗" : "↘"}</span>
          <span>{change.type === "increase" ? "+" : ""}{change.value}%</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-glass-border my-4" />

      {/* Sub-metrics */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Receitas
          </p>
          <p className="text-sm font-semibold text-success tabular-nums whitespace-nowrap">
            {currencyCompact(receitas, currencySymbol)}
          </p>
        </div>
        <div className="border-x border-glass-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Despesas
          </p>
          <p className="text-sm font-semibold text-destructive tabular-nums whitespace-nowrap">
            {currencyCompact(despesas, currencySymbol)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Economia
          </p>
          <p className="text-sm font-semibold text-gold-400 tabular-nums whitespace-nowrap">
            {currencyCompact(economia, currencySymbol)}
          </p>
        </div>
      </div>
    </GlassCard>
  );
});

MobileBalanceHero.displayName = 'MobileBalanceHero';
