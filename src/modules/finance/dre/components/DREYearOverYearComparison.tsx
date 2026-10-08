'use client';

import { useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Minus, CalendarRange, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDREData } from "@/modules/finance/dre/hooks/useDREData";
import { formatPct } from "@/lib/formatters";
import { format, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface DREYearOverYearComparisonProps {
  companyId: string | undefined;
  formatCurrency: (value: number) => string;
}

// Color mapping for metrics
const METRIC_COLORS = {
  "Receita Bruta": { current: "#14b8a6", lastYear: "#5eead4" }, // Teal
  "Custos": { current: "#f43f5e", lastYear: "#fda4af" }, // Rose
  "Lucro Bruto": { current: "#10b981", lastYear: "#6ee7b7" }, // Emerald
  "Despesas": { current: "#f59e0b", lastYear: "#fcd34d" }, // Amber
  "Resultado Líq.": { current: "#10b981", lastYear: "#6ee7b7" }, // Dynamic - will be overridden
};

// Memoized chart component to prevent re-renders
const YoYChart = memo(function YoYChart({
  chartData,
  currentMonth,
  previousYearMonth,
  formatCurrency
}: {
  chartData: Array<{ name: string; current: number; lastYear: number }>;
  currentMonth: string;
  previousYearMonth: string;
  formatCurrency: (value: number) => string;
}) {
  // Check if data is valid
  const hasValidData = chartData.some(d => d.current !== 0 || d.lastYear !== 0);

  if (!hasValidData) {
    return (
      <div className="h-64 sm:h-72 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Sem dados para comparação</p>
      </div>
    );
  }

  // Enhanced chart data with colors
  const coloredData = chartData.map(item => {
    const colors = METRIC_COLORS[item.name as keyof typeof METRIC_COLORS] || { current: "#14b8a6", lastYear: "#5eead4" };
    // Dynamic color for net result based on value
    if (item.name === "Resultado Líq.") {
      return {
        ...item,
        currentFill: item.current >= 0 ? "#10b981" : "#f43f5e",
        lastYearFill: item.lastYear >= 0 ? "#6ee7b7" : "#fda4af",
      };
    }
    return {
      ...item,
      currentFill: colors.current,
      lastYearFill: colors.lastYear,
    };
  });

  return (
    <div className="h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={coloredData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
          <defs>
            {coloredData.map((item, index) => (
              <linearGradient key={`grad-current-${index}`} id={`gradCurrent${index}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={item.currentFill} stopOpacity={0.9} />
                <stop offset="100%" stopColor={item.currentFill} stopOpacity={1} />
              </linearGradient>
            ))}
            {coloredData.map((item, index) => (
              <linearGradient key={`grad-last-${index}`} id={`gradLast${index}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={item.lastYearFill} stopOpacity={0.5} />
                <stop offset="100%" stopColor={item.lastYearFill} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <XAxis
            type="number"
            tickFormatter={(v) => {
              const absV = Math.abs(v);
              if (absV >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
              if (absV >= 1000) return `${(v / 1000).toFixed(0)}k`;
              return v.toString();
            }}
          />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 500 }} width={75} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                    <p className="mb-2 font-semibold text-foreground">{label}</p>
                    <div className="flex flex-col gap-2">
                      {payload.map((entry: any, index: number) => {
                        const isCurrent = entry.dataKey === "current";
                        const color = isCurrent ? entry.payload.currentFill : entry.payload.lastYearFill;
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: color || entry.color || "hsl(var(--primary))" }}
                            />
                            <span className="text-sm font-medium text-muted-foreground">{entry.name}:</span>
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(Math.abs(entry.value))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar
            dataKey="current"
            name={currentMonth}
            fill="#14b8a6"
            radius={[0, 6, 6, 0]}
            barSize={16}
          >
            {coloredData.map((entry, index) => (
              <Cell key={`cell-current-${index}`} fill={entry.currentFill} />
            ))}
          </Bar>
          <Bar
            dataKey="lastYear"
            name={previousYearMonth}
            fill="#5eead4"
            radius={[0, 6, 6, 0]}
            barSize={16}
          >
            {coloredData.map((entry, index) => (
              <Cell key={`cell-last-${index}`} fill={entry.lastYearFill} fillOpacity={0.6} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export function DREYearOverYearComparison({
  companyId,
  formatCurrency,
}: DREYearOverYearComparisonProps) {
  // Memoize dates to prevent recalculation on every render
  const { currentMonth, previousYearMonth, lastYearStart, lastYearEnd } = useMemo(() => {
    const now = new Date();
    return {
      currentMonth: format(now, "MMMM yyyy", { locale: ptBR }),
      previousYearMonth: format(subYears(now, 1), "MMMM yyyy", { locale: ptBR }),
      lastYearStart: subYears(new Date(now.getFullYear(), now.getMonth(), 1), 1),
      lastYearEnd: subYears(new Date(now.getFullYear(), now.getMonth() + 1, 0), 1),
    };
  }, []);

  // Current month data
  const {
    dreLines: currentLines,
    summary: currentSummary,
    isLoading: isLoadingCurrent
  } = useDREData(companyId, "current_month");

  // Same month last year
  const {
    dreLines: lastYearLines,
    summary: lastYearSummary,
    isLoading: isLoadingLastYear
  } = useDREData(companyId, "custom", lastYearStart, lastYearEnd);

  const isLoading = isLoadingCurrent || isLoadingLastYear;

  // Calculate variations - memoized
  const comparisonData = useMemo(() => {
    if (!currentLines.length) return [];

    const mainLines = currentLines.filter(
      line => line.type === "subtotal" || line.type === "total" || line.type === "header"
    );

    return mainLines.map(currentLine => {
      const lastYearLine = lastYearLines.find(l => l.id === currentLine.id);
      const lastYearValue = lastYearLine?.currentValue || 0;

      const absoluteVariation = currentLine.currentValue - lastYearValue;
      const percentVariation = lastYearValue !== 0
        ? ((currentLine.currentValue - lastYearValue) / Math.abs(lastYearValue)) * 100
        : currentLine.currentValue !== 0 ? 100 : 0;

      return {
        id: currentLine.id,
        name: currentLine.name,
        type: currentLine.type,
        currentValue: currentLine.currentValue,
        lastYearValue,
        absoluteVariation,
        percentVariation,
      };
    });
  }, [currentLines, lastYearLines]);

  // Chart data - memoized with safe values
  const chartData = useMemo(() => {
    const grossProfit = currentSummary.grossRevenue - currentSummary.costs;
    const lastYearGrossProfit = lastYearSummary.grossRevenue - lastYearSummary.costs;

    return [
      {
        name: "Receita Bruta",
        current: currentSummary.grossRevenue || 0,
        lastYear: lastYearSummary.grossRevenue || 0,
      },
      {
        name: "Custos",
        current: -(currentSummary.costs || 0),
        lastYear: -(lastYearSummary.costs || 0),
      },
      {
        name: "Lucro Bruto",
        current: grossProfit || 0,
        lastYear: lastYearGrossProfit || 0,
      },
      {
        name: "Despesas",
        current: -(currentSummary.operationalExpenses || 0),
        lastYear: -(lastYearSummary.operationalExpenses || 0),
      },
      {
        name: "Resultado Líq.",
        current: currentSummary.netResult || 0,
        lastYear: lastYearSummary.netResult || 0,
      },
    ];
  }, [currentSummary, lastYearSummary]);

  const getVariationIcon = (percent: number) => {
    if (percent > 5) return <TrendingUp className="h-3.5 w-3.5 text-success" />;
    if (percent < -5) return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getVariationColor = (percent: number, isExpense: boolean = false) => {
    // For expenses/costs, decrease is good
    const adjustedPercent = isExpense ? -percent : percent;
    if (adjustedPercent > 5) return "text-success";
    if (adjustedPercent < -5) return "text-destructive";
    return "text-muted-foreground";
  };

  const getRowBgClass = (type: string) => {
    switch (type) {
      case "total": return "bg-primary/5 font-bold";
      case "subtotal": return "bg-muted/50 font-semibold";
      case "header": return "font-medium";
      default: return "";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Card - Premium Gradient */}
      <Card className="bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 border-0 shadow-xl overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/10" />
        <CardHeader className="pb-3 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                <CalendarRange className="h-5 w-5 text-white" />
                Comparativo Ano-a-Ano
              </CardTitle>
              <CardDescription className="text-white/80">
                Comparação do mesmo período entre anos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge className="capitalize bg-white/20 text-white border-white/30 hover:bg-white/30">
                {currentMonth}
              </Badge>
              <ArrowRightLeft className="h-4 w-4 text-white/70" />
              <Badge className="capitalize bg-white/20 text-white border-white/30 hover:bg-white/30">
                {previousYearMonth}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chart - Memoized */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Evolução das Principais Métricas</CardTitle>
        </CardHeader>
        <CardContent>
          <YoYChart
            chartData={chartData}
            currentMonth={currentMonth}
            previousYearMonth={previousYearMonth}
            formatCurrency={formatCurrency}
          />
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Comparação Detalhada</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="rounded-lg border overflow-hidden">
            <ScrollArea className="w-full">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader className="[&_th]:!bg-gradient-to-r [&_th]:from-[#C5A059] [&_th]:via-[#E8D5A8] [&_th]:to-[#C5A059] [&_th]:!text-[#1a1a1a] [&_th]:!font-bold [&_th]:!text-[13px] [&_th]:!tracking-wide [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg">
                    <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                      <TableHead className="w-[35%]">Descrição</TableHead>
                      <TableHead className="text-right capitalize">{currentMonth}</TableHead>
                      <TableHead className="text-right capitalize">{previousYearMonth}</TableHead>
                      <TableHead className="text-right">Var. (R$)</TableHead>
                      <TableHead className="text-right">Var. (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((row) => {
                      const isExpense = row.name.toLowerCase().includes("custo") ||
                        row.name.toLowerCase().includes("despesa");

                      return (
                        <TableRow key={row.id} className={getRowBgClass(row.type)}>
                          <TableCell className="text-xs sm:text-sm py-2 sm:py-3">
                            {row.name}
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-mono text-xs sm:text-sm py-2 sm:py-3",
                            row.currentValue < 0 ? "text-destructive" : ""
                          )}>
                            {formatCurrency(row.currentValue)}
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-mono text-xs sm:text-sm py-2 sm:py-3 text-muted-foreground",
                            row.lastYearValue < 0 ? "text-destructive/70" : ""
                          )}>
                            {formatCurrency(row.lastYearValue)}
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-mono text-xs sm:text-sm py-2 sm:py-3",
                            getVariationColor(row.absoluteVariation, isExpense)
                          )}>
                            {row.absoluteVariation >= 0 ? "+" : ""}
                            {formatCurrency(row.absoluteVariation)}
                          </TableCell>
                          <TableCell className="text-right py-2 sm:py-3">
                            <div className={cn(
                              "flex items-center justify-end gap-1 text-xs sm:text-sm font-medium",
                              getVariationColor(row.percentVariation, isExpense)
                            )}>
                              {getVariationIcon(isExpense ? -row.percentVariation : row.percentVariation)}
                              <span>
                                {row.percentVariation >= 0 ? "+" : ""}
                                {formatPct(row.percentVariation)}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards - Vibrant Gradients */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Result Variation - Dynamic Emerald/Rose */}
        <Card className={cn(
          "border-0 shadow-xl overflow-hidden relative",
          currentSummary.netResult >= lastYearSummary.netResult
            ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700"
            : "bg-gradient-to-br from-rose-500 via-rose-600 to-red-700"
        )}>
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-white/10" />
          <CardContent className="p-4 relative z-10">
            <p className="text-xs text-white/80 font-medium">Variação do Resultado</p>
            <p className="text-2xl font-bold mt-1 text-white">
              {formatPct((currentSummary.netResult - lastYearSummary.netResult) / Math.abs(lastYearSummary.netResult || 1) * 100)}
            </p>
            <p className="text-xs text-white/70 mt-1 font-medium">
              {formatCurrency(currentSummary.netResult - lastYearSummary.netResult)}
            </p>
          </CardContent>
        </Card>

        {/* Revenue Variation - Teal */}
        <Card className="bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 border-0 shadow-xl overflow-hidden relative">
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-white/10" />
          <CardContent className="p-4 relative z-10">
            <p className="text-xs text-white/80 font-medium">Variação da Receita</p>
            <p className="text-2xl font-bold mt-1 text-white">
              {formatPct((currentSummary.grossRevenue - lastYearSummary.grossRevenue) / Math.abs(lastYearSummary.grossRevenue || 1) * 100)}
            </p>
            <p className="text-xs text-white/70 mt-1 font-medium">
              {formatCurrency(currentSummary.grossRevenue - lastYearSummary.grossRevenue)}
            </p>
          </CardContent>
        </Card>

        {/* Cost Variation - Amber */}
        <Card className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 border-0 shadow-xl overflow-hidden relative">
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-white/10" />
          <CardContent className="p-4 relative z-10">
            <p className="text-xs text-white/80 font-medium">Variação de Custos</p>
            <p className="text-2xl font-bold mt-1 text-white">
              {formatPct((currentSummary.costs - lastYearSummary.costs) / Math.abs(lastYearSummary.costs || 1) * 100)}
            </p>
            <p className="text-xs text-white/70 mt-1 font-medium">
              {formatCurrency(currentSummary.costs - lastYearSummary.costs)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
