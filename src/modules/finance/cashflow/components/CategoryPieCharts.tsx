'use client';

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { DetailedTransaction } from "./CashFlowTypes";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryPieChartsProps {
  transactions: DetailedTransaction[];
  formatCurrency: (value: number) => string;
}

const INCOME_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(142, 70%, 45%)",
  "hsl(142, 60%, 52%)",
  "hsl(158, 64%, 42%)",
  "hsl(158, 55%, 50%)",
  "hsl(170, 50%, 45%)",
];

const EXPENSE_COLORS = [
  "hsl(0, 84%, 55%)",
  "hsl(25, 95%, 53%)",
  "hsl(38, 92%, 50%)",
  "hsl(12, 76%, 52%)",
  "hsl(350, 80%, 50%)",
  "hsl(320, 70%, 50%)",
];

export function CategoryPieCharts({ transactions, formatCurrency }: CategoryPieChartsProps) {
  const incomeByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();

    transactions
      .filter((t) => t.type === "entrada")
      .forEach((t) => {
        const categoryName = t.category || "Sem Categoria";
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + t.amount);
      });

    const result: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: INCOME_COLORS[index % INCOME_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return result;
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();

    transactions
      .filter((t) => t.type === "saida")
      .forEach((t) => {
        const categoryName = t.category || "Sem Categoria";
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + t.amount);
      });

    const result: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return result;
  }, [transactions]);

  const totalIncome = incomeByCategory.reduce((sum, item) => sum + item.value, 0);
  const totalExpense = expenseByCategory.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)}
          </p>
          <p className="text-xs text-muted-foreground">
            {((data.value / (payload[0].dataKey === "value" ? totalIncome || totalExpense : 1)) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Income Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <ArrowDownCircle className="h-4 w-4 text-success" />
            </div>
            Distribuição de Entradas
          </CardTitle>
          <CardDescription>
            Total: {formatCurrency(totalIncome)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incomeByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
              Nenhuma entrada no período
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={incomeByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {incomeByCategory.map((entry, index) => (
                      <Cell
                        key={`income-cell-${index}`}
                        fill={entry.color}
                        className="transition-opacity hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <text
                    x="50%"
                    y="46%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-xs font-medium"
                  >
                    Total
                  </text>
                  <text
                    x="50%"
                    y="56%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-sm font-bold"
                  >
                    {(totalIncome / 1000).toFixed(1)}k
                  </text>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {incomeByCategory.slice(0, 4).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate max-w-[140px]">{item.name}</span>
                    </div>
                    <span className="font-medium tabular-nums text-success">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Expense Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ArrowUpCircle className="h-4 w-4 text-destructive" />
            </div>
            Distribuição de Saídas
          </CardTitle>
          <CardDescription>
            Total: {formatCurrency(totalExpense)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenseByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
              Nenhuma saída no período
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell
                        key={`expense-cell-${index}`}
                        fill={entry.color}
                        className="transition-opacity hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <text
                    x="50%"
                    y="46%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-xs font-medium"
                  >
                    Total
                  </text>
                  <text
                    x="50%"
                    y="56%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-sm font-bold"
                  >
                    {(totalExpense / 1000).toFixed(1)}k
                  </text>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {expenseByCategory.slice(0, 4).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate max-w-[140px]">{item.name}</span>
                    </div>
                    <span className="font-medium tabular-nums text-destructive">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
