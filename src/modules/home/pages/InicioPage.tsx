'use client';

import { useMemo, memo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthState } from "@/contexts/AuthContext";
import { useCompanyState } from "@/contexts/CompanyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCanEdit } from "@/hooks/useCanEdit";
import { useFormatters } from "@/hooks/useFormatters";
import { useDateRange } from "@/hooks/useDateRange";
import type { QuickPeriod } from "@/hooks/useDateRange";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MAIN_ROUTES, REPORT_ROUTES, SETTINGS_ROUTES } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip as TooltipUI, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Building2,
  CalendarDays,

} from "lucide-react";
import { useRouter } from "next/navigation";
import { format, addDays, isBefore, startOfDay, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { OptimizedAnimatedNumber } from "@/modules/analytics/dashboard/components/OptimizedAnimatedNumber";
import { DRESummaryCard } from "@/modules/analytics/dashboard/components/DRESummaryCard";
import { HeroMetricsRow } from "@/modules/analytics/dashboard/components/HeroMetricsRow";
import { DashboardFilters } from "@/modules/analytics/dashboard/components/DashboardFilters";
import { DashboardGrid, DraggableWidget, DraggableWidgetOverlay } from "@/modules/analytics/dashboard/components";
import { useDashboardQueries } from "@/modules/analytics/dashboard/hooks/useDashboardQueries";
import { useInicioLayout } from "@/modules/analytics/dashboard/hooks/useInicioLayout";
import type { DREPeriod } from "@/modules/finance/dre/hooks/useDREData";



// Re-export the optimized AnimatedNumber for backwards compatibility
const AnimatedNumber = memo(({ value, prefix = "" }: { value: number; prefix?: string }) => (
  <OptimizedAnimatedNumber value={value} prefix={prefix} />
));

// --- Constants extracted outside component to prevent re-creation ---
const KPI_CARD_COLORS = [
  { bg: "bg-[hsl(142,50%,35%)]", iconBg: "bg-rose-100", iconColor: "text-rose-600" },
  { bg: "bg-[hsl(174,50%,40%)]", iconBg: "bg-teal-100", iconColor: "text-teal-600" },
  { bg: "bg-[hsl(38,85%,50%)]", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  { bg: "bg-[hsl(12,70%,55%)]", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
] as const;

const INCOME_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(142, 70%, 45%)",
  "hsl(142, 60%, 52%)",
  "hsl(158, 64%, 42%)",
  "hsl(158, 55%, 50%)",
] as const;

const EXPENSE_COLORS = [
  "hsl(48, 96%, 70%)",
  "hsl(180, 80%, 65%)",
  "hsl(260, 70%, 75%)",
  "hsl(0, 0%, 100%)",
  "hsl(140, 60%, 65%)",
] as const;

// Pre-computed animation delay styles to avoid inline object re-creation
const ANIMATION_DELAYS = Array.from({ length: 8 }, (_, i) => ({
  animationDelay: `${i * 0.08}s`,
}));
const STYLE_DELAY_CASHFLOW = { animationDelay: "0.56s" } as const;
const STYLE_DELAY_INCOME = { animationDelay: "0.64s" } as const;
const STYLE_DELAY_EXPENSE = { animationDelay: "0.72s" } as const;

// Pure helper functions extracted outside component - no re-creation on render
const calcRemaining = (items: { total_amount: number; paid_amount: number }[]) =>
  items.reduce((acc, item) => acc + (item.total_amount - item.paid_amount), 0);

const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const getGreeting = (hour: number, t: (key: string) => string) => {
  if (hour < 12) return t("dashboard.greetingMorning");
  if (hour < 18) return t("dashboard.greetingAfternoon");
  return t("dashboard.greetingEvening");
};

/** Map useDateRange quick period to DRE period */
const mapToDREPeriod = (quickPeriod: QuickPeriod): DREPeriod => {
  switch (quickPeriod) {
    case "month": return "current_month";
    case "last_month": return "previous_month";
    case "year": return "year";
    default: return "custom";
  }
};

export default function Inicio() {
  const { profile } = useAuthState();
  const { currentCompany, companies } = useCompanyState();
  const { t } = useLanguage();
  const canEdit = useCanEdit();
  const router = useRouter();
  const { formatCurrency } = useFormatters();

  // Period filter state
  const {
    startDate: filterStartDate,
    endDate: filterEndDate,
    quickPeriod,
    setQuickPeriod,
    setCustomRange,
    startDateStr,
    endDateStr,
  } = useDateRange({ initialPeriod: "month" });

  // Map to DateRange for dashboard queries and DREPeriod for DRE components
  const dateRange = useMemo(() => ({ start: startDateStr, end: endDateStr }), [startDateStr, endDateStr]);
  const drePeriod = useMemo(() => mapToDREPeriod(quickPeriod), [quickPeriod]);

  // Drag-and-drop layout management
  const {
    layout,
    widgetOrder,
    reorderWidgets,
    getWidgetConfig,
    resetToDefault,
    isCustomLayout,
  } = useInicioLayout(currentCompany?.id);

  const greeting = useMemo(() => getGreeting(new Date().getHours(), t), [t]);

  // Memoize date calculations to avoid re-creating Date objects on every render
  const today = useMemo(() => startOfDay(new Date()), []);

  // Use unified dashboard queries with period filter
  const {
    receivables: receivablesData,
    payables: payablesData,
    incomeAccounts: incomeAccountsData,
    expenseAccounts: expenseAccountsData,
    lastMonthReceivablesSum,
    lastMonthPayablesSum,
    isLoading: dashboardLoading,
  } = useDashboardQueries(currentCompany?.id, dateRange);

  const isLoading = dashboardLoading;

  // Calculate KPI indicators with dynamic trends
  const indicators = useMemo(() => {
    if (!receivablesData || !payablesData) {
      return [
        { title: t("dashboard.overdueReceivables"), value: 0, count: 0, icon: ArrowDownCircle, color: "text-destructive", bgColor: "bg-destructive/10", type: "overdue" },
        { title: t("dashboard.monthlyReceivables"), value: 0, count: 0, icon: ArrowDownCircle, color: "text-success", bgColor: "bg-success/10", type: "month" },
        { title: t("dashboard.monthlyPayables"), value: 0, count: 0, icon: ArrowUpCircle, color: "text-warning", bgColor: "bg-warning/10", type: "month" },
        { title: t("dashboard.overduePayables"), value: 0, count: 0, icon: ArrowUpCircle, color: "text-destructive", bgColor: "bg-destructive/10", type: "overdue" },
      ];
    }

    const overdueReceivables = receivablesData.filter(r => isBefore(new Date(r.due_date), today));
    const periodReceivables = receivablesData.filter(r => {
      const dueDate = new Date(r.due_date);
      return dueDate >= filterStartDate && dueDate <= filterEndDate;
    });

    const overduePayables = payablesData.filter(p => isBefore(new Date(p.due_date), today));
    const periodPayables = payablesData.filter(p => {
      const dueDate = new Date(p.due_date);
      return dueDate >= filterStartDate && dueDate <= filterEndDate;
    });

    // Dynamic trends from real data (using aggregated sums from server)
    const trends = {
      overdueReceivables: calculateTrend(
        calcRemaining(overdueReceivables),
        lastMonthReceivablesSum.overdue
      ),
      periodReceivables: calculateTrend(
        calcRemaining(periodReceivables),
        lastMonthReceivablesSum.monthly
      ),
      periodPayables: calculateTrend(
        calcRemaining(periodPayables),
        lastMonthPayablesSum.monthly
      ),
      overduePayables: calculateTrend(
        calcRemaining(overduePayables),
        lastMonthPayablesSum.overdue
      ),
    };

    return [
      {
        title: t("dashboard.overdueReceivables"),
        value: calcRemaining(overdueReceivables),
        count: overdueReceivables.length,
        icon: ArrowDownCircle,
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        type: "overdue",
        trend: trends.overdueReceivables,
        trendPositive: trends.overdueReceivables < 0,
      },
      {
        title: t("dashboard.monthlyReceivables"),
        value: calcRemaining(periodReceivables),
        count: periodReceivables.length,
        icon: ArrowDownCircle,
        color: "text-success",
        bgColor: "bg-success/10",
        type: "month",
        trend: trends.periodReceivables,
        trendPositive: trends.periodReceivables > 0,
      },
      {
        title: t("dashboard.monthlyPayables"),
        value: calcRemaining(periodPayables),
        count: periodPayables.length,
        icon: ArrowUpCircle,
        color: "text-warning",
        bgColor: "bg-warning/10",
        type: "month",
        trend: trends.periodPayables,
        trendPositive: trends.periodPayables < 0,
      },
      {
        title: t("dashboard.overduePayables"),
        value: calcRemaining(overduePayables),
        count: overduePayables.length,
        icon: ArrowUpCircle,
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        type: "overdue",
        trend: trends.overduePayables,
        trendPositive: trends.overduePayables < 0,
      },
    ];
  }, [receivablesData, payablesData, lastMonthReceivablesSum, lastMonthPayablesSum, today, filterStartDate, filterEndDate, t]);

  // Generate 15-day cash flow projection
  const cashFlowData = useMemo(() => {
    if (!receivablesData || !payablesData) return [];

    const days: { date: string; day: string; receivables: number; payables: number; balance: number }[] = [];
    let cumulativeBalance = 0;

    for (let i = 0; i < 15; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayLabel = format(date, "dd/MM", { locale: ptBR });

      const dayReceivables = receivablesData
        .filter(r => r.due_date === dateStr)
        .reduce((acc, r) => acc + (r.total_amount - r.paid_amount), 0);

      const dayPayables = payablesData
        .filter(p => p.due_date === dateStr)
        .reduce((acc, p) => acc + (p.total_amount - p.paid_amount), 0);

      cumulativeBalance += dayReceivables - dayPayables;

      days.push({
        date: dateStr,
        day: dayLabel,
        receivables: dayReceivables,
        payables: dayPayables,
        balance: cumulativeBalance,
      });
    }

    return days;
  }, [receivablesData, payablesData, today]);

  /**
   * OPTIMIZATION: Build Map<id, name> once for O(1) lookup per item.
   * Before: .find() inside .forEach() = O(receivables * accounts) per render.
   * After:  O(accounts + receivables) — Map build + single iteration.
   */
  const incomeDistribution = useMemo(() => {
    if (!receivablesData || !incomeAccountsData) return [];

    const accountMap = new Map(incomeAccountsData.map(a => [a.id, a.name]));
    const distribution: Record<string, number> = {};

    for (const r of receivablesData) {
      const name = accountMap.get(r.chart_account_id) || t("dashboard.otherIncome");
      distribution[name] = (distribution[name] || 0) + (r.total_amount - r.paid_amount);
    }

    return Object.entries(distribution)
      .map(([name, value], index) => ({
        name,
        value,
        color: INCOME_COLORS[index % INCOME_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [receivablesData, incomeAccountsData, t]);

  const expenseDistribution = useMemo(() => {
    if (!payablesData || !expenseAccountsData) return [];

    const accountMap = new Map(expenseAccountsData.map(a => [a.id, a.name]));
    const distribution: Record<string, number> = {};

    for (const p of payablesData) {
      const name = accountMap.get(p.chart_account_id) || t("dashboard.otherExpenses");
      distribution[name] = (distribution[name] || 0) + (p.total_amount - p.paid_amount);
    }

    return Object.entries(distribution)
      .map(([name, value], index) => ({
        name,
        value,
        color: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [payablesData, expenseAccountsData, t]);

  const incomeTotal = useMemo(() =>
    incomeDistribution.reduce((acc, item) => acc + item.value, 0),
    [incomeDistribution]
  );

  const expenseTotal = useMemo(() =>
    expenseDistribution.reduce((acc, item) => acc + item.value, 0),
    [expenseDistribution]
  );

  const hasData = cashFlowData.some(d => d.receivables > 0 || d.payables > 0);
  const currencySymbol = currentCompany?.currency_symbol || "R$";

  // Widget components map for drag-and-drop
  const inicioWidgets = useMemo(() => ({
    heroMetrics: (
      <HeroMetricsRow
        companyId={currentCompany?.id}
        currencySymbol={currencySymbol}
        drePeriod={drePeriod}
        customStartDate={drePeriod === "custom" ? filterStartDate : undefined}
        customEndDate={drePeriod === "custom" ? filterEndDate : undefined}
      />
    ),
    kpiCards: (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {indicators.map((indicator, index) => {
          const colors = KPI_CARD_COLORS[index] || KPI_CARD_COLORS[0];
          return (
            <div
              key={indicator.title}
              className={cn(
                "relative overflow-hidden rounded-xl p-5 transition-[transform,box-shadow] duration-300 hover:shadow-xl hover:-translate-y-1 animate-fade-in group",
                colors.bg
              )}
              style={ANIMATION_DELAYS[index]}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 transition-transform group-hover:scale-110" />
              <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />
              <div className="absolute top-1/2 -left-8 w-20 h-20 rounded-full bg-white/5 blur-xl" />
              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-white/90 max-w-[70%] leading-tight">
                    {indicator.title}
                  </p>
                  <div className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                    colors.iconBg
                  )}>
                    <indicator.icon className={cn("h-5 w-5", colors.iconColor)} />
                  </div>
                </div>
                <div className="space-y-2">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-32 bg-white/20" />
                      <Skeleton className="h-4 w-20 bg-white/20" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                          <AnimatedNumber value={indicator.value} prefix={`${currencySymbol} `} />
                        </div>
                        {indicator.trend !== undefined && (
                          <TooltipUI>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full cursor-help transition-transform hover:scale-105",
                                "bg-white/20 text-white backdrop-blur-sm"
                              )}>
                                {indicator.trend > 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                <span>{Math.abs(indicator.trend).toFixed(1)}%</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px]">
                              <p className="text-xs font-medium">
                                Variação de {Math.abs(indicator.trend).toFixed(1)}% em relação ao mês anterior
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Comparação: {format(subMonths(today, 1), "MMMM", { locale: ptBR })} → {format(today, "MMMM", { locale: ptBR })}
                              </p>
                            </TooltipContent>
                          </TooltipUI>
                        )}
                      </div>
                      <p className="text-xs text-white/80 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                        {indicator.count} {indicator.count === 1 ? t("common.title") : t("common.titles")}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ),
    dreSummary: (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-primary" />
          <h3 className="text-base font-semibold text-foreground">Resultado Financeiro</h3>
          <div className="flex-1 h-px bg-border" />
        </div>
        <DRESummaryCard
          companyId={currentCompany?.id}
          currencySymbol={currencySymbol}
          drePeriod={drePeriod}
          customStartDate={drePeriod === "custom" ? filterStartDate : undefined}
          customEndDate={drePeriod === "custom" ? filterEndDate : undefined}
        />
      </div>
    ),

    cashFlow: (
      <Card className="glass-card border-0 animate-fade-in" style={STYLE_DELAY_CASHFLOW}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t("dashboard.projectedCashFlow")}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <CalendarDays className="h-4 w-4" />
                {t("dashboard.next15Days")}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(MAIN_ROUTES.CASH_FLOW)}>
              {t("dashboard.viewReport")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !hasData ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>{t("dashboard.noData")}</p>
                <p className="text-sm">{t("dashboard.noDataDescription")}</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceivables" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPayables" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "receivables" ? t("common.receivables") : name === "payables" ? t("common.payables") : t("common.balance"),
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="receivables"
                  stroke="hsl(var(--success))"
                  fillOpacity={1}
                  fill="url(#colorReceivables)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="payables"
                  stroke="hsl(var(--destructive))"
                  fillOpacity={1}
                  fill="url(#colorPayables)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    ),
    distributions: (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="relative overflow-hidden border-0 animate-fade-in bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg" style={STYLE_DELAY_INCOME}>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                <ArrowDownCircle className="h-4 w-4 text-white" />
              </div>
              {t("dashboard.incomeDistribution")}
            </CardTitle>
            <CardDescription className="text-white/80">{t("dashboard.whereMoneyComesFrom")}</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : incomeDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-white/70 text-sm">
                {t("dashboard.noIncome")}
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={incomeDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                      {incomeDistribution.map((entry, index) => (
                        <Cell key={`income-cell-${index}`} fill={entry.color} className="transition-opacity hover:opacity-80" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }} />
                    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-xs font-medium">Total</text>
                    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-sm font-bold">{currencySymbol} {(incomeTotal / 1000).toFixed(1)}k</text>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {incomeDistribution.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm text-white">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full flex-shrink-0 ring-2 ring-white/30" style={{ backgroundColor: item.color }} />
                        <span className="truncate max-w-[140px] text-white/90">{item.name}</span>
                      </div>
                      <span className="font-medium tabular-nums text-white">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 animate-fade-in bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg" style={STYLE_DELAY_EXPENSE}>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                <ArrowUpCircle className="h-4 w-4 text-white" />
              </div>
              {t("dashboard.expenseDistribution")}
            </CardTitle>
            <CardDescription className="text-white/80">{t("dashboard.whereMoneyGoes")}</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : expenseDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-white/70 text-sm">
                {t("dashboard.noExpenses")}
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={expenseDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                      {expenseDistribution.map((entry, index) => (
                        <Cell key={`expense-cell-${index}`} fill={entry.color} className="transition-opacity hover:opacity-80" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }} />
                    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-xs font-medium">Total</text>
                    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-sm font-bold">{currencySymbol} {(expenseTotal / 1000).toFixed(1)}k</text>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {expenseDistribution.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm text-white">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full flex-shrink-0 ring-2 ring-white/30" style={{ backgroundColor: item.color }} />
                        <span className="truncate max-w-[140px] text-white/90">{item.name}</span>
                      </div>
                      <span className="font-medium tabular-nums text-white">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    ),
  }), [
    currentCompany?.id,
    currencySymbol,
    indicators,
    isLoading,
    incomeTotal,
    expenseTotal,
    incomeDistribution,
    expenseDistribution,
    cashFlowData,
    hasData,
    today,
    t,
    router,
    formatCurrency,
    drePeriod,
    filterStartDate,
    filterEndDate,
  ]);

  return (
    <AppLayout title="Início" description={t("dashboard.subtitle")}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {greeting}, {profile?.full_name?.split(" ")[0] || t("common.user")}! 👋
            </h2>
            <p className="text-muted-foreground">
              {currentCompany
                ? `${t("dashboard.trackFinances")} ${currentCompany.name}`
                : t("dashboard.configureCompany")}
            </p>
          </div>
          <div className="flex gap-2">
            {companies.length > 0 && canEdit && (
              <>
                <Button
                  onClick={() => router.push(MAIN_ROUTES.RECEIVABLES)}
                  variant="outline"
                  className="gap-2 px-3 sm:px-4 h-9 sm:h-10 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                >
                  <ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="text-sm sm:text-base">Receber</span>
                </Button>
                <Button
                  onClick={() => router.push(MAIN_ROUTES.PAYABLES)}
                  variant="outline"
                  className="gap-2 px-3 sm:px-4 h-9 sm:h-10 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/50 text-rose-600 dark:text-rose-400"
                >
                  <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="text-sm sm:text-base">Pagar</span>
                </Button>
              </>
            )}
            {companies.length === 0 && (
              <Button onClick={() => router.push(SETTINGS_ROUTES.ONBOARDING)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("dashboard.registerCompany")}
              </Button>
            )}
          </div>
        </div>

        {/* Period Filter */}
        {companies.length > 0 && (
          <DashboardFilters
            quickPeriod={quickPeriod}
            onQuickPeriodChange={setQuickPeriod}
            startDate={filterStartDate}
            endDate={filterEndDate}
            onCustomRange={setCustomRange}
          />
        )}

        {/* No Company State */}
        {companies.length === 0 ? (
          <Card className="border-dashed animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("dashboard.noCompany")}</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                {t("dashboard.noCompanyDescription")}
              </p>
              <Button onClick={() => router.push(SETTINGS_ROUTES.ONBOARDING)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("dashboard.registerCompany")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DashboardGrid
            widgetOrder={widgetOrder}
            onReorder={reorderWidgets}
            onReset={resetToDefault}
            isCustomLayout={isCustomLayout}
            renderOverlay={(activeId) => {
              const config = getWidgetConfig(activeId);
              const content = inicioWidgets[activeId as keyof typeof inicioWidgets];
              if (!content) return null;
              return (
                <DraggableWidgetOverlay colSpan={config?.colSpan}>
                  {content}
                </DraggableWidgetOverlay>
              );
            }}
          >
            {layout.map((widget) => (
              <DraggableWidget
                key={widget.id}
                id={widget.id}
                colSpan={widget.colSpan}
              >
                {inicioWidgets[widget.id as keyof typeof inicioWidgets]}
              </DraggableWidget>
            ))}
          </DashboardGrid>
        )}
      </div>
    </AppLayout>
  );
}
