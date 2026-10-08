'use client';

import { useMemo, useCallback } from "react";
import { format, parseISO, getWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { WeeklyData, DailyDetail, DetailedTransaction } from "../components/CashFlowTypes";
import type { HistoricalData, CategoryData } from "./useCashFlowProjection";

export interface MatrixWeekColumn {
  weekNumber: number;
  weekLabel: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  isProjected?: boolean;
}

export interface MatrixDayColumn {
  date: string;
  dayLabel: string;
  dayNumber: number;
}

export interface MatrixCategoryData {
  code: string;
  name: string;
  values: Record<string | number, number>;
  total: number;
}

export interface MatrixGroupData {
  groupName: string;
  type: "entrada" | "saida";
  categories: MatrixCategoryData[];
  totals: Record<string | number, number>;
  grandTotal: number;
}

export type GranularityType = "week" | "day";
export type ProjectionMethod = "average" | "trend" | "last";

interface UseMatrixDataParams {
  weeklyData: WeeklyData[];
  dailyData: DailyDetail[];
  detailedTransactions: DetailedTransaction[];
  saldoInicial: number;
  granularity: GranularityType;
  hiddenCategories: string[];
  hideEmptyCategories: boolean;
  showComparison: boolean;
  showHeatmap: boolean;
  showProjection: boolean;
  projectionWeeks: number;
  projectionMethod: ProjectionMethod;
}

export function useMatrixData(params: UseMatrixDataParams) {
  const {
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
  } = params;

  // Build week columns
  const weekColumns: MatrixWeekColumn[] = useMemo(() => {
    return weeklyData.map((week) => ({
      weekNumber: week.weekNumber,
      weekLabel: `Sem ${week.weekNumber}`,
      dateRange: `${format(parseISO(week.startDate), "dd")}-${format(parseISO(week.endDate), "dd/MMM", { locale: ptBR })}`,
      startDate: week.startDate,
      endDate: week.endDate,
    }));
  }, [weeklyData]);

  // Build day columns
  const dayColumns: MatrixDayColumn[] = useMemo(() => {
    return dailyData.map((day, index) => ({
      date: day.date,
      dayLabel: format(parseISO(day.date), "EEE dd", { locale: ptBR }),
      dayNumber: index + 1,
    }));
  }, [dailyData]);

  // Calculate balances per week
  const weekBalances = useMemo(() => {
    const balances: Record<number, { inicial: number; final: number }> = {};
    weeklyData.forEach((week) => {
      balances[week.weekNumber] = {
        inicial: week.saldoInicial,
        final: week.saldoFinal,
      };
    });
    return balances;
  }, [weeklyData]);

  // Calculate balances per day
  const dayBalances = useMemo(() => {
    const balances: Record<string, { inicial: number; final: number }> = {};
    dailyData.forEach((day, index) => {
      const prevDay = index > 0 ? dailyData[index - 1] : null;
      balances[day.date] = {
        inicial: prevDay ? prevDay.saldoAcumulado : saldoInicial,
        final: day.saldoAcumulado,
      };
    });
    return balances;
  }, [dailyData, saldoInicial]);

  // Group transactions by category and period
  const groupedData = useMemo(() => {
    const entradasByPeriod: Record<string, Record<string | number, number>> = {};
    const saidasByPeriod: Record<string, Record<string | number, number>> = {};
    const categoryNames: Record<string, string> = {};

    detailedTransactions.forEach((tx) => {
      const periodKey =
        granularity === "week"
          ? getWeek(parseISO(tx.date), { locale: ptBR })
          : tx.date;
      const categoryKey = tx.categoryCode || "SEM_CAT";
      categoryNames[categoryKey] = tx.category || "Sem Categoria";

      if (tx.type === "entrada") {
        if (!entradasByPeriod[categoryKey]) entradasByPeriod[categoryKey] = {};
        entradasByPeriod[categoryKey][periodKey] =
          (entradasByPeriod[categoryKey][periodKey] || 0) + tx.amount;
      } else {
        if (!saidasByPeriod[categoryKey]) saidasByPeriod[categoryKey] = {};
        saidasByPeriod[categoryKey][periodKey] =
          (saidasByPeriod[categoryKey][periodKey] || 0) + tx.amount;
      }
    });

    const buildCategoryRows = (
      data: Record<string, Record<string | number, number>>
    ): MatrixCategoryData[] => {
      return Object.entries(data)
        .map(([code, periodValues]) => ({
          code,
          name: categoryNames[code] || code,
          values: periodValues,
          total: Object.values(periodValues).reduce((sum, val) => sum + val, 0),
        }))
        .sort((a, b) => a.code.localeCompare(b.code));
    };

    const entradasCategories = buildCategoryRows(entradasByPeriod);
    const saidasCategories = buildCategoryRows(saidasByPeriod);

    const calculateGroupTotals = (
      categories: MatrixCategoryData[]
    ): Record<string | number, number> => {
      const totals: Record<string | number, number> = {};
      const columns = granularity === "week" ? weekColumns : dayColumns;
      columns.forEach((col) => {
        const key =
          granularity === "week"
            ? (col as MatrixWeekColumn).weekNumber
            : (col as MatrixDayColumn).date;
        totals[key] = categories.reduce(
          (sum, cat) => sum + (cat.values[key] || 0),
          0
        );
      });
      return totals;
    };

    return {
      entradas: {
        groupName: "ENTRADAS",
        type: "entrada" as const,
        categories: entradasCategories,
        totals: calculateGroupTotals(entradasCategories),
        grandTotal: entradasCategories.reduce(
          (sum, cat) => sum + cat.total,
          0
        ),
      },
      saidas: {
        groupName: "SAÍDAS",
        type: "saida" as const,
        categories: saidasCategories,
        totals: calculateGroupTotals(saidasCategories),
        grandTotal: saidasCategories.reduce((sum, cat) => sum + cat.total, 0),
      },
    };
  }, [detailedTransactions, weekColumns, dayColumns, granularity]);

  // Filtered grouped data
  const filteredGroupedData = useMemo(() => {
    const filterCategories = (categories: MatrixCategoryData[]) => {
      return categories.filter((cat) => {
        if (hiddenCategories.includes(cat.code)) return false;
        if (hideEmptyCategories && cat.total === 0) return false;
        return true;
      });
    };

    const filteredEntradas = filterCategories(groupedData.entradas.categories);
    const filteredSaidas = filterCategories(groupedData.saidas.categories);

    const calculateFilteredTotals = (
      categories: MatrixCategoryData[]
    ): Record<string | number, number> => {
      const totals: Record<string | number, number> = {};
      const columns = granularity === "week" ? weekColumns : dayColumns;
      columns.forEach((col) => {
        const key =
          granularity === "week"
            ? (col as MatrixWeekColumn).weekNumber
            : (col as MatrixDayColumn).date;
        totals[key] = categories.reduce(
          (sum, cat) => sum + (cat.values[key] || 0),
          0
        );
      });
      return totals;
    };

    return {
      entradas: {
        ...groupedData.entradas,
        categories: filteredEntradas,
        totals: calculateFilteredTotals(filteredEntradas),
        grandTotal: filteredEntradas.reduce((sum, cat) => sum + cat.total, 0),
      },
      saidas: {
        ...groupedData.saidas,
        categories: filteredSaidas,
        totals: calculateFilteredTotals(filteredSaidas),
        grandTotal: filteredSaidas.reduce((sum, cat) => sum + cat.total, 0),
      },
    };
  }, [
    groupedData,
    hiddenCategories,
    hideEmptyCategories,
    weekColumns,
    dayColumns,
    granularity,
  ]);

  // Comparison data
  const comparisonData = useMemo(() => {
    if (!showComparison) return null;

    const columns = granularity === "week" ? weekColumns : dayColumns;
    const variations: Record<
      string,
      Record<string | number, { value: number; percent: number }>
    > = {};

    [
      ...filteredGroupedData.entradas.categories,
      ...filteredGroupedData.saidas.categories,
    ].forEach((cat) => {
      variations[cat.code] = {};

      columns.forEach((col, index) => {
        const key =
          granularity === "week"
            ? (col as MatrixWeekColumn).weekNumber
            : (col as MatrixDayColumn).date;
        const currentValue = cat.values[key] || 0;

        let previousValue = 0;
        if (index > 0) {
          const prevCol = columns[index - 1];
          const prevKey =
            granularity === "week"
              ? (prevCol as MatrixWeekColumn).weekNumber
              : (prevCol as MatrixDayColumn).date;
          previousValue = cat.values[prevKey] || 0;
        }

        const diff = currentValue - previousValue;
        const percent =
          previousValue !== 0
            ? (diff / previousValue) * 100
            : currentValue > 0
              ? 100
              : 0;

        variations[cat.code][key] = { value: diff, percent };
      });
    });

    return variations;
  }, [showComparison, filteredGroupedData, weekColumns, dayColumns, granularity]);

  // Heatmap max values
  const heatmapMaxValues = useMemo(() => {
    if (!showHeatmap) return null;

    const allEntradasValues = filteredGroupedData.entradas.categories.flatMap(
      (cat) => Object.values(cat.values)
    );
    const allSaidasValues = filteredGroupedData.saidas.categories.flatMap(
      (cat) => Object.values(cat.values)
    );

    return {
      entradas: Math.max(...allEntradasValues, 1),
      saidas: Math.max(...allSaidasValues, 1),
    };
  }, [showHeatmap, filteredGroupedData]);

  // Pre-computed heatmap color map
  const heatmapColorMap = useMemo(() => {
    if (!showHeatmap || !heatmapMaxValues) return new Map<string, string>();
    const map = new Map<string, string>();
    const cols = granularity === "week" ? weekColumns : dayColumns;

    const processCategories = (
      categories: MatrixCategoryData[],
      maxValue: number,
      type: "entrada" | "saida"
    ) => {
      categories.forEach((cat) => {
        cols.forEach((col) => {
          const key =
            granularity === "week"
              ? (col as MatrixWeekColumn).weekNumber
              : (col as MatrixDayColumn).date;
          const value = cat.values[key] || 0;
          if (value > 0 && maxValue > 0) {
            const intensity = Math.min(value / maxValue, 1);
            const color =
              type === "entrada"
                ? `rgba(16, 185, 129, ${(0.05 + intensity * 0.3).toFixed(4)})`
                : `rgba(239, 68, 68, ${(0.05 + intensity * 0.3).toFixed(4)})`;
            map.set(`${cat.code}_${key}`, color);
          }
        });
      });
    };

    processCategories(
      filteredGroupedData.entradas.categories,
      heatmapMaxValues.entradas,
      "entrada"
    );
    processCategories(
      filteredGroupedData.saidas.categories,
      heatmapMaxValues.saidas,
      "saida"
    );
    return map;
  }, [
    showHeatmap,
    heatmapMaxValues,
    filteredGroupedData,
    weekColumns,
    dayColumns,
    granularity,
  ]);

  // Linear projection
  const calculateLinearProjection = useCallback(
    (values: number[], periodsAhead: number): number => {
      if (values.length < 2) return values[values.length - 1] || 0;

      const n = values.length;
      let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumX2 = 0;

      values.forEach((y, x) => {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      });

      const denominator = n * sumX2 - sumX * sumX;
      if (denominator === 0) return values[values.length - 1] || 0;

      const slope = (n * sumXY - sumX * sumY) / denominator;
      const intercept = (sumY - slope * sumX) / n;

      return slope * (n - 1 + periodsAhead) + intercept;
    },
    []
  );

  // Projection data
  const projectionData = useMemo(() => {
    if (!showProjection || granularity !== "week" || weekColumns.length === 0)
      return null;

    const projectedWeeks: MatrixWeekColumn[] = [];
    const projectedValues: Record<string, number[]> = {};

    const lastWeek = weekColumns[weekColumns.length - 1];
    const lastDate = parseISO(lastWeek.endDate);

    for (let i = 1; i <= projectionWeeks; i++) {
      const startDate = addDays(lastDate, (i - 1) * 7 + 1);
      const endDate = addDays(startDate, 6);

      projectedWeeks.push({
        weekNumber: lastWeek.weekNumber + i,
        weekLabel: `Sem ${lastWeek.weekNumber + i}`,
        dateRange: `${format(startDate, "dd")}-${format(endDate, "dd/MMM", { locale: ptBR })}`,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        isProjected: true,
      });
    }

    const allCategories = [
      ...filteredGroupedData.entradas.categories,
      ...filteredGroupedData.saidas.categories,
    ];

    allCategories.forEach((cat) => {
      const historicalValues = weekColumns.map(
        (w) => cat.values[w.weekNumber] || 0
      );
      const projected: number[] = [];

      for (let i = 0; i < projectionWeeks; i++) {
        let projectedValue: number;

        switch (projectionMethod) {
          case "average": {
            const recentValues = historicalValues.slice(-4);
            projectedValue =
              recentValues.length > 0
                ? recentValues.reduce((a, b) => a + b, 0) /
                  recentValues.length
                : 0;
            break;
          }
          case "trend":
            projectedValue = calculateLinearProjection(
              historicalValues,
              i + 1
            );
            break;
          case "last":
            projectedValue =
              historicalValues[historicalValues.length - 1] || 0;
            break;
          default:
            projectedValue = 0;
        }

        projected.push(Math.max(0, projectedValue));
      }

      projectedValues[cat.code] = projected;
    });

    const projectedEntradasTotals: number[] = Array(projectionWeeks).fill(0);
    const projectedSaidasTotals: number[] = Array(projectionWeeks).fill(0);

    filteredGroupedData.entradas.categories.forEach((cat) => {
      projectedValues[cat.code]?.forEach((val, idx) => {
        projectedEntradasTotals[idx] += val;
      });
    });

    filteredGroupedData.saidas.categories.forEach((cat) => {
      projectedValues[cat.code]?.forEach((val, idx) => {
        projectedSaidasTotals[idx] += val;
      });
    });

    return {
      weeks: projectedWeeks,
      values: projectedValues,
      entradasTotals: projectedEntradasTotals,
      saidasTotals: projectedSaidasTotals,
    };
  }, [
    showProjection,
    projectionWeeks,
    projectionMethod,
    weekColumns,
    filteredGroupedData,
    granularity,
    calculateLinearProjection,
  ]);

  // Sparkline data
  const getCategoryTrendData = useCallback(
    (categoryCode: string): number[] => {
      const columns = granularity === "week" ? weekColumns : dayColumns;
      const allCategories = [
        ...groupedData.entradas.categories,
        ...groupedData.saidas.categories,
      ];
      const category = allCategories.find((c) => c.code === categoryCode);
      if (!category) return [];

      return columns.map((col) => {
        const key =
          granularity === "week"
            ? (col as MatrixWeekColumn).weekNumber
            : (col as MatrixDayColumn).date;
        return category.values[key] || 0;
      });
    },
    [weekColumns, dayColumns, groupedData, granularity]
  );

  // Category filter data
  const categoryFilterData = useMemo(() => {
    const mapCategories = (categories: MatrixCategoryData[]) =>
      categories.map((cat) => ({
        code: cat.code,
        name: cat.name,
        hasData: cat.total > 0,
      }));

    return {
      entradas: mapCategories(groupedData.entradas.categories),
      saidas: mapCategories(groupedData.saidas.categories),
    };
  }, [groupedData]);

  // Period results
  const periodResults = useMemo(() => {
    const results: Record<string | number, number> = {};
    const columns = granularity === "week" ? weekColumns : dayColumns;
    columns.forEach((col) => {
      const key =
        granularity === "week"
          ? (col as MatrixWeekColumn).weekNumber
          : (col as MatrixDayColumn).date;
      const entradas = filteredGroupedData.entradas.totals[key] || 0;
      const saidas = filteredGroupedData.saidas.totals[key] || 0;
      results[key] = entradas - saidas;
    });
    return results;
  }, [filteredGroupedData, weekColumns, dayColumns, granularity]);

  const totalResult =
    filteredGroupedData.entradas.grandTotal -
    filteredGroupedData.saidas.grandTotal;

  // Current final balance for projection alerts
  const currentFinalBalance = useMemo(() => {
    if (weekColumns.length === 0) return saldoInicial;
    const lastWeek = weekColumns[weekColumns.length - 1];
    return weekBalances[lastWeek.weekNumber]?.final || saldoInicial;
  }, [weekColumns, weekBalances, saldoInicial]);

  // Data for AI projection
  const historicalDataForAI = useMemo((): HistoricalData[] => {
    return weeklyData.map((week) => ({
      weekNumber: week.weekNumber,
      entradas: week.entradas,
      saidas: week.saidas,
      saldo: week.entradas - week.saidas,
    }));
  }, [weeklyData]);

  const categoriesForAI = useMemo((): CategoryData[] => {
    const cats: CategoryData[] = [];
    [
      ...groupedData.entradas.categories,
      ...groupedData.saidas.categories,
    ].forEach((cat) => {
      const type = groupedData.entradas.categories.includes(cat)
        ? "entrada"
        : "saida";
      const values = weekColumns.map((w) => cat.values[w.weekNumber] || 0);
      cats.push({ code: cat.code, name: cat.name, type, values });
    });
    return cats;
  }, [groupedData, weekColumns]);

  const chartOfAccountsList = useMemo(() => {
    return [
      ...groupedData.entradas.categories,
      ...groupedData.saidas.categories,
    ].map((cat) => ({
      code: cat.code,
      name: cat.name,
      type: groupedData.entradas.categories.includes(cat)
        ? "receita"
        : "despesa",
    }));
  }, [groupedData]);

  return {
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
  };
}
