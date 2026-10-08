'use client';

import { useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, ChevronRight, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MAIN_ROUTES } from "@/lib/routes";
import { useDREData } from "@/modules/finance/dre/hooks/useDREData";
import type { DREPeriod } from "@/modules/finance/dre/hooks/useDREData";
import { getMarginLevel, MARGIN_TEXT_CLASSES } from "@/lib/formatters";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DRESummaryCardProps {
  companyId: string | undefined;
  currencySymbol?: string;
  drePeriod?: DREPeriod;
  customStartDate?: Date;
  customEndDate?: Date;
}

export const DRESummaryCard = memo(function DRESummaryCard({
  companyId,
  currencySymbol = "R$",
  drePeriod = "current_month",
  customStartDate,
  customEndDate,
}: DRESummaryCardProps) {
  const router = useRouter();
  const { summary, indicators, isLoading } = useDREData(companyId, drePeriod, customStartDate, customEndDate);

  // Fetch historical data for sparkline (last 6 months)
  const { data: historicalData } = useQuery({
    queryKey: ["dre-historical", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        // Fetch receivables (revenue)
        const { data: receivables } = await supabase
          .from("receivables")
          .select("total_amount")
          .eq("company_id", companyId)
          .eq("is_deleted", false)
          .eq("status", "pago")
          .gte("due_date", format(start, "yyyy-MM-dd"))
          .lte("due_date", format(end, "yyyy-MM-dd"));

        // Fetch payables (costs + expenses)
        const { data: payables } = await supabase
          .from("payables")
          .select("total_amount")
          .eq("company_id", companyId)
          .eq("is_deleted", false)
          .eq("status", "pago")
          .gte("due_date", format(start, "yyyy-MM-dd"))
          .lte("due_date", format(end, "yyyy-MM-dd"));

        const totalRevenue = receivables?.reduce((acc, r) => acc + (r.total_amount || 0), 0) || 0;
        const totalExpenses = payables?.reduce((acc, p) => acc + (p.total_amount || 0), 0) || 0;

        months.push({
          month: format(date, "MMM", { locale: ptBR }),
          result: totalRevenue - totalExpenses,
          revenue: totalRevenue,
        });
      }

      return months;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const variation = useMemo(() => {
    if (summary.previousNetResult === 0) return summary.netResult > 0 ? 100 : 0;
    return ((summary.netResult - summary.previousNetResult) / Math.abs(summary.previousNetResult)) * 100;
  }, [summary]);

  const isPositive = summary.netResult >= 0;
  const isGrowth = variation > 0;

  const formatCurrency = (value: number) =>
    `${currencySymbol} ${Math.abs(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const formatCompact = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (absValue >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toFixed(0);
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-0">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0 overflow-hidden relative group">
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10",
        isPositive
          ? "bg-gradient-to-br from-success to-emerald-400"
          : "bg-gradient-to-br from-destructive to-red-400"
      )} />

      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center",
              isPositive ? "bg-success/10" : "bg-destructive/10"
            )}>
              <BarChart3 className={cn("h-3.5 w-3.5", isPositive ? "text-success" : "text-destructive")} />
            </div>
            Resultado do Mês
          </CardTitle>
          <Badge
            variant={isPositive ? "default" : "destructive"}
            className={cn(
              "text-[10px] px-1.5 py-0",
              isPositive && "bg-success/10 text-success hover:bg-success/20"
            )}
          >
            {isPositive ? "Lucro" : "Prejuízo"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-3">
        {/* Main Value */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className={cn(
              "text-2xl sm:text-3xl font-bold tracking-tight",
              isPositive ? "text-success" : "text-destructive"
            )}>
              {isPositive ? "" : "-"}{currencySymbol} {formatCompact(summary.netResult)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receita: {formatCurrency(summary.grossRevenue)}
            </p>
          </div>

          {/* Variation badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full cursor-help",
                isGrowth
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}>
                {isGrowth ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>{Number.isInteger(Math.abs(variation)) ? Math.abs(variation).toFixed(0) : Math.abs(variation).toFixed(1)}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {isGrowth ? "Crescimento" : "Queda"} vs mês anterior
              </p>
              <p className="text-[10px] text-muted-foreground">
                Anterior: {formatCurrency(summary.previousNetResult)}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Sparkline Chart */}
        {historicalData && historicalData.length > 0 && (
          <div className="h-16 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="dreResultGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Resultado"]}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="result"
                  stroke={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                  strokeWidth={2}
                  fill="url(#dreResultGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Indicators */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/50 cursor-help transition-colors hover:bg-muted/50 hover:border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Margem Bruta</p>
                <p className={cn(
                  "text-xl font-bold tracking-tight",
                  MARGIN_TEXT_CLASSES[getMarginLevel(indicators.grossMargin, 'bruta')]
                )}>
                  {Number.isInteger(indicators.grossMargin) ? indicators.grossMargin.toFixed(0) : indicators.grossMargin.toFixed(1)}%
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">Margem Bruta</p>
              <p className="text-[10px] text-muted-foreground">
                (Receita - Custos) / Receita
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/50 cursor-help transition-colors hover:bg-muted/50 hover:border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Margem Líquida</p>
                <p className={cn(
                  "text-xl font-bold tracking-tight",
                  MARGIN_TEXT_CLASSES[getMarginLevel(indicators.netMargin, 'liquida')]
                )}>
                  {Number.isInteger(indicators.netMargin) ? indicators.netMargin.toFixed(0) : indicators.netMargin.toFixed(1)}%
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">Margem Líquida</p>
              <p className="text-[10px] text-muted-foreground">
                Resultado / Receita
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/50 cursor-help transition-colors hover:bg-muted/50 hover:border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Result. Oper.</p>
                <p className="text-xl font-bold tracking-tight text-foreground">
                  {formatCompact(indicators.ebitda)}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">Resultado Operacional</p>
              <p className="text-[10px] text-muted-foreground">
                {formatCurrency(indicators.ebitda)}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Action Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 text-xs justify-between group/btn"
          onClick={() => router.push(MAIN_ROUTES.DRE)}
        >
          <span>Ver DRE Completo</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
});
