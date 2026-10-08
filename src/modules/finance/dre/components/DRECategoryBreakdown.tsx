import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { DRECategory } from "@/modules/finance/dre/hooks/useDREData";

interface DRECategoryBreakdownProps {
  categories: DRECategory[];
  type: "receita" | "custo" | "despesa";
  title: string;
  formatCurrency: (value: number) => string;
}

// Strategic vibrant colors for pie chart
const COLORS_RECEITA = [
  "#14b8a6", "#0d9488", "#0f766e", "#115e59", "#134e4a",
  "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1", "#f0fdfa",
];

const COLORS_CUSTO = [
  "#f43f5e", "#e11d48", "#be123c", "#9f1239", "#881337",
  "#fb7185", "#fda4af", "#fecdd3", "#ffe4e6", "#fff1f2",
];

const COLORS_DESPESA = [
  "#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f",
  "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7", "#fffbeb",
];

const TYPE_CONFIG = {
  receita: {
    colors: COLORS_RECEITA,
    gradient: "from-teal-500 via-teal-600 to-cyan-600",
    Icon: TrendingUp,
    bgClass: "bg-teal-500/10",
    textClass: "text-teal-600 dark:text-teal-400",
  },
  custo: {
    colors: COLORS_CUSTO,
    gradient: "from-rose-500 via-rose-600 to-pink-600",
    Icon: TrendingDown,
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-600 dark:text-rose-400",
  },
  despesa: {
    colors: COLORS_DESPESA,
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    Icon: DollarSign,
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-600 dark:text-amber-400",
  },
};

export function DRECategoryBreakdown({
  categories,
  type,
  title,
  formatCurrency
}: DRECategoryBreakdownProps) {
  const config = TYPE_CONFIG[type];
  const IconComponent = config.Icon;

  const filteredCategories = categories
    .filter(c => c.type === type && c.currentValue > 0)
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 10);

  const total = filteredCategories.reduce((sum, c) => sum + c.currentValue, 0);

  const chartData = filteredCategories.map((cat, index) => ({
    name: cat.name,
    value: cat.currentValue,
    percentage: total > 0 ? (cat.currentValue / total) * 100 : 0,
    color: config.colors[index % config.colors.length],
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="p-3 sm:p-6 pb-2">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
            <PieChartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="h-[150px] sm:h-[200px] flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
            Nenhuma categoria encontrada
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      {/* Colored Header */}
      <CardHeader className={`relative overflow-hidden border-0 bg-gradient-to-br ${config.gradient} text-white p-3 sm:p-4 rounded-t-lg`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10" />
          <div className="absolute -left-2 -bottom-2 h-12 w-12 rounded-full bg-white/10" />
        </div>
        <div className="relative">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-white">
            <IconComponent className="h-4 w-4" />
            {title}
          </CardTitle>
          <CardDescription className="text-white/80 text-xs sm:text-sm mt-1">
            Total: {formatCurrency(total)}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6 pt-4">
        <div className="h-[140px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="35%"
                outerRadius="65%"
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: payload[0].color || "hsl(var(--primary))" }}
                          />
                          <span className="text-sm font-medium text-muted-foreground">{data.name}:</span>
                          <span className="text-sm font-bold text-foreground">
                            {formatCurrency(data.value)} <span className="font-normal text-muted-foreground">({data.percentage.toFixed(1)}%)</span>
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with colored badges */}
        <div className="space-y-1.5 sm:space-y-2 mt-2 sm:mt-4">
          {chartData.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between text-[11px] sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate max-w-[100px] sm:max-w-[120px]" title={item.name}>
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bgClass} ${config.textClass}`}>
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
          {chartData.length > 5 && (
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center pt-1">
              +{chartData.length - 5} outras categorias
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
