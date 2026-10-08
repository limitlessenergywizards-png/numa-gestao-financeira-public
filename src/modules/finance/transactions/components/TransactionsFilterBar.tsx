'use client';

import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/ui/filter-bar";
import { Search, Calendar as CalendarIcon, Check, Clock, ChevronDown, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { NatureFilterSelector } from "./NatureFilter";
import { type NatureFilter, type ForecastTypeFilter } from "@/modules/finance/transactions/hooks/useTransactionsData";

interface BankAccount {
  id: string;
  name: string;
}

interface ChartAccount {
  id: string;
  name: string;
  code: string;
}

interface Category {
  id: string;
  name: string;
}

type StatusFilter = 'all' | 'reconciled' | 'pending';
type TypeFilter = 'all' | 'entrada' | 'saida';
type QuickFilter = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'semester' | 'year';

interface TransactionsFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  natureFilter: NatureFilter;
  onNatureChange: (value: NatureFilter) => void;
  selectedBankId: string | null;
  onBankChange: (value: string | null) => void;
  selectedCategoryId: string | null;
  onCategoryChange: (value: string | null) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  typeFilter: TypeFilter;
  onTypeChange: (value: TypeFilter) => void;
  forecastTypeFilter: ForecastTypeFilter;
  onForecastTypeChange: (value: ForecastTypeFilter) => void;
  selectedChartAccountId: string | null;
  onChartAccountChange: (value: string | null) => void;
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  quickFilter: QuickFilter;
  onQuickFilterChange: (value: QuickFilter) => void;
  onClearFilters: () => void;
  bankAccounts: BankAccount[];
  chartAccounts: ChartAccount[];
  categories: Category[];
  hasActiveFilters: boolean;
  isCustomDateActive: boolean;
}

export const TransactionsFilterBar = memo(function TransactionsFilterBar({
  searchTerm,
  onSearchChange,
  natureFilter,
  onNatureChange,
  selectedBankId,
  onBankChange,
  selectedCategoryId,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  forecastTypeFilter,
  onForecastTypeChange,
  selectedChartAccountId,
  onChartAccountChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  quickFilter,
  onQuickFilterChange,
  onClearFilters,
  bankAccounts,
  chartAccounts,
  categories,
  hasActiveFilters,
  isCustomDateActive,
}: TransactionsFilterBarProps) {
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const quickFilterLabels: Record<QuickFilter, string> = {
    all: 'Todo Período',
    today: 'Hoje',
    week: 'Semana',
    month: 'Mês',
    quarter: 'Trimestre',
    semester: 'Semestre',
    year: 'Ano',
  };

  const statusChips: { value: StatusFilter; label: string; icon?: typeof Check }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'reconciled', label: 'Conciliados', icon: Check },
    { value: 'pending', label: 'Pendentes', icon: Clock },
  ];

  return (
    <div className="space-y-4">
      {/* Top Row: Nature Filter & Clear actions */}
      <div className="flex flex-wrap items-center justify-between w-full">
        <div className="flex flex-wrap items-center gap-2">
          <NatureFilterSelector value={natureFilter} onChange={onNatureChange} />

          {/* Forecast Type Filter (Discreet, next to Previsão) */}
          {(natureFilter === 'previsao' || forecastTypeFilter !== 'all') && (
            <div className="flex items-center">
              <div className="h-4 w-px bg-border/40 mx-2" />
              <Select
                value={forecastTypeFilter}
                onValueChange={onForecastTypeChange as (v: string) => void}
              >
                <SelectTrigger
                  className={cn(
                    "h-8 border-0 bg-transparent hover:bg-transparent focus:ring-0 shadow-none px-2 text-xs transition-colors font-medium w-auto gap-1 focus:bg-transparent data-[state=open]:bg-transparent outline-none ring-0 focus-visible:ring-0 flex-row [&>svg:last-child]:hidden",
                    forecastTypeFilter !== 'all' ? "text-amber-500/90" : "text-muted-foreground/70 hover:text-foreground/90"
                  )}
                >
                  <ChevronDown className="h-3 w-3 opacity-50" />
                  <SelectValue placeholder="Todas as Previsões" />
                </SelectTrigger>
                <SelectContent align="start" className="min-w-[160px]">
                  <SelectItem value="all">Todas as Previsões</SelectItem>
                  <SelectItem value="estimativa">Estimativa</SelectItem>
                  <SelectItem value="orcamento">Orçamento (Meta)</SelectItem>
                  <SelectItem value="simulacao">Simulação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Clear Filters (Neutral position) */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
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
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar descrição..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Bank Filter */}
        <Select
          value={selectedBankId || "all"}
          onValueChange={(v) => onBankChange(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Banco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Contas</SelectItem>
            {bankAccounts.map((bank) => (
              <SelectItem key={bank.id} value={bank.id}>
                {bank.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={selectedCategoryId || "all"}
          onValueChange={(v) => onCategoryChange(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Plano de Contas Filter */}
        <Select
          value={selectedChartAccountId || "all"}
          onValueChange={(v) => onChartAccountChange(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Plano de Contas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Planos de Contas</SelectItem>
            {chartAccounts.map((ca) => (
              <SelectItem key={ca.id} value={ca.id}>
                {ca.code} - {ca.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

      </FilterBar>

      {/* Second Row: Date Range and Type */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Período:</span>

        {/* Start Date */}
        <DatePickerInput
          value={startDate}
          onChange={(date) => {
            if (date) onStartDateChange(date);
          }}
          className="w-[140px]"
        />

        <span className="text-sm text-muted-foreground">até</span>

        {/* End Date */}
        <DatePickerInput
          value={endDate}
          onChange={(date) => {
            if (date) onEndDateChange(date);
          }}
          className="w-[140px]"
          minDate={startDate}
        />

        {/* Quick Date Filters */}
        <div className="flex gap-1 ml-1 flex-wrap">
          {(['all', 'today', 'week', 'month', 'quarter', 'semester', 'year'] as QuickFilter[]).map((filter) => (
            <Badge
              key={filter}
              variant={quickFilter === filter && !isCustomDateActive ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors text-xs",
                quickFilter === filter && !isCustomDateActive && "bg-primary"
              )}
              onClick={() => onQuickFilterChange(filter)}
            >
              {quickFilterLabels[filter]}
            </Badge>
          ))}
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* Type Filter */}
        <span className="text-sm text-muted-foreground">Tipo:</span>
        <div className="flex gap-1">
          {[
            { value: 'all' as TypeFilter, label: 'Todos' },
            { value: 'entrada' as TypeFilter, label: 'Entradas' },
            { value: 'saida' as TypeFilter, label: 'Saídas' },
          ].map(({ value, label }) => (
            <Badge
              key={value}
              variant={typeFilter === value ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors",
                typeFilter === value && value === 'entrada' && "bg-success text-white",
                typeFilter === value && value === 'saida' && "bg-destructive text-white",
                typeFilter === value && value === 'all' && "bg-primary"
              )}
              onClick={() => onTypeChange(value)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Quick Status Chips */}
      <div className="flex flex-wrap gap-2">
        {statusChips.map(({ value, label, icon: Icon }) => (
          <Badge
            key={value}
            variant={statusFilter === value ? "default" : "secondary"}
            className={cn(
              "cursor-pointer transition-colors gap-1",
              statusFilter === value && value === 'reconciled' && "bg-success text-white",
              statusFilter === value && value === 'pending' && "bg-amber-500 text-white"
            )}
            onClick={() => onStatusChange(value)}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {label}
          </Badge>
        ))}
      </div>
    </div>
  );
});
