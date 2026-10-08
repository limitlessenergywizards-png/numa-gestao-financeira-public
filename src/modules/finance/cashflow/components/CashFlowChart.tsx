import { memo } from 'react';
import { formatCompactStandalone } from '@/hooks/useFormatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  Line, ComposedChart 
} from "recharts";
import { format, parseISO } from "date-fns";
import type { DailyDetail } from "./CashFlowTypes";

interface CashFlowChartProps {
  dailyData: DailyDetail[];
  formatCurrency: (value: number) => string;
}

function CashFlowChart({ dailyData, formatCurrency }: CashFlowChartProps) {
  const chartData = dailyData.map(d => ({
    date: format(parseISO(d.date), 'dd/MM'),
    Entradas: d.entradas,
    Saídas: d.saidas,
    Saldo: d.saldoAcumulado,
  }));

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Fluxo de Caixa</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Visualização de entradas, saídas e saldo acumulado
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        <div className="h-[300px] sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                tickFormatter={formatCompactStandalone}
              />
              <RechartsTooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Data: ${label}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Line 
                type="monotone" 
                dataKey="Saldo" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(CashFlowChart);
