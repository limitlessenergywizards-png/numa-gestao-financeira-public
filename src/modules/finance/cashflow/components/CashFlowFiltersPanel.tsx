'use client';

import { memo } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { MonthFilter, MONTHS } from './MonthFilter';
import { cn } from '@/lib/utils';
import type { BankAccount } from './CashFlowTypes';
import type { CashFlowFilters } from '../hooks/useCashFlowQueries';

// ============================================
// TYPES
// ============================================

interface CashFlowFiltersPanelProps {
  filters: CashFlowFilters;
  bankAccounts: BankAccount[];
  selectedMonth: number | null;
  selectedYear: number;
  filtersExpanded: boolean;
  onFiltersExpandedChange: (expanded: boolean) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onBankAccountChange: (id: string) => void;
  onViewTypeChange: (type: CashFlowFilters['viewType']) => void;
  onNatureChange: (nature: CashFlowFilters['nature']) => void;
  onMonthSelect: (month: number | null) => void;
  onYearSelect: (year: number) => void;
}

// ============================================
// MOBILE FILTERS
// ============================================

const MobileFilters = memo(function MobileFilters({
  filters,
  bankAccounts,
  selectedMonth,
  selectedYear,
  filtersExpanded,
  onFiltersExpandedChange,
  onStartDateChange,
  onEndDateChange,
  onBankAccountChange,
  onViewTypeChange,
  onNatureChange,
  onMonthSelect,
  onYearSelect,
}: CashFlowFiltersPanelProps) {
  return (
    <Collapsible open={filtersExpanded} onOpenChange={onFiltersExpandedChange}>
      <CollapsibleTrigger asChild>
        <CardHeader className="p-3 sm:hidden cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros</span>
              {selectedMonth !== null && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  {MONTHS[selectedMonth].label}/{selectedYear}
                </Badge>
              )}
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              filtersExpanded && "rotate-180"
            )} />
          </div>
        </CardHeader>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <CardContent className="p-3 pt-0 sm:hidden space-y-3">
          {/* Month Quick Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Mês</Label>
            <ScrollArea className="w-full">
              <MonthFilter
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthSelect={onMonthSelect}
                onYearSelect={onYearSelect}
              />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <div className="grid gap-2 grid-cols-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Data Ini</Label>
              <Input
                type="date"
                value={filters.startDate}
                className="h-8 text-xs"
                onChange={(e) => onStartDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Data Fim</Label>
              <Input
                type="date"
                value={filters.endDate}
                className="h-8 text-xs"
                onChange={(e) => onEndDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Conta</Label>
              <Select value={filters.bankAccountId} onValueChange={onBankAccountChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Tipo</Label>
              <Select value={filters.viewType} onValueChange={onViewTypeChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realizado">Real.</SelectItem>
                  <SelectItem value="projetado">Proj.</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Natureza</Label>
              <Select value={filters.nature} onValueChange={onNatureChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="previsao">Previsão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  );
});

// ============================================
// DESKTOP FILTERS
// ============================================

const DesktopFilters = memo(function DesktopFilters({
  filters,
  bankAccounts,
  selectedMonth,
  selectedYear,
  onStartDateChange,
  onEndDateChange,
  onBankAccountChange,
  onViewTypeChange,
  onNatureChange,
  onMonthSelect,
  onYearSelect,
}: Omit<CashFlowFiltersPanelProps, 'filtersExpanded' | 'onFiltersExpandedChange'>) {
  return (
    <CardContent className="hidden sm:block pt-6 space-y-4">
      {/* Filter header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtros</span>
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Month Quick Filter */}
      <div className="space-y-2">
        <Label className="text-sm">Filtro Rápido por Mês</Label>
        <ScrollArea className="w-full">
          <div className="pb-2">
            <MonthFilter
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthSelect={onMonthSelect}
              onYearSelect={onYearSelect}
            />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <Label className="text-sm">Data Inicial</Label>
          <Input
            type="date"
            value={filters.startDate}
            className="text-sm"
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Data Final</Label>
          <Input
            type="date"
            value={filters.endDate}
            className="text-sm"
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Conta Bancária</Label>
          <Select value={filters.bankAccountId} onValueChange={onBankAccountChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Contas</SelectItem>
              {bankAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Tipo</Label>
          <Select value={filters.viewType} onValueChange={onViewTypeChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realizado">Realizado</SelectItem>
              <SelectItem value="projetado">Projetado</SelectItem>
              <SelectItem value="ambos">Realizado + Projetado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Natureza</Label>
          <Select value={filters.nature} onValueChange={onNatureChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="realizado">Realizado</SelectItem>
              <SelectItem value="previsao">Previsão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardContent>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================

export const CashFlowFiltersPanel = memo(function CashFlowFiltersPanel(props: CashFlowFiltersPanelProps) {
  return (
    <Card>
      <MobileFilters {...props} />
      <DesktopFilters {...props} />
    </Card>
  );
});
