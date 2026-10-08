'use client';

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MonthFilterProps {
  selectedMonth: number | null;
  selectedYear: number;
  onMonthSelect: (month: number | null) => void;
  onYearSelect: (year: number) => void;
}

export const MONTHS = [
  { value: 0, label: "Jan" },
  { value: 1, label: "Fev" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Abr" },
  { value: 4, label: "Mai" },
  { value: 5, label: "Jun" },
  { value: 6, label: "Jul" },
  { value: 7, label: "Ago" },
  { value: 8, label: "Set" },
  { value: 9, label: "Out" },
  { value: 10, label: "Nov" },
  { value: 11, label: "Dez" },
];

export function MonthFilter({
  selectedMonth,
  selectedYear,
  onMonthSelect,
  onYearSelect,
}: MonthFilterProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Grid of months: 6 per row on mobile, flex on desktop */}
      <div className="grid grid-cols-6 xs:flex xs:flex-wrap gap-1">
        {MONTHS.map((month) => (
          <Button
            key={month.value}
            variant={selectedMonth === month.value ? "default" : "outline"}
            size="sm"
            className="px-1.5 xs:px-2 sm:px-3 py-1 h-7 xs:h-8 text-[10px] xs:text-xs sm:text-sm min-w-0"
            onClick={() => onMonthSelect(selectedMonth === month.value ? null : month.value)}
          >
            {month.label}
          </Button>
        ))}
      </div>
      <Select value={String(selectedYear)} onValueChange={(v) => onYearSelect(Number(v))}>
        <SelectTrigger className="w-[70px] xs:w-[80px] sm:w-[90px] h-7 xs:h-8 text-xs sm:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
