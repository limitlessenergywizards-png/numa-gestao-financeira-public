import { memo } from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { AnimatedNumber } from '@/modules/home/components/AnimatedNumber';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface CashFlowSummaryCardsProps {
  totalEntradas: number;
  totalSaidas: number;
  saldoPeriodo: number;
  currencySymbol: string;
}

// ============================================
// SUMMARY CARD COMPONENT
// ============================================

interface SummaryCardProps {
  title: string;
  value: number;
  currencySymbol: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  prefix?: string;
  index: number;
}

const SummaryCard = memo(function SummaryCard({
  title,
  value,
  currencySymbol,
  icon: Icon,
  gradient,
  prefix = '',
  index,
}: SummaryCardProps) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}>
      <Card className={cn(
        "p-3 sm:p-0 relative overflow-hidden hover:shadow-xl transition-[transform,box-shadow] shadow-lg",
        gradient
      )}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute -bottom-4 -right-4 w-12 h-12 sm:w-14 sm:h-14 bg-white/5 rounded-full" />

        {/* Mobile layout */}
        <div className="flex items-center gap-3 sm:hidden relative z-10">
          <div className="p-2 rounded-lg bg-white/20 shrink-0">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/80">{title}</p>
            <p className="text-lg font-bold text-white tabular-nums">
              <AnimatedNumber
                value={value}
                prefix={`${prefix}${currencySymbol} `}
              />
            </p>
          </div>
        </div>

        {/* Desktop layout */}
        <CardHeader className="hidden sm:flex flex-row items-center gap-3 pb-2 relative z-10">
          <div className="p-2.5 rounded-xl bg-white/20">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <CardDescription className="text-sm font-medium text-white/90">
            {title}
          </CardDescription>
        </CardHeader>
        <CardContent className="hidden sm:block pt-0 relative z-10">
          <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
            <AnimatedNumber
              value={value}
              prefix={`${prefix}${currencySymbol} `}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================

export const CashFlowSummaryCards = memo(function CashFlowSummaryCards({
  totalEntradas,
  totalSaidas,
  saldoPeriodo,
  currencySymbol,
}: CashFlowSummaryCardsProps) {
  return (
    <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-3">
      <SummaryCard
        title="Total Entradas"
        value={totalEntradas}
        currencySymbol={currencySymbol}
        icon={TrendingUp}
        gradient="bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 border-emerald-400/30"
        index={0}
      />

      <SummaryCard
        title="Total Saídas"
        value={totalSaidas}
        currencySymbol={currencySymbol}
        icon={TrendingDown}
        gradient="bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 border-rose-400/30"
        index={1}
      />

      <SummaryCard
        title="Saldo do Período"
        value={saldoPeriodo}
        currencySymbol={currencySymbol}
        icon={Wallet}
        prefix={saldoPeriodo >= 0 ? '+' : ''}
        gradient={saldoPeriodo >= 0
          ? "bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 border-teal-400/30"
          : "bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 border-orange-400/30"
        }
        index={2}
      />
    </div>
  );
});
