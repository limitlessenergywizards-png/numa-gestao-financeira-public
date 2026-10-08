'use client';

import { useState, useEffect, lazy, Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  Sparkles,
  Download,
  MessageSquare,
  Target,
  CalendarRange,
  Mail,
} from "lucide-react";
import { useCompanyState } from "@/contexts/CompanyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { useDREData, DREPeriod } from "./hooks/useDREData";
import { useDRENotes, DRENote } from "./hooks/useDRENotes";
import { useDREAIInsights } from "./hooks/useDREAIInsights";
import {
  DREExecutiveSummary,
  DREDetailedTable,
  DRENoteDialog,
  DRENotesList,
  DREExportDialog,
  DREHeroGauges,
} from "./components";
import { DREFiltersCard } from "./components/DREFiltersCard";
import { DREAnalysisTab } from "./components/DREAnalysisTab";

// Lazy load heavy components for better performance
const DREIndicators = lazy(() => import("./components/DREIndicators").then(m => ({ default: m.DREIndicators })));
const DREWaterfallChart = lazy(() => import("./components/DREWaterfallChart").then(m => ({ default: m.DREWaterfallChart })));
const DREEvolutionChart = lazy(() => import("./components/DREEvolutionChart").then(m => ({ default: m.DREEvolutionChart })));
const DREComparison = lazy(() => import("./components/DREComparison").then(m => ({ default: m.DREComparison })));
const DRECategoryBreakdown = lazy(() => import("./components/DRECategoryBreakdown").then(m => ({ default: m.DRECategoryBreakdown })));
const DREBudgetDashboard = lazy(() => import("./components/DREBudgetDashboard").then(m => ({ default: m.DREBudgetDashboard })));
const DREYearOverYearComparison = lazy(() => import("./components/DREYearOverYearComparison").then(m => ({ default: m.DREYearOverYearComparison })));
const DREBudgetTrends = lazy(() => import("./components/DREBudgetTrends").then(m => ({ default: m.DREBudgetTrends })));
const DREReportScheduler = lazy(() => import("./components/DREReportScheduler").then(m => ({ default: m.DREReportScheduler })));
const DREEmailMetrics = lazy(() => import("./components/DREEmailMetrics").then(m => ({ default: m.DREEmailMetrics })));
import { DREXMLImport } from "./components/DREXMLImport";
import { exportDREPdf } from "@/modules/finance/dre/services/exportDREPdf";
import { exportToExcel } from "@/lib/exportExcel";
import { toast } from "sonner";
import type { ExportOptions } from "./components/DREExportDialog";
import { useSearchParamsState } from "@/hooks/useSearchParamsState";

// Tabs configuration
const tabsConfig = [
  { value: "demonstrativo", icon: FileText, label: "Demonstrativo" },
  { value: "indicadores", icon: TrendingUp, label: "Indicadores" },
  { value: "graficos", icon: BarChart3, label: "Gráficos" },
  { value: "categorias", icon: PieChart, label: "Categorias" },
  { value: "comparativo", icon: CalendarRange, label: "Ano a Ano" },
  { value: "orcamento", icon: Target, label: "Orçamento" },
  { value: "analise", icon: Sparkles, label: "Análise IA" },
  { value: "automacao", icon: Mail, label: "Automação" },
];

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="space-y-4 animate-fade-in">
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}>
          <Skeleton className="h-20 sm:h-24 w-full rounded-lg" />
        </div>
      ))}
    </div>
    <Skeleton className="h-16 sm:h-20 w-full" />
  </div>
);

// Tab loading skeleton for lazy-loaded components
const DRETabSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-[200px] w-full" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Skeleton className="h-[150px]" />
      <Skeleton className="h-[150px]" />
    </div>
    <Skeleton className="h-[300px] w-full" />
  </div>
);

export default function DRE() {
  const { currentCompany } = useCompanyState();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParamsState();
  const [period, setPeriod] = useState<DREPeriod>("current_month");
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "demonstrativo");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [accountingRegime, setAccountingRegime] = useState<"competencia" | "caixa">("competencia");
  const [comparisonMode, setComparisonMode] = useState<"period" | "budget">("period");
  const [selectedNoteData, setSelectedNoteData] = useState<{
    lineId: string;
    lineName: string;
    note?: DRENote;
  } | null>(null);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const {
    dreLines,
    summary,
    indicators,
    categories,
    isLoading,
    periodDates,
    formatCurrency,
    formatPercent,
  } = useDREData(currentCompany?.id, period, undefined, undefined, accountingRegime, comparisonMode);

  // Notes hook - using current period
  const currentYear = periodDates.currentStart.getFullYear();
  const currentMonth = periodDates.currentStart.getMonth() + 1;

  const {
    notes,
    getNoteForLine,
    saveNote,
    deleteNote,
    refreshNotes,
  } = useDRENotes(currentCompany?.id, currentYear, currentMonth);

  // AI Insights hook
  const {
    analysis: aiAnalysis,
    isLoading: isLoadingAI,
    fetchAnalysis,
  } = useDREAIInsights();

  // Fetch AI analysis when data changes
  useEffect(() => {
    if (summary.grossRevenue > 0 || summary.costs > 0) {
      const revenueVariation = summary.previousGrossRevenue !== 0
        ? ((summary.grossRevenue - summary.previousGrossRevenue) / Math.abs(summary.previousGrossRevenue)) * 100
        : 0;
      const resultVariation = summary.previousNetResult !== 0
        ? ((summary.netResult - summary.previousNetResult) / Math.abs(summary.previousNetResult)) * 100
        : 0;

      fetchAnalysis({
        grossRevenue: summary.grossRevenue,
        costs: summary.costs,
        operationalExpenses: summary.operationalExpenses,
        netResult: summary.netResult,
        grossMargin: indicators.grossMargin,
        netMargin: indicators.netMargin,
        ebitda: indicators.ebitda,
        revenueVariation,
        resultVariation,
        companyContext: currentCompany?.name,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, indicators, currentCompany?.name]);

  const getPeriodLabel = (p: DREPeriod) => {
    const labels: Record<DREPeriod, string> = {
      current_month: "Mês Atual",
      previous_month: "Mês Anterior",
      quarter: "Trimestre Atual",
      previous_quarter: "Trimestre Anterior",
      semester: "Semestre Atual",
      year: "Ano Atual",
      previous_year: "Ano Anterior",
      custom: "Personalizado",
    };
    return labels[p];
  };

  // Handle note add/edit
  const handleAddNote = (lineId: string) => {
    const line = dreLines.find((l) => l.id === lineId);
    if (!line) return;

    const existingNote = getNoteForLine(lineId);
    setSelectedNoteData({
      lineId,
      lineName: line.name,
      note: existingNote,
    });
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async (data: { note: string; is_important: boolean }) => {
    if (!selectedNoteData) return;

    await saveNote({
      dre_line_id: selectedNoteData.lineId,
      note: data.note,
      is_important: data.is_important,
    });
  };

  const handleDeleteNote = async () => {
    if (!selectedNoteData?.note) return;
    await deleteNote(selectedNoteData.note.id);
  };

  const handleEditNoteFromList = (note: DRENote) => {
    const line = dreLines.find((l) => l.id === note.dre_line_id);
    setSelectedNoteData({
      lineId: note.dre_line_id,
      lineName: line?.name || note.dre_line_id,
      note,
    });
    setNoteDialogOpen(true);
  };

  // Export handlers
  const handleExport = async (options: ExportOptions) => {
    try {
      if (options.format === "pdf") {
        await exportDREPdf({
          company: currentCompany ? {
            name: currentCompany.name,
            document: currentCompany.document || undefined,
            logo_url: currentCompany.logo_url || undefined,
          } : { name: "Empresa" },
          dreLines: dreLines.map((line) => ({
            code: line.code,
            name: line.name,
            currentValue: line.currentValue,
            previousValue: line.previousValue,
            type: line.type === "category" ? "item" : line.type as "header" | "item" | "subtotal" | "total" | "result",
            indent: line.indent,
          })),
          summary,
          indicators,
          formatCurrency,
          formatPercent,
          periodLabel: getPeriodLabel(period),
          notes: options.includeNotes ? notes : [],
          aiAnalysis: options.includeAIInsights ? aiAnalysis || undefined : undefined,
          includeLogo: options.includeLogo,
          includeCharts: options.includeCharts,
          orientation: options.orientation,
          detailLevel: options.detailLevel,
        });
        toast.success("PDF exportado com sucesso!");
      } else {
        const exportData = dreLines.map((line) => ({
          codigo: line.code,
          descricao: line.name,
          valorAtual: line.currentValue,
          valorAnterior: line.previousValue,
          analiseVertical: summary.netRevenue !== 0 ? (line.currentValue / summary.netRevenue) * 100 : 0,
          variacaoHorizontal: line.previousValue !== 0
            ? ((line.currentValue - line.previousValue) / Math.abs(line.previousValue)) * 100
            : 0,
        }));

        const columns = [
          { key: "codigo", header: "Código" },
          { key: "descricao", header: "Descrição" },
          { key: "valorAtual", header: "Período Atual" },
          { key: "valorAnterior", header: "Período Anterior" },
          { key: "analiseVertical", header: "AV (%)" },
          { key: "variacaoHorizontal", header: "AH (%)" },
        ];

        await exportToExcel({
          data: exportData,
          columns,
          filename: "dre.xlsx",
          sheetName: "DRE",
        });
        toast.success("Excel exportado com sucesso!");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar arquivo");
    }
  };

  const handleImportSuccess = () => {
    // Trigger data refresh
    refreshNotes();
  };

  return (
    <AppLayout
      title={t("dre.title")}
      description={t("dre.description")}
      actions={
        <div className="flex items-center gap-2">
          <DREXMLImport
            companyId={currentCompany?.id}
            onImportSuccess={handleImportSuccess}
          />
          <Button size="sm" className="h-8 sm:h-9" onClick={() => setExportDialogOpen(true)}>
            <Download className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Exportar</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-6 pb-12 animate-fade-in">
        {/* Filters - Collapsible on mobile */}
        <DREFiltersCard
          period={period}
          onPeriodChange={setPeriod}
          accountingRegime={accountingRegime}
          onAccountingRegimeChange={setAccountingRegime}
          comparisonMode={comparisonMode}
          onComparisonModeChange={setComparisonMode}
          periodDates={periodDates}
          notesCount={notes.length}
          filtersExpanded={filtersExpanded}
          onFiltersExpandedChange={setFiltersExpanded}
          periodLabel={getPeriodLabel(period)}
          t={t}
        />

        {/* Hero Gauges - Main Visual Focus */}
        <div>
          <DREHeroGauges
            grossMargin={indicators.grossMargin}
            previousGrossMargin={indicators.previousGrossMargin}
            ebitdaMargin={summary.netRevenue !== 0 ? (indicators.ebitda / summary.netRevenue) * 100 : 0}
            previousEbitdaMargin={summary.previousGrossRevenue !== 0 ? (indicators.previousEbitda / summary.previousGrossRevenue) * 100 : undefined}
            netMargin={indicators.netMargin}
            previousNetMargin={indicators.previousNetMargin}
            isLoading={isLoading}
          />
        </div>

        {/* Executive Summary - Below Gauges */}
        <div>
          {isLoading ? (
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <LoadingSkeleton />
              </CardContent>
            </Card>
          ) : (
            <DREExecutiveSummary
              summary={summary}
              indicators={indicators}
              formatCurrency={formatCurrency}
              isLoading={isLoading}
              aiInsight={aiAnalysis?.insight}
              healthScore={aiAnalysis?.healthScore || 50}
            />
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 h-auto p-0.5 sm:p-1 gap-0.5">
            {tabsConfig.map(({ value, icon: Icon, label }) => (
              <TooltipProvider key={value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value={value}
                      className="py-2 sm:py-2.5 px-1 sm:px-3 data-[state=active]:shadow-sm"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs">{label}</span>
                      </div>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="sm:hidden">
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </TabsList>

          <TabsContent value="demonstrativo" className="mt-4 sm:mt-6">
            <div className="animate-fade-in">
              <Card>
                <CardContent className="p-3 sm:p-6 pt-3 sm:pt-6">
                  <DREDetailedTable
                    lines={dreLines}
                    netRevenue={summary.netRevenue}
                    companyId={currentCompany?.id || ""}
                    startDate={format(periodDates.currentStart, "yyyy-MM-dd")}
                    endDate={format(periodDates.currentEnd, "yyyy-MM-dd")}
                    formatCurrency={formatCurrency}
                    onAddNote={handleAddNote}
                    comparisonMode={comparisonMode}
                  />
                </CardContent>
              </Card>

              {/* Notes Section */}
              {notes.length > 0 && (
                <div className="mt-4 sm:mt-6 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
                  <Card>
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        Notas Explicativas ({notes.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <DRENotesList
                        notes={notes}
                        onEditNote={handleEditNoteFromList}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="indicadores" className="mt-4 sm:mt-6">
            <Suspense fallback={<DRETabSkeleton />}>
              <div className="space-y-4 sm:space-y-6 animate-fade-in">
                <DREIndicators
                  indicators={indicators}
                  summary={summary}
                  formatCurrency={formatCurrency}
                />
                <DREComparison
                  summary={summary}
                  periodLabel={getPeriodLabel(period)}
                  previousPeriodLabel="Período Anterior"
                  formatCurrency={formatCurrency}
                />
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="graficos" className="mt-4 sm:mt-6">
            <Suspense fallback={<DRETabSkeleton />}>
              <div className="space-y-4 sm:space-y-6 animate-fade-in">
                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                  <DREWaterfallChart
                    summary={summary}
                    formatCurrency={formatCurrency}
                  />
                  <DREEvolutionChart
                    companyId={currentCompany?.id || ""}
                    formatCurrency={formatCurrency}
                  />
                </div>
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="categorias" className="mt-4 sm:mt-6">
            <Suspense fallback={<DRETabSkeleton />}>
              <div className="animate-fade-in">
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  <DRECategoryBreakdown
                    categories={categories}
                    type="receita"
                    title="Receitas por Categoria"
                    formatCurrency={formatCurrency}
                  />
                  <DRECategoryBreakdown
                    categories={categories}
                    type="custo"
                    title="Custos por Categoria"
                    formatCurrency={formatCurrency}
                  />
                  <DRECategoryBreakdown
                    categories={categories}
                    type="despesa"
                    title="Despesas por Categoria"
                    formatCurrency={formatCurrency}
                  />
                </div>
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="comparativo" className="mt-4 sm:mt-6">
            <Suspense fallback={<DRETabSkeleton />}>
              <div className="animate-fade-in">
                <DREYearOverYearComparison
                  companyId={currentCompany?.id}
                  formatCurrency={formatCurrency}
                />
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="orcamento" className="mt-4 sm:mt-6">
            <Suspense fallback={<DRETabSkeleton />}>
              <div className="space-y-4 sm:space-y-6 animate-fade-in">
                <DREBudgetDashboard
                  companyId={currentCompany?.id || ""}
                  year={currentYear}
                  month={currentMonth}
                  summary={summary}
                  formatCurrency={formatCurrency}
                />
                <DREBudgetTrends
                  companyId={currentCompany?.id || ""}
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  formatCurrency={formatCurrency}
                />
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="analise" className="mt-4 sm:mt-6">
            <DREAnalysisTab
              aiAnalysis={aiAnalysis}
              isLoadingAI={isLoadingAI}
              summary={summary}
              indicators={indicators}
              companyName={currentCompany?.name}
              fetchAnalysis={fetchAnalysis}
            />
          </TabsContent>

          <TabsContent value="automacao" className="mt-4 sm:mt-6">
            <Suspense fallback={<DRETabSkeleton />}>
              <div className="space-y-4 sm:space-y-6 animate-fade-in">
                {currentCompany?.id && (
                  <>
                    <DREReportScheduler companyId={currentCompany.id} />
                    <DREEmailMetrics companyId={currentCompany.id} />
                  </>
                )}
              </div>
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      {/* Note Dialog */}
      {selectedNoteData && (
        <DRENoteDialog
          open={noteDialogOpen}
          onOpenChange={setNoteDialogOpen}
          lineId={selectedNoteData.lineId}
          lineName={selectedNoteData.lineName}
          periodLabel={`${currentMonth}/${currentYear}`}
          note={selectedNoteData.note}
          onSave={handleSaveNote}
          onDelete={selectedNoteData.note ? handleDeleteNote : undefined}
        />
      )}

      {/* Export Dialog */}
      <DREExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
        lineCount={dreLines.length}
        notesCount={notes.length}
        hasAIInsights={!!aiAnalysis}
        hasLogo={!!currentCompany?.logo_url}
      />
    </AppLayout>
  );
}
