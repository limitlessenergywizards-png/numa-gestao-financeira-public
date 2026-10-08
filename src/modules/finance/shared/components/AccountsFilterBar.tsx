'use client';

/**
 * Unified filter bar for Payables and Receivables pages
 * Provides status tabs, date type selector, date range pickers, and quick period filters
 */

import { memo, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Search, X, Clock, CheckCircle, AlertTriangle, ListFilter } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

export type AccountStatusTab = 'all' | 'open' | 'paid' | 'overdue';
export type DateFilterType = 'due' | 'issue' | 'payment';

export interface AccountsFilterBarProps {
  statusTab: AccountStatusTab;
  onStatusTabChange: (tab: AccountStatusTab) => void;
  dateType: DateFilterType;
  onDateTypeChange: (type: DateFilterType) => void;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  /** Additional filter (e.g., supplier/customer select) */
  additionalFilter?: React.ReactNode;
}

// ============================================
// CONSTANTS
// ============================================

const STATUS_TAB_CONFIG: Partial<Record<AccountStatusTab, { label: string; icon: typeof ListFilter; activeClass: string }>> = {
  all: {
    label: 'Todos',
    icon: ListFilter,
    activeClass: 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary'
  },
  open: {
    label: 'Em Aberto',
    icon: Clock,
    activeClass: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
  },
  paid: {
    label: 'Pagos',
    icon: CheckCircle,
    activeClass: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500'
  },
  overdue: {
    label: 'Vencidos',
    icon: AlertTriangle,
    activeClass: 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500'
  },
};

const VISIBLE_TABS: AccountStatusTab[] = ['all', 'open', 'paid', 'overdue'];

const DATE_TYPE_OPTIONS: { value: DateFilterType; label: string }[] = [
  { value: 'due', label: 'Vencimento' },
  { value: 'issue', label: 'Emissão' },
  { value: 'payment', label: 'Pagamento' },
];

type QuickPeriodFilter = 'today' | 'week' | 'month' | 'quarter' | 'semester' | 'year';

const QUICK_PERIOD_LABELS: Record<QuickPeriodFilter, string> = {
  today: 'Hoje',
  week: 'Semana',
  month: 'Mês',
  quarter: 'Trimestre',
  semester: 'Semestre',
  year: 'Ano',
};

const QUICK_PERIOD_KEYS: QuickPeriodFilter[] = ['today', 'week', 'month', 'quarter', 'semester', 'year'];

function getQuickPeriodDates(period: QuickPeriodFilter): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'quarter':
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case 'semester': {
      const currentMonth = now.getMonth();
      const semesterStart = currentMonth < 6
        ? new Date(now.getFullYear(), 0, 1)
        : new Date(now.getFullYear(), 6, 1);
      const semesterEnd = currentMonth < 6
        ? new Date(now.getFullYear(), 5, 30)
        : new Date(now.getFullYear(), 11, 31);
      return { start: startOfDay(semesterStart), end: endOfDay(semesterEnd) };
    }
    case 'year':
      return { start: startOfYear(now), end: endOfYear(now) };
  }
}

// ============================================
// COMPONENT
// ============================================

function AccountsFilterBarComponent({
  statusTab,
  onStatusTabChange,
  dateType,
  onDateTypeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  searchTerm,
  onSearchChange,
  onClear,
  hasActiveFilters,
  additionalFilter,
}: AccountsFilterBarProps) {
  const [activeQuickPeriod, setActiveQuickPeriod] = useState<QuickPeriodFilter | null>(null);

  // Apply default "month" period on mount if no dates are set
  useEffect(() => {
    if (!startDate && !endDate && !activeQuickPeriod) {
      const { start, end } = getQuickPeriodDates('month');
      setActiveQuickPeriod('month');
      onStartDateChange(start);
      onEndDateChange(end);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuickPeriod = useCallback((period: QuickPeriodFilter) => {
    if (activeQuickPeriod === period) {
      // Toggle off: clear dates
      setActiveQuickPeriod(null);
      onStartDateChange(undefined);
      onEndDateChange(undefined);
    } else {
      setActiveQuickPeriod(period);
      const { start, end } = getQuickPeriodDates(period);
      onStartDateChange(start);
      onEndDateChange(end);
    }
  }, [activeQuickPeriod, onStartDateChange, onEndDateChange]);

  // If user manually changes dates, deactivate quick period
  const handleStartDateChange = useCallback((date: Date | undefined) => {
    setActiveQuickPeriod(null);
    onStartDateChange(date);
  }, [onStartDateChange]);

  const handleEndDateChange = useCallback((date: Date | undefined) => {
    setActiveQuickPeriod(null);
    onEndDateChange(date);
  }, [onEndDateChange]);

  const handleClear = useCallback(() => {
    setActiveQuickPeriod(null);
    onClear();
  }, [onClear]);

  return (
    <div
      className="space-y-4 animate-fade-in"
      style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
    >
      {/* Top Row: Status Tabs & Clear action */}
      <div className="flex flex-wrap items-center justify-between w-full">
        <div className="flex flex-wrap items-center gap-2">
          {VISIBLE_TABS.map((tab) => {
            const config = STATUS_TAB_CONFIG[tab];
            if (!config) return null;
            const Icon = config.icon;
            const isActive = statusTab === tab;

            return (
              <Button
                key={tab}
                variant="outline"
                size="sm"
                onClick={() => onStatusTabChange(tab)}
                className={cn(
                  "gap-2 transition-colors duration-200",
                  isActive && config.activeClass
                )}
              >
                <Icon className="h-4 w-4" />
                {config.label}
              </Button>
            );
          })}
        </div>

        {/* Clear Filters (Neutral position) */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Main Filter Bar */}
      <FilterBar>
        {/* Search */}
        <div className="relative flex-1 min-w-[130px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar descrição..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Date Type Selector */}
        <Select value={dateType} onValueChange={(v) => onDateTypeChange(v as DateFilterType)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Filtrar por" />
          </SelectTrigger>
          <SelectContent>
            {DATE_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Additional Filters (Supplier/Customer, Category, Cost Type) */}
        {additionalFilter && (
          <div className="relative flex items-center gap-2 h-9">
            {additionalFilter}
          </div>
        )}
      </FilterBar>

      {/* Second Row: Date Range and Type */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Período:</span>

        {/* Start Date */}
        <DatePickerInput
          value={startDate}
          onChange={handleStartDateChange}
          className="w-[140px] h-9"
        />

        <span className="text-sm text-muted-foreground">até</span>

        {/* End Date */}
        <DatePickerInput
          value={endDate}
          onChange={handleEndDateChange}
          className="w-[140px] h-9"
          minDate={startDate}
        />

        {/* Quick Period Filters */}
        <div className="flex gap-1 ml-1">
          {QUICK_PERIOD_KEYS.map((period) => (
            <Badge
              key={period}
              variant={activeQuickPeriod === period ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors text-xs font-medium",
                activeQuickPeriod === period && "bg-primary"
              )}
              onClick={() => handleQuickPeriod(period)}
            >
              {QUICK_PERIOD_LABELS[period]}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

AccountsFilterBarComponent.displayName = "AccountsFilterBar";

export const AccountsFilterBar = memo(AccountsFilterBarComponent);