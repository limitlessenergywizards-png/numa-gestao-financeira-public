'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Filter, X, ChevronDown, RotateCcw } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export interface ReportFiltersState {
  dateRange: { start: Date; end: Date };
  chartAccounts: string[];
  bankAccounts: string[];
  transactionType: "all" | "entrada" | "saida";
  comparison: boolean;
}

interface ReportFiltersProps {
  onFilterChange: (filters: ReportFiltersState) => void;
  initialFilters?: Partial<ReportFiltersState>;
}

const datePresets = [
  { label: "Últimos 7 dias", getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: "Últimos 30 dias", getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: "Este mês", getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: "Este ano", getValue: () => ({ start: startOfYear(new Date()), end: new Date() }) },
];

export function ReportFilters({ onFilterChange, initialFilters }: ReportFiltersProps) {
  const { currentCompany } = useCompany();
  
  const [filters, setFilters] = useState<ReportFiltersState>({
    dateRange: initialFilters?.dateRange || { start: subDays(new Date(), 30), end: new Date() },
    chartAccounts: initialFilters?.chartAccounts || [],
    bankAccounts: initialFilters?.bankAccounts || [],
    transactionType: initialFilters?.transactionType || "all",
    comparison: initialFilters?.comparison || false,
  });

  const [chartAccountsList, setChartAccountsList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [bankAccountsList, setBankAccountsList] = useState<{ id: string; name: string }[]>([]);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isBanksOpen, setIsBanksOpen] = useState(false);

  // Fetch chart accounts
  useEffect(() => {
    if (!currentCompany) return;

    const fetchData = async () => {
      const [chartRes, bankRes] = await Promise.all([
        supabase
          .from("chart_of_accounts")
          .select("id, name, code")
          .eq("company_id", currentCompany.id)
          .order("code"),
        supabase
          .from("bank_accounts")
          .select("id, name")
          .eq("company_id", currentCompany.id)
          .eq("is_active", true)
          .order("name"),
      ]);

      if (chartRes.data) setChartAccountsList(chartRes.data);
      if (bankRes.data) setBankAccountsList(bankRes.data);
    };

    fetchData();
  }, [currentCompany]);

  // Notify parent when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const updateFilters = (updates: Partial<ReportFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const resetFilters = () => {
    setFilters({
      dateRange: { start: subDays(new Date(), 30), end: new Date() },
      chartAccounts: [],
      bankAccounts: [],
      transactionType: "all",
      comparison: false,
    });
  };

  const toggleChartAccount = (id: string) => {
    setFilters((prev) => ({
      ...prev,
      chartAccounts: prev.chartAccounts.includes(id)
        ? prev.chartAccounts.filter((a) => a !== id)
        : [...prev.chartAccounts, id],
    }));
  };

  const toggleBankAccount = (id: string) => {
    setFilters((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.includes(id)
        ? prev.bankAccounts.filter((a) => a !== id)
        : [...prev.bankAccounts, id],
    }));
  };

  const activeFiltersCount =
    (filters.chartAccounts.length > 0 ? 1 : 0) +
    (filters.bankAccounts.length > 0 ? 1 : 0) +
    (filters.transactionType !== "all" ? 1 : 0) +
    (filters.comparison ? 1 : 0);

  return (
    <div className="glass-card p-4 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Filtros</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} ativo{activeFiltersCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Date Range Filter */}
        <Popover open={isDateOpen} onOpenChange={setIsDateOpen} modal>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(filters.dateRange.start, "dd/MM/yy", { locale: ptBR })} -{" "}
              {format(filters.dateRange.end, "dd/MM/yy", { locale: ptBR })}
              <ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[200]" align="start">
            <div className="p-3 border-b">
              <div className="flex flex-wrap gap-2">
                {datePresets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateFilters({ dateRange: preset.getValue() });
                      setIsDateOpen(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange.start}
              selected={{ from: filters.dateRange.start, to: filters.dateRange.end }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  updateFilters({ dateRange: { start: range.from, end: range.to } });
                }
              }}
              numberOfMonths={2}
              locale={ptBR}
              captionLayout="dropdown"
              fromYear={2020}
              toYear={2030}
            />
          </PopoverContent>
        </Popover>

        {/* Chart Accounts Filter */}
        <Popover open={isAccountsOpen} onOpenChange={setIsAccountsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start gap-2">
              Categorias
              {filters.chartAccounts.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {filters.chartAccounts.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="p-3 border-b">
              <p className="font-medium text-sm">Plano de Contas</p>
            </div>
            <ScrollArea className="h-64">
              <div className="p-3 space-y-2">
                {chartAccountsList.map((account) => (
                  <div key={account.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`chart-${account.id}`}
                      checked={filters.chartAccounts.includes(account.id)}
                      onCheckedChange={() => toggleChartAccount(account.id)}
                    />
                    <Label htmlFor={`chart-${account.id}`} className="text-sm cursor-pointer flex-1">
                      <span className="text-muted-foreground">{account.code}</span> - {account.name}
                    </Label>
                  </div>
                ))}
                {chartAccountsList.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma categoria encontrada
                  </p>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Bank Accounts Filter */}
        <Popover open={isBanksOpen} onOpenChange={setIsBanksOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start gap-2">
              Contas Bancárias
              {filters.bankAccounts.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {filters.bankAccounts.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <div className="p-3 border-b">
              <p className="font-medium text-sm">Contas Bancárias</p>
            </div>
            <ScrollArea className="h-48">
              <div className="p-3 space-y-2">
                {bankAccountsList.map((account) => (
                  <div key={account.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`bank-${account.id}`}
                      checked={filters.bankAccounts.includes(account.id)}
                      onCheckedChange={() => toggleBankAccount(account.id)}
                    />
                    <Label htmlFor={`bank-${account.id}`} className="text-sm cursor-pointer flex-1">
                      {account.name}
                    </Label>
                  </div>
                ))}
                {bankAccountsList.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma conta encontrada
                  </p>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Transaction Type */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          {[
            { value: "all", label: "Todos" },
            { value: "entrada", label: "Entradas" },
            { value: "saida", label: "Saídas" },
          ].map((type) => (
            <Button
              key={type.value}
              variant={filters.transactionType === type.value ? "default" : "ghost"}
              size="sm"
              onClick={() => updateFilters({ transactionType: type.value as "all" | "entrada" | "saida" })}
            >
              {type.label}
            </Button>
          ))}
        </div>

        {/* Comparison Toggle */}
        <Button
          variant={filters.comparison ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilters({ comparison: !filters.comparison })}
        >
          Comparar período
        </Button>
      </div>

      {/* Active Filter Badges */}
      {(filters.chartAccounts.length > 0 || filters.bankAccounts.length > 0) && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-2">
            {filters.chartAccounts.map((id) => {
              const account = chartAccountsList.find((a) => a.id === id);
              return account ? (
                <Badge key={id} variant="secondary" className="gap-1">
                  {account.code} - {account.name}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => toggleChartAccount(id)}
                  />
                </Badge>
              ) : null;
            })}
            {filters.bankAccounts.map((id) => {
              const account = bankAccountsList.find((a) => a.id === id);
              return account ? (
                <Badge key={id} variant="secondary" className="gap-1">
                  {account.name}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => toggleBankAccount(id)}
                  />
                </Badge>
              ) : null;
            })}
          </div>
        </>
      )}
    </div>
  );
}
