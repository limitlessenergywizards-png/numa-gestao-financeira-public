import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Cell } from "recharts";
import { Scale, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DRESummary } from "@/modules/finance/dre/hooks/useDREData";
import { formatPct } from "@/lib/formatters";

interface DREComparisonProps {
  summary: DRESummary;
  periodLabel: string;
  previousPeriodLabel: string;
  formatCurrency: (value: number) => string;
}

// Strategic color mapping for each metric
const METRIC_COLORS: Record<string, { current: string; previous: string }> = {
  "Receita": { current: "#14b8a6", previous: "#5eead4" },    // Teal
  "Custos": { current: "#f43f5e", previous: "#fda4af" },     // Rose
  "Despesas": { current: "#f59e0b", previous: "#fcd34d" },   // Amber
  "Lucro Bruto": { current: "#10b981", previous: "#6ee7b7" }, // Emerald
  "Resultado": { current: "#10b981", previous: "#6ee7b7" },   // Emerald (dynamic)
};

export function DREComparison({
  summary,
  periodLabel,
  previousPeriodLabel,
  formatCurrency
}: DREComparisonProps) {
  const comparisonData = [
    {
      name: "Receita",
      atual: summary.grossRevenue,
      anterior: summary.previousGrossRevenue,
    },
    {
      name: "Custos",
      atual: summary.costs,
      anterior: summary.previousCosts,
    },
    {
      name: "Despesas",
      atual: summary.operationalExpenses,
      anterior: summary.previousOperationalExpenses,
    },
    {
      name: "Lucro Bruto",
      atual: summary.grossProfit,
      anterior: summary.previousGrossRevenue - summary.previousCosts,
    },
    {
      name: "Resultado",
      atual: summary.netResult,
      anterior: summary.previousNetResult,
    },
  ];

  // Add colors to data
  const coloredData = comparisonData.map(item => {
    const colors = METRIC_COLORS[item.name] || METRIC_COLORS["Resultado"];
    // Dynamic color for Resultado based on value
    if (item.name === "Resultado") {
      return {
        ...item,
        currentFill: item.atual >= 0 ? "#10b981" : "#f43f5e",
        previousFill: item.anterior >= 0 ? "#6ee7b7" : "#fda4af",
      };
    }
    return {
      ...item,
      currentFill: colors.current,
      previousFill: colors.previous,
    };
  });

  const variationCards = comparisonData.map((item) => {
    const variation = item.anterior !== 0
      ? ((item.atual - item.anterior) / Math.abs(item.anterior)) * 100
      : 0;
    const isPositive = item.name === "Custos" || item.name === "Despesas"
      ? variation <= 0
      : variation >= 0;

    return { name: item.name, variation, isPositive };
  });

  return (
    <div className="space-y-4">
      {/* Premium Header Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 text-white shadow-xl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute right-1/4 top-1/2 h-16 w-16 rounded-full bg-white/5" />
        </div>
        <CardHeader className="relative pb-2">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <Scale className="h-5 w-5" />
            Comparativo: {periodLabel} vs {previousPeriodLabel}
          </CardTitle>
          <CardDescription className="text-white/80">
            Compare os principais indicadores entre períodos
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Chart Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={coloredData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => {
                    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
                    return value.toString();
                  }}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const labels: Record<string, string> = {
                        atual: periodLabel,
                        anterior: previousPeriodLabel,
                      };
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
                      atual: periodLabel,
                      anterior: previousPeriodLabel,
                    };
                    return labels[value] || value;
                  }}
                />
                <Bar dataKey="atual" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={16}>
                  {coloredData.map((entry, index) => (
                    <Cell key={`cell-atual-${index}`} fill={entry.currentFill} />
                  ))}
                </Bar>
                <Bar dataKey="anterior" fill="#5eead4" radius={[0, 4, 4, 0]} barSize={16}>
                  {coloredData.map((entry, index) => (
                    <Cell key={`cell-anterior-${index}`} fill={entry.previousFill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Variation Summary Cards */}
      <div className="grid grid-cols-5 gap-2">
        {variationCards.map((item, index) => {
          // Color mapping for each metric
          const gradientClasses: Record<string, string> = {
            "Receita": "from-teal-500 to-teal-600",
            "Custos": "from-rose-500 to-rose-600",
            "Despesas": "from-amber-500 to-amber-600",
            "Lucro Bruto": item.isPositive ? "from-emerald-500 to-emerald-600" : "from-rose-500 to-rose-600",
            "Resultado": item.isPositive ? "from-emerald-500 to-emerald-600" : "from-rose-500 to-rose-600",
          };

          const Icon = item.variation > 0.5 ? TrendingUp : item.variation < -0.5 ? TrendingDown : Minus;

          return (
            <div
              key={item.name}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradientClasses[item.name]} p-3 text-center text-white shadow-lg`}
            >
              {/* Decorative circles */}
              <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-white/10" />
              <div className="absolute -left-1 -bottom-1 h-6 w-6 rounded-full bg-white/10" />

              <div className="relative">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-sm font-bold">
                    {item.variation >= 0 ? "+" : ""}{formatPct(item.variation)}
                  </span>
                </div>
                <p className="text-[10px] text-white/90 font-medium truncate">{item.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
