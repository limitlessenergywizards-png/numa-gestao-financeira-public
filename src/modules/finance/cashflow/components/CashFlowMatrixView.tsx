'use client';

import { useState, useMemo, useEffect, useRef, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronDown, ChevronRight, Maximize2, Minimize2, FileSpreadsheet,
  Calendar, CalendarDays, GitCompare, TrendingUp, TrendingDown, Minus,
  Palette, Sparkles, X, FileText, Brain, Building2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DetailedTransaction, WeeklyData, DailyDetail } from "./CashFlowTypes";
import { CashFlowDrillDownDialog } from "./CashFlowDrillDownDialog";
import { CashFlowCategoryFilter } from "./CashFlowCategoryFilter";
import { MiniSparkline } from "./MiniSparkline";
import { CashFlowCell } from "./CashFlowCell";
import { ProjectionAlertBanner } from "./ProjectionAlertBanner";
import { CashFlowProjectionPanel } from "./CashFlowProjectionPanel";
import { ExportAccountingDialog } from "./ExportAccountingDialog";
import { exportToExcel } from "@/lib/exportExcel";
import { exportMatrixToPdf } from "@/modules/finance/cashflow/services/exportMatrixPdf";
import { toast } from "sonner";
import {
  useMatrixData,
  type MatrixWeekColumn,
  type MatrixDayColumn,
  type MatrixGroupData,
  type MatrixCategoryData,
  type GranularityType,
  type ProjectionMethod,
} from "../hooks/useMatrixData";

interface DrillDownData {
  categoryName: string;
  categoryCode: string;
  periodLabel: string;
  transactions: DetailedTransaction[];
  total: number;
  type: 'entrada' | 'saida';
}

type VirtualRowType = 'saldoInicial' | 'groupHeader' | 'category' | 'comparison' | 'resultado' | 'saldoFinal';

interface VirtualRow {
  id: string;
  type: VirtualRowType;
  groupType?: 'entrada' | 'saida';
  group?: MatrixGroupData;
  category?: MatrixCategoryData;
  height: number;
}

const ROW_HEIGHTS: Record<VirtualRowType, number> = {
  saldoInicial: 48,
  groupHeader: 48,
  category: 40,
  comparison: 28,
  resultado: 48,
  saldoFinal: 48,
};

interface CashFlowMatrixViewProps {
  weeklyData: WeeklyData[];
  dailyData: DailyDetail[];
  detailedTransactions: DetailedTransaction[];
  formatCurrency: (value: number) => string;
  saldoInicial: number;
  startDate: string;
  endDate: string;
}

export const CashFlowMatrixView = memo(function CashFlowMatrixView({
  weeklyData,
  dailyData,
  detailedTransactions,
  formatCurrency,
  saldoInicial,
  startDate,
  endDate,
}: CashFlowMatrixViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['ENTRADAS', 'SAÍDAS']);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [granularity, setGranularity] = useState<GranularityType>('week');
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);

  // Filter states
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [hideEmptyCategories, setHideEmptyCategories] = useState(false);

  // Comparison mode
  const [showComparison, setShowComparison] = useState(false);

  // Heatmap mode
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Projection mode
  const [showProjection, setShowProjection] = useState(false);
  const [projectionWeeks, setProjectionWeeks] = useState(2);
  const [projectionMethod, setProjectionMethod] = useState<ProjectionMethod>('trend');

  // AI Projection mode
  const [showAIProjection, setShowAIProjection] = useState(false);

  // Accounting export dialog
  const [showAccountingExport, setShowAccountingExport] = useState(false);

  // Projection alerts
  const [dismissedAlerts, setDismissedAlerts] = useState(false);

  // All data computation extracted to hook
  const {
    weekColumns,
    dayColumns,
    weekBalances,
    dayBalances,
    groupedData,
    filteredGroupedData,
    comparisonData,
    heatmapColorMap,
    projectionData,
    getCategoryTrendData,
    categoryFilterData,
    periodResults,
    totalResult,
    currentFinalBalance,
    historicalDataForAI,
    categoriesForAI,
    chartOfAccountsList,
  } = useMatrixData({
    weeklyData,
    dailyData,
    detailedTransactions,
    saldoInicial,
    granularity,
    hiddenCategories,
    hideEmptyCategories,
    showComparison,
    showHeatmap,
    showProjection,
    projectionWeeks,
    projectionMethod,
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName]
    );
  };

  const toggleAllGroups = () => {
    if (expandedGroups.length === 2) {
      setExpandedGroups([]);
    } else {
      setExpandedGroups(['ENTRADAS', 'SAÍDAS']);
    }
  };

  // Filter handlers
  const handleToggleCategory = (code: string) => {
    setHiddenCategories((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleShowAllCategories = () => {
    setHiddenCategories([]);
  };

  const handleHideAllCategories = () => {
    const allCodes = [
      ...groupedData.entradas.categories.map((c) => c.code),
      ...groupedData.saidas.categories.map((c) => c.code),
    ];
    setHiddenCategories(allCodes);
  };

  // Handle cell click for drill-down
  const handleCellClick = (
    categoryCode: string,
    categoryName: string,
    periodKey: string | number,
    type: 'entrada' | 'saida'
  ) => {
    let periodLabel: string;
    let filteredTx: DetailedTransaction[];

    if (granularity === 'week') {
      const week = weekColumns.find((w) => w.weekNumber === periodKey);
      if (!week) return;
      periodLabel = `${week.weekLabel} (${week.dateRange})`;
      filteredTx = detailedTransactions.filter((tx) => {
        if (tx.categoryCode !== categoryCode) return false;
        const txDate = parseISO(tx.date);
        return isWithinInterval(txDate, {
          start: parseISO(week.startDate),
          end: parseISO(week.endDate),
        });
      });
    } else {
      const day = dayColumns.find((d) => d.date === periodKey);
      if (!day) return;
      periodLabel = format(parseISO(day.date), "EEEE, dd 'de' MMMM", { locale: ptBR });
      filteredTx = detailedTransactions.filter(
        (tx) => tx.categoryCode === categoryCode && tx.date === periodKey
      );
    }

    const total = filteredTx.reduce((sum, tx) => sum + tx.amount, 0);

    setDrillDownData({
      categoryName,
      categoryCode,
      periodLabel,
      transactions: filteredTx,
      total,
      type,
    });
  };

  // Handle group total click for drill-down
  const handleGroupTotalClick = (
    groupName: string,
    periodKey: string | number,
    type: 'entrada' | 'saida'
  ) => {
    let periodLabel: string;
    let filteredTx: DetailedTransaction[];

    if (granularity === 'week') {
      const week = weekColumns.find((w) => w.weekNumber === periodKey);
      if (!week) return;
      periodLabel = `${week.weekLabel} (${week.dateRange})`;
      filteredTx = detailedTransactions.filter((tx) => {
        if (tx.type !== type) return false;
        const txDate = parseISO(tx.date);
        return isWithinInterval(txDate, {
          start: parseISO(week.startDate),
          end: parseISO(week.endDate),
        });
      });
    } else {
      const day = dayColumns.find((d) => d.date === periodKey);
      if (!day) return;
      periodLabel = format(parseISO(day.date), "EEEE, dd 'de' MMMM", { locale: ptBR });
      filteredTx = detailedTransactions.filter(
        (tx) => tx.type === type && tx.date === periodKey
      );
    }

    const total = filteredTx.reduce((sum, tx) => sum + tx.amount, 0);

    setDrillDownData({
      categoryName: groupName,
      categoryCode: type === 'entrada' ? 'ENTRADAS' : 'SAÍDAS',
      periodLabel,
      transactions: filteredTx,
      total,
      type,
    });
  };

  // Export to Excel
  const handleExport = async () => {
    const columns = granularity === 'week' ? weekColumns : dayColumns;
    const rows: Record<string, string | number>[] = [];

    // Header columns
    const excelColumns = [
      { key: 'categoria', header: 'Categoria' },
      ...columns.map((c) => ({
        key: granularity === 'week'
          ? `period_${(c as MatrixWeekColumn).weekNumber}`
          : `period_${(c as MatrixDayColumn).date}`,
        header: granularity === 'week'
          ? `${(c as MatrixWeekColumn).weekLabel} (${(c as MatrixWeekColumn).dateRange})`
          : (c as MatrixDayColumn).dayLabel,
      })),
      { key: 'total', header: 'Total' },
    ];

    // Saldo Inicial
    const saldoInicialRow: Record<string, string | number> = { categoria: 'Saldo Inicial' };
    columns.forEach((c) => {
      const key = granularity === 'week'
        ? `period_${(c as MatrixWeekColumn).weekNumber}`
        : `period_${(c as MatrixDayColumn).date}`;
      const balance = granularity === 'week'
        ? weekBalances[(c as MatrixWeekColumn).weekNumber]?.inicial || 0
        : dayBalances[(c as MatrixDayColumn).date]?.inicial || 0;
      saldoInicialRow[key] = formatCurrency(balance);
    });
    saldoInicialRow.total = '-';
    rows.push(saldoInicialRow);

    // Add group and categories
    const addGroupRows = (group: MatrixGroupData) => {
      // Group total row
      const groupRow: Record<string, string | number> = { categoria: group.groupName };
      columns.forEach((c) => {
        const key = granularity === 'week'
          ? `period_${(c as MatrixWeekColumn).weekNumber}`
          : `period_${(c as MatrixDayColumn).date}`;
        const periodKey = granularity === 'week' ? (c as MatrixWeekColumn).weekNumber : (c as MatrixDayColumn).date;
        groupRow[key] = formatCurrency(group.totals[periodKey] || 0);
      });
      groupRow.total = formatCurrency(group.grandTotal);
      rows.push(groupRow);

      // Category rows
      group.categories.forEach((cat) => {
        const catRow: Record<string, string | number> = { categoria: `  ${cat.code} - ${cat.name}` };
        columns.forEach((c) => {
          const key = granularity === 'week'
            ? `period_${(c as MatrixWeekColumn).weekNumber}`
            : `period_${(c as MatrixDayColumn).date}`;
          const periodKey = granularity === 'week' ? (c as MatrixWeekColumn).weekNumber : (c as MatrixDayColumn).date;
          const value = cat.values[periodKey] || 0;
          catRow[key] = value > 0 ? formatCurrency(value) : '-';
        });
        catRow.total = cat.total > 0 ? formatCurrency(cat.total) : '-';
        rows.push(catRow);
      });
    };

    addGroupRows(filteredGroupedData.entradas);
    addGroupRows(filteredGroupedData.saidas);

    // Resultado do Período
    const resultadoRow: Record<string, string | number> = { categoria: 'Resultado do Período' };
    columns.forEach((c) => {
      const key = granularity === 'week'
        ? `period_${(c as MatrixWeekColumn).weekNumber}`
        : `period_${(c as MatrixDayColumn).date}`;
      const periodKey = granularity === 'week' ? (c as MatrixWeekColumn).weekNumber : (c as MatrixDayColumn).date;
      const result = periodResults[periodKey] || 0;
      resultadoRow[key] = (result >= 0 ? '+' : '') + formatCurrency(result);
    });
    resultadoRow.total = (totalResult >= 0 ? '+' : '') + formatCurrency(totalResult);
    rows.push(resultadoRow);

    // Saldo Final
    const saldoFinalRow: Record<string, string | number> = { categoria: 'Saldo Final' };
    columns.forEach((c) => {
      const key = granularity === 'week'
        ? `period_${(c as MatrixWeekColumn).weekNumber}`
        : `period_${(c as MatrixDayColumn).date}`;
      const balance = granularity === 'week'
        ? weekBalances[(c as MatrixWeekColumn).weekNumber]?.final || 0
        : dayBalances[(c as MatrixDayColumn).date]?.final || 0;
      saldoFinalRow[key] = formatCurrency(balance);
    });
    saldoFinalRow.total = '-';
    rows.push(saldoFinalRow);

    await exportToExcel({
      data: rows,
      columns: excelColumns,
      filename: `fluxo-caixa-matriz-${granularity === 'week' ? 'semanal' : 'diario'}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      sheetName: 'Fluxo de Caixa',
    });

    toast.success('Matriz exportada com sucesso!');
  };

  // Export to PDF
  const handleExportPdf = async () => {
    toast.loading('Gerando PDF...', { id: 'pdf-export' });

    try {
      await exportMatrixToPdf({
        filename: `fluxo-caixa-matriz-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        title: 'Fluxo de Caixa Matricial',
        subtitle: 'Análise Semanal com Projeções',
        period: `${format(parseISO(startDate), 'dd/MM/yyyy', { locale: ptBR })} a ${format(parseISO(endDate), 'dd/MM/yyyy', { locale: ptBR })}`,
        weekColumns,
        groupedData: filteredGroupedData,
        periodResults,
        weekBalances,
        projectionData: showProjection ? projectionData : null,
        formatCurrency,
      });

      toast.success('PDF exportado com sucesso!', { id: 'pdf-export' });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao exportar PDF', { id: 'pdf-export' });
    }
  };

  // Show toast when projection detects negative balance
  useEffect(() => {
    if (!showProjection || !projectionData || dismissedAlerts) return;

    let cumulativeBalance = currentFinalBalance;
    let hasNegative = false;

    for (let i = 0; i < projectionData.weeks.length; i++) {
      cumulativeBalance += projectionData.entradasTotals[i] - projectionData.saidasTotals[i];
      if (cumulativeBalance < 0) {
        hasNegative = true;
        break;
      }
    }

    if (hasNegative) {
      toast.warning('Projeção indica saldo negativo em semanas futuras', {
        description: 'Verifique o alerta no topo da matriz',
        duration: 5000,
      });
    }
  }, [showProjection, projectionData, currentFinalBalance, dismissedAlerts]);

  // Reset dismissed alerts when projection settings change
  useEffect(() => {
    setDismissedAlerts(false);
  }, [projectionWeeks, projectionMethod]);

  // Render variation indicator
  const renderVariation = (variation: { value: number; percent: number } | undefined) => {
    if (!variation || (variation.value === 0 && variation.percent === 0)) {
      return <span className="text-muted-foreground">-</span>;
    }

    const isPositive = variation.percent > 0;
    const isNegative = variation.percent < 0;
    const isSignificant = Math.abs(variation.percent) >= 20;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-xs",
          isPositive && "text-emerald-600 dark:text-emerald-400",
          isNegative && "text-red-600 dark:text-red-400",
          !isPositive && !isNegative && "text-muted-foreground"
        )}
      >
        {isPositive && <TrendingUp className="h-3 w-3" />}
        {isNegative && <TrendingDown className="h-3 w-3" />}
        {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
        {isPositive && '+'}
        {variation.percent.toFixed(0)}%
      </span>
    );
  };

  const columns = granularity === 'week' ? weekColumns : dayColumns;

  // Flat array of virtual rows for virtualization
  const virtualRows = useMemo<VirtualRow[]>(() => {
    const rows: VirtualRow[] = [];

    // 1. Saldo Inicial
    rows.push({ id: 'saldo-inicial', type: 'saldoInicial', height: ROW_HEIGHTS.saldoInicial });

    // 2. Entradas group
    const entradasGroup = filteredGroupedData.entradas;
    rows.push({ id: 'group-entradas', type: 'groupHeader', groupType: 'entrada', group: entradasGroup, height: ROW_HEIGHTS.groupHeader });
    if (expandedGroups.includes(entradasGroup.groupName)) {
      entradasGroup.categories.forEach((cat) => {
        rows.push({ id: `cat-entrada-${cat.code}`, type: 'category', groupType: 'entrada', group: entradasGroup, category: cat, height: ROW_HEIGHTS.category });
        if (showComparison && comparisonData) {
          rows.push({ id: `comp-entrada-${cat.code}`, type: 'comparison', groupType: 'entrada', category: cat, height: ROW_HEIGHTS.comparison });
        }
      });
    }

    // 3. Saídas group
    const saidasGroup = filteredGroupedData.saidas;
    rows.push({ id: 'group-saidas', type: 'groupHeader', groupType: 'saida', group: saidasGroup, height: ROW_HEIGHTS.groupHeader });
    if (expandedGroups.includes(saidasGroup.groupName)) {
      saidasGroup.categories.forEach((cat) => {
        rows.push({ id: `cat-saida-${cat.code}`, type: 'category', groupType: 'saida', group: saidasGroup, category: cat, height: ROW_HEIGHTS.category });
        if (showComparison && comparisonData) {
          rows.push({ id: `comp-saida-${cat.code}`, type: 'comparison', groupType: 'saida', category: cat, height: ROW_HEIGHTS.comparison });
        }
      });
    }

    // 4. Resultado do Período
    rows.push({ id: 'resultado', type: 'resultado', height: ROW_HEIGHTS.resultado });

    // 5. Saldo Final
    rows.push({ id: 'saldo-final', type: 'saldoFinal', height: ROW_HEIGHTS.saldoFinal });

    return rows;
  }, [filteredGroupedData, expandedGroups, showComparison, comparisonData]);

  // Virtualizer ref and instance
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: virtualRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: (index) => virtualRows[index].height,
    overscan: 5,
  });

  // Dynamic column sizing based on granularity
  const getColumnClass = () => {
    if (granularity === 'week') {
      return "px-3 py-3 min-w-[100px]";
    }
    return "px-1.5 py-2 min-w-[50px] max-w-[70px] text-xs";
  };

  const getDataCellClass = () => {
    if (granularity === 'week') {
      return "px-3 py-2";
    }
    return "px-1 py-1.5 text-xs";
  };

  return (
    <>
      <Card className={cn("overflow-hidden", isFullWidth && "fixed inset-4 z-50")}>
        <CardHeader className="p-2 sm:p-4 lg:p-6 flex flex-col gap-2 sm:gap-3">
          {/* Title Row - Hidden on very small screens */}
          <div className="hidden xs:flex items-center justify-between">
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-lg truncate">Fluxo de Caixa Matricial</CardTitle>
              <CardDescription className="text-[10px] sm:text-sm hidden sm:block">
                {granularity === 'week' ? 'Semanas' : 'Dias'} como colunas, categorias expansíveis
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" onClick={() => setIsFullWidth(!isFullWidth)} aria-label={isFullWidth ? "Sair da tela cheia" : "Tela cheia"}>
              {isFullWidth ? <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </Button>
          </div>

          {/* Controls Row - Scrollable on mobile with smaller buttons */}
          <ScrollArea className="w-full -mx-2 px-2">
            <div className="flex items-center gap-1 sm:gap-1.5 pb-2">
              {/* Category Filter */}
              <CashFlowCategoryFilter
                entradasCategories={categoryFilterData.entradas}
                saidasCategories={categoryFilterData.saidas}
                hiddenCategories={hiddenCategories}
                hideEmptyCategories={hideEmptyCategories}
                onToggleCategory={handleToggleCategory}
                onToggleHideEmpty={() => setHideEmptyCategories(!hideEmptyCategories)}
                onShowAll={handleShowAllCategories}
                onHideAll={handleHideAllCategories}
              />

              {/* Granularity Toggle */}
              <ToggleGroup type="single" value={granularity} onValueChange={(value) => value && setGranularity(value as GranularityType)} className="shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="week" aria-label="Visualização por semana" className="h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 p-0">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline ml-1 text-xs">Sem</span>
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="sm:hidden">
                    <p>Semanal</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="day" aria-label="Visualização por dia" className="h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 p-0">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline ml-1 text-xs">Dia</span>
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="sm:hidden">
                    <p>Diário</p>
                  </TooltipContent>
                </Tooltip>
              </ToggleGroup>

              {/* Comparison Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowComparison(!showComparison)}
                    className={cn(
                      "h-7 w-7 sm:h-8 sm:w-8 shrink-0",
                      showComparison && "bg-primary/10 border-primary text-primary"
                    )}
                    aria-label="Comparar períodos"
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Comparar períodos</p>
                </TooltipContent>
              </Tooltip>

              {/* Heatmap Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={cn(
                      "h-7 w-7 sm:h-8 sm:w-8 shrink-0",
                      showHeatmap && "bg-primary/10 border-primary text-primary"
                    )}
                    aria-label="Mapa de calor"
                  >
                    <Palette className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Mapa de calor</p>
                </TooltipContent>
              </Tooltip>

              {/* Projection Dropdown */}
              {granularity === 'week' && (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "h-7 w-7 sm:h-8 sm:w-auto sm:px-2 shrink-0",
                            showProjection && "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-400"
                          )}
                          aria-label="Projeção"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {showProjection && (
                            <Badge variant="secondary" className="hidden sm:inline-flex h-4 px-1 ml-1 text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                              +{projectionWeeks}
                            </Badge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="sm:hidden">
                      <p>Projeção</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-56 bg-popover">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Semanas a projetar</DropdownMenuLabel>
                    <div className="flex gap-1 px-2 py-1.5">
                      {[1, 2, 3, 4].map(n => (
                        <Button
                          key={n}
                          variant={projectionWeeks === n && showProjection ? "default" : "outline"}
                          size="sm"
                          className="flex-1 h-7 sm:h-8"
                          onClick={() => {
                            setProjectionWeeks(n);
                            setShowProjection(true);
                          }}
                        >
                          {n}
                        </Button>
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Método de Cálculo</DropdownMenuLabel>
                    <div className="px-2 py-1.5">
                      <Select value={projectionMethod} onValueChange={(v) => setProjectionMethod(v as ProjectionMethod)}>
                        <SelectTrigger className="h-7 sm:h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trend">Tendência Linear</SelectItem>
                          <SelectItem value="average">Média Móvel (últimos 4)</SelectItem>
                          <SelectItem value="last">Repetir Último</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {showProjection && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowProjection(false)}>
                          <X className="h-4 w-4 mr-2" />
                          Desativar Projeção
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* AI Projection Button */}
              {granularity === 'week' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowAIProjection(!showAIProjection)}
                      className={cn(
                        "h-7 w-7 sm:h-8 sm:w-8 shrink-0",
                        showAIProjection && "bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-950/30 dark:border-violet-700 dark:text-violet-400"
                      )}
                      aria-label="Projeção com IA"
                    >
                      <Brain className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Projeção com IA</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Expand/Collapse */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" onClick={toggleAllGroups} aria-label="Expandir ou recolher tudo">
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expandedGroups.length === 0 && "rotate-180")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{expandedGroups.length === 2 ? "Recolher tudo" : "Expandir tudo"}</p>
                </TooltipContent>
              </Tooltip>

              {/* Export Dropdown */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 ml-auto" aria-label="Exportar">
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Exportar</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExport}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPdf}>
                    <FileText className="h-4 w-4 mr-2" />
                    PDF com Gráfico
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAccountingExport(true)}>
                    <Building2 className="h-4 w-4 mr-2" />
                    SPED / TOTVS
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardHeader>

        <CardContent className={cn("p-0 overflow-hidden", isFullWidth && "h-[calc(100vh-180px)]")}>
          {/* AI Projection Panel */}
          {showAIProjection && granularity === 'week' && (
            <div className="px-2 sm:px-4 pt-2 sm:pt-4">
              <CashFlowProjectionPanel
                historicalData={historicalDataForAI}
                categories={categoriesForAI}
                currentBalance={currentFinalBalance}
                formatCurrency={formatCurrency}
                onClose={() => setShowAIProjection(false)}
              />
            </div>
          )}

          {/* Projection Alert Banner */}
          {showProjection && !dismissedAlerts && granularity === 'week' && !showAIProjection && (
            <div className="px-3 sm:px-4 pt-3 sm:pt-4">
              <ProjectionAlertBanner
                projectionData={projectionData}
                currentBalance={currentFinalBalance}
                formatCurrency={formatCurrency}
                onDismiss={() => setDismissedAlerts(true)}
                onDisableProjection={() => setShowProjection(false)}
              />
            </div>
          )}

          <div className="relative w-full min-w-0">
            <div
              ref={tableContainerRef}
              className={cn(
                "w-full overflow-auto",
                isFullWidth ? "h-full" : "max-h-[500px] sm:max-h-[600px]"
              )}
              data-lenis-prevent
            >
              <div className="min-w-[600px] sm:min-w-[800px]">
                <table className={cn(
                  "w-full border-collapse",
                  granularity === 'week' && "table-fixed",
                  granularity === 'day' && "text-xs sm:text-sm"
                )}>
                  <thead className="sticky top-0 z-20 [&_th:not(.proj-header)]:!bg-gradient-to-r [&_th:not(.proj-header)]:from-[#C5A059] [&_th:not(.proj-header)]:via-[#E8D5A8] [&_th:not(.proj-header)]:to-[#C5A059] [&_th]:!text-[#1a1a1a] [&_th]:!font-bold [&_th]:!text-[13px] [&_th]:!tracking-wide [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg">
                    <tr>
                      <th className="sticky left-0 z-30 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold border-r border-b w-[140px] sm:w-[200px] text-xs sm:text-sm">
                        Categoria
                      </th>
                      {columns.map((col) => {
                        const key = granularity === 'week' ? (col as MatrixWeekColumn).weekNumber : (col as MatrixDayColumn).date;
                        return (
                          <th
                            key={key}
                            className={cn(
                              "text-center font-semibold border-b",
                              granularity === 'week'
                                ? "px-1.5 sm:px-3 py-2 sm:py-3 min-w-[70px] sm:min-w-[100px]"
                                : "px-0.5 sm:px-1.5 py-1 sm:py-2 min-w-[35px] sm:min-w-[50px]"
                            )}
                          >
                            {granularity === 'week' ? (
                              <>
                                <div className="text-xs sm:text-sm">{(col as MatrixWeekColumn).weekLabel}</div>
                                <div className="text-[10px] sm:text-xs text-[#1a1a1a]/60 font-normal">
                                  {(col as MatrixWeekColumn).dateRange}
                                </div>
                              </>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-help">
                                    <div className="text-[10px] sm:text-xs font-semibold">
                                      {format(parseISO((col as MatrixDayColumn).date), 'dd')}
                                    </div>
                                    <div className="text-[8px] sm:text-[10px] text-[#1a1a1a]/60 font-normal uppercase">
                                      {format(parseISO((col as MatrixDayColumn).date), 'EEE', { locale: ptBR }).slice(0, 3)}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="capitalize">
                                    {format(parseISO((col as MatrixDayColumn).date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </th>
                        );
                      })}
                      {/* Projection column headers */}
                      {projectionData && granularity === 'week' && projectionData.weeks.map((week) => (
                        <th
                          key={`proj-header-${week.weekNumber}`}
                          className={cn(
                            "proj-header text-center font-semibold border-b border-l border-dashed border-amber-300",
                            "!bg-amber-50/50 dark:!bg-amber-950/20",
                            "px-1.5 sm:px-3 py-2 sm:py-3 min-w-[70px] sm:min-w-[100px]"
                          )}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500" />
                            <div>
                              <div className="text-xs sm:text-sm !text-amber-700 dark:!text-amber-400">{week.weekLabel}</div>
                              <div className="text-[10px] sm:text-xs !text-amber-600/70 font-normal">{week.dateRange}</div>
                            </div>
                          </div>
                        </th>
                      ))}

                      <th className={cn(
                        "text-center font-semibold border-b border-l-2 min-w-[70px] sm:min-w-[100px] text-xs sm:text-sm",
                        granularity === 'week' ? "px-1.5 sm:px-3 py-2 sm:py-3" : "px-1 sm:px-2 py-1 sm:py-2"
                      )}>
                        Total
                      </th>

                      {/* Projected Total header */}
                      {projectionData && granularity === 'week' && (
                        <th className={cn(
                          "proj-header text-center font-semibold border-b border-l-2 min-w-[70px] sm:min-w-[100px]",
                          "!bg-amber-50/50 dark:!bg-amber-950/20",
                          "px-1.5 sm:px-3 py-2 sm:py-3"
                        )}>
                          <div className="flex items-center justify-center gap-1">
                            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500" />
                            <span className="text-xs sm:text-sm !text-amber-700 dark:!text-amber-400">Projetado</span>
                          </div>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const virtualItems = rowVirtualizer.getVirtualItems();
                      const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
                      const paddingBottom = virtualItems.length > 0
                        ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
                        : 0;
                      const projCols = projectionData && granularity === 'week' ? projectionData.weeks.length : 0;
                      const totalColSpan = 1 + columns.length + projCols + 1 + (projCols > 0 ? 1 : 0);

                      return (
                        <>
                          {paddingTop > 0 && (
                            <tr><td colSpan={totalColSpan} style={{ height: paddingTop, padding: 0, border: 'none' }} /></tr>
                          )}
                          {virtualItems.map((virtualItem) => {
                            const row = virtualRows[virtualItem.index];
                            const isEntrada = row.groupType === 'entrada';

                            // Saldo Inicial Row
                            if (row.type === 'saldoInicial') {
                              return (
                                <tr
                                  key={row.id}
                                  className="bg-muted/30 border-b-2"
                                  style={{ height: `${virtualItem.size}px` }}
                                >
                                  <td className="sticky left-0 z-10 px-4 py-3 font-medium border-r bg-background/90 backdrop-blur-md">
                                    Saldo Inicial
                                  </td>
                                  {columns.map((col) => {
                                    const key = granularity === 'week' ? (col as MatrixWeekColumn).weekNumber : (col as MatrixDayColumn).date;
                                    const balance = granularity === 'week'
                                      ? weekBalances[(col as MatrixWeekColumn).weekNumber]?.inicial || 0
                                      : dayBalances[(col as MatrixDayColumn).date]?.inicial || 0;
                                    return (
                                      <td key={key} className="px-3 py-3 text-right font-medium whitespace-nowrap">
                                        {formatCurrency(balance)}
                                      </td>
                                    );
                                  })}
                                  {projectionData && granularity === 'week' && projectionData.weeks.map((week) => (
                                    <td key={`proj-saldo-ini-${week.weekNumber}`} className="px-3 py-3 text-right font-medium whitespace-nowrap border-l border-dashed border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 text-muted-foreground">-</td>
                                  ))}
                                  <td className="px-3 py-3 text-right font-medium border-l-2">-</td>
                                  {projectionData && granularity === 'week' && (
                                    <td className="px-3 py-3 text-right font-medium border-l-2 bg-amber-50/30 dark:bg-amber-950/10 text-muted-foreground">-</td>
                                  )}
                                </tr>
                              );
                            }

                            // Group Header Row
                            if (row.type === 'groupHeader' && row.group) {
                              const group = row.group;
                              const isGroupExpanded = expandedGroups.includes(group.groupName);
                              return (
                                <tr
                                  key={row.id}
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    isEntrada
                                      ? "bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                                      : "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50"
                                  )}
                                  style={{ height: `${virtualItem.size}px` }}
                                >
                                  <td className="sticky left-0 z-10 px-4 py-3 font-semibold border-r bg-background/90 backdrop-blur-md" onClick={() => toggleGroup(group.groupName)}>
                                    <div className="flex items-center gap-2">
                                      {isGroupExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                      <span className={isEntrada ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
                                        {group.groupName}
                                      </span>
                                    </div>
                                  </td>
                                  {columns.map((col) => {
                                    const key = granularity === 'week' ? (col as MatrixWeekColumn).weekNumber : (col as MatrixDayColumn).date;
                                    const value = group.totals[key] || 0;
                                    return (
                                      <td
                                        key={key}
                                        className={cn(
                                          "text-right font-semibold whitespace-nowrap cursor-pointer",
                                          granularity === 'week' ? "px-3 py-3" : "px-1 py-2 text-xs",
                                          isEntrada ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
                                          value > 0 && "hover:bg-primary/10 hover:underline"
                                        )}
                                        title={value > 0 ? "Clique para ver detalhes" : undefined}
                                        onClick={() => value > 0 && handleGroupTotalClick(group.groupName, key, group.type)}
                                      >
                                        {formatCurrency(value)}
                                      </td>
                                    );
                                  })}
                                  {projectionData && granularity === 'week' && projectionData.weeks.map((week, weekIndex) => {
                                    const projectedTotal = isEntrada ? projectionData.entradasTotals[weekIndex] : projectionData.saidasTotals[weekIndex];
                                    return (
                                      <td key={`proj-group-${week.weekNumber}`} className={cn("text-right font-semibold whitespace-nowrap border-l border-dashed border-amber-300 bg-amber-50/50 dark:bg-amber-950/20", granularity === 'week' ? "px-3 py-3" : "px-1 py-2 text-xs", "text-amber-700 dark:text-amber-400 italic")}>
                                        <span className="inline-flex items-center gap-0.5"><span className="opacity-70">~</span>{formatCurrency(projectedTotal)}</span>
                                      </td>
                                    );
                                  })}
                                  <td className={cn("text-right font-bold whitespace-nowrap border-l-2", granularity === 'week' ? "px-3 py-3" : "px-2 py-2 text-xs", isEntrada ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
                                    {formatCurrency(group.grandTotal)}
                                  </td>
                                  {projectionData && granularity === 'week' && (
                                    <td className={cn("text-right font-bold whitespace-nowrap border-l-2 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 italic", granularity === 'week' ? "px-3 py-3" : "px-2 py-2 text-xs")}>
                                      <span className="inline-flex items-center gap-0.5"><span className="opacity-70">~</span>{formatCurrency(isEntrada ? projectionData.entradasTotals.reduce((a, b) => a + b, 0) : projectionData.saidasTotals.reduce((a, b) => a + b, 0))}</span>
                                    </td>
                                  )}
                                </tr>
                              );
                            }

                            // Category Row
                            if (row.type === 'category' && row.category && row.group) {
                              const category = row.category;
                              return (
                                <tr
                                  key={row.id}
                                  className="hover:bg-muted/50 border-b border-muted/30"
                                  style={{ height: `${virtualItem.size}px` }}
                                >
                                  <td className="sticky left-0 z-10 px-4 py-2 pl-10 text-sm border-r bg-background/95 backdrop-blur-md">
                                    <span className="font-mono text-[10px] sm:text-xs text-muted-foreground mr-1 sm:mr-2 hidden xs:inline">{category.code}</span>
                                    <span className="text-xs sm:text-sm">{category.name}</span>
                                  </td>
                                  {columns.map((col) => {
                                    const key = granularity === 'week' ? (col as MatrixWeekColumn).weekNumber : (col as MatrixDayColumn).date;
                                    return (
                                      <CashFlowCell
                                        key={key}
                                        value={category.values[key] || 0}
                                        columnKey={key}
                                        categoryCode={category.code}
                                        categoryName={category.name}
                                        heatmapColor={heatmapColorMap.get(`${category.code}_${key}`)}
                                        isEntrada={isEntrada}
                                        granularity={granularity}
                                        groupType={row.group!.type}
                                        formatCurrency={formatCurrency}
                                        onCellClick={handleCellClick}
                                      />
                                    );
                                  })}
                                  {projectionData && granularity === 'week' && projectionData.weeks.map((week, weekIndex) => {
                                    const projectedValue = projectionData.values[category.code]?.[weekIndex] || 0;
                                    return (
                                      <td key={`proj-${category.code}-${week.weekNumber}`} className={cn("text-right whitespace-nowrap border-l border-dashed border-amber-200 bg-amber-50/30 dark:bg-amber-950/10", granularity === 'week' ? "px-3 py-2 text-sm" : "px-1 py-1.5 text-xs", projectedValue > 0 ? "text-amber-700 dark:text-amber-400 italic" : "text-muted-foreground")}>
                                        {projectedValue > 0 ? <span className="inline-flex items-center gap-0.5"><span className="opacity-70">~</span>{formatCurrency(projectedValue)}</span> : "-"}
                                      </td>
                                    );
                                  })}
                                  <td className={cn("text-right font-medium whitespace-nowrap border-l-2", granularity === 'week' ? "px-3 py-2 text-sm" : "px-2 py-1.5 text-xs", category.total > 0 ? (isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400") : "text-muted-foreground")}>
                                    <div className="flex items-center justify-end gap-1">
                                      {category.total > 0 && granularity === 'week' && (
                                        <MiniSparkline data={getCategoryTrendData(category.code)} color={isEntrada ? 'emerald' : 'red'} width={40} height={14} />
                                      )}
                                      <span>{category.total > 0 ? formatCurrency(category.total) : "-"}</span>
                                    </div>
                                  </td>
                                  {projectionData && granularity === 'week' && (
                                    <td className={cn("text-right font-medium whitespace-nowrap border-l-2 bg-amber-50/30 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400 italic", granularity === 'week' ? "px-3 py-2 text-sm" : "px-2 py-1.5 text-xs")}>
                                      {projectionData.values[category.code] && projectionData.values[category.code].some(v => v > 0) ? (
                                        <span className="inline-flex items-center gap-0.5"><span className="opacity-70">~</span>{formatCurrency(projectionData.values[category.code].reduce((a, b) => a + b, 0))}</span>
                                      ) : "-"}
                                    </td>
                                  )}
                                </tr>
                              );
                            }

                            // Comparison Row
                            if (row.type === 'comparison' && row.category) {
                              const category = row.category;
                              return (
                                <tr key={row.id} className="bg-muted/20 border-b border-muted/20" style={{ height: `${virtualItem.size}px` }}>
                                  <td className="sticky left-0 z-10 px-4 py-1 pl-12 text-xs text-muted-foreground italic border-r bg-background/85 backdrop-blur-md">vs anterior</td>
                                  {columns.map((col) => {
                                    const key = granularity === 'week' ? (col as MatrixWeekColumn).weekNumber : (col as MatrixDayColumn).date;
                                    const variation = comparisonData?.[category.code]?.[key];
                                    return (
                                      <td key={key} className={cn("text-right", granularity === 'week' ? "px-3 py-1" : "px-1 py-0.5")}>
                                        {renderVariation(variation)}
                                      </td>
                                    );
                                  })}
                                  {projectionData && granularity === 'week' && projectionData.weeks.map((week) => (
                                    <td key={`comp-proj-${week.weekNumber}`} className="px-3 py-1 text-right text-muted-foreground text-xs border-l border-dashed border-amber-200 bg-amber-50/20">-</td>
                                  ))}
                                  <td className={cn("text-right border-l-2 text-muted-foreground text-xs", granularity === 'week' ? "px-3 py-1" : "px-2 py-0.5")}>-</td>
                                  {projectionData && granularity === 'week' && (
                                    <td className="px-3 py-1 text-right text-muted-foreground text-xs border-l-2 bg-amber-50/20">-</td>
                                  )}
                                </tr>
                              );
                            }

                            // Resultado do Período
                            if (row.type === 'resultado') {
                              return (
                                <tr key={row.id} className="bg-muted/50 border-y-2 font-semibold" style={{ height: `${virtualItem.size}px` }}>
                                  <td className="sticky left-0 z-10 px-4 py-3 border-r bg-background/90 backdrop-blur-md">Resultado do Período</td>
                                  {columns.map((col) => {
                                    const key = granularity === 'week' ? (col as MatrixWeekColumn).weekNumber : (col as MatrixDayColumn).date;
                                    const result = periodResults[key] || 0;
                                    return (
                                      <td key={key} className={cn("px-3 py-3 text-right whitespace-nowrap", result >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                                        {result >= 0 ? "+" : ""}{formatCurrency(result)}
                                      </td>
                                    );
                                  })}
                                  {projectionData && granularity === 'week' && projectionData.weeks.map((week, weekIndex) => {
                                    const projectedResult = projectionData.entradasTotals[weekIndex] - projectionData.saidasTotals[weekIndex];
                                    return (
                                      <td key={`proj-result-${week.weekNumber}`} className={cn("px-3 py-3 text-right whitespace-nowrap border-l border-dashed border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 italic", projectedResult >= 0 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                                        <span className="inline-flex items-center gap-0.5"><span className="opacity-70">~</span>{projectedResult >= 0 ? "+" : ""}{formatCurrency(projectedResult)}</span>
                                      </td>
                                    );
                                  })}
                                  <td className={cn("px-3 py-3 text-right font-bold whitespace-nowrap border-l-2", totalResult >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                                    {totalResult >= 0 ? "+" : ""}{formatCurrency(totalResult)}
                                  </td>
                                  {projectionData && granularity === 'week' && (() => {
                                    const projectedTotalResult = projectionData.entradasTotals.reduce((a, b) => a + b, 0) - projectionData.saidasTotals.reduce((a, b) => a + b, 0);
                                    return (
                                      <td className={cn("px-3 py-3 text-right font-bold whitespace-nowrap border-l-2 bg-amber-50/50 dark:bg-amber-950/20 italic", projectedTotalResult >= 0 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                                        <span className="inline-flex items-center gap-0.5"><span className="opacity-70">~</span>{projectedTotalResult >= 0 ? "+" : ""}{formatCurrency(projectedTotalResult)}</span>
                                      </td>
                                    );
                                  })()}
                                </tr>
                              );
                            }

                            // Saldo Final
                            if (row.type === 'saldoFinal') {
                              return (
                                <tr key={row.id} className="bg-primary/5 border-t-2 font-bold" style={{ height: `${virtualItem.size}px` }}>
                                  <td className="sticky left-0 z-10 px-4 py-3 border-r bg-background/90 backdrop-blur-md">Saldo Final</td>
                                  {columns.map((col) => {
                                    const key = granularity === 'week' ? (col as MatrixWeekColumn).weekNumber : (col as MatrixDayColumn).date;
                                    const saldo = granularity === 'week'
                                      ? weekBalances[(col as MatrixWeekColumn).weekNumber]?.final || 0
                                      : dayBalances[(col as MatrixDayColumn).date]?.final || 0;
                                    return (
                                      <td key={key} className={cn("px-3 py-3 text-right whitespace-nowrap", saldo >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
                                        {formatCurrency(saldo)}
                                      </td>
                                    );
                                  })}
                                  {projectionData && granularity === 'week' && (() => {
                                    const lastRealBalance = weekBalances[weekColumns[weekColumns.length - 1]?.weekNumber]?.final || 0;
                                    let runningBalance = lastRealBalance;
                                    return projectionData.weeks.map((week, weekIndex) => {
                                      const projectedResult = projectionData.entradasTotals[weekIndex] - projectionData.saidasTotals[weekIndex];
                                      runningBalance += projectedResult;
                                      return (
                                        <td key={`proj-saldo-${week.weekNumber}`} className={cn("px-3 py-3 text-right whitespace-nowrap border-l border-dashed border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 italic", runningBalance >= 0 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400")}>
                                          <span className="inline-flex items-center gap-0.5"><span className="opacity-70">~</span>{formatCurrency(runningBalance)}</span>
                                        </td>
                                      );
                                    });
                                  })()}
                                  <td className="px-3 py-3 text-right border-l-2">-</td>
                                  {projectionData && granularity === 'week' && (() => {
                                    const lastRealBalance = weekBalances[weekColumns[weekColumns.length - 1]?.weekNumber]?.final || 0;
                                    const totalProjectedResult = projectionData.entradasTotals.reduce((a, b) => a + b, 0) - projectionData.saidasTotals.reduce((a, b) => a + b, 0);
                                    const projectedFinalBalance = lastRealBalance + totalProjectedResult;
                                    return (
                                      <td className={cn("px-3 py-3 text-right font-bold whitespace-nowrap border-l-2 bg-amber-50/50 dark:bg-amber-950/20 italic", projectedFinalBalance >= 0 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400")}>
                                        <span className="inline-flex items-center gap-0.5"><span className="opacity-70">~</span>{formatCurrency(projectedFinalBalance)}</span>
                                      </td>
                                    );
                                  })()}
                                </tr>
                              );
                            }

                            return null;
                          })}
                          {paddingBottom > 0 && (
                            <tr><td colSpan={totalColSpan} style={{ height: paddingBottom, padding: 0, border: 'none' }} /></tr>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drill-down Dialog */}
      {drillDownData && (
        <CashFlowDrillDownDialog
          isOpen={!!drillDownData}
          onClose={() => setDrillDownData(null)}
          categoryName={drillDownData.categoryName}
          categoryCode={drillDownData.categoryCode}
          periodLabel={drillDownData.periodLabel}
          transactions={drillDownData.transactions}
          total={drillDownData.total}
          formatCurrency={formatCurrency}
          type={drillDownData.type}
        />
      )}

      {/* Accounting Export Dialog */}
      <ExportAccountingDialog
        open={showAccountingExport}
        onOpenChange={setShowAccountingExport}
        transactions={detailedTransactions}
        period={{ startDate, endDate }}
        chartOfAccounts={chartOfAccountsList}
      />
    </>
  );
});
