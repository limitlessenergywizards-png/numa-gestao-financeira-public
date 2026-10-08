'use client';

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, startOfQuarter, endOfQuarter, subQuarters } from "date-fns";
import { dreKeys, STALE_TIMES, GC_TIMES } from "@/lib/queryKeys";
import type { DREGroupableItem } from "@/types/dre";

export type DREPeriod = "current_month" | "previous_month" | "quarter" | "previous_quarter" | "semester" | "year" | "previous_year" | "custom";
export type DREView = "summary" | "detailed" | "accounting";

export interface DRECategory {
  id: string;
  code: string;
  name: string;
  type: "receita" | "despesa" | "custo";
  currentValue: number;
  previousValue: number;
  budgetValue?: number;
  children?: DRECategory[];
}

export interface DRELine {
  id: string;
  code: string;
  name: string;
  currentValue: number;
  previousValue: number;
  budgetValue?: number;
  type: "header" | "item" | "subtotal" | "total" | "category";
  categoryType?: "receita" | "despesa" | "custo";
  indent: number;
  isExpanded?: boolean;
  children?: DRELine[];
  isClickable?: boolean;
  chartAccountId?: string;
}

export interface DREIndicators {
  grossMargin: number;
  operationalMargin: number;
  netMargin: number;
  ebitda: number;
  previousGrossMargin: number;
  previousOperationalMargin: number;
  previousNetMargin: number;
  previousEbitda: number;
}

export interface DRESummary {
  grossRevenue: number;
  deductions: number;
  netRevenue: number;
  costs: number;
  grossProfit: number;
  operationalExpenses: number;
  administrativeExpenses: number;
  commercialExpenses: number;
  financialExpenses: number;
  operationalResult: number;
  netResult: number;
  previousGrossRevenue: number;
  previousCosts: number;
  previousOperationalExpenses: number;
  previousNetResult: number;
}

export interface UseDREDataReturn {
  dreLines: DRELine[];
  summary: DRESummary;
  indicators: DREIndicators;
  categories: DRECategory[];
  isLoading: boolean;
  periodDates: {
    currentStart: Date;
    currentEnd: Date;
    previousStart: Date;
    previousEnd: Date;
  };
  formatCurrency: (value: number) => string;
  formatPercent: (value: number) => string;
}

export type AccountingRegime = "competencia" | "caixa";

// Pure formatting functions - defined outside hook to prevent re-creation
const formatCurrencyFn = (value: number) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const formatPercentFn = (value: number) => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
};

// Pure function to group data by category - defined outside hook
const groupByCategory = (data: DREGroupableItem[]) => {
  const grouped: Record<string, { total: number; name: string; code: string; id: string }> = {};
  let uncategorizedTotal = 0;

  data.forEach((item) => {
    const account = item.chart_of_accounts;
    const amount = item.total_amount || item.amount || 0;

    if (account && account.id) {
      const key = account.id;
      if (!grouped[key]) {
        grouped[key] = { total: 0, name: account.name, code: account.code, id: account.id };
      }
      grouped[key].total += amount;
    } else {
      uncategorizedTotal += amount;
    }
  });

  const result = Object.values(grouped).sort((a, b) => a.code.localeCompare(b.code));

  if (uncategorizedTotal > 0) {
    result.push({
      id: 'uncategorized',
      code: 'X.99',
      name: 'Outros (Não Categorizado)',
      total: uncategorizedTotal,
    });
  }

  return result;
};

// Pure function to calculate period dates
const calculatePeriodDates = (
  period: DREPeriod,
  customStartDate?: Date,
  customEndDate?: Date
) => {
  const now = new Date();
  let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

  switch (period) {
    case "current_month":
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      previousStart = startOfMonth(subMonths(now, 1));
      previousEnd = endOfMonth(subMonths(now, 1));
      break;
    case "previous_month":
      currentStart = startOfMonth(subMonths(now, 1));
      currentEnd = endOfMonth(subMonths(now, 1));
      previousStart = startOfMonth(subMonths(now, 2));
      previousEnd = endOfMonth(subMonths(now, 2));
      break;
    case "quarter":
      currentStart = startOfQuarter(now);
      currentEnd = endOfQuarter(now);
      previousStart = startOfQuarter(subQuarters(now, 1));
      previousEnd = endOfQuarter(subQuarters(now, 1));
      break;
    case "previous_quarter":
      currentStart = startOfQuarter(subQuarters(now, 1));
      currentEnd = endOfQuarter(subQuarters(now, 1));
      previousStart = startOfQuarter(subQuarters(now, 2));
      previousEnd = endOfQuarter(subQuarters(now, 2));
      break;
    case "semester": {
      const currentSemesterStart = now.getMonth() < 6 ? 0 : 6;
      currentStart = new Date(now.getFullYear(), currentSemesterStart, 1);
      currentEnd = new Date(now.getFullYear(), currentSemesterStart + 6, 0);
      const prevSemesterStart = currentSemesterStart === 0 ? 6 : 0;
      const prevYear = currentSemesterStart === 0 ? now.getFullYear() - 1 : now.getFullYear();
      previousStart = new Date(prevYear, prevSemesterStart, 1);
      previousEnd = new Date(prevYear, prevSemesterStart + 6, 0);
      break;
    }
    case "year":
      currentStart = startOfYear(now);
      currentEnd = endOfYear(now);
      previousStart = startOfYear(subYears(now, 1));
      previousEnd = endOfYear(subYears(now, 1));
      break;
    case "previous_year":
      currentStart = startOfYear(subYears(now, 1));
      currentEnd = endOfYear(subYears(now, 1));
      previousStart = startOfYear(subYears(now, 2));
      previousEnd = endOfYear(subYears(now, 2));
      break;
    case "custom": {
      currentStart = customStartDate || startOfMonth(now);
      currentEnd = customEndDate || endOfMonth(now);
      const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
      previousStart = new Date(currentStart.getTime() - daysDiff * 24 * 60 * 60 * 1000);
      previousEnd = new Date(currentStart.getTime() - 1);
      break;
    }
    default:
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      previousStart = startOfMonth(subMonths(now, 1));
      previousEnd = endOfMonth(subMonths(now, 1));
  }

  return { currentStart, currentEnd, previousStart, previousEnd };
};

// Raw data shape returned by the query
interface DRERawData {
  revenueData: { period: string; data: DREGroupableItem[] }[];
  expenseData: { period: string; data: DREGroupableItem[] }[];
  costData: { period: string; data: DREGroupableItem[] }[];
}

const EMPTY_RAW: DRERawData = {
  revenueData: [],
  expenseData: [],
  costData: [],
};

export function useDREData(
  companyId: string | undefined,
  period: DREPeriod,
  customStartDate?: Date,
  customEndDate?: Date,
  accountingRegime: AccountingRegime = "competencia",
  comparisonMode: "period" | "budget" = "period"
): UseDREDataReturn {
  // Memoize period dates calculation
  const periodDates = useMemo(
    () => calculatePeriodDates(period, customStartDate, customEndDate),
    [period, customStartDate?.getTime(), customEndDate?.getTime()]
  );

  // Build a stable query key that captures all parameters
  const periodKey = `${period}_${accountingRegime}_${comparisonMode}_${format(periodDates.currentStart, 'yyyy-MM-dd')}_${format(periodDates.currentEnd, 'yyyy-MM-dd')}`;

  const { data: rawData, isLoading } = useQuery({
    queryKey: companyId ? dreKeys.data(companyId, periodKey) : ['disabled'],
    queryFn: async ({ signal }) => {
      const { currentStart, currentEnd, previousStart, previousEnd } = periodDates;

      const statusFilter = accountingRegime === "caixa" ? "pago" : undefined;
      const dateField = "due_date";
      const receivablesSelect = "total_amount, paid_amount, chart_account_id, chart_of_accounts(id, name, code, type, dre_category)";
      const payablesSelect = "total_amount, paid_amount, chart_account_id, chart_of_accounts(id, name, code, type, dre_category)";
      const transactionsSelect = "amount, type, transaction_date, chart_account_id, forecast_basis, is_deleted, chart_of_accounts(id, name, code, type, dre_category)";

      const buildReceivablesQuery = (start: Date, end: Date) => {
        let q = supabase
          .from("receivables")
          .select(receivablesSelect)
          .eq("company_id", companyId!)
          .eq("is_deleted", false)
          .gte(dateField, format(start, "yyyy-MM-dd"))
          .lte(dateField, format(end, "yyyy-MM-dd"));
        if (statusFilter) q = q.eq("status", statusFilter);
        q = q.neq("status", "cancelado");
        return q.abortSignal(signal);
      };

      const buildPayablesQuery = (start: Date, end: Date) => {
        let q = supabase
          .from("payables")
          .select(payablesSelect)
          .eq("company_id", companyId!)
          .eq("is_deleted", false)
          .gte(dateField, format(start, "yyyy-MM-dd"))
          .lte(dateField, format(end, "yyyy-MM-dd"));
        if (statusFilter) q = q.eq("status", statusFilter);
        q = q.neq("status", "cancelado");
        return q.abortSignal(signal);
      };

      const buildTransactionsQuery = (start: Date, end: Date, nature?: 'realizado' | 'previsao') => {
        let q = supabase
          .from("transactions")
          .select(transactionsSelect)
          .eq("company_id", companyId!)
          .is("forecast_basis", null) // Exclude synced transactions — already counted via receivables/payables
          .eq("is_deleted", false)
          .gte("transaction_date", format(start, "yyyy-MM-dd"))
          .lte("transaction_date", format(end, "yyyy-MM-dd"));

        if (nature) {
          q = q.eq("nature", nature);
        } else if (comparisonMode === 'budget') {
          q = q.eq("nature", "realizado");
        }

        return q.abortSignal(signal);
      };

      // Define queries based on comparison mode
      const currentRevQuery = buildReceivablesQuery(currentStart, currentEnd);
      const currentPayQuery = buildPayablesQuery(currentStart, currentEnd);
      // For current period, we always want realized transactions
      const currentTxQuery = buildTransactionsQuery(currentStart, currentEnd, 'realizado');

      let previousRevQuery;
      let previousPayQuery;
      let previousTxQuery;

      if (comparisonMode === 'budget') {
        // In budget mode:
        // 1. We don't use receivables/payables for budget (usually budget is in transactions table as forecast)
        // 2. We verify transactions with nature='previsao' for the CURRENT period
        previousRevQuery = Promise.resolve({ data: [] });
        previousPayQuery = Promise.resolve({ data: [] });
        previousTxQuery = buildTransactionsQuery(currentStart, currentEnd, 'previsao');
      } else {
        // In period comparison mode:
        // 1. Regular queries for previous period
        // 2. Nature defaults to realized (implicit in current data, but we filter to be safe)
        previousRevQuery = buildReceivablesQuery(previousStart, previousEnd);
        previousPayQuery = buildPayablesQuery(previousStart, previousEnd);
        previousTxQuery = buildTransactionsQuery(previousStart, previousEnd, 'realizado');
      }

      const [
        { data: currentReceivables },
        { data: previousReceivables },
        { data: currentPayables },
        { data: previousPayables },
        { data: currentTransactions },
        { data: previousTransactions },
      ] = await Promise.all([
        currentRevQuery,
        previousRevQuery,
        currentPayQuery,
        previousPayQuery,
        currentTxQuery,
        previousTxQuery,
      ]);

      // Separate transactions by type
      const currentTransactionRevenue = (currentTransactions || [])
        .filter((t: any) => t.type === "entrada" && !t.is_deleted)
        .map((t: any) => ({ total_amount: t.amount, chart_of_accounts: t.chart_of_accounts, chart_account_id: t.chart_account_id }));

      const previousTransactionRevenue = (previousTransactions || [])
        .filter((t: any) => t.type === "entrada" && !t.is_deleted)
        .map((t: any) => ({ total_amount: t.amount, chart_of_accounts: t.chart_of_accounts, chart_account_id: t.chart_account_id }));

      const currentTransactionCosts = (currentTransactions || [])
        .filter((t: any) => t.type === "saida" && t.chart_of_accounts?.type === "custo" && !t.is_deleted)
        .map((t: any) => ({ total_amount: t.amount, chart_of_accounts: t.chart_of_accounts, chart_account_id: t.chart_account_id }));

      const previousTransactionCosts = (previousTransactions || [])
        .filter((t: any) => t.type === "saida" && t.chart_of_accounts?.type === "custo" && !t.is_deleted)
        .map((t: any) => ({ total_amount: t.amount, chart_of_accounts: t.chart_of_accounts, chart_account_id: t.chart_account_id }));

      const currentTransactionExpenses = (currentTransactions || [])
        .filter((t: any) => t.type === "saida" && t.chart_of_accounts?.type === "despesa" && !t.is_deleted)
        .map((t: any) => ({ total_amount: t.amount, chart_of_accounts: t.chart_of_accounts, chart_account_id: t.chart_account_id }));

      const previousTransactionExpenses = (previousTransactions || [])
        .filter((t: any) => t.type === "saida" && t.chart_of_accounts?.type === "despesa" && !t.is_deleted)
        .map((t: any) => ({ total_amount: t.amount, chart_of_accounts: t.chart_of_accounts, chart_account_id: t.chart_account_id }));

      // Merge receivables + transaction revenue
      const mergedCurrentRevenue = [...(currentReceivables || []), ...currentTransactionRevenue];
      const mergedPreviousRevenue = [...(previousReceivables || []), ...previousTransactionRevenue];

      // Merge payables costs + transaction costs
      const currentPayableCosts = (currentPayables || []).filter((p: any) => p.chart_of_accounts?.type === "custo");
      const previousPayableCosts = (previousPayables || []).filter((p: any) => p.chart_of_accounts?.type === "custo");
      const mergedCurrentCosts = [...currentPayableCosts, ...currentTransactionCosts];
      const mergedPreviousCosts = [...previousPayableCosts, ...previousTransactionCosts];

      // Merge payables expenses + transaction expenses
      const currentPayableExpenses = (currentPayables || []).filter((p: any) => p.chart_of_accounts?.type === "despesa");
      const previousPayableExpenses = (previousPayables || []).filter((p: any) => p.chart_of_accounts?.type === "despesa");
      const mergedCurrentExpenses = [...currentPayableExpenses, ...currentTransactionExpenses];
      const mergedPreviousExpenses = [...previousPayableExpenses, ...previousTransactionExpenses];

      return {
        revenueData: [
          { period: "current", data: mergedCurrentRevenue },
          { period: "previous", data: mergedPreviousRevenue },
        ],
        costData: [
          { period: "current", data: mergedCurrentCosts },
          { period: "previous", data: mergedPreviousCosts },
        ],
        expenseData: [
          { period: "current", data: mergedCurrentExpenses },
          { period: "previous", data: mergedPreviousExpenses },
        ],
      } as DRERawData;
    },
    enabled: !!companyId,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  const { revenueData, expenseData, costData } = rawData ?? EMPTY_RAW;

  // Build categories for drill-down
  const categories = useMemo(() => {
    const currentRevenue = revenueData.find(r => r.period === "current")?.data || [];
    const previousRevenue = revenueData.find(r => r.period === "previous")?.data || [];
    const currentCosts = costData.find(r => r.period === "current")?.data || [];
    const previousCosts = costData.find(r => r.period === "previous")?.data || [];
    const currentExpenses = expenseData.find(r => r.period === "current")?.data || [];
    const previousExpenses = expenseData.find(r => r.period === "previous")?.data || [];

    const currentRevenueByCategory = groupByCategory(currentRevenue);
    const previousRevenueByCategory = groupByCategory(previousRevenue);
    const currentCostsByCategory = groupByCategory(currentCosts);
    const previousCostsByCategory = groupByCategory(previousCosts);
    const currentExpensesByCategory = groupByCategory(currentExpenses);
    const previousExpensesByCategory = groupByCategory(previousExpenses);

    const buildCategories = (
      current: { total: number; name: string; code: string; id: string }[],
      previous: { total: number; name: string; code: string; id: string }[],
      type: "receita" | "despesa" | "custo"
    ): DRECategory[] => {
      return current.map((c) => {
        const prev = previous.find((p) => p.id === c.id);
        return {
          id: c.id,
          code: c.code,
          name: c.name,
          type,
          currentValue: c.total,
          previousValue: prev?.total || 0,
        };
      });
    };

    return [
      ...buildCategories(currentRevenueByCategory, previousRevenueByCategory, "receita"),
      ...buildCategories(currentCostsByCategory, previousCostsByCategory, "custo"),
      ...buildCategories(currentExpensesByCategory, previousExpensesByCategory, "despesa"),
    ];
  }, [revenueData, costData, expenseData]);

  // Calculate DRE lines and summary
  const { dreLines, summary } = useMemo(() => {
    const currentRevenue = revenueData.find(r => r.period === "current")?.data || [];
    const previousRevenue = revenueData.find(r => r.period === "previous")?.data || [];
    const currentCosts = costData.find(r => r.period === "current")?.data || [];
    const previousCosts = costData.find(r => r.period === "previous")?.data || [];
    const currentExpenses = expenseData.find(r => r.period === "current")?.data || [];
    const previousExpenses = expenseData.find(r => r.period === "previous")?.data || [];

    const sumAmount = (data: any[]) => data.reduce((acc, item) => acc + (item.total_amount || 0), 0);

    const totalCurrentRevenue = sumAmount(currentRevenue);
    const totalPreviousRevenue = sumAmount(previousRevenue);
    const totalCurrentCosts = sumAmount(currentCosts);
    const totalPreviousCosts = sumAmount(previousCosts);
    const totalCurrentExpenses = sumAmount(currentExpenses);
    const totalPreviousExpenses = sumAmount(previousExpenses);

    const currentGrossProfit = totalCurrentRevenue - totalCurrentCosts;
    const previousGrossProfit = totalPreviousRevenue - totalPreviousCosts;
    const currentNetResult = currentGrossProfit - totalCurrentExpenses;
    const previousNetResult = previousGrossProfit - totalPreviousExpenses;

    // Build detailed lines with categories
    const revenueCategories = categories.filter(c => c.type === "receita");
    const costCategories = categories.filter(c => c.type === "custo");
    const expenseCategories = categories.filter(c => c.type === "despesa");

    const lines: DRELine[] = [
      {
        id: "receita_bruta",
        code: "1",
        name: "(+) RECEITA OPERACIONAL BRUTA",
        currentValue: totalCurrentRevenue,
        previousValue: totalPreviousRevenue,
        type: "header",
        indent: 0,
        isClickable: true,
        categoryType: "receita"
      },
      ...revenueCategories.map((cat, idx) => ({
        id: `receita_${cat.id}`,
        code: `1.${idx + 1}`,
        name: cat.name,
        currentValue: cat.currentValue,
        previousValue: cat.previousValue,
        type: "item" as const,
        categoryType: "receita" as const,
        indent: 1,
        isClickable: true,
        chartAccountId: cat.id,
      })),
      {
        id: "deducoes",
        code: "2",
        name: "(-) DEDUÇÕES DA RECEITA",
        currentValue: 0,
        previousValue: 0,
        type: "header",
        indent: 0
      },
      {
        id: "receita_liquida",
        code: "3",
        name: "(=) RECEITA OPERACIONAL LÍQUIDA",
        currentValue: totalCurrentRevenue,
        previousValue: totalPreviousRevenue,
        type: "subtotal",
        indent: 0
      },
      {
        id: "custos",
        code: "4",
        name: "(-) CUSTOS DOS PRODUTOS/SERVIÇOS VENDIDOS",
        currentValue: -totalCurrentCosts,
        previousValue: -totalPreviousCosts,
        type: "header",
        indent: 0,
        isClickable: true,
        categoryType: "custo"
      },
      ...costCategories.map((cat, idx) => ({
        id: `custo_${cat.id}`,
        code: `4.${idx + 1}`,
        name: cat.name,
        currentValue: -cat.currentValue,
        previousValue: -cat.previousValue,
        type: "item" as const,
        categoryType: "custo" as const,
        indent: 1,
        isClickable: true,
        chartAccountId: cat.id,
      })),
      {
        id: "lucro_bruto",
        code: "5",
        name: "(=) LUCRO BRUTO",
        currentValue: currentGrossProfit,
        previousValue: previousGrossProfit,
        type: "subtotal",
        indent: 0
      },
      {
        id: "despesas_operacionais",
        code: "6",
        name: "(-) DESPESAS OPERACIONAIS",
        currentValue: -totalCurrentExpenses,
        previousValue: -totalPreviousExpenses,
        type: "header",
        indent: 0,
        isClickable: true,
        categoryType: "despesa"
      },
      ...expenseCategories.map((cat, idx) => ({
        id: `despesa_${cat.id}`,
        code: `6.${idx + 1}`,
        name: cat.name,
        currentValue: -cat.currentValue,
        previousValue: -cat.previousValue,
        type: "item" as const,
        categoryType: "despesa" as const,
        indent: 1,
        isClickable: true,
        chartAccountId: cat.id,
      })),
      {
        id: "resultado_operacional",
        code: "7",
        name: "(=) RESULTADO OPERACIONAL (EBIT)",
        currentValue: currentNetResult,
        previousValue: previousNetResult,
        type: "subtotal",
        indent: 0
      },
      {
        id: "resultado_liquido",
        code: "8",
        name: "(=) RESULTADO LÍQUIDO DO EXERCÍCIO",
        currentValue: currentNetResult,
        previousValue: previousNetResult,
        type: "total",
        indent: 0
      },
    ];

    const summaryData: DRESummary = {
      grossRevenue: totalCurrentRevenue,
      deductions: 0,
      netRevenue: totalCurrentRevenue,
      costs: totalCurrentCosts,
      grossProfit: currentGrossProfit,
      operationalExpenses: totalCurrentExpenses,
      administrativeExpenses: 0,
      commercialExpenses: 0,
      financialExpenses: 0,
      operationalResult: currentNetResult,
      netResult: currentNetResult,
      previousGrossRevenue: totalPreviousRevenue,
      previousCosts: totalPreviousCosts,
      previousOperationalExpenses: totalPreviousExpenses,
      previousNetResult: previousNetResult,
    };

    return { dreLines: lines, summary: summaryData };
  }, [revenueData, costData, expenseData, categories]);

  // Calculate indicators
  const indicators = useMemo((): DREIndicators => {
    const safeDiv = (num: number, den: number): number =>
      den === 0 ? 0 : (num / den) * 100;

    return {
      grossMargin: safeDiv(summary.grossProfit, summary.netRevenue),
      operationalMargin: safeDiv(summary.operationalResult, summary.netRevenue),
      netMargin: safeDiv(summary.netResult, summary.netRevenue),
      ebitda: summary.operationalResult,
      previousGrossMargin: safeDiv(summary.previousGrossRevenue - summary.previousCosts, summary.previousGrossRevenue),
      previousOperationalMargin: safeDiv(summary.previousNetResult, summary.previousGrossRevenue),
      previousNetMargin: safeDiv(summary.previousNetResult, summary.previousGrossRevenue),
      previousEbitda: summary.previousNetResult,
    };
  }, [summary]);

  return {
    dreLines,
    summary,
    indicators,
    categories,
    isLoading,
    periodDates,
    formatCurrency: formatCurrencyFn,
    formatPercent: formatPercentFn,
  };
}
