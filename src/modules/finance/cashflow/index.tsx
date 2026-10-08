'use client';

import { lazy, Suspense, useState } from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyState } from "@/contexts/CompanyContext";
import { useFormatters } from "@/hooks/useFormatters";
import { CashFlowAlerts } from "./components/CashFlowAlerts";

// Feature imports - all logic extracted to hooks and components
import {
  useCashFlowQueries,
} from "./hooks/useCashFlowQueries";
import { useCashFlowFilters } from "./hooks/useCashFlowFilters";
import { useCashFlowExport } from "./hooks/useCashFlowExport";
import { useComparisonData } from "./hooks/useComparisonData";
import { CashFlowSummaryCards } from "./components/CashFlowSummaryCards";
import { CashFlowFiltersPanel } from "./components/CashFlowFiltersPanel";

// Lazy-load heavy tab content (contains 1200+ line matrix view, charts, etc.)
const CashFlowTabsContent = lazy(() => import("./components/CashFlowTabsContent").then(m => ({ default: m.CashFlowTabsContent })));

// ============================================
// LOADING SKELETON
// ============================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards Skeleton */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <div className="flex flex-row items-center gap-2 sm:gap-3 p-4">
              <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
              <Skeleton className="h-4 w-20 sm:w-24" />
            </div>
            <div className="px-4 pb-4">
              <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 space-y-4">
          <Skeleton className="h-8 w-full" />
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <Skeleton className="h-10 w-full" />

      {/* Content Skeleton */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-16 sm:w-20" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20 sm:w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function CashFlow() {
  const { currentCompany } = useCompanyState();
  const { formatCurrency } = useFormatters();

  // UI State
  const [activeTab, setActiveTab] = useState('matriz');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Feature hooks - all data fetching and state management extracted
  const {
    filters,
    selectedMonth,
    selectedYear,
    setStartDate,
    setEndDate,
    setBankAccount,
    setViewType,
    setNature,
    setMonth,
    setYear,
    periodLabel,
  } = useCashFlowFilters();

  const {
    bankAccounts,
    transactions,
    dailyData,
    weeklyData,
    monthlyData,
    totals,
    saldoInicial,
    isLoading,
  } = useCashFlowQueries(currentCompany?.id, filters, activeTab);

  // Comparison data — deferred until comparativo tab is active
  const comparisonData = useComparisonData(
    activeTab === 'comparativo' ? transactions : [],
    saldoInicial
  );

  // Export functionality
  const { exportPdf, exportExcel } = useCashFlowExport({
    transactions,
    weeklyData,
    monthlyData,
    companyName: currentCompany?.name || '',
    currencySymbol: currentCompany?.currency_symbol || 'R$',
    startDate: filters.startDate,
    endDate: filters.endDate,
    totals,
    formatCurrency,
  });

  // No company selected state
  if (!currentCompany) {
    return (
      <AppLayout title="Fluxo de Caixa">
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-muted-foreground">Selecione uma empresa para continuar</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Fluxo de Caixa"
      description="Análise detalhada de entradas e saídas"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 sm:gap-2" onClick={exportPdf}>
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1 sm:gap-2" onClick={exportExcel}>
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-3 sm:space-y-6 animate-fade-in">
          {/* Summary Cards */}
          <CashFlowSummaryCards
            totalEntradas={totals.entradas}
            totalSaidas={totals.saidas}
            saldoPeriodo={totals.saldo}
            currencySymbol={currentCompany?.currency_symbol || 'R$'}
          />

          {/* Filters Panel */}
          <CashFlowFiltersPanel
            filters={filters}
            bankAccounts={bankAccounts}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            filtersExpanded={filtersExpanded}
            onFiltersExpandedChange={setFiltersExpanded}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onBankAccountChange={setBankAccount}
            onViewTypeChange={setViewType}
            onNatureChange={setNature}
            onMonthSelect={setMonth}
            onYearSelect={setYear}
          />

          {/* Negative Balance Alerts */}
          <CashFlowAlerts
            dailyData={dailyData}
            formatCurrency={formatCurrency}
            onViewDetails={() => setActiveTab('diario')}
          />

          {/* Tabs Content (lazy-loaded - heavy charts/matrix views) */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <CashFlowTabsContent
            activeTab={activeTab}
            onTabChange={setActiveTab}
            dailyData={dailyData}
            weeklyData={weeklyData}
            monthlyData={monthlyData}
            transactions={transactions}
            comparisonData={comparisonData}
            formatCurrency={formatCurrency}
            saldoInicial={saldoInicial}
            startDate={filters.startDate}
            endDate={filters.endDate}
            periodLabel={periodLabel}
          />
          </Suspense>
        </div>
      )}
    </AppLayout>
  );
}
