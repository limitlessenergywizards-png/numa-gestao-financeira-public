'use client';

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STALE_TIMES } from "@/lib/queryKeys";

interface DREEvolutionChartProps {
  companyId: string;
  formatCurrency: (value: number) => string;
}

interface MonthData {
  month: string;
  receita: number;
  custos: number;
  despesas: number;
  resultado: number;
}

// Strategic color mapping
const CHART_COLORS = {
  receita: "#14b8a6",    // Teal
  custos: "#f59e0b",     // Amber
  despesas: "#f43f5e",   // Rose
  resultado: "#10b981",  // Emerald (positive)
  resultadoNegativo: "#f43f5e", // Rose (negative)
};

export function DREEvolutionChart({ companyId, formatCurrency }: DREEvolutionChartProps) {
  // Single RPC call replaces 24 sequential Supabase requests (12 months × 2 queries each)
  const { data: rawData, isLoading } = useQuery({
    queryKey: ['dre', 'evolution', companyId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_dre_evolution_12months', {
        p_company_id: companyId,
      });
      if (error) throw error;
      return (data || []) as Array<{ month_start: string; receita: number; custos: number; despesas: number }>;
    },
    enabled: !!companyId,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const data = useMemo<MonthData[]>(() => {
    if (!rawData) return [];
    return rawData.map(row => ({
      month: format(parseISO(row.month_start), "MMM/yy", { locale: ptBR }),
      receita: Number(row.receita),
      custos: Number(row.custos),
      despesas: Number(row.despesas),
      resultado: Number(row.receita) - Number(row.custos) - Number(row.despesas),
    }));
  }, [rawData]);

  // Calculate trends
  const calculateTrend = (key: keyof MonthData) => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1][key] as number;
    const previous = data[data.length - 2][key] as number;
    if (previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  const receitaTrend = calculateTrend("receita");
  const resultadoTrend = calculateTrend("resultado");

  return (
    <div className="space-y-4">
      {/* Premium Header Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-sky-500 via-cyan-600 to-teal-600 text-white shadow-xl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute right-1/3 top-1/2 h-16 w-16 rounded-full bg-white/5" />
        </div>
        <CardHeader className="relative pb-2">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <BarChart3 className="h-5 w-5" />
            Evolu\u00e7\u00e3o dos \u00daltimos 12 Meses
          </CardTitle>
          <CardDescription className="text-white/80">
            Acompanhe a tend\u00eancia de receitas, custos e resultado ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent className="relative pb-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
              {receitaTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-300" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-300" />
              )}
              <span className="text-sm font-medium">
                Receita: {receitaTrend >= 0 ? "+" : ""}{receitaTrend.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
              {resultadoTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-300" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-300" />
              )}
              <span className="text-sm font-medium">
                Resultado: {resultadoTrend >= 0 ? "+" : ""}{resultadoTrend.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                    return value.toString();
                  }}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const labels: Record<string, string> = {
                        receita: "Receita",
                        custos: "Custos",
                        despesas: "Despesas",
                        resultado: "Resultado",
                      };
                      return (
                        <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                          <p className="mb-2 font-semibold text-foreground">{label}</p>
                          <div className="flex flex-col gap-2">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full shrink-0"
                                  style={{ backgroundColor: entry.color || "hsl(var(--primary))" }}
                                />
                                <span className="text-sm font-medium text-muted-foreground">{labels[entry.name] || entry.name}:</span>
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
                <Legend
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      receita: "Receita",
                      custos: "Custos",
                      despesas: "Despesas",
                      resultado: "Resultado",
                    };
                    return labels[value] || value;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke={CHART_COLORS.receita}
                  strokeWidth={2.5}
                  dot={{ fill: CHART_COLORS.receita, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="custos"
                  stroke={CHART_COLORS.custos}
                  strokeWidth={2.5}
                  dot={{ fill: CHART_COLORS.custos, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="despesas"
                  stroke={CHART_COLORS.despesas}
                  strokeWidth={2.5}
                  dot={{ fill: CHART_COLORS.despesas, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="resultado"
                  stroke={CHART_COLORS.resultado}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.resultado, r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Color Legend Cards */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-teal-500/10 px-3 py-2">
              <div className="h-3 w-3 rounded-full bg-teal-500" />
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400">Receita</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Custos</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2">
              <div className="h-3 w-3 rounded-full bg-rose-500" />
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Despesas</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Resultado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
