'use client';

/**
 * TransactionsSummaryCards - Memoized summary metrics for transactions
 * 
 * Displays entry/exit totals, balance, and pending amounts.
 * Uses React.memo to prevent re-renders when parent state changes
 * but these specific values remain the same.
 */

import { memo, useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, Clock } from "lucide-react";
import { MetricCardsGrid, GradientMetricCardProps } from "@/components/ui/metric-cards-grid";

interface TransactionsSummaryCardsProps {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  pendingCount: number;
  pendingAmount: number;
  entradasCount: number;
  saidasCount: number;
  totalCount: number;
  previousEntradas?: number;
  previousSaidas?: number;
  formatCurrency: (value: number) => string;
}

function TransactionsSummaryCardsComponent({
  totalEntradas,
  totalSaidas,
  saldo,
  pendingCount,
  pendingAmount,
  entradasCount,
  saidasCount,
  totalCount,
  previousEntradas = 0,
  previousSaidas = 0,
  formatCurrency,
}: TransactionsSummaryCardsProps) {
  // Memoize trend calculations
  const { entradasTrend, saidasTrend, saldoTrend } = useMemo(() => {
    const entTrend = previousEntradas > 0
      ? ((totalEntradas - previousEntradas) / previousEntradas) * 100
      : 0;
    const saiTrend = previousSaidas > 0
      ? ((totalSaidas - previousSaidas) / previousSaidas) * 100
      : 0;
    const salTrend = previousEntradas > 0 || previousSaidas > 0
      ? (saldo >= 0 ? 1 : -1) * Math.abs(saldo) / Math.max(previousEntradas, previousSaidas, 1) * 100
      : 0;

    return { entradasTrend: entTrend, saidasTrend: saiTrend, saldoTrend: salTrend };
  }, [totalEntradas, totalSaidas, saldo, previousEntradas, previousSaidas]);

  const fmtCount = (n: number) => `${n} ${n === 1 ? 'título' : 'títulos'}`;

  // Memoize cards array
  const cards: GradientMetricCardProps[] = useMemo(() => [
    {
      title: "Entradas",
      value: formatCurrency(totalEntradas),
      icon: TrendingUp,
      gradient: "from-emerald-600 to-emerald-700",
      trend: entradasTrend !== 0 ? { value: entradasTrend } : undefined,
      subtitle: fmtCount(entradasCount),
    },
    {
      title: "Saídas",
      value: formatCurrency(totalSaidas),
      icon: TrendingDown,
      gradient: "from-rose-500 to-rose-600",
      trend: saidasTrend !== 0 ? { value: saidasTrend, invertPositive: true } : undefined,
      subtitle: fmtCount(saidasCount),
    },
    {
      title: "Saldo",
      value: formatCurrency(saldo),
      icon: Wallet,
      gradient: saldo >= 0 ? "from-teal-500 to-teal-600" : "from-rose-500 to-rose-600",
      trend: saldoTrend !== 0 ? { value: saldoTrend } : undefined,
      subtitle: fmtCount(totalCount),
    },
    {
      title: "Pendente",
      value: formatCurrency(pendingAmount),
      icon: Clock,
      gradient: "from-amber-500 to-amber-600",
      subtitle: fmtCount(pendingCount),
    },
  ], [totalEntradas, totalSaidas, saldo, pendingAmount, pendingCount, entradasCount, saidasCount, totalCount, entradasTrend, saidasTrend, saldoTrend, formatCurrency]);

  return <MetricCardsGrid cards={cards} />;
}

// Export memoized version for performance
export const TransactionsSummaryCards = memo(TransactionsSummaryCardsComponent);
