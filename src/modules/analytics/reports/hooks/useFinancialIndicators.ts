'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FINANCIAL_INDICATORS_KEYS, STALE_TIMES, GC_TIMES } from '@/lib/queryKeys';
import { differenceInDays, parseISO, format, startOfMonth, endOfMonth, subMonths, differenceInCalendarDays } from 'date-fns';
import { DateRange } from '@/lib/periodUtils';

interface PaymentWithReceivable {
  payment_date: string;
  amount: number;
  receivable_id: string;
  receivables: { issue_date: string | null; due_date: string | null; created_at: string; total_amount: number } | null;
}

interface PaymentWithPayable {
  payment_date: string;
  amount: number;
  payable_id: string;
  payables: { issue_date: string | null; due_date: string | null; created_at: string; total_amount: number } | null;
}

interface PendingItem {
  total_amount: number;
  paid_amount: number;
}

export interface FinancialIndicatorsResult {
  pmr: number;
  pmp: number;
  capitalDeGiro: number;
  totalReceivablesPending: number;
  totalPayablesPending: number;
  pmrCount: number;
  pmpCount: number;
  breakEvenPoint: number;
  totalFixedCosts: number;
  totalVariableCosts: number;
  totalRevenue: number;
  contributionMarginRatio: number;
  isLoading: boolean;
  hasData: boolean;
}

interface ExpenseRecord {
  amount: number;
  chart_accounts: {
    cost_type: 'fixed' | 'variable';
  } | null;
}

interface RevenueRecord {
  amount: number;
}

// ─── Fetch Functions ────────────────────────────────

async function fetchPmrItems(companyId: string, dateRange?: DateRange) {
  const startDate = dateRange?.start || format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const endDate = dateRange?.end || format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('receivables')
    .select('due_date, total_amount, paid_amount')
    .eq('company_id', companyId)
    .in('status', ['pendente', 'parcial'])
    .gte('due_date', startDate)
    .lte('due_date', endDate);

  if (error) throw error;
  return data ?? [];
}

async function fetchPmpItems(companyId: string, dateRange?: DateRange) {
  const startDate = dateRange?.start || format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const endDate = dateRange?.end || format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('payables')
    .select('due_date, total_amount, paid_amount')
    .eq('company_id', companyId)
    .in('status', ['pendente', 'parcial'])
    .gte('due_date', startDate)
    .lte('due_date', endDate);

  if (error) throw error;
  return data ?? [];
}

async function fetchPendingReceivables(companyId: string): Promise<PendingItem[]> {
  const { data, error } = await supabase
    .from('receivables')
    .select('total_amount, paid_amount')
    .eq('company_id', companyId)
    .in('status', ['pendente', 'parcial']);

  if (error) throw error;
  return (data ?? []) as PendingItem[];
}

async function fetchPendingPayables(companyId: string): Promise<PendingItem[]> {
  const { data, error } = await supabase
    .from('payables')
    .select('total_amount, paid_amount')
    .eq('company_id', companyId)
    .in('status', ['pendente', 'parcial']);

  if (error) throw error;
  return (data ?? []) as PendingItem[];
}

async function fetchExpenses(companyId: string, dateRange?: DateRange): Promise<ExpenseRecord[]> {
  const startDate = dateRange?.start || format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const endDate = dateRange?.end || format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const { data, error } = await (supabase
    .from('transactions')
    .select(`amount, chart_accounts(cost_type)`)
    .eq('company_id', companyId)
    .eq('type', 'saida')
    .eq('is_deleted', false) as any)
    .eq('status', 'completed')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate);

  if (error) throw error;
  return (data || []) as unknown as ExpenseRecord[];
}

async function fetchRevenue(companyId: string, dateRange?: DateRange): Promise<RevenueRecord[]> {
  const startDate = dateRange?.start || format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const endDate = dateRange?.end || format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const { data, error } = await (supabase
    .from('transactions')
    .select(`amount`)
    .eq('company_id', companyId)
    .eq('type', 'entrada')
    .eq('is_deleted', false) as any)
    .eq('status', 'completed')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate);

  if (error) throw error;
  return (data || []) as RevenueRecord[];
}

// ─── Hook ───────────────────────────────────────────

export function useFinancialIndicators(companyId: string | null | undefined, dateRange?: DateRange): FinancialIndicatorsResult {
  const enabled = !!companyId;

  const pmrQuery = useQuery({
    queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'pmr', dateRange?.start, dateRange?.end] : ['disabled'],
    queryFn: () => fetchPmrItems(companyId!, dateRange),
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  const pmpQuery = useQuery({
    queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'pmp', dateRange?.start, dateRange?.end] : ['disabled'],
    queryFn: () => fetchPmpItems(companyId!, dateRange),
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  const pendingReceivablesQuery = useQuery({
    queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'pending-receivables'] : ['disabled'],
    queryFn: () => fetchPendingReceivables(companyId!),
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  const pendingPayablesQuery = useQuery({
    queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'pending-payables'] : ['disabled'],
    queryFn: () => fetchPendingPayables(companyId!),
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  const expensesQuery = useQuery({
    queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'expenses', dateRange?.start, dateRange?.end] : ['disabled'],
    queryFn: () => fetchExpenses(companyId!, dateRange),
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  const revenueQuery = useQuery({
    queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'revenue', dateRange?.start, dateRange?.end] : ['disabled'],
    queryFn: () => fetchRevenue(companyId!, dateRange),
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  // Calcular indicadores
  const result = useMemo((): Omit<FinancialIndicatorsResult, 'isLoading'> => {
    const pmrRecords = pmrQuery.data ?? [];
    const pmpRecords = pmpQuery.data ?? [];
    const pendingReceivables = pendingReceivablesQuery.data ?? [];
    const pendingPayables = pendingPayablesQuery.data ?? [];
    const expenseRecords = expensesQuery.data ?? [];
    const revenueRecords = revenueQuery.data ?? [];

    // PMR logic matching Dashboard: average days until due date for open/partial receivables
    const pmrItems = pmrQuery.data ?? [];
    let pmr = 0;
    let pmrCount = pmrItems.length;
    if (pmrCount > 0) {
      const totalDays = pmrItems.reduce((sum, r) =>
        sum + Math.abs(differenceInCalendarDays(new Date(r.due_date), new Date())), 0);
      pmr = Math.round(totalDays / pmrCount);
    }

    // PMP logic matching Dashboard: average days until due date for open/partial payables
    const pmpItems = pmpQuery.data ?? [];
    let pmp = 0;
    let pmpCount = pmpItems.length;
    if (pmpCount > 0) {
      const totalDays = pmpItems.reduce((sum, p) =>
        sum + Math.abs(differenceInCalendarDays(new Date(p.due_date), new Date())), 0);
      pmp = Math.round(totalDays / pmpCount);
    }

    // Capital de Giro
    const totalReceivablesPending = pendingReceivables.reduce(
      (sum, r) => sum + (Number(r.total_amount) - Number(r.paid_amount)), 0
    );
    const totalPayablesPending = pendingPayables.reduce(
      (sum, p) => sum + (Number(p.total_amount) - Number(p.paid_amount)), 0
    );
    const capitalDeGiro = totalReceivablesPending - totalPayablesPending;

    // Break-even Point
    const totalRevenue = revenueRecords.reduce((sum, r) => sum + Number(r.amount), 0);

    let totalFixedCosts = 0;
    let totalVariableCosts = 0;

    expenseRecords.forEach((record) => {
      const amount = Number(record.amount);
      const costType = record.chart_accounts?.cost_type;
      if (costType === 'fixed') {
        totalFixedCosts += amount;
      } else {
        totalVariableCosts += amount;
      }
    });

    const contributionMargin = totalRevenue - totalVariableCosts;
    const contributionMarginRatio = totalRevenue > 0 ? contributionMargin / totalRevenue : 0;

    let breakEvenPoint = 0;
    if (contributionMarginRatio > 0) {
      breakEvenPoint = totalFixedCosts / contributionMarginRatio;
    }

    const hasData = pmrCount > 0 || pmpCount > 0 || pendingReceivables.length > 0 || pendingPayables.length > 0 || expenseRecords.length > 0;

    return {
      pmr, pmp, capitalDeGiro, totalReceivablesPending, totalPayablesPending,
      pmrCount, pmpCount, breakEvenPoint, totalFixedCosts, totalVariableCosts,
      totalRevenue, contributionMarginRatio, hasData,
    };
  }, [pmrQuery.data, pmpQuery.data, pendingReceivablesQuery.data, pendingPayablesQuery.data, expensesQuery.data, revenueQuery.data]);

  const isLoading = pmrQuery.isLoading || pmpQuery.isLoading ||
    pendingReceivablesQuery.isLoading || pendingPayablesQuery.isLoading || expensesQuery.isLoading || revenueQuery.isLoading;

  return { ...result, isLoading };
}
