import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Target, Percent, DollarSign, BarChart3, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DREIndicators as DREIndicatorsType, DRESummary } from "@/modules/finance/dre/hooks/useDREData";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { getMarginLevel, MARGIN_COLORS, formatPct } from "@/lib/formatters";

interface DREIndicatorsProps {
  indicators: DREIndicatorsType;
  summary: DRESummary;
  formatCurrency: (value: number) => string;
}

interface IndicatorCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  previousValue?: number;
  benchmark?: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend?: "up" | "down" | "neutral";
  isPositive?: boolean;
  sparklineData?: number[];
  colorScheme: "emerald" | "teal" | "amber" | "sky" | "violet" | "rose";
}

type ColorScheme = "emerald" | "teal" | "amber" | "sky" | "violet" | "rose";

const colorSchemes = {
  emerald: {
    card: "bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 border-emerald-400/30",
    icon: "bg-white/20 text-white",
  },
  teal: {
    card: "bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 border-teal-400/30",
    icon: "bg-white/20 text-white",
  },
  amber: {
    card: "bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 border-amber-400/30",
    icon: "bg-white/20 text-white",
  },
  sky: {
    card: "bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 border-sky-400/30",
    icon: "bg-white/20 text-white",
  },
  violet: {
    card: "bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700 border-violet-400/30",
    icon: "bg-white/20 text-white",
  },
  rose: {
    card: "bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 border-rose-400/30",
    icon: "bg-white/20 text-white",
  },
};

function IndicatorCard({
  title,
  value,
  suffix = "%",
  previousValue,
  benchmark,
  icon: Icon,
  description,
  trend,
  isPositive = true,
  sparklineData,
  colorScheme,
}: IndicatorCardProps) {
  const variation = previousValue !== undefined && previousValue !== 0
    ? ((Number(value) - previousValue) / Math.abs(previousValue)) * 100
    : 0;

  const colors = colorSchemes[colorScheme];

  const getTrendIcon = () => {
    if (trend === "up" || variation > 0) return <TrendingUp className="h-2.5 w-2.5" />;
    if (trend === "down" || variation < 0) return <TrendingDown className="h-2.5 w-2.5" />;
    return null;
  };

  const getTrendColor = () => {
    const isGood = isPositive ? variation >= 0 : variation <= 0;
    return isGood ? "text-white bg-white/20" : "text-white bg-white/10";
  };

  return (
    <Card className={cn("overflow-hidden hover:shadow-xl transition-[transform,box-shadow] border shadow-lg relative", colors.card)}>
      {/* Decorative circles */}
      <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-white/10" />
      <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-white/5" />

      <CardContent className="p-2.5 sm:p-3 relative z-10">
        <div className="flex items-start justify-between mb-1 sm:mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className={cn("p-1 rounded-lg", colors.icon)}>
              <Icon className="h-3 w-3" />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-0.5 cursor-help">
                    <span className="text-[10px] sm:text-xs font-medium text-white/90 truncate max-w-[70px] sm:max-w-none">{title}</span>
                    <HelpCircle className="h-2.5 w-2.5 text-white/50 shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px]">
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {(trend || variation !== 0) && (
            <div className={cn("flex items-center gap-0.5 text-[10px] sm:text-xs font-medium shrink-0 rounded-full px-1.5 py-0.5", getTrendColor())}>
              {getTrendIcon()}
              <span>{variation >= 0 ? "+" : ""}{formatPct(variation)}</span>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold text-white truncate">
              {typeof value === "number" ? formatPct(value).replace("%", "") : value}
              <span className="text-[10px] sm:text-xs font-normal text-white/70">{suffix}</span>
            </p>
            {benchmark !== undefined && (
              <p className="text-[10px] text-white/70 mt-0.5">
                Benchmark: {benchmark}{suffix}
              </p>
            )}
          </div>

          {sparklineData && sparklineData.length > 0 && (
            <div className="w-12 h-6 sm:w-16 sm:h-8 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData.map((v, i) => ({ value: v, index: i }))}>
                  <defs>
                    <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.5)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={1.5}
                    fill={`url(#gradient-${title})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DREIndicators({ indicators, summary, formatCurrency }: DREIndicatorsProps) {
  // Dynamic color schemes based on margin values
  const grossMarginColor: ColorScheme = MARGIN_COLORS[getMarginLevel(indicators.grossMargin, 'bruta')];
  const operationalMarginColor: ColorScheme = MARGIN_COLORS[getMarginLevel(indicators.operationalMargin, 'operacional')];
  const netMarginColor: ColorScheme = MARGIN_COLORS[getMarginLevel(indicators.netMargin, 'liquida')];

  // Absorção de custos: % da receita consumido por custos e despesas
  const breakEvenPoint = summary.costs + summary.operationalExpenses;
  const revenueToBreakEven = summary.netRevenue > 0
    ? (breakEvenPoint / summary.netRevenue) * 100
    : 0;

  // Cobertura de custos: quanto a receita cobre custos e despesas totais
  const totalCostsAndExpenses = summary.costs + summary.operationalExpenses;
  const costCoverage = totalCostsAndExpenses > 0
    ? (summary.netRevenue / totalCostsAndExpenses) * 100
    : 0;

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm sm:text-base font-semibold">Indicadores Financeiros</h3>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
        <IndicatorCard
          title="Margem Bruta"
          value={indicators.grossMargin}
          previousValue={indicators.previousGrossMargin}
          benchmark={40}
          icon={Percent}
          description="Percentual da receita que sobra após deduzir os custos diretos dos produtos/serviços vendidos."
          isPositive={true}
          colorScheme={grossMarginColor}
        />

        <IndicatorCard
          title="Margem Oper."
          value={indicators.operationalMargin}
          previousValue={indicators.previousOperationalMargin}
          benchmark={25}
          icon={Target}
          description="Percentual da receita que sobra após todas as despesas operacionais."
          isPositive={true}
          colorScheme={operationalMarginColor}
        />

        <IndicatorCard
          title="Margem Líquida"
          value={indicators.netMargin}
          previousValue={indicators.previousNetMargin}
          benchmark={15}
          icon={Percent}
          description="Percentual do lucro líquido em relação à receita total. Indica a eficiência geral do negócio."
          isPositive={true}
          colorScheme={netMarginColor}
        />

        <IndicatorCard
          title="Result. Oper."
          value={formatCurrency(indicators.ebitda)}
          previousValue={indicators.previousEbitda}
          suffix=""
          icon={DollarSign}
          description="Resultado operacional do período (EBIT). Receita menos custos e despesas operacionais."
          isPositive={true}
          colorScheme="amber"
        />

        <IndicatorCard
          title="Cobertura"
          value={costCoverage}
          benchmark={150}
          icon={TrendingUp}
          description="Percentual que a receita cobre custos e despesas totais. Acima de 100% indica lucro."
          isPositive={true}
          colorScheme="violet"
        />

        <IndicatorCard
          title="Absorção"
          value={revenueToBreakEven}
          benchmark={70}
          icon={Target}
          description="Percentual da receita consumido por custos e despesas. Abaixo de 100% indica lucro operacional."
          isPositive={false}
          colorScheme="rose"
        />
      </div>
    </div>
  );
}
