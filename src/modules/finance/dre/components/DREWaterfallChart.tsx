import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { TrendingUp, ArrowRight } from "lucide-react";
import { DRESummary } from "@/modules/finance/dre/hooks/useDREData";

interface DREWaterfallChartProps {
  summary: DRESummary;
  formatCurrency: (value: number) => string;
}

// Strategic color mapping
const WATERFALL_COLORS = {
  revenue: "#14b8a6",      // Teal
  deduction: "#f43f5e",    // Rose
  cost: "#f43f5e",         // Rose
  expense: "#f43f5e",      // Rose
  profitPositive: "#10b981", // Emerald
  profitNegative: "#f43f5e", // Rose
  totalPositive: "#10b981",  // Emerald
  totalNegative: "#f43f5e",  // Rose
};

export function DREWaterfallChart({ summary, formatCurrency }: DREWaterfallChartProps) {
  // Build waterfall data
  const waterfallData = [
    {
      name: "Receita Bruta",
      value: summary.grossRevenue,
      total: summary.grossRevenue,
      isPositive: true,
      isTotal: false,
      colorType: "revenue",
    },
    {
      name: "Deduções",
      value: -summary.deductions,
      start: summary.grossRevenue - summary.deductions,
      total: summary.grossRevenue - summary.deductions,
      isPositive: false,
      isTotal: false,
      colorType: "deduction",
    },
    {
      name: "Custos",
      value: -summary.costs,
      start: summary.netRevenue - summary.costs,
      total: summary.grossProfit,
      isPositive: false,
      isTotal: false,
      colorType: "cost",
    },
    {
      name: "Lucro Bruto",
      value: summary.grossProfit,
      total: summary.grossProfit,
      isPositive: summary.grossProfit >= 0,
      isTotal: true,
      colorType: summary.grossProfit >= 0 ? "profitPositive" : "profitNegative",
    },
    {
      name: "Despesas",
      value: -summary.operationalExpenses,
      start: summary.grossProfit - summary.operationalExpenses,
      total: summary.netResult,
      isPositive: false,
      isTotal: false,
      colorType: "expense",
    },
    {
      name: "Resultado",
      value: summary.netResult,
      total: summary.netResult,
      isPositive: summary.netResult >= 0,
      isTotal: true,
      colorType: summary.netResult >= 0 ? "totalPositive" : "totalNegative",
    },
  ];

  // Transform for stacked bar
  const chartData = waterfallData.map((item, index) => {
    if (index === 0) {
      return {
        name: item.name,
        invisible: 0,
        value: item.value,
        isPositive: item.isPositive,
        isTotal: item.isTotal,
        colorType: item.colorType,
      };
    }

    if (item.isTotal) {
      return {
        name: item.name,
        invisible: 0,
        value: item.value,
        isPositive: item.isPositive,
        isTotal: item.isTotal,
        colorType: item.colorType,
      };
    }

    // Calculate the invisible part (stack base)
    const prevTotal = waterfallData[index - 1].total;
    const invisible = item.value < 0 ? prevTotal + item.value : prevTotal;

    return {
      name: item.name,
      invisible: Math.max(0, invisible),
      value: Math.abs(item.value),
      isPositive: item.isPositive,
      isTotal: item.isTotal,
      actualValue: item.value,
      colorType: item.colorType,
    };
  });

  const getBarColor = (entry: any) => {
    return WATERFALL_COLORS[entry.colorType as keyof typeof WATERFALL_COLORS] || WATERFALL_COLORS.revenue;
  };

  return (
    <div className="space-y-4">
      {/* Premium Header Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white shadow-xl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute right-1/4 top-1/3 h-16 w-16 rounded-full bg-white/5" />
        </div>
        <CardHeader className="relative pb-2">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <TrendingUp className="h-5 w-5" />
            Composição do Resultado (Waterfall)
          </CardTitle>
          <CardDescription className="text-white/80">
            Visualize como a receita se transforma em resultado
          </CardDescription>
        </CardHeader>
        <CardContent className="relative pb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-lg bg-white/20 px-3 py-1 font-medium">
              {formatCurrency(summary.grossRevenue)}
            </span>
            <ArrowRight className="h-4 w-4" />
            <span className={`rounded-lg px-3 py-1 font-medium ${summary.netResult >= 0 ? 'bg-emerald-500/30' : 'bg-rose-500/30'}`}>
              {formatCurrency(summary.netResult)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Chart Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const actualValue = data.actualValue ?? payload[0].value;
                      return (
                        <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                          <p className="mb-2 font-semibold text-foreground">{label}</p>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: payload[0].color || "hsl(var(--primary))" }}
                            />
                            <span className="text-sm font-medium text-muted-foreground">Valor:</span>
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(actualValue)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Bar dataKey="invisible" stackId="stack" fill="transparent" />
                <Bar dataKey="value" stackId="stack" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 rounded-lg bg-teal-500/10 px-3 py-1.5">
              <div className="w-3 h-3 rounded-sm bg-teal-500" />
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400">Receitas</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-1.5">
              <div className="w-3 h-3 rounded-sm bg-rose-500" />
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Deduções/Custos/Despesas</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Lucros/Resultados</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
