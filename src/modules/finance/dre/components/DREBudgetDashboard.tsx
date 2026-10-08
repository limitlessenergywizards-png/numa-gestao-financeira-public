'use client';

import { useState, useMemo } from "react";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Edit,
  Copy,
  ArrowRight,
  PiggyBank,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { useDREBudget, type BudgetComparison } from "../hooks/useDREBudget";
import { DREBudgetEditor } from "./DREBudgetEditor";
import { cn } from "@/lib/utils";

interface DREBudgetDashboardProps {
  companyId: string;
  year: number;
  month: number;
  summary: {
    grossRevenue: number;
    netRevenue: number;
    costs: number;
    operationalExpenses: number;
    financialExpenses: number;
    netResult: number;
  };
  formatCurrency: (value: number) => string;
}

const CATEGORY_MAP = [
  { code: "3.1", name: "Receita Bruta", type: "revenue" },
  { code: "3.2", name: "Deduções", type: "deduction" },
  { code: "4.1", name: "CMV/CSV", type: "cost" },
  { code: "4.2", name: "Despesas Operacionais", type: "expense" },
  { code: "4.3", name: "Despesas Financeiras", type: "expense" },
  { code: "5.1", name: "Resultado Líquido", type: "result" },
];

// Strategic color mapping
const CHART_COLORS = {
  budgeted: "#8b5cf6",   // Violet
  realized: "#14b8a6",   // Teal
  overBudget: "#f43f5e", // Rose
  warning: "#f59e0b",    // Amber
  positive: "#10b981",   // Emerald
};

export function DREBudgetDashboard({
  companyId,
  year,
  month,
  summary,
  formatCurrency,
}: DREBudgetDashboardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const {
    budgetItems,
    isLoading,
    calculateComparison,
    copyFromPreviousPeriod,
    saveBulkBudget,
    refreshBudget,
  } = useDREBudget(companyId, year, month);

  // Map summary values to categories
  const actualValues: Record<string, number> = {
    "3.1": summary.grossRevenue,
    "3.2": summary.grossRevenue - summary.netRevenue,
    "4.1": Math.abs(summary.costs),
    "4.2": Math.abs(summary.operationalExpenses),
    "4.3": Math.abs(summary.financialExpenses),
    "5.1": summary.netResult,
  };

  const comparisons = useMemo<BudgetComparison[]>(() => {
    return CATEGORY_MAP.map((cat) => {
      return calculateComparison(cat.code, cat.name, actualValues[cat.code] || 0);
    });
  }, [budgetItems, summary]);

  const totalBudgeted = comparisons.reduce((sum, c) => sum + c.budgeted, 0);
  const totalRealized = comparisons.reduce((sum, c) => sum + c.actual, 0);
  const hasBudget = budgetItems.length > 0;

  // Chart data
  const chartData = comparisons.map((c) => ({
    name: c.category_name,
    Orçado: c.budgeted,
    Realizado: c.actual,
    status: c.status,
  }));

  // Critical alerts
  const criticalAlerts = comparisons.filter((c) => c.status === "critical" && c.budgeted > 0);
  const warningAlerts = comparisons.filter((c) => c.status === "warning" && c.budgeted > 0);

  const getStatusColor = (status: BudgetComparison["status"]) => {
    switch (status) {
      case "on_track":
        return "text-emerald-600 bg-emerald-500/10";
      case "positive":
        return "text-teal-600 bg-teal-500/10";
      case "warning":
        return "text-amber-600 bg-amber-500/10";
      case "critical":
        return "text-rose-600 bg-rose-500/10";
    }
  };

  const getStatusIcon = (status: BudgetComparison["status"]) => {
    switch (status) {
      case "on_track":
      case "positive":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getChartColor = (status: BudgetComparison["status"]) => {
    switch (status) {
      case "critical":
        return CHART_COLORS.overBudget;
      case "warning":
        return CHART_COLORS.warning;
      case "positive":
        return CHART_COLORS.realized;
      default:
        return CHART_COLORS.positive;
    }
  };

  const handleCopyPreviousPeriod = async () => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    await copyFromPreviousPeriod(prevYear, prevMonth);
  };

  // Summary statistics
  const overBudgetCount = comparisons.filter(c => c.status === "critical" || c.status === "warning").length;
  const overallUtilization = totalBudgeted > 0 ? (totalRealized / totalBudgeted) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Header Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 text-white shadow-xl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute right-1/3 top-1/2 h-16 w-16 rounded-full bg-white/5" />
        </div>
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Target className="h-5 w-5" />
                Orçamento vs Realizado
              </CardTitle>
              <CardDescription className="text-white/80">
                Acompanhe o desempenho em relação às metas definidas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!hasBudget && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPreviousPeriod}
                  className="text-white hover:bg-white/20"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Anterior
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setIsEditorOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Edit className="h-4 w-4 mr-2" />
                {hasBudget ? "Editar" : "Definir"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!hasBudget ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="h-10 w-10 text-violet-500" />
            </div>
            <h4 className="text-lg font-medium mb-2">Nenhum orçamento definido</h4>
            <p className="text-muted-foreground mb-4">
              Defina metas para acompanhar o desempenho financeiro
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleCopyPreviousPeriod}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar do Mês Anterior
              </Button>
              <Button onClick={() => setIsEditorOpen(true)} className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                <Edit className="h-4 w-4 mr-2" />
                Criar Orçamento
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards with Vibrant Gradients */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Overall Utilization */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
              <div className="absolute -left-2 -bottom-2 h-14 w-14 rounded-full bg-white/10" />
              <CardContent className="relative pt-6">
                <div className="flex items-center gap-2 mb-2">
                  {overallUtilization <= 100 ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium text-white/80">Utilização Geral</span>
                </div>
                <p className="text-2xl font-bold">{overallUtilization.toFixed(1)}%</p>
                <Progress
                  value={Math.min(overallUtilization, 100)}
                  className="mt-2 h-2 bg-white/20"
                />
              </CardContent>
            </Card>

            {/* Budget vs Realized */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
              <div className="absolute -left-2 -bottom-2 h-14 w-14 rounded-full bg-white/10" />
              <CardContent className="relative pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="h-5 w-5" />
                  <span className="text-sm font-medium text-white/80">Orçado vs Realizado</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(totalBudgeted)}</p>
                <p className="text-sm text-white/70">
                  Realizado: {formatCurrency(totalRealized)}
                </p>
              </CardContent>
            </Card>

            {/* Alert Count */}
            <Card className={`relative overflow-hidden border-0 text-white shadow-lg ${overBudgetCount === 0
              ? 'bg-gradient-to-br from-emerald-500 to-green-600'
              : 'bg-gradient-to-br from-amber-500 to-orange-600'
              }`}>
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
              <div className="absolute -left-2 -bottom-2 h-14 w-14 rounded-full bg-white/10" />
              <CardContent className="relative pt-6">
                <div className="flex items-center gap-2 mb-2">
                  {overBudgetCount === 0 ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium text-white/80">Status</span>
                </div>
                <p className="text-2xl font-bold">
                  {overBudgetCount === 0 ? 'OK' : `${overBudgetCount} Alerta(s)`}
                </p>
                <p className="text-sm text-white/70">
                  {overBudgetCount === 0 ? 'Todas as categorias dentro do orçado' : 'Categorias acima do orçado'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Comparativo por Categoria</CardTitle>
              <CardDescription>Orçado vs Realizado por categoria do DRE</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                              <p className="mb-2 font-semibold text-foreground">{label}</p>
                              <div className="flex flex-col gap-2">
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <div
                                      className="h-3 w-3 rounded-full shrink-0"
                                      style={{ backgroundColor: entry.color || "hsl(var(--primary))" }}
                                    />
                                    <span className="text-sm font-medium text-muted-foreground">{entry.name}:</span>
                                    <span className="text-sm font-bold text-foreground">
                                      {formatCurrency(entry.value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Orçado" fill={CHART_COLORS.budgeted} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Realizado" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getChartColor(entry.status)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Color Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-1.5">
                  <div className="w-3 h-3 rounded-sm bg-violet-500" />
                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400">Orçado</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Dentro do orçado</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5">
                  <div className="w-3 h-3 rounded-sm bg-amber-500" />
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Atenção</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-1.5">
                  <div className="w-3 h-3 rounded-sm bg-rose-500" />
                  <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Acima do orçado</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Alertas de Desvio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {criticalAlerts.map((alert) => (
                  <div
                    key={alert.category_code}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-rose-700 dark:text-rose-400">
                        {alert.category_name} {Math.abs(alert.variancePercent).toFixed(1)}%{" "}
                        {alert.variance > 0 ? "acima" : "abaixo"} do orçado
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Orçado: {formatCurrency(alert.budgeted)} → Realizado:{" "}
                        {formatCurrency(alert.actual)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
                {warningAlerts.map((alert) => (
                  <div
                    key={alert.category_code}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-amber-700 dark:text-amber-400">
                        {alert.category_name} {Math.abs(alert.variancePercent).toFixed(1)}%{" "}
                        {alert.variance > 0 ? "acima" : "abaixo"} do orçado
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Orçado: {formatCurrency(alert.budgeted)} → Realizado:{" "}
                        {formatCurrency(alert.actual)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Detailed Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Detalhamento Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Categoria</th>
                      <th className="text-right py-2 font-medium">Orçado</th>
                      <th className="text-right py-2 font-medium">Realizado</th>
                      <th className="text-right py-2 font-medium">Variação</th>
                      <th className="text-right py-2 font-medium">%</th>
                      <th className="text-center py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((c) => (
                      <tr key={c.category_code} className="border-b">
                        <td className="py-3">{c.category_name}</td>
                        <td className="text-right py-3">{formatCurrency(c.budgeted)}</td>
                        <td className="text-right py-3">{formatCurrency(c.actual)}</td>
                        <td className="text-right py-3">
                          <span
                            className={cn(
                              c.variance > 0 ? "text-emerald-600" : c.variance < 0 ? "text-rose-600" : ""
                            )}
                          >
                            {c.variance > 0 ? "+" : ""}
                            {formatCurrency(c.variance)}
                          </span>
                        </td>
                        <td className="text-right py-3">
                          <span
                            className={cn(
                              c.variancePercent > 0
                                ? "text-emerald-600"
                                : c.variancePercent < 0
                                  ? "text-rose-600"
                                  : ""
                            )}
                          >
                            {c.variancePercent > 0 ? "+" : ""}
                            {c.variancePercent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3">
                          <Badge className={cn("gap-1 justify-center", getStatusColor(c.status))}>
                            {getStatusIcon(c.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Budget Editor Dialog */}
      <DREBudgetEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        companyId={companyId}
        year={year}
        month={month}
        currentBudget={budgetItems}
        categories={CATEGORY_MAP}
        onSave={async (items) => {
          await saveBulkBudget(items);
          setIsEditorOpen(false);
        }}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
