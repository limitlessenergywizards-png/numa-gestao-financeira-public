'use client';

import { useMemo, memo } from "react";
import { Wallet, Percent, TrendingUp, DollarSign } from "lucide-react";
import { HeroMetricCard } from "./HeroMetricCard";
import { SpeedometerGauge } from "./SpeedometerGauge";
import { useDREData } from "@/modules/finance/dre/hooks/useDREData";
import type { DREPeriod } from "@/modules/finance/dre/hooks/useDREData";
import { Skeleton } from "@/components/ui/skeleton";

interface HeroMetricsRowProps {
  companyId: string | undefined;
  currencySymbol?: string;
  drePeriod?: DREPeriod;
  customStartDate?: Date;
  customEndDate?: Date;
}

export const HeroMetricsRow = memo(function HeroMetricsRow({
  companyId,
  currencySymbol = "R$",
  drePeriod = "current_month",
  customStartDate,
  customEndDate,
}: HeroMetricsRowProps) {
  const { summary, indicators, isLoading } = useDREData(companyId, drePeriod, customStartDate, customEndDate);

  // Calculate EBITDA margin percentage
  const ebitdaMargin = useMemo(() => {
    if (!summary.netRevenue || summary.netRevenue === 0) return 0;
    return (indicators.ebitda / summary.netRevenue) * 100;
  }, [indicators.ebitda, summary.netRevenue]);

  const previousEbitdaMargin = useMemo(() => {
    if (!summary.previousGrossRevenue || summary.previousGrossRevenue === 0) return 0;
    return (indicators.previousEbitda / summary.previousGrossRevenue) * 100;
  }, [indicators.previousEbitda, summary.previousGrossRevenue]);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[180px] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {/* Receita Líquida */}
      <HeroMetricCard
        label="Receita Líquida"
        value={summary.netRevenue}
        previousValue={summary.previousGrossRevenue}
        format="currency"
        color="emerald"
        icon={Wallet}
        currencySymbol={currencySymbol}
        delay={0}
      />

      {/* Margem Bruta with Speedometer */}
      <HeroMetricCard
        label="Margem Bruta"
        value={indicators.grossMargin}
        previousValue={indicators.previousGrossMargin}
        format="percent"
        color="amber"
        icon={Percent}
        delay={0.1}
      >
        <SpeedometerGauge
          value={indicators.grossMargin}
          label="Margem Bruta"
          previousValue={indicators.previousGrossMargin}
          size="md"
          color="amber"
        />
      </HeroMetricCard>

      {/* Margem Operacional with Speedometer */}
      <HeroMetricCard
        label="Margem Oper."
        value={ebitdaMargin}
        previousValue={previousEbitdaMargin}
        format="percent"
        color="sky"
        icon={TrendingUp}
        delay={0.2}
      >
        <SpeedometerGauge
          value={Math.max(0, Math.min(ebitdaMargin, 100))}
          label="Margem Operacional"
          previousValue={previousEbitdaMargin}
          size="md"
          color="sky"
        />
      </HeroMetricCard>

      {/* Lucro Líquido */}
      <HeroMetricCard
        label="Lucro Líquido"
        value={summary.netResult}
        previousValue={summary.previousNetResult}
        format="currency"
        color={summary.netResult >= 0 ? "emerald" : "destructive"}
        icon={DollarSign}
        currencySymbol={currencySymbol}
        delay={0.3}
      />
    </div>
  );
});
