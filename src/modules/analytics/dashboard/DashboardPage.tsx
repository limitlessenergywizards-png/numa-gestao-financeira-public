'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useCanEdit } from "@/hooks/useCanEdit";

import { useFinancialHistory } from "./hooks/useFinancialHistory";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MAIN_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Landmark,
  Receipt,
  CreditCard,
  Percent,
  Clock,
  AlertTriangle,
  CalendarCheck,
} from "lucide-react";
import { startOfMonth, endOfMonth, format, formatDistanceToNow, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MonthSituationCard,
} from "@/modules/home/components";
import {
  GlassMetricCard,
  GlassAreaChart,
  GlassRecentTransactions,
} from "@/components/glass";
import {
  StrategicProjectionSection,
  DashboardSection,
} from "./components";
import { useDashboardQueries } from "./hooks/useDashboardQueries";
import { PeriodType, getDateRange, PERIOD_LABELS } from "@/lib/periodUtils";
import { cn } from "@/lib/utils";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/transitions";

export default function Dashboard() {
  const { user, isLoading: authLoading, profile } = useAuthState();
  const { currentCompany, isLoading: companyLoading } = useCompany();
  const canEdit = useCanEdit();
  const router = useRouter();

  // Period filter state
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');

  // Calculate date range based on selected period
  const dateRange = useMemo(() => getDateRange(selectedPeriod), [selectedPeriod]);

  // Use unified dashboard queries with period filtering
  const {
    receivables,
    payables,
    bankAccounts,
    transactions: rawTransactions,
    financialTotals,
    queries, // Access individual query states
  } = useDashboardQueries(currentCompany?.id, dateRange);

  // Fetch historical data for the chart
  const { data: financialHistory } = useFinancialHistory(currentCompany?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(PUBLIC_ROUTES.AUTH);
    }
  }, [user, authLoading, router]);

  const currencySymbol = currentCompany?.currency_symbol || "R$";

  // Date calculations — recalculate on each render (cheap, always correct)
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  // KPI Calculations — memoized to prevent recalculation on cosmetic renders
  const {
    overdueReceivables,
    monthlyReceivables,
    monthlyPayables,
    overduePayables,
    currentBalance,
    totalReceitas,
    totalDespesas,
    saldoInicial,
    totalAReceber,
    totalAPagar,
    margemLiquida,
    prazoMedioRecebimento,
    prazoMedioPagamento,
  } = useMemo(() => {
    // Always compute receivables/payables totals client-side (RPC has a bug that double-counts paid amounts)
    const _overdueReceivables = receivables
      .filter((r) => r.due_date < today)
      .reduce((sum, r) => sum + (Number(r.total_amount) - Number(r.paid_amount)), 0);

    const _monthlyReceivables = receivables
      .reduce((sum, r) => sum + Number(r.total_amount), 0); // all receivables already filtered by period in the query

    const _monthlyPayables = payables
      .reduce((sum, p) => sum + Number(p.total_amount), 0); // all payables already filtered by period in the query

    const _overduePayables = payables
      .filter((p) => p.due_date < today)
      .reduce((sum, p) => sum + (Number(p.total_amount) - Number(p.paid_amount)), 0);

    // Prazo Médio de Recebimento: average days until due date for open receivables
    const openReceivables = receivables.filter((r) => Number(r.total_amount) - Number(r.paid_amount) > 0);
    const _pmr = openReceivables.length > 0
      ? openReceivables.reduce((sum, r) => sum + Math.abs(differenceInCalendarDays(new Date(r.due_date), new Date())), 0) / openReceivables.length
      : 0;

    // Prazo Médio de Pagamento: average days until due date for open payables
    const openPayables = payables.filter((p) => Number(p.total_amount) - Number(p.paid_amount) > 0);
    const _pmp = openPayables.length > 0
      ? openPayables.reduce((sum, p) => sum + Math.abs(differenceInCalendarDays(new Date(p.due_date), new Date())), 0) / openPayables.length
      : 0;

    // RPC OVERRIDE: Use server-side totals for receitas, despesas, current_balance only
    const rpcTotals = queries.financialTotals?.data;
    if (rpcTotals?.isRpc) {
      const _totalReceitas = rpcTotals.receitas;
      const _totalDespesas = rpcTotals.despesas;
      const _currentBalance = rpcTotals.current_balance;
      return {
        overdueReceivables: _overdueReceivables,
        monthlyReceivables: _monthlyReceivables,
        monthlyPayables: _monthlyPayables,
        overduePayables: _overduePayables,
        currentBalance: _currentBalance,
        totalReceitas: _totalReceitas,
        totalDespesas: _totalDespesas,
        saldoInicial: _currentBalance - (_totalReceitas - _totalDespesas),
        totalAReceber: _monthlyReceivables,
        totalAPagar: _monthlyPayables,
        margemLiquida: _totalReceitas > 0 ? ((_totalReceitas - _totalDespesas) / _totalReceitas) * 100 : 0,
        prazoMedioRecebimento: Math.round(_pmr),
        prazoMedioPagamento: Math.round(_pmp),
      };
    }

    // FALLBACK: Client-side calculation when RPC is unavailable
    const _currentBalance = bankAccounts.reduce(
      (sum, acc) => sum + acc.current_balance, 0
    );

    const _totalReceitas = financialTotals?.receitas || 0;
    const _totalDespesas = financialTotals?.despesas || 0;

    return {
      overdueReceivables: _overdueReceivables,
      monthlyReceivables: _monthlyReceivables,
      monthlyPayables: _monthlyPayables,
      overduePayables: _overduePayables,
      currentBalance: _currentBalance,
      totalReceitas: _totalReceitas,
      totalDespesas: _totalDespesas,
      saldoInicial: _currentBalance - (_totalReceitas - _totalDespesas),
      totalAReceber: _monthlyReceivables,
      totalAPagar: _monthlyPayables,
      margemLiquida: _totalReceitas > 0 ? ((_totalReceitas - _totalDespesas) / _totalReceitas) * 100 : 0,
      prazoMedioRecebimento: Math.round(_pmr),
      prazoMedioPagamento: Math.round(_pmp),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receivables, payables, bankAccounts, financialTotals, today, monthStart, monthEnd]);

  // Transform raw transactions for display components
  const recentTransactions = useMemo(() =>
    rawTransactions.map((tx) => ({
      id: tx.id,
      name: tx.description || "Transação",
      description: tx.type === "entrada" ? "Receita" : "Despesa",
      amount: tx.amount,
      type: (tx.type === "entrada" ? "income" : "expense") as "income" | "expense",
      time: formatDistanceToNow(new Date(tx.transaction_date), { addSuffix: true, locale: ptBR }),
    })),
    [rawTransactions]
  );

  // Loading states for specific sections - ATOMIC PARALLELIZATION
  // We use isfetching to show loading state on period change as well
  const isLoadingTotals = queries.transactionsSummary?.isLoading;
  const isLoadingBalance = queries.bankAccounts.isLoading;
  const isLoadingSituation = queries.receivables.isLoading || queries.payables.isLoading;
  const isLoadingTransactions = queries.transactions.isLoading;

  // Widget components map — matches the new 11-card hierarchy
  const widgetComponents = ({
    // ─── CONTEXTO ───
    metric_prazo_recebimento: (
      <GlassMetricCard
        label="Prazo Médio Recebimento"
        value={prazoMedioRecebimento}
        icon={Clock}
        accentColor="info"
        formatAs="number"
        suffix="dias"
        delay={0}
        tooltip="Média de dias até o vencimento das contas a receber em aberto"
        loading={isLoadingSituation}
      />
    ),
    metric_prazo_pagamento: (
      <GlassMetricCard
        label="Prazo Médio Pagamento"
        value={prazoMedioPagamento}
        icon={Clock}
        accentColor="gold"
        formatAs="number"
        suffix="dias"
        delay={0.1}
        tooltip="Média de dias até o vencimento das contas a pagar em aberto"
        loading={isLoadingSituation}
      />
    ),
    // ─── RESULTADOS — Primários ───
    metric_receitas: (
      <GlassMetricCard
        label="Receitas"
        value={totalReceitas}
        icon={TrendingUp}
        accentColor="success"
        delay={0}
        currencySymbol={currencySymbol}
        loading={isLoadingTotals}
      />
    ),
    metric_despesas: (
      <GlassMetricCard
        label="Despesas"
        value={totalDespesas}
        icon={TrendingDown}
        accentColor="danger"
        delay={0}
        currencySymbol={currencySymbol}
        loading={isLoadingTotals}
      />
    ),
    metric_resultado: (
      <GlassMetricCard
        label="Resultado"
        value={totalReceitas - totalDespesas}
        icon={Wallet}
        accentColor={totalReceitas - totalDespesas >= 0 ? "gold" : "danger"}
        delay={0}
        currencySymbol={currencySymbol}
        tooltip={`Receitas - Despesas = ${currencySymbol} ${(totalReceitas - totalDespesas).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
        loading={isLoadingTotals}
      />
    ),
    // ─── RESULTADOS — Secundários (6 cards) ───
    metric_saldo_inicial: (
      <GlassMetricCard
        label={"Saldo\nInicial"}
        value={saldoInicial}
        icon={Landmark}
        accentColor="gold"
        delay={0}
        currencySymbol={currencySymbol}
        tooltip={`Saldo no início do período selecionado (${PERIOD_LABELS[selectedPeriod]})`}
        loading={isLoadingBalance || isLoadingTotals}
        compact
      />
    ),
    metric_a_receber_aberto: (
      <GlassMetricCard
        label="A Receber Em Aberto"
        value={totalAReceber}
        icon={Receipt}
        accentColor="success"
        delay={0}
        currencySymbol={currencySymbol}
        tooltip="Total de contas a receber em aberto no período"
        loading={isLoadingSituation}
        compact
      />
    ),
    metric_a_receber_vencidas: (
      <GlassMetricCard
        label="A Receber Vencidas"
        value={overdueReceivables}
        icon={AlertTriangle}
        accentColor={overdueReceivables > 0 ? "danger" : "success"}
        delay={0}
        currencySymbol={currencySymbol}
        tooltip="Contas a receber já vencidas (não pagas até a data)"
        loading={isLoadingSituation}
        compact
      />
    ),
    metric_a_pagar_aberto: (
      <GlassMetricCard
        label="A Pagar Em Aberto"
        value={totalAPagar}
        icon={CreditCard}
        accentColor="danger"
        delay={0}
        currencySymbol={currencySymbol}
        tooltip="Total de contas a pagar em aberto no período"
        loading={isLoadingSituation}
        compact
      />
    ),
    metric_a_pagar_vencidas: (
      <GlassMetricCard
        label="A Pagar Vencidas"
        value={overduePayables}
        icon={AlertTriangle}
        accentColor={overduePayables > 0 ? "danger" : "success"}
        delay={0}
        currencySymbol={currencySymbol}
        tooltip="Contas a pagar já vencidas (não pagas até a data)"
        loading={isLoadingSituation}
        compact
      />
    ),
    metric_saldo_final: (
      <GlassMetricCard
        label={"Saldo\nFinal"}
        value={currentBalance}
        icon={CalendarCheck}
        accentColor="info"
        delay={0}
        currencySymbol={currencySymbol}
        tooltip="Saldo atual em conta"
        loading={isLoadingBalance}
        compact
      />
    ),
    // ─── ANÁLISE ───
    chart: (
      <GlassAreaChart
        className="h-full"
        data={financialHistory}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
    ),
    transactions: (
      <GlassRecentTransactions
        transactions={recentTransactions}
        currencySymbol={currencySymbol}
        onViewAll={() => router.push(MAIN_ROUTES.TRANSACTIONS)}
        className="h-full"
      />
    ),
    situation: (
      <MonthSituationCard
        receivablesProjection={monthlyReceivables}
        receivablesReceived={totalReceitas}
        payablesProjection={monthlyPayables}
        payablesPaid={totalDespesas}
        currencySymbol={currencySymbol}
        loading={isLoadingSituation}
      />
    ),
    projection: (
      <StrategicProjectionSection
        currentBalance={currentBalance}
        receivables={receivables.map((r) => ({
          due_date: r.due_date,
          total_amount: r.total_amount,
          paid_amount: r.paid_amount,
        }))}
        payables={payables.map((p) => ({
          due_date: p.due_date,
          total_amount: p.total_amount,
          paid_amount: p.paid_amount,
        }))}
        currencySymbol={currencySymbol}
      />
    ),
  });

  if (authLoading || companyLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Dashboard with hierarchical section-based layout
  // Mirrors the reference image: CONTEXTO → RESULTADOS → ANÁLISE
  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header with Period Selector */}
        <FadeIn direction="down">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Sua Gestão de Recursos
              </h1>
              <p className="text-muted-foreground">
                Bom dia, <span className="text-brand">{profile?.full_name?.split(" ")[0] || "Usuário"}</span>.
                Aqui está o estado das suas finanças.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 dark:bg-glass-elevated/50">
                {(['day', 'week', 'month', 'quarter', 'semester', 'year'] as PeriodType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPeriod(p)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      selectedPeriod === p
                        ? "bg-gold-500 text-numa-deep"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              {canEdit && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push(MAIN_ROUTES.RECEIVABLES)}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-500/20"
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    Receber
                  </Button>
                  <Button
                    onClick={() => router.push(MAIN_ROUTES.PAYABLES)}
                    className="gap-2 bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-lg shadow-rose-500/20"
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    Pagar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        {/* ─── CONTEXTO ─── */}
        {/* Two smaller cards: Prazo Médio Recebimento (left) + Prazo Médio Pagamento (right) */}
        <FadeIn direction="up" delay={0.1}>
          <DashboardSection label="Contexto">
            <div className="flex flex-col sm:flex-row gap-4 max-w-md">
              <div className="flex-1 sm:max-w-[200px]">{widgetComponents.metric_prazo_recebimento}</div>
              <div className="flex-1 sm:max-w-[200px]">{widgetComponents.metric_prazo_pagamento}</div>
            </div>
          </DashboardSection>
        </FadeIn>

        {/* ─── RESULTADOS ─── */}
        {/* Primary row: 3 large cards (Receita, Despesa, Resultado) */}
        {/* Secondary row: 6 smaller cards */}
        <DashboardSection label="Resultados">
          {/* Primary metrics — large, prominent */}
          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <StaggerItem>{widgetComponents.metric_receitas}</StaggerItem>
            <StaggerItem>{widgetComponents.metric_despesas}</StaggerItem>
            <StaggerItem>{widgetComponents.metric_resultado}</StaggerItem>
          </StaggerContainer>
          {/* Secondary metrics — 6 smaller cards */}
          <StaggerContainer staggerDelay={0.06} delayChildren={0.2} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <StaggerItem>{widgetComponents.metric_saldo_inicial}</StaggerItem>
            <StaggerItem>{widgetComponents.metric_a_receber_aberto}</StaggerItem>
            <StaggerItem>{widgetComponents.metric_a_receber_vencidas}</StaggerItem>
            <StaggerItem>{widgetComponents.metric_a_pagar_aberto}</StaggerItem>
            <StaggerItem>{widgetComponents.metric_a_pagar_vencidas}</StaggerItem>
            <StaggerItem>{widgetComponents.metric_saldo_final}</StaggerItem>
          </StaggerContainer>
        </DashboardSection>

        {/* ─── ANÁLISE ─── */}
        <FadeIn direction="up" delay={0.15}>
          <DashboardSection label="Análise">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              <div className="lg:col-span-3">
                {widgetComponents.chart}
              </div>
              <div className="lg:col-span-1">
                {widgetComponents.situation}
              </div>
            </div>
            <div className="mb-4">
              {widgetComponents.transactions}
            </div>
          </DashboardSection>
        </FadeIn>

        {/* ─── PROJEÇÕES ─── */}
        <FadeIn direction="up" delay={0.2}>
          <DashboardSection label="Projeções">
            {widgetComponents.projection}
          </DashboardSection>
        </FadeIn>
      </div>
    </AppLayout>
  );
}
