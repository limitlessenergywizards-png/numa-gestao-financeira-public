import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import type { AccountStats, AccountType } from "../../types";

interface AccountSummaryCardsProps {
  stats: AccountStats;
  accountType: AccountType;
  currencySymbol: string;
}

// Card configuration based on account type
const getCardConfigs = (accountType: AccountType) => {
  const isPayer = accountType === 'payable';

  return {
    total: {
      label: isPayer ? 'Total a Pagar' : 'Total a Receber',
      gradient: isPayer
        ? 'from-sky-500 to-sky-600'
        : 'from-teal-500 to-teal-600',
      icon: DollarSign,
    },
    paid: {
      label: isPayer ? 'Pago' : 'Recebido',
      gradient: 'from-emerald-500 to-emerald-600',
      icon: CheckCircle,
    },
    pending: {
      label: 'Pendente',
      gradient: 'from-amber-500 to-amber-600',
      icon: Clock,
    },
    overdue: {
      label: 'Em Atraso',
      gradient: 'from-rose-500 to-rose-600',
      icon: AlertTriangle,
    },
  };
};

// Individual stat card
const StatCard = memo(({
  label,
  value,
  gradient,
  icon: Icon,
  currencySymbol,
  count,
}: {
  label: string;
  value: number;
  gradient: string;
  icon: typeof DollarSign;
  currencySymbol: string;
  count?: number;
}) => {
  const formattedValue = `${currencySymbol} ${(value / 1).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return (
    <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${gradient} shadow-lg`}>
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-full bg-white/5" />
      <CardContent className="p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{label}</p>
            <p className="text-2xl font-bold text-white">{formattedValue}</p>
            {count !== undefined && (
              <p className="text-xs text-white/70">{count} {count === 1 ? 'título' : 'títulos'}</p>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

export const AccountSummaryCards = memo(({
  stats,
  accountType,
  currencySymbol
}: AccountSummaryCardsProps) => {
  const configs = getCardConfigs(accountType);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label={configs.total.label}
        value={stats.total}
        gradient={configs.total.gradient}
        icon={configs.total.icon}
        currencySymbol={currencySymbol}
        count={stats.totalCount}
      />
      <StatCard
        label={configs.paid.label}
        value={stats.paidOrReceived}
        gradient={configs.paid.gradient}
        icon={configs.paid.icon}
        currencySymbol={currencySymbol}
        count={stats.paidCount}
      />
      <StatCard
        label={configs.pending.label}
        value={stats.pendingAmount}
        gradient={configs.pending.gradient}
        icon={configs.pending.icon}
        currencySymbol={currencySymbol}
        count={stats.pendingCount}
      />
      <StatCard
        label={configs.overdue.label}
        value={stats.overdueAmount}
        gradient={configs.overdue.gradient}
        icon={configs.overdue.icon}
        currencySymbol={currencySymbol}
        count={stats.overdueCount}
      />
    </div>
  );
});

AccountSummaryCards.displayName = 'AccountSummaryCards';
