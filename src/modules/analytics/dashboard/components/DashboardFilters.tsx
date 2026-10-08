'use client';

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickPeriod } from "@/hooks/useDateRange";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardFiltersProps {
  quickPeriod: QuickPeriod;
  onQuickPeriodChange: (period: QuickPeriod) => void;
  startDate: Date;
  endDate: Date;
  onCustomRange: (start: Date, end: Date) => void;
}

const PRESETS: { label: string; value: QuickPeriod }[] = [
  { label: "Este Mês", value: "month" },
  { label: "Mês Passado", value: "last_month" },
  { label: "Esta Semana", value: "week" },
  { label: "Este Ano", value: "year" },
];

export const DashboardFilters = memo(function DashboardFilters({
  quickPeriod,
  onQuickPeriodChange,
  startDate,
  endDate,
  onCustomRange,
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-in">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
        <CalendarDays className="h-4 w-4" />
        <span className="font-medium">Período:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            variant={quickPeriod === preset.value ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 text-xs px-3 transition-colors",
              quickPeriod === preset.value && "shadow-sm"
            )}
            onClick={() => onQuickPeriodChange(preset.value)}
          >
            {preset.label}
          </Button>
        ))}

        <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <DatePickerInput
            value={startDate}
            onChange={(date) => date && onCustomRange(date, endDate)}
            maxDate={endDate}
            placeholder="Início"
          />
          <span className="text-xs text-muted-foreground">a</span>
          <DatePickerInput
            value={endDate}
            onChange={(date) => date && onCustomRange(startDate, date)}
            minDate={startDate}
            placeholder="Fim"
          />
        </div>
      </div>

      {quickPeriod !== "custom" && (
        <span className="text-xs text-muted-foreground hidden lg:inline">
          {format(startDate, "dd MMM", { locale: ptBR })} — {format(endDate, "dd MMM yyyy", { locale: ptBR })}
        </span>
      )}
    </div>
  );
});
