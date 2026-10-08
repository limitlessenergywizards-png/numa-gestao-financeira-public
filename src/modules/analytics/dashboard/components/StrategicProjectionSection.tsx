'use client';

import { useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StrategicProjectionSectionProps {
  currentBalance: number;
  receivables: Array<{ due_date: string; total_amount: number; paid_amount: number }>;
  payables: Array<{ due_date: string; total_amount: number; paid_amount: number }>;
  currencySymbol: string;
}

type PeriodDays = 15 | 30 | 60 | 90;

const SCENARIO_CONFIG = {
  optimistic: {
    label: "Otimista",
    revenueMultiplier: 1.15,
    expenseMultiplier: 0.90,
    color: "hsl(var(--success))",
    bgClass: "from-emerald-500/20 to-emerald-600/10",
    borderClass: "border-emerald-500/30",
    icon: TrendingUp,
  },
  realistic: {
    label: "Realista",
    revenueMultiplier: 1.0,
    expenseMultiplier: 1.0,
    color: "hsl(var(--primary))",
    bgClass: "from-brand/20 to-brand/10",
    borderClass: "border-brand/30",
    icon: Target,
  },
  pessimistic: {
    label: "Pessimista",
    revenueMultiplier: 0.85,
    expenseMultiplier: 1.10,
    color: "hsl(var(--destructive))",
    bgClass: "from-rose-500/20 to-rose-600/10",
    borderClass: "border-rose-500/30",
    icon: TrendingDown,
  },
};

export function StrategicProjectionSection({
  currentBalance,
  receivables,
  payables,
  currencySymbol,
}: StrategicProjectionSectionProps) {
  const [periodDays, setPeriodDays] = useState<PeriodDays>(30);

  const projectionData = useMemo(() => {
    const today = new Date();
    const data: Array<{
      date: string;
      label: string;
      optimistic: number;
      realistic: number;
      pessimistic: number;
    }> = [];

    let optimisticBalance = currentBalance;
    let realisticBalance = currentBalance;
    let pessimisticBalance = currentBalance;

    for (let i = 0; i <= periodDays; i++) {
      const currentDate = addDays(today, i);
      const dateStr = format(currentDate, "yyyy-MM-dd");

      // Calculate receivables for this date
      const dayReceivables = receivables
        .filter((r) => r.due_date === dateStr)
        .reduce((sum, r) => sum + (r.total_amount - r.paid_amount), 0);

      // Calculate payables for this date
      const dayPayables = payables
        .filter((p) => p.due_date === dateStr)
        .reduce((sum, p) => sum + (p.total_amount - p.paid_amount), 0);

      // Apply scenario multipliers
      optimisticBalance +=
        dayReceivables * SCENARIO_CONFIG.optimistic.revenueMultiplier -
        dayPayables * SCENARIO_CONFIG.optimistic.expenseMultiplier;
      realisticBalance +=
        dayReceivables * SCENARIO_CONFIG.realistic.revenueMultiplier -
        dayPayables * SCENARIO_CONFIG.realistic.expenseMultiplier;
      pessimisticBalance +=
        dayReceivables * SCENARIO_CONFIG.pessimistic.revenueMultiplier -
        dayPayables * SCENARIO_CONFIG.pessimistic.expenseMultiplier;

      data.push({
        date: dateStr,
        label: format(currentDate, "dd/MM", { locale: ptBR }),
        optimistic: optimisticBalance,
        realistic: realisticBalance,
        pessimistic: pessimisticBalance,
      });
    }

    return data;
  }, [currentBalance, receivables, payables, periodDays]);

  const kpis = useMemo(() => {
    const optimisticValues = projectionData.map((d) => d.optimistic);
    const realisticValues = projectionData.map((d) => d.realistic);
    const pessimisticValues = projectionData.map((d) => d.pessimistic);

    const peakBalance = Math.max(...optimisticValues);
    const valleyBalance = Math.min(...pessimisticValues);
    const averageBalance =
      realisticValues.reduce((sum, v) => sum + v, 0) / realisticValues.length;

    // Find days to negative balance (if any)
    const negativeIndex = pessimisticValues.findIndex((v) => v < 0);
    const daysToNegative = negativeIndex >= 0 ? negativeIndex : null;

    // Calculate trend
    const lastValue = realisticValues[realisticValues.length - 1];
    const trend =
      lastValue > currentBalance * 1.05
        ? "up"
        : lastValue < currentBalance * 0.95
        ? "down"
        : "stable";

    return {
      peakBalance,
      valleyBalance,
      averageBalance,
      daysToNegative,
      trend,
      finalOptimistic: optimisticValues[optimisticValues.length - 1],
      finalRealistic: realisticValues[realisticValues.length - 1],
      finalPessimistic: pessimisticValues[pessimisticValues.length - 1],
    };
  }, [projectionData, currentBalance]);

  const formatCurrency = (value: number) => {
    return `${currencySymbol} ${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const TrendIcon =
    kpis.trend === "up"
      ? ArrowUpRight
      : kpis.trend === "down"
      ? ArrowDownRight
      : Minus;

  const trendColor =
    kpis.trend === "up"
      ? "text-emerald-400"
      : kpis.trend === "down"
      ? "text-rose-400"
      : "text-amber-400";

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-brand/20 to-brand/10 border border-brand/30">
            <Calendar className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Projeção Estratégica</h3>
            <p className="text-sm text-muted-foreground">
              Análise de cenários para os próximos {periodDays} dias
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={kpis.trend === "up" ? "success" : kpis.trend === "down" ? "danger" : "warning"}
            className="gap-1"
          >
            <TrendIcon className="h-3 w-3" />
            {kpis.trend === "up" ? "Crescente" : kpis.trend === "down" ? "Decrescente" : "Estável"}
          </Badge>

          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {([15, 30, 60, 90] as PeriodDays[]).map((days) => (
              <Button
                key={days}
                variant={periodDays === days ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPeriodDays(days)}
              >
                {days}d
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {kpis.daysToNegative !== null && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/30 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <div>
              <p className="font-medium text-rose-300">Alerta de Saldo Negativo</p>
              <p className="text-sm text-muted-foreground">
                No cenário pessimista, o saldo pode ficar negativo em{" "}
                <strong className="text-rose-400">{kpis.daysToNegative} dias</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(Object.entries(SCENARIO_CONFIG) as [keyof typeof SCENARIO_CONFIG, typeof SCENARIO_CONFIG.optimistic][]).map(
          ([key, config], index) => {
            const Icon = config.icon;
            const finalValue =
              key === "optimistic"
                ? kpis.finalOptimistic
                : key === "realistic"
                ? kpis.finalRealistic
                : kpis.finalPessimistic;
            const percentChange = ((finalValue - currentBalance) / currentBalance) * 100;

            return (
              <div
                key={key}
                className={cn(
                  "p-4 rounded-xl bg-gradient-to-br border backdrop-blur-sm animate-fade-in",
                  config.bgClass,
                  config.borderClass
                )}
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4" style={{ color: config.color }} />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <p className="text-xl font-bold mb-1">{formatCurrency(finalValue)}</p>
                <p
                  className={cn(
                    "text-xs",
                    percentChange >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {percentChange >= 0 ? "+" : ""}
                  {percentChange.toFixed(1)}% vs atual
                </p>
              </div>
            );
          }
        )}
      </div>

      {/* Chart */}
      <div className="h-[300px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="optimisticGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="realisticGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="pessimisticGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="label"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                `${currencySymbol}${(value / 1000).toFixed(0)}k`
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "0.75rem",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "optimistic"
                  ? "Otimista"
                  : name === "realistic"
                  ? "Realista"
                  : "Pessimista",
              ]}
            />
            <Legend
              formatter={(value) =>
                value === "optimistic"
                  ? "Otimista"
                  : value === "realistic"
                  ? "Realista"
                  : "Pessimista"
              }
            />
            <ReferenceLine
              y={currentBalance}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              label={{
                value: "Saldo Atual",
                position: "insideTopRight",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="optimistic"
              stroke="hsl(var(--success))"
              fill="url(#optimisticGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="realistic"
              stroke="hsl(var(--primary))"
              fill="url(#realisticGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="pessimistic"
              stroke="hsl(var(--destructive))"
              fill="url(#pessimisticGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-muted-foreground">Pico Projetado</span>
          </div>
          <p className="text-lg font-bold text-emerald-400">
            {formatCurrency(kpis.peakBalance)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-rose-400" />
            <span className="text-sm text-muted-foreground">Vale Projetado</span>
          </div>
          <p className="text-lg font-bold text-rose-400">
            {formatCurrency(kpis.valleyBalance)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-brand" />
            <span className="text-sm text-muted-foreground">Média do Período</span>
          </div>
          <p className="text-lg font-bold text-brand">
            {formatCurrency(kpis.averageBalance)}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
