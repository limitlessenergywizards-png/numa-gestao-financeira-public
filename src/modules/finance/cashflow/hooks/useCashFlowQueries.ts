'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/queryKeys';
import {
  eachDayOfInterval,
  parseISO,
  format,
  getWeek
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  DetailedTransaction,
  DailyDetail,
  WeeklyData,
  MonthlyData,
  MonthlyCategory,
  BankAccount
} from '../components/CashFlowTypes';

// ============================================
// TYPES
// ============================================

export interface CashFlowFilters {
  startDate: string;
  endDate: string;
  bankAccountId: string;
  viewType: 'realizado' | 'projetado' | 'ambos';
  nature: 'all' | 'realizado' | 'previsao';
}

interface ChartAccount {
  id: string;
  code: string;
  name: string;
}

// ============================================
// QUERY FUNCTIONS (isoladas para testabilidade)
// ============================================

async function fetchBankAccounts(companyId: string, signal?: AbortSignal): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('id, name, current_balance, initial_balance')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')
    .abortSignal(signal!);

  if (error) throw error;
  return data || [];
}

// Fetch realized transactions via RPC (consolidated query)
async function fetchCashFlowRealized(
  companyId: string,
  filters: CashFlowFilters,
  signal?: AbortSignal
): Promise<Record<string, unknown>[]> {
  const params: Record<string, unknown> = {
    p_company_id: companyId,
    p_start_date: filters.startDate,
    p_end_date: filters.endDate,
  };
  if (filters.bankAccountId !== 'all') {
    params.p_bank_account_id = filters.bankAccountId;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.rpc('get_cashflow_realized', params as any).abortSignal(signal!);

  if (error) throw error;
  return data || [];
}

// Fetch projected transactions via RPC (consolidated query)
async function fetchCashFlowProjected(
  companyId: string,
  filters: CashFlowFilters,
  signal?: AbortSignal
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .rpc('get_cashflow_projected', {
      p_company_id: companyId,
      p_start_date: filters.startDate,
      p_end_date: filters.endDate,
    })
    .abortSignal(signal!);

  if (error) throw error;
  return data || [];
}

async function fetchTransactions(
  companyId: string,
  filters: CashFlowFilters,
  signal?: AbortSignal
): Promise<DetailedTransaction[]> {
  const transactions: DetailedTransaction[] = [];
  const { viewType, nature } = filters;

  // OPTIMIZATION: Run both RPC calls in parallel via Promise.all
  const [realizedData, projectedData] = await Promise.all([
    viewType === 'realizado' || viewType === 'ambos'
      ? fetchCashFlowRealized(companyId, filters, signal)
      : Promise.resolve([]),
    viewType === 'projetado' || viewType === 'ambos'
      ? fetchCashFlowProjected(companyId, filters, signal)
      : Promise.resolve([]),
  ]);

  // Process realized transactions
  if (realizedData.length > 0) {
    const paidReceivableIds = new Set<string>();
    const paidPayableIds = new Set<string>();

    // First pass: collect IDs of receivables/payables that have payment records
    realizedData
      .filter((r: Record<string, unknown>) => r.source === 'receivable_payment')
      .forEach((r: Record<string, unknown>) => {
        if (r.forecast_basis) paidReceivableIds.add(r.forecast_basis as string);
      });

    realizedData
      .filter((r: Record<string, unknown>) => r.source === 'payable_payment')
      .forEach((r: Record<string, unknown>) => {
        if (r.forecast_basis) paidPayableIds.add(r.forecast_basis as string);
      });

    // Second pass: Build DetailedTransaction array (includes deduplication logic)
    realizedData
      .filter((r: Record<string, unknown>) => {
        // Include non-transaction sources (receivable_payment, payable_payment)
        if (r.source !== 'transaction') return true;
        // Exclude forecast transactions unless nature filter allows
        if (r.nature !== 'realizado') return false;
        // Exclude regular transactions if they're covered by payment records
        const forecastBasis = r.forecast_basis as string | undefined;
        if (forecastBasis?.startsWith('receivable:')) {
          const id = forecastBasis.replace('receivable:', '');
          return !paidReceivableIds.has(id);
        }
        if (forecastBasis?.startsWith('payable:')) {
          const id = forecastBasis.replace('payable:', '');
          return !paidPayableIds.has(id);
        }
        return true;
      })
      .forEach((r: Record<string, unknown>) => {
        transactions.push({
          id: String(r.id),
          date: r.entry_date as string,
          description: r.description as string,
          category: r.category_name as string,
          categoryCode: r.category_code as string,
          type: r.entry_type as 'entrada' | 'saida',
          amount: Number(r.amount),
          source: r.source as DetailedTransaction['source'],
          isProjected: false,
        });
      });
  }

  // Process projected transactions
  if (projectedData.length > 0) {
    projectedData.forEach((r: Record<string, unknown>) => {
      transactions.push({
        id: String(r.id),
        date: r.entry_date as string,
        description: r.description as string,
        category: r.category_name as string,
        categoryCode: r.category_code as string,
        type: r.entry_type as 'entrada' | 'saida',
        amount: Number(r.amount),
        source: r.source as DetailedTransaction['source'],
        isProjected: true,
      });
    });
  }

  // Sort by date
  transactions.sort((a, b) => a.date.localeCompare(b.date));
  return transactions;
}

// ============================================
// DATA TRANSFORMATION UTILS (pure functions)
// ============================================

export function buildDailyData(
  transactions: DetailedTransaction[],
  startDate: string,
  endDate: string,
  saldoInicial: number
): DailyDetail[] {
  // Pre-group transactions by date — O(N) instead of O(days × N)
  const txByDate = new Map<string, DetailedTransaction[]>();
  for (const tx of transactions) {
    const existing = txByDate.get(tx.date);
    if (existing) existing.push(tx);
    else txByDate.set(tx.date, [tx]);
  }

  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  let runningBalance = saldoInicial;

  return days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayTransactions = txByDate.get(dateStr) || [];

    const entradas = dayTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);
    const saidas = dayTransactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + t.amount, 0);
    const saldo = entradas - saidas;
    runningBalance += saldo;

    return {
      date: dateStr,
      transactions: dayTransactions,
      entradas,
      saidas,
      saldo,
      saldoAcumulado: runningBalance,
    };
  });
}

export function buildWeeklyData(
  dailyData: DailyDetail[],
  saldoInicial: number
): WeeklyData[] {
  const weekMap = new Map<number, DailyDetail[]>();

  dailyData.forEach(day => {
    const weekNum = getWeek(parseISO(day.date), { locale: ptBR });
    if (!weekMap.has(weekNum)) {
      weekMap.set(weekNum, []);
    }
    weekMap.get(weekNum)!.push(day);
  });

  let prevBalance = saldoInicial;
  const weeks: WeeklyData[] = [];

  Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([weekNum, days]) => {
      const entradas = days.reduce((sum, d) => sum + d.entradas, 0);
      const saidas = days.reduce((sum, d) => sum + d.saidas, 0);
      const saldoFinal = prevBalance + entradas - saidas;

      weeks.push({
        weekNumber: weekNum,
        weekLabel: `Semana ${weekNum}`,
        startDate: days[0].date,
        endDate: days[days.length - 1].date,
        saldoInicial: prevBalance,
        entradas,
        saidas,
        saldoFinal,
        days,
      });

      prevBalance = saldoFinal;
    });

  return weeks;
}

function groupByCategory(txs: DetailedTransaction[]): MonthlyCategory[] {
  const categoryMap = new Map<string, {
    code: string;
    name: string;
    total: number;
    transactions: DetailedTransaction[]
  }>();

  txs.forEach(tx => {
    const key = tx.categoryCode || 'SEM_CATEGORIA';
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        code: tx.categoryCode || '0',
        name: tx.category || 'Sem Categoria',
        total: 0,
        transactions: [],
      });
    }
    const cat = categoryMap.get(key)!;
    cat.total += tx.amount;
    cat.transactions.push(tx);
  });

  return Array.from(categoryMap.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export function buildMonthlyData(
  transactions: DetailedTransaction[],
  saldoInicial: number
): MonthlyData {
  const entradas = transactions.filter(t => t.type === 'entrada');
  const saidas = transactions.filter(t => t.type === 'saida');

  const totalEntradas = entradas.reduce((sum, t) => sum + t.amount, 0);
  const totalSaidas = saidas.reduce((sum, t) => sum + t.amount, 0);

  return {
    saldoInicial,
    entradas: totalEntradas,
    saidas: totalSaidas,
    saldoOperacional: totalEntradas - totalSaidas,
    saldoFinal: saldoInicial + totalEntradas - totalSaidas,
    entradasByCategory: groupByCategory(entradas),
    saidasByCategory: groupByCategory(saidas),
  };
}

// ============================================
// MAIN HOOK
// ============================================

const DEFAULT_MONTHLY: MonthlyData = {
  saldoInicial: 0,
  entradas: 0,
  saidas: 0,
  saldoOperacional: 0,
  saldoFinal: 0,
  entradasByCategory: [],
  saidasByCategory: [],
};

export function useCashFlowQueries(
  companyId: string | undefined,
  filters: CashFlowFilters,
  activeTab?: string
) {
  // Query 1: Bank accounts
  const bankAccountsQuery = useQuery({
    queryKey: ['cashflow', 'bank-accounts', companyId],
    queryFn: ({ signal }) => fetchBankAccounts(companyId!, signal),
    enabled: !!companyId,
    staleTime: STALE_TIMES.FINANCIAL, // 30 seconds
    gcTime: 30 * 60 * 1000,   // 30 minutes (formerly cacheTime)
  });

  // Query 2: Transactions (main data)
  const transactionsQuery = useQuery({
    queryKey: ['cashflow', 'transactions', companyId, filters],
    queryFn: ({ signal }) => fetchTransactions(companyId!, filters, signal),
    enabled: !!companyId,
    staleTime: 30 * 1000,     // 30 seconds - data changes frequently
    gcTime: 5 * 60 * 1000,    // 5 minutes
  });

  // Calculate initial balance based on selected bank account
  const saldoInicial = useMemo(() => {
    const accounts = bankAccountsQuery.data || [];
    if (filters.bankAccountId === 'all') {
      return accounts.reduce((sum, acc) => sum + Number(acc.initial_balance), 0);
    }
    const account = accounts.find(a => a.id === filters.bankAccountId);
    return account ? Number(account.initial_balance) : 0;
  }, [bankAccountsQuery.data, filters.bankAccountId]);

  // Derived data - memoized with precise dependencies
  const dailyData = useMemo(() => {
    if (!transactionsQuery.data) return [];
    return buildDailyData(
      transactionsQuery.data,
      filters.startDate,
      filters.endDate,
      saldoInicial
    );
  }, [transactionsQuery.data, filters.startDate, filters.endDate, saldoInicial]);

  // Deferred: only compute when semanal/matriz tab is active
  const weeklyData = useMemo(() => {
    if (activeTab && activeTab !== 'semanal' && activeTab !== 'matriz') return [];
    return buildWeeklyData(dailyData, saldoInicial);
  }, [dailyData, saldoInicial, activeTab]);

  // Deferred: only compute when mensal tab is active
  const monthlyData = useMemo(() => {
    if (activeTab && activeTab !== 'mensal') return DEFAULT_MONTHLY;
    if (!transactionsQuery.data) return DEFAULT_MONTHLY;
    return buildMonthlyData(transactionsQuery.data, saldoInicial);
  }, [transactionsQuery.data, saldoInicial, activeTab]);

  // Totals
  const totals = useMemo(() => {
    const transactions = transactionsQuery.data || [];
    const totalEntradas = transactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalSaidas = transactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      entradas: totalEntradas,
      saidas: totalSaidas,
      saldo: totalEntradas - totalSaidas,
    };
  }, [transactionsQuery.data]);

  return {
    // Raw data
    bankAccounts: bankAccountsQuery.data ?? [],
    transactions: transactionsQuery.data ?? [],

    // Computed data
    dailyData,
    weeklyData,
    monthlyData,
    totals,
    saldoInicial,

    // Loading states
    isLoading: bankAccountsQuery.isLoading || transactionsQuery.isLoading,
    isFetching: bankAccountsQuery.isFetching || transactionsQuery.isFetching,

    // Errors
    error: bankAccountsQuery.error || transactionsQuery.error,

    // Refetch
    refetch: () => {
      bankAccountsQuery.refetch();
      transactionsQuery.refetch();
    },
  };
}
