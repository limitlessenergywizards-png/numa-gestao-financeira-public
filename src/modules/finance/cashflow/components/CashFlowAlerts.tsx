'use client';

import { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, TrendingDown, Calendar } from "lucide-react";
import { format, parseISO, addDays, isWithinInterval, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DailyDetail } from "./CashFlowTypes";

interface NegativeBalanceDay {
  date: string;
  balance: number;
  daysFromNow: number;
}

interface CashFlowAlertsProps {
  dailyData: DailyDetail[];
  formatCurrency: (value: number) => string;
  onDismiss?: () => void;
  onViewDetails?: () => void;
}

export function CashFlowAlerts({
  dailyData,
  formatCurrency,
  onDismiss,
  onViewDetails,
}: CashFlowAlertsProps) {
  const today = startOfDay(new Date());
  const thirtyDaysFromNow = addDays(today, 30);

  const negativeBalanceDays = useMemo(() => {
    const negativeDays: NegativeBalanceDay[] = [];

    dailyData.forEach((day) => {
      const dayDate = parseISO(day.date);
      if (
        isWithinInterval(dayDate, { start: today, end: thirtyDaysFromNow }) &&
        day.saldoAcumulado < 0
      ) {
        const daysFromNow = Math.ceil(
          (dayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        negativeDays.push({
          date: day.date,
          balance: day.saldoAcumulado,
          daysFromNow,
        });
      }
    });

    return negativeDays.sort((a, b) => a.daysFromNow - b.daysFromNow);
  }, [dailyData, today, thirtyDaysFromNow]);

  const minBalance = useMemo(() => {
    if (negativeBalanceDays.length === 0) return null;
    return negativeBalanceDays.reduce(
      (min, day) => (day.balance < min.balance ? day : min),
      negativeBalanceDays[0]
    );
  }, [negativeBalanceDays]);

  const firstNegativeDay = negativeBalanceDays[0];

  if (negativeBalanceDays.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="animate-fade-in border-destructive/50 bg-destructive/5">
      <AlertTriangle className="h-5 w-5 animate-pulse" />
      <AlertTitle className="flex items-center gap-2">
        <span className="font-semibold">Alerta de Saldo Negativo</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={onDismiss}
            aria-label="Fechar alerta"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-destructive" />
            <span>
              Primeiro dia negativo em{" "}
              <strong>
                {format(parseISO(firstNegativeDay.date), "dd/MM/yyyy", { locale: ptBR })}
              </strong>
              {" "}({firstNegativeDay.daysFromNow === 0
                ? "hoje"
                : firstNegativeDay.daysFromNow === 1
                  ? "amanhã"
                  : `em ${firstNegativeDay.daysFromNow} dias`})
            </span>
          </div>

          {minBalance && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span>
                Saldo mínimo projetado:{" "}
                <strong className="text-destructive">
                  {formatCurrency(minBalance.balance)}
                </strong>
                {" "}em{" "}
                {format(parseISO(minBalance.date), "dd/MM", { locale: ptBR })}
              </span>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {negativeBalanceDays.length === 1
            ? "1 dia com saldo negativo nos próximos 30 dias."
            : `${negativeBalanceDays.length} dias com saldo negativo nos próximos 30 dias.`}
        </div>

        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={onViewDetails}
          >
            Ver Detalhes
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
