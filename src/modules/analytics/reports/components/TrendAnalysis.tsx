'use client';

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ArrowRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendData {
  period: string;
  income: number;
  expense: number;
  balance: number;
}

interface TrendAnalysisProps {
  data: TrendData[];
  currencySymbol?: string;
}

export function TrendAnalysis({ data, currencySymbol = "R$" }: TrendAnalysisProps) {
  const analysis = useMemo(() => {
    if (data.length < 2) return null;

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];

    const incomeTrend = previous.income > 0 
      ? ((latest.income - previous.income) / previous.income) * 100 
      : 0;
    const expenseTrend = previous.expense > 0 
      ? ((latest.expense - previous.expense) / previous.expense) * 100 
      : 0;
    const balanceTrend = previous.balance !== 0 
      ? ((latest.balance - previous.balance) / Math.abs(previous.balance)) * 100 
      : 0;

    // Calculate averages
    const avgIncome = data.reduce((acc, d) => acc + d.income, 0) / data.length;
    const avgExpense = data.reduce((acc, d) => acc + d.expense, 0) / data.length;
    const avgBalance = data.reduce((acc, d) => acc + d.balance, 0) / data.length;

    // Simple linear regression for projection
    const n = data.length;
    const xSum = (n * (n + 1)) / 2;
    const xSquaredSum = (n * (n + 1) * (2 * n + 1)) / 6;
    
    const incomeYSum = data.reduce((acc, d) => acc + d.income, 0);
    const incomeXYSum = data.reduce((acc, d, i) => acc + d.income * (i + 1), 0);
    const incomeSlope = (n * incomeXYSum - xSum * incomeYSum) / (n * xSquaredSum - xSum * xSum);
    const incomeProjection = latest.income + incomeSlope * 3; // Project 3 periods ahead

    const expenseYSum = data.reduce((acc, d) => acc + d.expense, 0);
    const expenseXYSum = data.reduce((acc, d, i) => acc + d.expense * (i + 1), 0);
    const expenseSlope = (n * expenseXYSum - xSum * expenseYSum) / (n * xSquaredSum - xSum * xSum);
    const expenseProjection = latest.expense + expenseSlope * 3;

    return {
      income: {
        current: latest.income,
        trend: incomeTrend,
        average: avgIncome,
        projection: Math.max(0, incomeProjection),
        slope: incomeSlope,
      },
      expense: {
        current: latest.expense,
        trend: expenseTrend,
        average: avgExpense,
        projection: Math.max(0, expenseProjection),
        slope: expenseSlope,
      },
      balance: {
        current: latest.balance,
        trend: balanceTrend,
        average: avgBalance,
      },
    };
  }, [data]);

  if (!analysis) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Dados insuficientes para análise de tendência
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return `${currencySymbol} ${Math.abs(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 2) return <TrendingUp className="h-4 w-4" />;
    if (trend < -2) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = (trend: number, inverse: boolean = false) => {
    const isPositive = inverse ? trend < 0 : trend > 0;
    if (Math.abs(trend) < 2) return "text-muted-foreground";
    return isPositive ? "text-success" : "text-destructive";
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Análise de Tendências
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Income Trend */}
          <div className="space-y-3 p-4 rounded-lg bg-success/5 border border-success/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Receitas</span>
              <Badge
                variant="outline"
                className={cn("gap-1", getTrendColor(analysis.income.trend))}
              >
                {getTrendIcon(analysis.income.trend)}
                {analysis.income.trend > 0 ? "+" : ""}
                {analysis.income.trend.toFixed(1)}%
              </Badge>
            </div>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(analysis.income.current)}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Média:</span>
                <span>{formatCurrency(analysis.income.average)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  Projeção <ArrowRight className="h-3 w-3" />
                </span>
                <span className={analysis.income.slope > 0 ? "text-success" : "text-destructive"}>
                  {formatCurrency(analysis.income.projection)}
                </span>
              </div>
            </div>
          </div>

          {/* Expense Trend */}
          <div className="space-y-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Despesas</span>
              <Badge
                variant="outline"
                className={cn("gap-1", getTrendColor(analysis.expense.trend, true))}
              >
                {getTrendIcon(analysis.expense.trend)}
                {analysis.expense.trend > 0 ? "+" : ""}
                {analysis.expense.trend.toFixed(1)}%
              </Badge>
            </div>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(analysis.expense.current)}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Média:</span>
                <span>{formatCurrency(analysis.expense.average)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  Projeção <ArrowRight className="h-3 w-3" />
                </span>
                <span className={analysis.expense.slope < 0 ? "text-success" : "text-destructive"}>
                  {formatCurrency(analysis.expense.projection)}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Trend */}
          <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Saldo</span>
              <Badge
                variant="outline"
                className={cn("gap-1", getTrendColor(analysis.balance.trend))}
              >
                {getTrendIcon(analysis.balance.trend)}
                {analysis.balance.trend > 0 ? "+" : ""}
                {analysis.balance.trend.toFixed(1)}%
              </Badge>
            </div>
            <div className={cn(
              "text-2xl font-bold",
              analysis.balance.current >= 0 ? "text-primary" : "text-destructive"
            )}>
              {analysis.balance.current < 0 && "-"}
              {formatCurrency(analysis.balance.current)}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Média:</span>
                <span className={analysis.balance.average >= 0 ? "text-success" : "text-destructive"}>
                  {analysis.balance.average < 0 && "-"}
                  {formatCurrency(analysis.balance.average)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Status:</span>
                <span className={analysis.balance.current >= analysis.balance.average ? "text-success" : "text-warning"}>
                  {analysis.balance.current >= analysis.balance.average ? "Acima da média" : "Abaixo da média"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
