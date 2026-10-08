'use client';

import { useState, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { addDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatters";

interface ProjectionDataPoint {
  date: string;
  saldo: number;
  receber: number;
  pagar: number;
}

interface ProjectionChartProps {
  currentBalance: number;
  receivables: Array<{ due_date: string; total_amount: number; paid_amount: number }>;
  payables: Array<{ due_date: string; total_amount: number; paid_amount: number }>;
  currencySymbol: string;
}

export const ProjectionChart = memo(function ProjectionChart({
  currentBalance,
  receivables,
  payables,
  currencySymbol,
}: ProjectionChartProps) {
  const [period, setPeriod] = useState("30");

  const handlePeriodChange = useCallback((value: string) => {
    if (value) setPeriod(value);
  }, []);

  /**
   * OPTIMIZATION: Pre-index receivables/payables by date using Map.
   * Before: O(days * (receivables + payables)) — filter+reduce per day.
   * After:  O(receivables + payables + days) — single pass to build index, then O(1) lookup per day.
   * With 1000 items and 60 days: 120,000 iterations → 1,120 iterations.
   */
  const projectionData = useMemo(() => {
    const days = parseInt(period);
    const today = startOfDay(new Date());
    const data: ProjectionDataPoint[] = [];
    let runningBalance = currentBalance;

    // Build date-indexed maps: O(n) single pass
    const receivablesByDate = new Map<string, number>();
    for (const r of receivables) {
      const remaining = r.total_amount - r.paid_amount;
      receivablesByDate.set(r.due_date, (receivablesByDate.get(r.due_date) || 0) + remaining);
    }

    const payablesByDate = new Map<string, number>();
    for (const p of payables) {
      const remaining = p.total_amount - p.paid_amount;
      payablesByDate.set(p.due_date, (payablesByDate.get(p.due_date) || 0) + remaining);
    }

    // O(days) iteration with O(1) lookups
    for (let i = 0; i <= days; i++) {
      const currentDate = addDays(today, i);
      const dateStr = format(currentDate, "yyyy-MM-dd");

      const dailyReceivables = receivablesByDate.get(dateStr) || 0;
      const dailyPayables = payablesByDate.get(dateStr) || 0;

      runningBalance += dailyReceivables - dailyPayables;

      data.push({
        date: format(currentDate, "dd/MM", { locale: ptBR }),
        saldo: runningBalance,
        receber: dailyReceivables,
        pagar: dailyPayables,
      });
    }

    return data;
  }, [period, currentBalance, receivables, payables]);

  const formatYAxis = useCallback((value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toFixed(0);
  }, []);

  const formatTooltipValue = useCallback((value: number) => formatCurrency(value), []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg font-semibold">
            Projeção para os próximos dias
          </CardTitle>
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={handlePeriodChange}
            className="justify-start"
          >
            <ToggleGroupItem value="15" className="text-xs px-3">
              15 dias
            </ToggleGroupItem>
            <ToggleGroupItem value="30" className="text-xs px-3">
              30 dias
            </ToggleGroupItem>
            <ToggleGroupItem value="60" className="text-xs px-3">
              60 dias
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="receberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pagarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                width={60}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    saldo: "Saldo",
                    receber: "A Receber",
                    pagar: "A Pagar",
                  };
                  return [formatTooltipValue(value), labels[name] || name];
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    saldo: "Saldo Projetado",
                    receber: "A Receber",
                    pagar: "A Pagar",
                  };
                  return labels[value] || value;
                }}
              />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke="hsl(217, 91%, 50%)"
                fill="url(#saldoGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="receber"
                stroke="hsl(142, 76%, 36%)"
                fill="url(#receberGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="pagar"
                stroke="hsl(38, 92%, 50%)"
                fill="url(#pagarGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
