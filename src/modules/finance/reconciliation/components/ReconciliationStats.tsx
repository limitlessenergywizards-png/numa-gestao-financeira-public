import { Wallet, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { MetricCardsGrid, GradientMetricCardProps } from '@/components/ui/metric-cards-grid';
import { formatCurrency } from '@/lib/formatters';

interface ReconciliationStatsProps {
  stats: {
    totalBank: number;
    totalSystem: number;
    totalReconciled: number;
    totalPending: number;
    difference: number;
    reconciledCount: number;
    pendingCount: number;
    bankCount: number;
  };
  currencySymbol?: string;
}

export function ReconciliationStats({ stats, currencySymbol = 'R$' }: ReconciliationStatsProps) {
  const format = (value: number) => 
    formatCurrency(value, { symbol: currencySymbol });

  const cards: GradientMetricCardProps[] = [
    {
      title: 'Total Extrato',
      value: format(stats.totalBank),
      subtitle: `${stats.bankCount} transações`,
      icon: Wallet,
      gradient: 'from-cyan-500 via-indigo-500 to-purple-600',
    },
    {
      title: 'Conciliado',
      value: format(stats.totalReconciled),
      subtitle: `${stats.reconciledCount} transações`,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 via-emerald-600 to-green-700',
    },
    {
      title: 'Pendentes',
      value: format(stats.totalPending),
      subtitle: `${stats.pendingCount} transações`,
      icon: Clock,
      gradient: 'from-amber-500 via-orange-500 to-yellow-600',
    },
    {
      title: 'Diferença',
      value: format(stats.difference),
      subtitle: stats.difference === 0 ? 'Conciliado ✓' : 'A verificar',
      icon: AlertTriangle,
      gradient: stats.difference === 0 
        ? 'from-teal-600 via-teal-700 to-green-800'
        : 'from-rose-500 via-rose-600 to-red-700',
    },
  ];

  return <MetricCardsGrid cards={cards} />;
}
