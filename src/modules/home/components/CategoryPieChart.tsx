'use client';

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryPieChartProps {
  title: string;
  data: CategoryData[];
  total: number;
  currencySymbol: string;
  emptyMessage?: string;
}

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 46%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(340, 82%, 52%)",
  "hsl(173, 80%, 40%)",
];

export function CategoryPieChart({
  title,
  data,
  total,
  currencySymbol,
  emptyMessage = "Sem dados",
}: CategoryPieChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      color: item.color || COLORS[index % COLORS.length],
    }));
  }, [data]);

  const format$ = (value: number) => 
    formatCurrency(value, { symbol: currencySymbol });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {format$(data.value)}
          </p>
          <p className="text-xs text-muted-foreground">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in">
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <span className="text-sm font-semibold text-primary">
              {format$(total)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-4 space-y-2">
            {chartData.slice(0, 4).map((item, index) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="text-muted-foreground">{percentage}%</span>
                </div>
              );
            })}
            {chartData.length > 4 && (
              <p className="text-xs text-muted-foreground text-center">
                +{chartData.length - 4} categorias
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
