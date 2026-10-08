'use client';

import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DREBudgetTrendsProps {
  companyId: string;
  currentYear: number;
  currentMonth: number;
  formatCurrency: (value: number) => string;
}

interface MonthlyData {
  period: string;
  month: number;
  year: number;
  orcado: number;
  realizado: number;
  projecao?: number;
}

interface Projection {
  month: number;
  year: number;
  value: number;
  label: string;
}

// Simple linear regression for projection
function calculateLinearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  data.forEach((y, x) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: data[0] || 0 };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function projectValues(historicalData: number[], monthsAhead: number): number[] {
  const { slope, intercept } = calculateLinearRegression(historicalData);
  const lastIndex = historicalData.length - 1;

  return Array.from({ length: monthsAhead }, (_, i) => {
    const projectedValue = intercept + slope * (lastIndex + i + 1);
    return Math.max(0, projectedValue); // Prevent negative projections
  });
}

function getMonthLabel(month: number, year: number): string {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[month - 1]}/${year.toString().slice(-2)}`;
}

export function DREBudgetTrends({
  companyId,
  currentYear,
  currentMonth,
  formatCurrency,
}: DREBudgetTrendsProps) {
  const [historicalData, setHistoricalData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!companyId) return;

      setIsLoading(true);
      try {
        // Calculate date range (last 12 months)
        const months: { year: number; month: number }[] = [];
        for (let i = 11; i >= 0; i--) {
          let m = currentMonth - i;
          let y = currentYear;
          while (m <= 0) {
            m += 12;
            y -= 1;
          }
          months.push({ year: y, month: m });
        }

        // Fetch budget data for all months
        const { data: budgetData } = await supabase
          .from("dre_budget")
          .select("id, company_id, period_year, period_month, category_code, category_name, budgeted_value, created_by, created_at, updated_at")
          .eq("company_id", companyId)
          .gte("period_year", months[0].year)
          .order("period_year", { ascending: true })
          .order("period_month", { ascending: true });

        // Fetch transactions for actual values
        const startDate = new Date(months[0].year, months[0].month - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);

        const { data: transactions } = await supabase
          .from("transactions")
          .select("amount, type, transaction_date")
          .eq("company_id", companyId)
          .eq("is_deleted", false)
          .gte("transaction_date", startDate.toISOString().split("T")[0])
          .lte("transaction_date", endDate.toISOString().split("T")[0]);

        // Group transactions by month
        const actualsByMonth: Record<string, number> = {};
        transactions?.forEach((tx) => {
          const date = new Date(tx.transaction_date);
          const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          if (!actualsByMonth[key]) {
            actualsByMonth[key] = 0;
          }
          // Sum net result (revenues - expenses)
          actualsByMonth[key] += tx.type === "entrada" ? tx.amount : -tx.amount;
        });

        // Group budget by month
        const budgetByMonth: Record<string, number> = {};
        budgetData?.forEach((budget) => {
          const key = `${budget.period_year}-${budget.period_month}`;
          if (!budgetByMonth[key]) {
            budgetByMonth[key] = 0;
          }
          // Sum net result budget (for simplicity, using category 5.1 or sum)
          if (budget.category_code === "5.1") {
            budgetByMonth[key] = budget.budgeted_value;
          }
        });

        // Build monthly data
        const data: MonthlyData[] = months.map(({ year, month }) => {
          const key = `${year}-${month}`;
          return {
            period: getMonthLabel(month, year),
            month,
            year,
            orcado: budgetByMonth[key] || 0,
            realizado: actualsByMonth[key] || 0,
          };
        });

        setHistoricalData(data);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [companyId, currentYear, currentMonth]);

  // Calculate projections
  const projections = useMemo<Projection[]>(() => {
    const realizedValues = historicalData.map((d) => d.realizado);
    const projectedValues = projectValues(realizedValues, 3);

    const result: Projection[] = [];
    for (let i = 1; i <= 3; i++) {
      let m = currentMonth + i;
      let y = currentYear;
      while (m > 12) {
        m -= 12;
        y += 1;
      }
      result.push({
        month: m,
        year: y,
        value: projectedValues[i - 1],
        label: getMonthLabel(m, y),
      });
    }
    return result;
  }, [historicalData, currentMonth, currentYear]);

  // Chart data with projections
  const chartData = useMemo(() => {
    const data = [...historicalData];

    // Add projection points
    projections.forEach((proj, index) => {
      data.push({
        period: proj.label,
        month: proj.month,
        year: proj.year,
        orcado: 0,
        realizado: 0,
        projecao: proj.value,
      });
    });

    return data;
  }, [historicalData, projections]);

  // Calculate trend
  const trend = useMemo(() => {
    if (historicalData.length < 2) return { direction: "neutral" as const, percent: 0 };

    const { slope, intercept } = calculateLinearRegression(historicalData.map((d) => d.realizado));
    const firstValue = intercept;
    const lastValue = intercept + slope * (historicalData.length - 1);

    if (firstValue === 0) return { direction: "neutral" as const, percent: 0 };

    const percentChange = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;

    return {
      direction: percentChange > 2 ? "up" as const : percentChange < -2 ? "down" as const : "neutral" as const,
      percent: Math.abs(percentChange),
    };
  }, [historicalData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Tendência e Projeções
              </CardTitle>
              <CardDescription>
                Histórico dos últimos 12 meses com projeção para os próximos 3 meses
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "gap-1",
                trend.direction === "up" && "text-green-600 border-green-500/30 bg-green-500/10",
                trend.direction === "down" && "text-red-600 border-red-500/30 bg-red-500/10",
                trend.direction === "neutral" && "text-muted-foreground"
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : trend.direction === "down" ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              {trend.percent.toFixed(1)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} />
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
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="orcado"
                  name="Orçado"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--muted-foreground))", r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="realizado"
                  name="Realizado"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="projecao"
                  name="Projeção"
                  stroke="hsl(var(--info))"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--info))", r: 4, strokeDasharray: "" }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Projections Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Projeções para os Próximos 3 Meses
          </CardTitle>
          <CardDescription>
            Baseado em regressão linear dos últimos 12 meses de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {projections.map((proj, index) => {
              const lastActual = historicalData[historicalData.length - 1]?.realizado || 0;
              const changePercent = lastActual !== 0 ? ((proj.value - lastActual) / Math.abs(lastActual)) * 100 : 0;
              const isPositive = changePercent >= 0;

              return (
                <Card key={proj.label} className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {proj.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 text-xs",
                          isPositive ? "text-green-600 bg-green-500/10" : "text-red-600 bg-red-500/10"
                        )}
                      >
                        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {changePercent > 0 ? "+" : ""}
                        {changePercent.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(proj.value)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      vs. atual: {formatCurrency(lastActual)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trend Summary */}
          <div className="mt-4 p-4 rounded-lg bg-muted/30 flex items-center gap-3">
            {trend.direction === "up" ? (
              <div className="p-2 rounded-full bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            ) : trend.direction === "down" ? (
              <div className="p-2 rounded-full bg-red-500/20">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-muted">
                <Minus className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium">
                Tendência{" "}
                {trend.direction === "up" ? "de Alta" : trend.direction === "down" ? "de Queda" : "Estável"}
              </p>
              <p className="text-sm text-muted-foreground">
                {trend.direction === "up"
                  ? `Os resultados estão crescendo em média ${trend.percent.toFixed(1)}% ao período`
                  : trend.direction === "down"
                    ? `Os resultados estão caindo em média ${trend.percent.toFixed(1)}% ao período`
                    : "Os resultados estão mantendo uma tendência estável"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
