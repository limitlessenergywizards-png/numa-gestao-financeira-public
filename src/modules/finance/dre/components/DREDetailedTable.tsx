'use client';

import { useState, useMemo, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPct } from "@/lib/formatters";
import { DRELine } from "@/modules/finance/dre/hooks/useDREData";
import { DREDrillDown } from "./DREDrillDown";

interface DREDetailedTableProps {
  lines: DRELine[];
  netRevenue: number;
  companyId: string;
  startDate: string;
  endDate: string;
  formatCurrency: (value: number) => string;
  onAddNote?: (lineId: string) => void;
  comparisonMode?: "period" | "budget";
}

export function DREDetailedTable({
  lines,
  netRevenue,
  companyId,
  startDate,
  endDate,
  formatCurrency,
  onAddNote,
  comparisonMode = "period",
}: DREDetailedTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    new Set(["receita_bruta", "custos", "despesas_operacionais"])
  );
  const [drillDown, setDrillDown] = useState<{
    open: boolean;
    categoryId: string;
    categoryName: string;
    categoryType: "receita" | "despesa" | "custo";
  }>({
    open: false,
    categoryId: "",
    categoryName: "",
    categoryType: "receita",
  });

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleRowClick = useCallback((line: DRELine) => {
    if (line.isClickable && line.chartAccountId && line.categoryType) {
      setDrillDown({
        open: true,
        categoryId: line.chartAccountId,
        categoryName: line.name,
        categoryType: line.categoryType,
      });
    }
  }, []);

  const getRowStyles = (line: DRELine) => {
    switch (line.type) {
      case "header":
        return "bg-muted/30 font-semibold hover:bg-muted/50";
      case "subtotal":
        return "bg-accent/30 font-bold";
      case "total":
        return "bg-primary/10 font-bold text-primary";
      case "item":
        return "hover:bg-muted/20";
      default:
        return "";
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (previous === 0) return <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />;
    const variation = ((current - previous) / Math.abs(previous)) * 100;
    if (variation > 5) return <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success" />;
    if (variation < -5) return <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />;
    return <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />;
  };

  const getVariationColor = (variation: number) => {
    if (variation > 5) return "text-success";
    if (variation < -5) return "text-destructive";
    return "text-muted-foreground";
  };

  /**
   * OPTIMIZATION: Pre-compute parent for each line in a single O(n) pass.
   * Before: O(n²) — for each line, findIndex scans backward + indexOf scans the whole array.
   * After:  O(n) — single pass tracks current parent, then filter is O(n) with Set.has() O(1).
   */
  const visibleLines = useMemo(() => {
    let currentParentId: string | null = null;
    return lines.filter((line) => {
      if (line.indent === 0) {
        if (line.type === "header") currentParentId = line.id;
        return true;
      }
      if (!currentParentId) return true;
      return expandedRows.has(currentParentId);
    });
  }, [lines, expandedRows]);

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[650px]">
            <Table>
              <TableHeader className="[&_th]:!bg-gradient-to-r [&_th]:from-[#C5A059] [&_th]:via-[#E8D5A8] [&_th]:to-[#C5A059] [&_th]:!text-[#1a1a1a] [&_th]:!font-bold [&_th]:!text-[13px] [&_th]:!tracking-wide [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg">
                <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                  <TableHead className="w-[30%] sm:w-[35%] px-2 sm:px-4">Descrição</TableHead>
                  <TableHead className="text-right w-[15%] px-2 sm:px-4">Atual</TableHead>
                  <TableHead className="text-right w-[10%] px-1 sm:px-4">AV%</TableHead>
                  <TableHead className="text-right w-[15%] px-2 sm:px-4">
                    {comparisonMode === "budget" ? "Orçado" : "Anterior"}
                  </TableHead>
                  <TableHead className="text-right w-[10%] px-1 sm:px-4">
                    {comparisonMode === "budget" ? "Var%" : "AH%"}
                  </TableHead>
                  <TableHead className="text-center w-[20%] sm:w-[15%] px-1 sm:px-4">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLines.map((line) => {
                  const verticalAnalysis = netRevenue !== 0
                    ? (line.currentValue / netRevenue) * 100
                    : 0;
                  const horizontalVariation = line.previousValue !== 0
                    ? ((line.currentValue - line.previousValue) / Math.abs(line.previousValue)) * 100
                    : 0;

                  const hasChildren = line.type === "header" && lines.some(
                    (l) => l.indent > 0 && lines.indexOf(l) > lines.indexOf(line)
                  );

                  // Calcular se há discrepância entre header e soma das subcategorias
                  let hasDiscrepancy = false;
                  if (line.type === "header" && hasChildren) {
                    const lineIndex = lines.indexOf(line);
                    const nextHeaderIndex = lines.findIndex(
                      (l, idx) => idx > lineIndex && l.type === "header" && l.indent === 0
                    );
                    const endIndex = nextHeaderIndex === -1 ? lines.length : nextHeaderIndex;
                    const children = lines.slice(lineIndex + 1, endIndex).filter(l => l.indent === 1 && l.type === "item");
                    const sumOfChildren = children.reduce((sum, child) => sum + Math.abs(child.currentValue), 0);
                    const headerValue = Math.abs(line.currentValue);
                    hasDiscrepancy = Math.abs(headerValue - sumOfChildren) > 0.01;
                  }

                  return (
                    <TableRow
                      key={line.id}
                      className={cn(
                        "transition-colors cursor-pointer",
                        getRowStyles(line),
                        line.isClickable && "cursor-pointer"
                      )}
                      onClick={() => line.type === "item" && handleRowClick(line)}
                    >
                      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                        <div
                          className="flex items-center gap-1.5 sm:gap-2"
                          style={{ paddingLeft: line.indent * 12 }}
                        >
                          {hasChildren && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 sm:h-5 sm:w-5 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(line.id);
                              }}
                              aria-label="Expandir/recolher"
                            >
                              {expandedRows.has(line.id) ? (
                                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                              ) : (
                                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                          )}
                          <span className="font-mono text-[10px] sm:text-xs text-muted-foreground mr-1 sm:mr-2 hidden xs:inline">
                            {line.code}
                          </span>
                          <span className={cn(
                            "text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none",
                            line.type === "total" && "text-primary",
                            line.type === "item" && line.isClickable && "underline decoration-dotted underline-offset-4"
                          )}>
                            {line.name}
                          </span>
                          {line.type === "item" && line.isClickable && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex cursor-help">
                                    <Search className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground ml-0.5 sm:ml-1" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Clique para ver detalhes</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {hasDiscrepancy && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">
                                    ⚠️
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Soma das subcategorias não bate com o total. Verifique transações sem categoria.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3",
                        line.currentValue < 0 ? "text-destructive" : "",
                        line.type === "total" && "text-sm sm:text-lg"
                      )}>
                        {formatCurrency(line.currentValue)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[10px] sm:text-sm text-muted-foreground px-1 sm:px-4 py-2 sm:py-3">
                        {formatPct(verticalAnalysis)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono text-[10px] sm:text-sm px-2 sm:px-4 py-2 sm:py-3",
                        line.previousValue < 0 ? "text-destructive/70" : "text-muted-foreground"
                      )}>
                        {formatCurrency(line.previousValue)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono text-[10px] sm:text-sm font-medium px-1 sm:px-4 py-2 sm:py-3",
                        getVariationColor(horizontalVariation)
                      )}>
                        {horizontalVariation >= 0 ? "+" : ""}
                        {formatPct(horizontalVariation)}
                      </TableCell>
                      <TableCell className="text-center px-1 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          {getTrendIcon(line.currentValue, line.previousValue)}
                          {onAddNote && line.type === "item" && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 sm:h-6 sm:w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onAddNote(line.id);
                                    }}
                                    aria-label="Adicionar nota"
                                  >
                                    <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Adicionar nota</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <DREDrillDown
        open={drillDown.open}
        onOpenChange={(open) => setDrillDown((prev) => ({ ...prev, open }))}
        categoryId={drillDown.categoryId}
        categoryName={drillDown.categoryName}
        categoryType={drillDown.categoryType}
        companyId={companyId}
        startDate={startDate}
        endDate={endDate}
        formatCurrency={formatCurrency}
      />
    </>
  );
}
