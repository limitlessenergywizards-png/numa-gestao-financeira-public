'use client';

import { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, TrendingDown, Calendar, X, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectionAlert {
  week: string;
  dateRange: string;
  projectedBalance: number;
  weekIndex: number;
  severity: 'warning' | 'critical';
}

interface ProjectionData {
  weeks: {
    weekNumber: number;
    weekLabel: string;
    dateRange: string;
    startDate: string;
    endDate: string;
    isProjected?: boolean;
  }[];
  values: Record<string, number[]>;
  entradasTotals: number[];
  saidasTotals: number[];
}

interface ProjectionAlertBannerProps {
  projectionData: ProjectionData | null;
  currentBalance: number;
  formatCurrency: (value: number) => string;
  onDismiss?: () => void;
  onDisableProjection?: () => void;
}

export function ProjectionAlertBanner({
  projectionData,
  currentBalance,
  formatCurrency,
  onDismiss,
  onDisableProjection,
}: ProjectionAlertBannerProps) {
  const alerts = useMemo(() => {
    if (!projectionData) return [];

    const result: ProjectionAlert[] = [];
    let cumulativeBalance = currentBalance;

    projectionData.weeks.forEach((week, index) => {
      const weekIncome = projectionData.entradasTotals[index] || 0;
      const weekExpense = projectionData.saidasTotals[index] || 0;

      cumulativeBalance += weekIncome - weekExpense;

      if (cumulativeBalance < 0) {
        result.push({
          week: week.weekLabel,
          dateRange: week.dateRange,
          projectedBalance: cumulativeBalance,
          weekIndex: index,
          severity: cumulativeBalance < -10000 ? 'critical' : 'warning',
        });
      }
    });

    return result;
  }, [projectionData, currentBalance]);

  const worstAlert = useMemo(() => {
    if (alerts.length === 0) return null;
    return alerts.reduce((min, alert) => 
      alert.projectedBalance < min.projectedBalance ? alert : min, 
      alerts[0]
    );
  }, [alerts]);

  const firstAlert = alerts[0];
  const hasCriticalAlert = alerts.some(a => a.severity === 'critical');

  if (alerts.length === 0 || !projectionData) {
    return null;
  }

  return (
    <Alert 
      variant="destructive" 
      className={cn(
        "animate-fade-in border-2 mb-4",
        hasCriticalAlert 
          ? "border-destructive bg-destructive/10" 
          : "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 p-2 rounded-full",
          hasCriticalAlert 
            ? "bg-destructive/20" 
            : "bg-amber-500/20"
        )}>
          <AlertTriangle className={cn(
            "h-5 w-5 animate-pulse",
            hasCriticalAlert 
              ? "text-destructive" 
              : "text-amber-600 dark:text-amber-400"
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <AlertTitle className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "font-semibold",
              hasCriticalAlert 
                ? "text-destructive" 
                : "text-amber-700 dark:text-amber-400"
            )}>
              {hasCriticalAlert ? "Alerta Crítico de Caixa" : "Alerta de Projeção"}
            </span>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1",
                hasCriticalAlert 
                  ? "border-destructive/50 text-destructive" 
                  : "border-amber-500/50 text-amber-700 dark:text-amber-400"
              )}
            >
              <Sparkles className="h-3 w-3" />
              Projeção
            </Badge>
          </AlertTitle>
          
          <AlertDescription className="mt-2 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              {/* First negative week */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className={cn(
                  "h-4 w-4 flex-shrink-0",
                  hasCriticalAlert ? "text-destructive" : "text-amber-600"
                )} />
                <span className={hasCriticalAlert ? "text-destructive" : "text-amber-800 dark:text-amber-300"}>
                  Primeiro saldo negativo em{" "}
                  <strong>{firstAlert.week}</strong>
                  {" "}({firstAlert.dateRange})
                </span>
              </div>

              {/* Worst projected balance */}
              {worstAlert && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className={cn(
                    "h-4 w-4 flex-shrink-0",
                    hasCriticalAlert ? "text-destructive" : "text-amber-600"
                  )} />
                  <span className={hasCriticalAlert ? "text-destructive" : "text-amber-800 dark:text-amber-300"}>
                    Saldo mínimo projetado:{" "}
                    <strong className="text-destructive">
                      {formatCurrency(worstAlert.projectedBalance)}
                    </strong>
                    {" "}({worstAlert.week})
                  </span>
                </div>
              )}
            </div>

            {/* Affected weeks summary */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "text-sm",
                hasCriticalAlert 
                  ? "text-destructive/80" 
                  : "text-amber-700/80 dark:text-amber-400/80"
              )}>
                {alerts.length === 1 
                  ? "1 semana afetada" 
                  : `${alerts.length} semanas afetadas`}:
              </span>
              {alerts.map((alert) => (
                <Tooltip key={alert.week}>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-xs cursor-help",
                        alert.severity === 'critical'
                          ? "border-destructive/50 text-destructive bg-destructive/10"
                          : "border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30"
                      )}
                    >
                      {alert.week}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{alert.dateRange}</p>
                    <p className="text-destructive">
                      Saldo projetado: {formatCurrency(alert.projectedBalance)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {onDisableProjection && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs",
                    hasCriticalAlert 
                      ? "border-destructive/50 text-destructive hover:bg-destructive/10" 
                      : "border-amber-500/50 text-amber-700 hover:bg-amber-100"
                  )}
                  onClick={onDisableProjection}
                >
                  Desativar Projeção
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 flex-shrink-0",
              hasCriticalAlert
                ? "text-destructive hover:bg-destructive/10"
                : "text-amber-600 hover:bg-amber-100"
            )}
            onClick={onDismiss}
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}
