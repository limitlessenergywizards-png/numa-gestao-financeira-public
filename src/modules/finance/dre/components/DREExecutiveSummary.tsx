import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Activity, Target, Sparkles, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DREIndicators, DRESummary } from "@/modules/finance/dre/hooks/useDREData";
import { getMarginLevel, MARGIN_GRADIENT_CLASSES, formatPct } from "@/lib/formatters";

interface DREExecutiveSummaryProps {
  summary: DRESummary;
  indicators: DREIndicators;
  formatCurrency: (value: number) => string;
  isLoading?: boolean;
  aiInsight?: string;
  healthScore?: number;
}

function MiniGauge({ value, maxValue = 100, label, color }: { value: number; maxValue?: number; label: string; color: string }) {
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
  const radius = 36;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-10 sm:w-20 sm:h-12">
        <svg width="100%" height="100%" viewBox="0 0 84 48" preserveAspectRatio="xMidYMid meet">
          <path
            d="M 6 44 A 36 36 0 0 1 78 44"
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            className="stroke-white/20"
          />
          <path
            d="M 6 44 A 36 36 0 0 1 78 44"
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            className={cn("transition-[stroke-dashoffset] duration-700", color)}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
          <span className="text-xs sm:text-base font-bold text-white">
            {formatPct(value)}
          </span>
        </div>
      </div>
      <span className="text-[9px] sm:text-[10px] text-white/80 mt-0.5">{label}</span>
    </div>
  );
}

function HealthBadge({ score }: { score: number }) {
  const getHealthConfig = () => {
    if (score >= 80) return { label: "Excelente", icon: CheckCircle2, className: "bg-success/10 text-success border-success/20" };
    if (score >= 60) return { label: "Bom", icon: Activity, className: "bg-primary/10 text-primary border-primary/20" };
    if (score >= 40) return { label: "Atenção", icon: AlertCircle, className: "bg-warning/10 text-warning border-warning/20" };
    return { label: "Crítico", icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/20" };
  };

  const config = getHealthConfig();
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1 px-2 py-1 text-[10px] sm:text-xs", config.className)}>
      <Icon className="h-3 w-3" />
      <span className="hidden xs:inline">{config.label}</span>
    </Badge>
  );
}

export function DREExecutiveSummary({
  summary,
  indicators,
  formatCurrency,
  isLoading,
  aiInsight,
  healthScore = 75,
}: DREExecutiveSummaryProps) {
  const variation = summary.previousNetResult !== 0
    ? ((summary.netResult - summary.previousNetResult) / Math.abs(summary.previousNetResult)) * 100
    : 0;

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-card via-card to-muted/20">
        <CardHeader className="p-2.5 sm:p-4">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="p-2.5 sm:p-4 pt-0 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 sm:h-20" />
            ))}
          </div>
          <Skeleton className="h-14 sm:h-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/10">
      <CardHeader className="p-2.5 sm:p-4 pb-1.5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-sm sm:text-base">
            <Target className="h-4 w-4 text-primary" />
            Resumo Executivo
          </CardTitle>
          <HealthBadge score={healthScore} />
        </div>
      </CardHeader>
      <CardContent className="p-2.5 sm:p-4 pt-0 space-y-3 sm:space-y-4">
        {/* Metrics Grid - stack on mobile */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Receita Líquida - Teal Vibrant */}
          <div className="relative overflow-hidden p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 border border-teal-400/30 shadow-lg">
            <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-white/10" />
            <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-white/5" />
            <div className="relative z-10">
              <p className="text-[10px] text-white/90 font-medium mb-0.5">Receita Líquida</p>
              <p className="text-base sm:text-lg font-bold text-white truncate">{formatCurrency(summary.netRevenue)}</p>
              <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                {summary.netRevenue > summary.previousGrossRevenue ? (
                  <TrendingUp className="h-3 w-3 text-white/80" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-white/60" />
                )}
                <span className="text-[10px] sm:text-xs text-white/70">vs. anterior</span>
              </div>
            </div>
          </div>

          {/* Margem Bruta - Dynamic Color */}
          <div className={cn(
            "relative overflow-hidden p-2.5 sm:p-3 rounded-xl shadow-lg flex flex-col items-center justify-center border",
            MARGIN_GRADIENT_CLASSES[getMarginLevel(indicators.grossMargin, 'bruta')]
          )}>
            <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-white/10" />
            <div className="absolute -bottom-3 -left-3 w-10 h-10 rounded-full bg-white/5" />
            <div className="relative z-10">
              <MiniGauge
                value={indicators.grossMargin}
                label="Margem Bruta"
                color="stroke-white"
              />
            </div>
          </div>

          {/* Margem Operacional - Dynamic Color */}
          <div className={cn(
            "relative overflow-hidden p-2.5 sm:p-3 rounded-xl shadow-lg flex flex-col items-center justify-center border",
            MARGIN_GRADIENT_CLASSES[getMarginLevel(indicators.operationalMargin, 'operacional')]
          )}>
            <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-white/10" />
            <div className="absolute -bottom-3 -left-3 w-10 h-10 rounded-full bg-white/5" />
            <div className="relative z-10">
              <MiniGauge
                value={indicators.operationalMargin}
                label="Margem Operacional"
                color="stroke-white"
              />
            </div>
          </div>

          {/* Resultado - Dynamic: Emerald/Rose Vibrant */}
          <div className={cn(
            "relative overflow-hidden p-2.5 sm:p-3 rounded-xl shadow-lg border",
            summary.netResult >= 0
              ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 border-emerald-400/30"
              : "bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 border-rose-400/30"
          )}>
            <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-white/10" />
            <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-white/5" />
            <div className="relative z-10">
              <p className="text-[10px] text-white/90 font-medium mb-0.5">Resultado Líquido</p>
              <p className="text-base sm:text-lg font-bold text-white truncate">
                {formatCurrency(summary.netResult)}
              </p>
              <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                {variation >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-white/80" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-white/60" />
                )}
                <span className="text-[10px] sm:text-xs font-medium text-white/80">
                  {variation >= 0 ? "+" : ""}{formatPct(variation)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        {aiInsight && (
          <div className="p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-full bg-primary/10 shrink-0">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium mb-0.5">Insight Inteligente</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  {aiInsight}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 border-t">
          <div className="text-center">
            <p className="text-base sm:text-lg font-bold text-primary">{formatPct(indicators.netMargin)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Margem Líquida</p>
          </div>
          <div className="text-center">
            <p className="text-base sm:text-lg font-bold truncate">{formatCurrency(indicators.ebitda)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Result. Oper.</p>
          </div>
          <div className="text-center">
            <p className={cn(
              "text-base sm:text-lg font-bold",
              variation >= 0 ? "text-success" : "text-destructive"
            )}>
              {variation >= 0 ? "+" : ""}{formatPct(variation)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Crescimento</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
