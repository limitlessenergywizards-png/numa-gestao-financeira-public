'use client';

import { useMemo } from "react";
import { formatCompactStandalone } from '@/hooks/useFormatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export interface MonthlyComparisonData {
  month: string;
  monthLabel: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

interface ComparisonViewProps {
  data: MonthlyComparisonData[];
  formatCurrency: (value: number) => string;
  isLoading?: boolean;
}

export function ComparisonView({ data, formatCurrency, isLoading }: ComparisonViewProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: item.monthLabel,
      Entradas: item.entradas,
      Saídas: item.saidas,
      "Saldo Acumulado": item.saldoAcumulado,
    }));
  }, [data]);

  const tableData = useMemo(() => {
    return data.map((item, index) => {
      const previousItem = index > 0 ? data[index - 1] : null;
      const variation = previousItem
        ? previousItem.saldo !== 0
          ? ((item.saldo - previousItem.saldo) / Math.abs(previousItem.saldo)) * 100
          : 0
        : null;

      return {
        ...item,
        variation,
      };
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Sem dados para comparação</h3>
          <p className="text-muted-foreground text-sm">
            Não há dados suficientes para exibir o comparativo mensal.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Chart */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Evolução Mensal - Últimos 6 Meses
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Comparativo de entradas, saídas e saldo acumulado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="h-[250px] sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }} 
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickFormatter={formatCompactStandalone
                  }
                />
                <Tooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="Saldo Acumulado"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Detalhamento Mensal</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Valores e variações mês a mês
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <ScrollArea className="w-full">
            <div className="min-w-[600px] rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="[&_th]:!bg-gradient-to-r [&_th]:from-[#C5A059] [&_th]:via-[#E8D5A8] [&_th]:to-[#C5A059] [&_th]:!text-[#1a1a1a] [&_th]:!font-bold [&_th]:!text-[13px] [&_th]:!tracking-wide [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg">
                  <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                    <TableHead className="sticky left-0 z-10 !bg-gradient-to-r from-[#C5A059] via-[#E8D5A8] to-[#C5A059]">Mês</TableHead>
                    <TableHead className="text-right">Entradas</TableHead>
                    <TableHead className="text-right">Saídas</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Saldo</TableHead>
                    <TableHead className="text-right">Acumulado</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Variação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row) => (
                    <TableRow key={row.month} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-xs sm:text-sm sticky left-0 bg-card">{row.monthLabel}</TableCell>
                      <TableCell className="text-right font-mono text-success text-xs sm:text-sm">
                        {formatCurrency(row.entradas)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive text-xs sm:text-sm">
                        {formatCurrency(row.saidas)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono font-medium text-xs sm:text-sm hidden sm:table-cell",
                        row.saldo >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {formatCurrency(row.saldo)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono font-semibold text-xs sm:text-sm",
                        row.saldoAcumulado >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {formatCurrency(row.saldoAcumulado)}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        {row.variation === null ? (
                          <Badge variant="secondary" className="font-mono text-xs">
                            —
                          </Badge>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {row.variation > 0 ? (
                              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                            ) : row.variation < 0 ? (
                              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                            ) : (
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            )}
                            <span
                              className={cn(
                                "font-mono text-xs sm:text-sm",
                                row.variation > 0
                                  ? "text-success"
                                  : row.variation < 0
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                              )}
                            >
                              {row.variation > 0 ? "+" : ""}
                              {row.variation.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
