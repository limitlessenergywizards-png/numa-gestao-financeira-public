'use client';

import { useMemo, useState } from "react";
import { PeriodType, getDateRange, PERIOD_LABELS } from "@/lib/periodUtils";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompany } from "@/contexts/CompanyContext";
import { useFormatters } from "@/hooks/useFormatters";
import { useFinancialIndicators } from "./hooks/useFinancialIndicators";
import { useCashMismatch } from "./hooks/useCashMismatch";
import { useStrategicIndicators } from "./hooks/useStrategicIndicators";
import { useChartData } from "./hooks/useChartData";
import { StrategicKPISection, type KPIItem } from "./components/StrategicKPISection";
import { StrategicCharts } from "./components/StrategicCharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CalendarDays,
  DollarSign,
  ShieldCheck,
  Timer,
  Scale,
  Wallet,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ComposedChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Line,
} from "recharts";

export default function AdvancedReports() {
  const { currentCompany } = useCompany();
  const { formatCurrency } = useFormatters();

  // Period filter state
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');

  // Calculate date range based on selected period
  const dateRange = useMemo(() => getDateRange(selectedPeriod), [selectedPeriod]);

  const indicators = useFinancialIndicators(currentCompany?.id, dateRange);
  const mismatch = useCashMismatch(currentCompany?.id, dateRange);
  const strategic = useStrategicIndicators(currentCompany?.id, indicators.pmr, indicators.pmp, dateRange);
  const chartData = useChartData(currentCompany?.id, dateRange);

  const isLoading = indicators.isLoading || mismatch.isLoading;

  // Cycle de caixa = PMR - PMP (em dias)
  const cashCycle = useMemo(() => indicators.pmr - indicators.pmp, [indicators.pmr, indicators.pmp]);

  // Tooltip styles for mismatch charts (strategic charts have their own)
  const chartTooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    color: "hsl(var(--foreground))",
  };
  const chartTooltipLabelStyle = { color: "hsl(var(--foreground))", fontWeight: 600 };
  const chartTooltipItemStyle = { color: "hsl(var(--foreground))" };

  return (
    <AppLayout
      title="Indicadores Financeiros"
      description="Prazos médios, capital de giro e análise de descasamento de caixa"
    >
      <div className="space-y-6">
        {/* Period Selector Section - CTO Premium Style */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/40 backdrop-blur-sm border border-brand/5 shadow-sm w-fit">
            <div className="flex items-center gap-2 px-3 py-2 border-r border-brand/10 hidden lg:flex">
              <CalendarDays className="h-4 w-4 text-gold-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Análise</span>
            </div>
            <div className="flex items-center gap-1">
              {(['day', 'week', 'month', 'quarter', 'semester', 'year'] as PeriodType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-xl transition-colors duration-300 whitespace-nowrap flex-shrink-0 tracking-tight",
                    selectedPeriod === p
                      ? "bg-gold-500 text-numa-deep shadow-md scale-105 active:scale-95"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95"
                  )}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards - 3 indicadores */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* PMR */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-sky-600 to-sky-700 shadow-lg">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-white/90">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                Prazo Médio de Recebimento
              </CardTitle>
              <CardDescription className="text-white/70">
                Tempo médio para receber dos clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {isLoading ? (
                <Skeleton className="h-12 w-32 bg-white/20" />
              ) : !indicators.hasData ? (
                <p className="text-white/60 text-sm">Sem contas em aberto no período</p>
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white tabular-nums">
                    {indicators.pmr} <span className="text-lg font-normal text-white/80">dias</span>
                  </div>
                  <p className="text-xs text-white/70">
                    Baseado em {indicators.pmrCount} recebimento{indicators.pmrCount !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PMP */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-600 to-amber-700 shadow-lg">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-white/90">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                Prazo Médio de Pagamento
              </CardTitle>
              <CardDescription className="text-white/70">
                Tempo médio para pagar fornecedores
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {isLoading ? (
                <Skeleton className="h-12 w-32 bg-white/20" />
              ) : !indicators.hasData ? (
                <p className="text-white/60 text-sm">Sem contas em aberto no período</p>
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white tabular-nums">
                    {indicators.pmp} <span className="text-lg font-normal text-white/80">dias</span>
                  </div>
                  <p className="text-xs text-white/70">
                    Baseado em {indicators.pmpCount} pagamento{indicators.pmpCount !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Second Row: Capital de Giro & Break-even */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Capital de Giro */}
          <Card className={cn(
            "relative overflow-hidden border-0 shadow-lg bg-gradient-to-br",
            indicators.capitalDeGiro >= 0
              ? "from-emerald-600 to-emerald-700"
              : "from-rose-600 to-rose-700"
          )}>
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-white/90">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-white" />
                </div>
                Capital de Giro
              </CardTitle>
              <CardDescription className="text-white/70">
                Recebíveis pendentes - Contas a pagar
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {isLoading ? (
                <Skeleton className="h-12 w-32 bg-white/20" />
              ) : !indicators.hasData ? (
                <p className="text-white/60 text-sm">Sem dados</p>
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white tabular-nums">
                    {formatCurrency(indicators.capitalDeGiro)}
                  </div>
                  <p className="text-xs text-white/70">
                    {formatCurrency(indicators.totalReceivablesPending)} a receber - {formatCurrency(indicators.totalPayablesPending)} a pagar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ponto de Equilíbrio */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-600 to-violet-700 shadow-lg">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-white/90">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Ponto de Equilíbrio
              </CardTitle>
              <CardDescription className="text-white/70">
                Receita necessária para cobrir todos os custos
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {isLoading ? (
                <Skeleton className="h-12 w-32 bg-white/20" />
              ) : !indicators.hasData ? (
                <p className="text-white/60 text-sm">Sem dados suficientes</p>
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white tabular-nums">
                    {formatCurrency(indicators.breakEvenPoint)}
                  </div>
                  <p className="text-xs text-white/70">
                    Custos Fixos: {formatCurrency(indicators.totalFixedCosts)} | Margem: {(indicators.contributionMarginRatio * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ciclo de Caixa - card informativo */}
        {indicators.hasData && !isLoading && (
          <Card className="glass-card border-0">
            <CardContent className="py-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  {cashCycle > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-success" />
                  )}
                  <span className="font-medium">Ciclo de Caixa:</span>
                  <span className={cn(
                    "font-bold text-lg tabular-nums",
                    cashCycle > 0 ? "text-warning" : "text-success"
                  )}>
                    {cashCycle} dias
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {cashCycle > 0
                    ? `Você recebe ${cashCycle} dias depois de pagar. Negocie prazos para reduzir essa diferença.`
                    : cashCycle < 0
                      ? `Você recebe ${Math.abs(cashCycle)} dias antes de pagar. Ótima posição de caixa!`
                      : "Seus prazos de recebimento e pagamento estão equilibrados."}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Descasamento Semanal */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              Descasamento Semanal
            </CardTitle>
            <CardDescription>
              Média de entradas e saídas por dia da semana (últimos 6 meses)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : !mismatch.hasData ? (
              <div className="flex items-center justify-center h-72 text-muted-foreground">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Sem dados de movimentações</p>
                  <p className="text-sm">Registre transações para ver a análise de descasamento</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={mismatch.weeklyMismatch} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} itemStyle={chartTooltipItemStyle}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "entradas" ? "Entradas" : name === "saidas" ? "Saídas" : "Saldo",
                    ]}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "entradas" ? "Entradas" : value === "saidas" ? "Saídas" : "Saldo"
                    }
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Bar dataKey="entradas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="saidas" fill="hsl(0, 84%, 55%)" radius={[4, 4, 0, 0]} barSize={28} />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "hsl(217, 91%, 60%)" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Descasamento Mensal */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-warning" />
              </div>
              Descasamento Mensal
            </CardTitle>
            <CardDescription>
              Média de entradas e saídas por dia do mês (últimos 6 meses). A linha azul abaixo de zero indica dias deficitários.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : !mismatch.hasData ? (
              <div className="flex items-center justify-center h-72 text-muted-foreground">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Sem dados de movimentações</p>
                  <p className="text-sm">Registre transações para ver a análise de descasamento</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={mismatch.monthlyMismatch} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} className="text-muted-foreground" interval={0} />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} itemStyle={chartTooltipItemStyle}
                    labelFormatter={(label) => `Dia ${label}`}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "entradas" ? "Entradas" : name === "saidas" ? "Saídas" : "Saldo",
                    ]}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "entradas" ? "Entradas" : value === "saidas" ? "Saídas" : "Saldo"
                    }
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Bar dataKey="entradas" fill="hsl(142, 76%, 36%)" radius={[2, 2, 0, 0]} barSize={12} />
                  <Bar dataKey="saidas" fill="hsl(0, 84%, 55%)" radius={[2, 2, 0, 0]} barSize={12} />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════════════ */}
        {/* INDICADORES ESTRATÉGICOS ADICIONAIS               */}
        {/* ════════════════════════════════════════════════════ */}

        {/* 1. Rentabilidade & Lucratividade */}
        <StrategicKPISection
          title="Rentabilidade & Lucratividade"
          description="Indicadores de performance econômica do mês corrente"
          icon={DollarSign}
          iconColor="bg-emerald-600"
          isLoading={strategic.isLoading}
          hasData={strategic.hasData}
          columns={4}
          items={[
            {
              label: 'Receita Bruta',
              value: formatCurrency(strategic.receitaBruta),
              status: 'neutral',
              formula: 'Soma de todas as entradas do mês',
            },
            {
              label: 'Lucro Líquido',
              value: formatCurrency(strategic.lucroLiquido),
              status: strategic.lucroLiquido >= 0 ? 'success' : 'danger',
              formula: 'Receita Bruta − Total de Despesas',
              subtitle: strategic.lucroLiquido >= 0 ? 'Superavitário' : 'Deficitário',
            },
            {
              label: 'Margem Líquida',
              value: `${strategic.margemLiquida.toFixed(1)}%`,
              status: strategic.margemLiquida >= 15 ? 'success' : strategic.margemLiquida >= 5 ? 'warning' : 'danger',
              formula: '(Lucro Líquido ÷ Receita Bruta) × 100',
              subtitle: strategic.margemLiquida >= 15 ? 'Saudável' : strategic.margemLiquida >= 5 ? 'Moderada' : 'Crítica',
            },
            {
              label: 'EBITDA',
              value: formatCurrency(strategic.ebitda),
              status: strategic.ebitda >= 0 ? 'success' : 'danger',
              formula: 'Lucros antes de Juros, Impostos, Depreciação e Amortização',
            },
            {
              label: 'Margem EBITDA',
              value: `${strategic.margemEbitda.toFixed(1)}%`,
              status: strategic.margemEbitda >= 20 ? 'success' : strategic.margemEbitda >= 10 ? 'warning' : 'danger',
              formula: '(EBITDA ÷ Receita Bruta) × 100. Ideal: > 20%',
              subtitle: strategic.margemEbitda >= 20 ? 'Eficiente' : strategic.margemEbitda >= 10 ? 'Moderada' : 'Abaixo do ideal',
            },
            {
              label: 'Lucro Operacional',
              value: formatCurrency(strategic.lucroOperacional),
              status: strategic.lucroOperacional >= 0 ? 'success' : 'danger',
              formula: 'Receita − Custos Operacionais (Fixos + Variáveis)',
              subtitle: strategic.lucroOperacional >= 0 ? 'Operação saudável' : 'Operação deficitária',
            },
            {
              label: 'Margem de Contribuição',
              value: formatCurrency(strategic.margemContribuicao),
              status: strategic.margemContribuicao > 0 ? 'success' : 'danger',
              formula: 'Receita − Custos Variáveis',
            },
            {
              label: 'Margem de Contribuição %',
              value: `${strategic.margemContribuicaoPct.toFixed(1)}%`,
              status: strategic.margemContribuicaoPct >= 40 ? 'success' : strategic.margemContribuicaoPct >= 20 ? 'warning' : 'danger',
              formula: '(Margem de Contribuição ÷ Receita) × 100',
            },
            {
              label: 'Total Despesas',
              value: formatCurrency(strategic.totalDespesas),
              status: 'neutral',
              formula: 'Custos Fixos + Custos Variáveis',
            },
          ] as KPIItem[]}
        />

        {/* 2. Índices de Liquidez */}
        <StrategicKPISection
          title="Índices de Liquidez"
          description="Capacidade de honrar compromissos financeiros nos prazos acordados"
          icon={ShieldCheck}
          iconColor="bg-sky-600"
          isLoading={strategic.isLoading}
          hasData={strategic.hasData}
          columns={4}
          items={[
            {
              label: 'Liquidez Corrente',
              value: strategic.liquidezCorrente.toFixed(2),
              status: strategic.liquidezCorrente >= 1.5 ? 'success' : strategic.liquidezCorrente >= 1 ? 'warning' : 'danger',
              formula: 'Ativo Circulante ÷ Passivo Circulante. Ideal: > 1.5',
              subtitle: strategic.liquidezCorrente >= 1 ? 'Pode cobrir obrigações de curto prazo' : 'Risco de insolvência',
            },
            {
              label: 'Liquidez Seca',
              value: strategic.liquidezSeca.toFixed(2),
              status: strategic.liquidezSeca >= 1 ? 'success' : strategic.liquidezSeca >= 0.7 ? 'warning' : 'danger',
              formula: '(Ativo Circulante − Estoques) ÷ Passivo Circulante',
              subtitle: 'Exclui estoques da análise',
            },
            {
              label: 'Liquidez Imediata',
              value: strategic.liquidezImediata.toFixed(2),
              status: strategic.liquidezImediata >= 0.5 ? 'success' : strategic.liquidezImediata >= 0.2 ? 'warning' : 'danger',
              formula: 'Disponibilidades ÷ Passivo Circulante. Pagamento instantâneo.',
            },
            {
              label: 'Disponível em Caixa',
              value: formatCurrency(strategic.disponivelImediato),
              status: 'neutral',
              formula: 'Soma dos saldos em contas bancárias ativas',
            },
          ] as KPIItem[]}
        />

        {/* 3. Endividamento & Solvência */}
        <StrategicKPISection
          title="Endividamento & Solvência"
          description="Nível de dependência de capital de terceiros e capacidade de pagamento"
          icon={Scale}
          iconColor="bg-violet-600"
          isLoading={strategic.isLoading}
          hasData={strategic.hasData}
          columns={3}
          items={[
            {
              label: 'Índice de Endividamento',
              value: `${strategic.indiceEndividamento.toFixed(1)}%`,
              status: strategic.indiceEndividamento <= 50 ? 'success' : strategic.indiceEndividamento <= 80 ? 'warning' : 'danger',
              formula: '(Passivo Total ÷ Ativo Total) × 100. Ideal: < 50%',
              subtitle: strategic.indiceEndividamento <= 50 ? 'Baixo risco' : 'Elevado',
            },
            {
              label: 'Total Obrigações',
              value: formatCurrency(strategic.totalObrigacoes),
              status: 'neutral',
              formula: 'Soma de todas as contas a pagar pendentes',
            },
            {
              label: 'Total Ativos Circulantes',
              value: formatCurrency(strategic.totalAtivos),
              status: 'neutral',
              formula: 'Disponibilidades + Recebíveis Pendentes',
            },
          ] as KPIItem[]}
        />

        {/* 4. Ciclos Financeiros Avançados */}
        <StrategicKPISection
          title="Ciclos Financeiros Avançados"
          description="Tempo entre pagamento a fornecedores e recebimento de clientes"
          icon={Timer}
          iconColor="bg-amber-600"
          isLoading={strategic.isLoading}
          hasData={strategic.hasData}
          columns={3}
          items={[
            {
              label: 'Ciclo Operacional',
              value: `${strategic.cicloOperacional} dias`,
              status: strategic.cicloOperacional <= 30 ? 'success' : strategic.cicloOperacional <= 60 ? 'warning' : 'danger',
              formula: 'PME + PMR (tempo total do ciclo de produção ao recebimento)',
            },
            {
              label: 'Ciclo Financeiro',
              value: `${strategic.cicloFinanceiro} dias`,
              status: strategic.cicloFinanceiro <= 0 ? 'success' : strategic.cicloFinanceiro <= 30 ? 'warning' : 'danger',
              formula: 'Ciclo Operacional − PMP. Negativo = recebe antes de pagar ✓',
              subtitle: strategic.cicloFinanceiro <= 0 ? 'Posição favorável' : 'Requer capital de giro',
            },
            {
              label: 'NCG (Necessidade de Capital)',
              value: formatCurrency(strategic.necessidadeCapitalGiro),
              status: strategic.necessidadeCapitalGiro <= 0 ? 'success' : 'warning',
              formula: '(PMR × Receita Diária) − (PMP × Despesa Diária)',
              subtitle: strategic.necessidadeCapitalGiro <= 0 ? 'Autossuficiente' : 'Precisa de financiamento',
            },
          ] as KPIItem[]}
        />

        {/* 5. Inadimplência & Aging */}
        <StrategicKPISection
          title="Inadimplência & Aging de Recebíveis"
          description="Taxa de inadimplência e distribuição por faixas de atraso"
          icon={TrendingDown}
          iconColor="bg-rose-600"
          isLoading={strategic.isLoading}
          hasData={strategic.hasData}
          columns={3}
          items={[
            {
              label: 'Taxa de Inadimplência',
              value: `${strategic.taxaInadimplencia.toFixed(1)}%`,
              status: strategic.taxaInadimplencia <= 3 ? 'success' : strategic.taxaInadimplencia <= 10 ? 'warning' : 'danger',
              formula: '(Total Vencido ÷ Total Recebíveis) × 100',
              subtitle: `${formatCurrency(strategic.totalVencido)} vencido de ${formatCurrency(strategic.totalRecebiveis)}`,
            },
            {
              label: 'Vencidos D+1 a D+15',
              value: formatCurrency(strategic.agingBuckets.d1_15),
              status: strategic.agingBuckets.d1_15 > 0 ? 'warning' : 'success',
              formula: 'Recebíveis vencidos entre 1 e 15 dias',
            },
            {
              label: 'Vencidos D+16 a D+30',
              value: formatCurrency(strategic.agingBuckets.d16_30),
              status: strategic.agingBuckets.d16_30 > 0 ? 'warning' : 'success',
              formula: 'Recebíveis vencidos entre 16 e 30 dias',
            },
            {
              label: 'Vencidos D+31 a D+60',
              value: formatCurrency(strategic.agingBuckets.d31_60),
              status: strategic.agingBuckets.d31_60 > 0 ? 'danger' : 'success',
              formula: 'Recebíveis vencidos entre 31 e 60 dias',
            },
            {
              label: 'Vencidos D+60+',
              value: formatCurrency(strategic.agingBuckets.d60plus),
              status: strategic.agingBuckets.d60plus > 0 ? 'danger' : 'success',
              formula: 'Recebíveis vencidos há mais de 60 dias — risco de perda',
            },
          ] as KPIItem[]}
        />

        {/* Strategic Charts (Gauges, Waterfall, Sankey, Trend, Aging, Budget vs Actual) */}
        <StrategicCharts
          strategic={strategic}
          chartData={chartData}
          formatCurrency={formatCurrency}
        />
      </div>
    </AppLayout>
  );
}
