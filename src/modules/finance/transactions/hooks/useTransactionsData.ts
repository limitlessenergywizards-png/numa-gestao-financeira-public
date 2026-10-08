'use client';

/**
 * useTransactionsData Hook
 * 
 * Hook centralizado para gerenciamento de dados de transações.
 * Usa AbortController para prevenir race conditions e otimiza re-renders.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyState } from '@/contexts/CompanyContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useSafeState } from '@/hooks/useSafeState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TIMING } from '@/lib/config';
import { getErrorMessage, isAbortError } from '@/lib/errorUtils';
import { BANK_ACCOUNTS_KEYS, CHART_ACCOUNTS_KEYS, CUSTOMERS_KEYS, SUPPLIERS_KEYS, STALE_TIMES, GC_TIMES } from '@/lib/queryKeys';
import { toast } from 'sonner';

// ============================================
// CACHED SUPPORTING DATA FETCH FUNCTIONS
// ============================================

async function fetchBankAccountsCached(companyId: string, signal?: AbortSignal): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('id, name, current_balance')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')
    .abortSignal(signal!);
  if (error) throw error;
  return (data || []) as BankAccount[];
}

async function fetchChartAccountsCached(companyId: string, signal?: AbortSignal): Promise<ChartAccount[]> {
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('id, name, code, type')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('code')
    .abortSignal(signal!);
  if (error) throw error;
  return (data || []) as ChartAccount[];
}

async function fetchCustomersCached(companyId: string, signal?: AbortSignal): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('id, company_id, name, document, email, phone')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')
    .abortSignal(signal!);
  if (error) throw error;
  return (data || []) as Customer[];
}

async function fetchSuppliersCached(companyId: string, signal?: AbortSignal): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, company_id, name, document, email, phone, category')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')
    .abortSignal(signal!);
  if (error) throw error;
  return (data || []) as Supplier[];
}

async function fetchCategoriesCached(companyId: string, signal?: AbortSignal): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, type, color, icon')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')
    .abortSignal(signal!);
  if (error) throw error;
  return (data || []) as Category[];
}

// Types
export type TransactionType = 'entrada' | 'saida';
export type StatusFilter = 'all' | 'reconciled' | 'pending';
export type TypeFilter = 'all' | 'entrada' | 'saida';
export type NatureFilter = 'all' | 'realizado' | 'previsao';
export type ForecastTypeFilter = 'all' | 'estimativa' | 'orcamento' | 'simulacao';
export type QuickFilter = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'semester' | 'year';

export interface Transaction {
  id: string;
  company_id: string;
  bank_account_id: string;
  chart_account_id: string | null;
  category_id: string | null;
  customer_id: string | null;
  supplier_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  transaction_date: string;
  document_number: string | null;
  notes: string | null;
  payment_method: string | null;
  reconciled: boolean;
  reconciled_at: string | null;
  recurrence: string | null;
  created_at: string;
  original_transaction_date: string | null;
  original_created_at: string | null;
  // Forecast fields
  nature: string;
  forecast_type: string | null;
  forecast_confidence: number | null;
  forecast_basis: string | null;
  forecast_notes: string | null;
  linked_forecast_id: string | null;
  converted_at: string | null;
  converted_by: string | null;
  is_debt_payment?: boolean;
  // Relationships
  bank_account?: { name: string };
  chart_account?: { name: string; code: string } | null;
  category?: { name: string } | null;
  customer?: { name: string } | null;
  supplier?: { name: string } | null;
  running_balance?: number;
}

export interface BankAccount {
  id: string;
  name: string;
  current_balance: number;
}

export interface ChartAccount {
  id: string;
  name: string;
  code: string;
  type: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
}

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

interface TransactionsFiltersInternal {
  searchTerm: string;
  selectedBankId: string | null;
  selectedCategoryId: string | null;
  selectedChartAccountId: string | null;
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
  natureFilter: NatureFilter;
  forecastTypeFilter: ForecastTypeFilter;
  quickFilter: QuickFilter;
}

// Exported type keeps startDate/endDate for backward compatibility
export interface TransactionsFilters extends TransactionsFiltersInternal {
  startDate?: Date;
  endDate?: Date;
}

interface TransactionsTotals {
  entradas: number;
  saidas: number;
  saldo: number;
  pendingCount: number;
  pendingAmount: number;
  entradasCount: number;
  saidasCount: number;
  totalCount: number;
}

const ITEMS_PER_PAGE = 50;

export function useTransactionsData() {
  const { currentCompany } = useCompanyState();
  const queryClient = useQueryClient();
  const companyId = currentCompany?.id;

  // ============================================
  // CACHED SUPPORTING DATA (React Query)
  // These queries are shared across pages and cached for 30 minutes.
  // Navigating between Transactions → Payables → Transactions = ZERO refetch.
  // ============================================
  const { data: bankAccounts = [] } = useQuery({
    queryKey: companyId ? BANK_ACCOUNTS_KEYS.list(companyId, false) : ['disabled'],
    queryFn: ({ signal }) => fetchBankAccountsCached(companyId!, signal),
    enabled: !!companyId,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  const { data: chartAccounts = [] } = useQuery({
    queryKey: companyId ? CHART_ACCOUNTS_KEYS.list(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchChartAccountsCached(companyId!, signal),
    enabled: !!companyId,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  const { data: customers = [] } = useQuery({
    queryKey: companyId ? CUSTOMERS_KEYS.active(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchCustomersCached(companyId!, signal),
    enabled: !!companyId,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: companyId ? SUPPLIERS_KEYS.active(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchSuppliersCached(companyId!, signal),
    enabled: !!companyId,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  const { data: categories = [] } = useQuery({
    queryKey: companyId ? ['categories', 'active', companyId] : ['disabled'],
    queryFn: ({ signal }) => fetchCategoriesCached(companyId!, signal),
    enabled: !!companyId,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  // Transaction data state (fetched imperatively due to complex filter logic)
  const [transactions, setTransactions] = useSafeState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useSafeState(true);

  // Filter states (dates managed separately via useMemo)
  const [filters, setFilters] = useLocalStorage<TransactionsFiltersInternal>(
    'numa_transactions_filters',
    {
      searchTerm: '',
      selectedBankId: null,
      selectedCategoryId: null,
      selectedChartAccountId: null,
      statusFilter: 'all',
      typeFilter: 'all',
      natureFilter: 'all',
      forecastTypeFilter: 'all',
      quickFilter: 'month',
    }
  );

  // Custom date range for manual date picker overrides
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Abort controller ref
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchIdRef = useRef(0);

  // Debounced search
  const debouncedSearch = useDebounce(filters.searchTerm, TIMING.DEBOUNCE_DELAY);

  // Derive date range synchronously from quickFilter (no cascade)
  const dateRange = useMemo<{ start: Date | undefined; end: Date | undefined }>(() => {
    if (customDateRange) return customDateRange;

    const now = new Date();
    switch (filters.quickFilter) {
      case 'all':
        return { start: undefined, end: undefined };
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case 'quarter': {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        const qStart = new Date(now.getFullYear(), qMonth, 1);
        const qEnd = new Date(now.getFullYear(), qMonth + 3, 0);
        return { start: startOfDay(qStart), end: endOfDay(qEnd) };
      }
      case 'semester': {
        const sMonth = now.getMonth() < 6 ? 0 : 6;
        const sStart = new Date(now.getFullYear(), sMonth, 1);
        const sEnd = new Date(now.getFullYear(), sMonth + 6, 0);
        return { start: startOfDay(sStart), end: endOfDay(sEnd) };
      }
      case 'year':
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
      case 'month':
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [filters.quickFilter, customDateRange]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters.selectedBankId, filters.selectedCategoryId, filters.selectedChartAccountId, filters.statusFilter, filters.typeFilter, filters.natureFilter, filters.forecastTypeFilter]);

  // Fetch data with abort controller (must be declared before useEffects that reference it)
  const fetchData = useStableCallback(async () => {
    if (!currentCompany) return;

    // Cancel previous request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentFetchId = ++fetchIdRef.current;

    setIsLoading(true);

    try {
      // Fetch transactions with EXPLICIT columns (no SELECT *)
      let txQuery = supabase
        .from('transactions')
        .select(`
          id, company_id, bank_account_id, chart_account_id, category_id,
          customer_id, supplier_id, type, amount, description,
          transaction_date, document_number, notes, payment_method,
          reconciled, reconciled_at, recurrence, created_at,
          original_transaction_date, original_created_at,
          nature, forecast_type, forecast_confidence, forecast_basis,
          forecast_notes, linked_forecast_id, converted_at, converted_by,
          is_debt_payment,
          bank_account:bank_accounts(name),
          chart_account:chart_of_accounts(name, code),
          category:categories(name),
          customer:customers(name),
          supplier:suppliers(name)
        `)
        .eq('company_id', currentCompany.id)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (dateRange.start) {
        txQuery = txQuery.gte('transaction_date', format(dateRange.start, 'yyyy-MM-dd'));
      }
      if (dateRange.end) {
        txQuery = txQuery.lte('transaction_date', format(dateRange.end, 'yyyy-MM-dd'));
      }

      // Apply nature filter
      if (filters.natureFilter !== 'all') {
        txQuery = txQuery.eq('nature', filters.natureFilter);
      }

      // Hide converted forecasts to avoid duplicates in view
      txQuery = txQuery.neq('nature', 'convertido');

      const { data: transactionsData, error: transactionsError } = await txQuery
        .abortSignal(controller.signal);

      if (transactionsError) throw transactionsError;

      // Only update if this is still the latest request
      if (currentFetchId !== fetchIdRef.current) return;

      setTransactions((transactionsData || []).map(t => ({
        ...t,
        reconciled: t.reconciled ?? false,
        reconciled_at: t.reconciled_at ?? null,
        recurrence: t.recurrence ?? null,
        category_id: t.category_id ?? null,
        nature: t.nature ?? 'realizado',
      })));

      // Supporting data (banks, customers, suppliers, categories, chart_accounts)
      // is now fetched via React Query hooks above with 30-min caching.
      // No more re-fetch on every filter change! 🚀

    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) {
        return; // Silently ignore abort errors
      }
      toast.error('Erro ao carregar dados: ' + getErrorMessage(error));
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  });

  // Subscribe to queryClient cache events to refetch when BackgroundServices invalidates transactions
  // This replaces the duplicate Realtime subscription that was in TransactionsPage
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.action.type === 'invalidate' &&
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey[0] === 'transactions'
      ) {
        // Only refetch if we have a current company (i.e., data is loaded)
        if (currentCompany) {
          fetchData();
        }
      }
    });
    return unsubscribe;
  }, [currentCompany, queryClient, fetchData]);

  // Fetch when company or date range changes
  useEffect(() => {
    if (currentCompany) {
      fetchData();
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [currentCompany, dateRange, filters.natureFilter, fetchData]);

  // Filtered transactions (memoized)
  const filteredTransactions = useMemo(() => {
    // 1. Calculate true chronological running balances
    const balancesById: Record<string, number> = {};
    const rollingBalance = filters.selectedBankId
      ? (bankAccounts.find(b => b.id === filters.selectedBankId)?.current_balance || 0)
      : bankAccounts.reduce((sum, b) => sum + b.current_balance, 0);

    const sumOfRealizados = transactions
      .filter(t => t.nature === 'realizado')
      .reduce((sum, t) => sum + (t.type === 'entrada' ? Number(t.amount) : -Number(t.amount)), 0);

    let runningBalance = rollingBalance - sumOfRealizados;

    const reversedTransactions = [...transactions].reverse();
    for (const t of reversedTransactions) {
      runningBalance += (t.type === 'entrada' ? Number(t.amount) : -Number(t.amount));
      balancesById[t.id] = runningBalance;
    }

    // 2. Apply filters
    let filtered = transactions.map(t => ({ ...t, running_balance: balancesById[t.id] }));

    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(search) ||
        t.document_number?.toLowerCase().includes(search) ||
        t.notes?.toLowerCase().includes(search)
      );
    }

    // Bank filter
    if (filters.selectedBankId) {
      filtered = filtered.filter(t => t.bank_account_id === filters.selectedBankId);
    }

    // Category filter
    if (filters.selectedCategoryId) {
      filtered = filtered.filter(t => t.category_id === filters.selectedCategoryId);
    }

    // Chart account filter
    if (filters.selectedChartAccountId) {
      filtered = filtered.filter(t => t.chart_account_id === filters.selectedChartAccountId);
    }

    // Status filter
    if (filters.statusFilter === 'reconciled') {
      filtered = filtered.filter(t => t.reconciled);
    } else if (filters.statusFilter === 'pending') {
      filtered = filtered.filter(t => !t.reconciled);
    }

    // Type filter
    if (filters.typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === filters.typeFilter);
    }

    // Nature filter
    if (filters.natureFilter !== 'all') {
      filtered = filtered.filter(t => t.nature === filters.natureFilter);
    }

    // Forecast type filter
    if (filters.forecastTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.forecast_type === filters.forecastTypeFilter);
    }

    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, debouncedSearch, filters.selectedBankId, filters.selectedCategoryId, filters.selectedChartAccountId, filters.statusFilter, filters.typeFilter, filters.natureFilter, filters.forecastTypeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Calculate totals
  const totals = useMemo<TransactionsTotals>(() => {
    const entradasTxs = filteredTransactions.filter(t => t.type === 'entrada');
    const saidasTxs = filteredTransactions.filter(t => t.type === 'saida');

    const entradas = entradasTxs.reduce((sum, t) => sum + Number(t.amount), 0);
    const saidas = saidasTxs.reduce((sum, t) => sum + Number(t.amount), 0);

    const pending = filteredTransactions.filter(t => !t.reconciled);
    const pendingAmount = pending.reduce((sum, t) => {
      const amount = Number(t.amount);
      return sum + (t.type === 'entrada' ? amount : -amount);
    }, 0);

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      pendingCount: pending.length,
      pendingAmount: Math.abs(pendingAmount),
      entradasCount: entradasTxs.length,
      saidasCount: saidasTxs.length,
      totalCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.searchTerm !== '' ||
      filters.selectedBankId !== null ||
      filters.selectedCategoryId !== null ||
      filters.selectedChartAccountId !== null ||
      filters.statusFilter !== 'all' ||
      filters.typeFilter !== 'all' ||
      filters.natureFilter !== 'all' ||
      filters.forecastTypeFilter !== 'all';
  }, [filters]);

  /* eslint-disable react-hooks/exhaustive-deps */
  // Filter setters — setFilters is a stable useState setter, safe to omit from deps
  const setSearchTerm = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  }, []);

  const setSelectedBankId = useCallback((value: string | null) => {
    setFilters(prev => ({ ...prev, selectedBankId: value }));
  }, []);

  const setSelectedCategoryId = useCallback((value: string | null) => {
    setFilters(prev => ({ ...prev, selectedCategoryId: value }));
  }, []);

  const setSelectedChartAccountId = useCallback((value: string | null) => {
    setFilters(prev => ({ ...prev, selectedChartAccountId: value }));
  }, []);

  const setStatusFilter = useCallback((value: StatusFilter) => {
    setFilters(prev => ({ ...prev, statusFilter: value }));
  }, []);

  const setTypeFilter = useCallback((value: TypeFilter) => {
    setFilters(prev => ({ ...prev, typeFilter: value }));
  }, []);

  const setQuickFilter = useCallback((value: QuickFilter) => {
    setCustomDateRange(null); // Clear custom override
    setFilters(prev => ({ ...prev, quickFilter: value }));
  }, []);

  const setStartDate = useCallback((value: Date) => {
    setCustomDateRange(prev => ({ start: value, end: prev?.end ?? (dateRange.end || value) }));
  }, [dateRange.end]);

  const setEndDate = useCallback((value: Date) => {
    setCustomDateRange(prev => ({ start: prev?.start ?? (dateRange.start || value), end: value }));
  }, [dateRange.start]);

  const setNatureFilter = useCallback((value: NatureFilter) => {
    setFilters(prev => ({ ...prev, natureFilter: value }));
  }, []);

  const setForecastTypeFilter = useCallback((value: ForecastTypeFilter) => {
    setFilters(prev => ({ ...prev, forecastTypeFilter: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setCustomDateRange(null);
    setFilters(prev => ({
      ...prev,
      searchTerm: '',
      selectedBankId: null,
      selectedCategoryId: null,
      selectedChartAccountId: null,
      statusFilter: 'all',
      typeFilter: 'all',
      natureFilter: 'all',
      forecastTypeFilter: 'all',
      quickFilter: 'all',
    }));
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Add to lists (for quick-add dialogs) — update React Query cache directly + invalidate
  const addCustomer = useCallback((customer: Customer) => {
    if (!companyId) return;
    queryClient.setQueryData<Customer[]>(CUSTOMERS_KEYS.active(companyId), prev => prev ? [...prev, customer] : [customer]);
    queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEYS.active(companyId) });
  }, [companyId, queryClient]);

  const addSupplier = useCallback((supplier: Supplier) => {
    if (!companyId) return;
    queryClient.setQueryData<Supplier[]>(SUPPLIERS_KEYS.active(companyId), prev => prev ? [...prev, supplier] : [supplier]);
    queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEYS.active(companyId) });
  }, [companyId, queryClient]);

  const addChartAccount = useCallback((account: ChartAccount) => {
    if (!companyId) return;
    queryClient.setQueryData<ChartAccount[]>(CHART_ACCOUNTS_KEYS.list(companyId), prev => prev ? [...prev, account] : [account]);
    queryClient.invalidateQueries({ queryKey: CHART_ACCOUNTS_KEYS.list(companyId) });
  }, [companyId, queryClient]);

  const addCategory = useCallback((category: Category) => {
    if (!companyId) return;
    queryClient.setQueryData<Category[]>(['categories', 'active', companyId], prev => prev ? [...prev, category] : [category]);
    queryClient.invalidateQueries({ queryKey: ['categories', 'active', companyId] });
  }, [companyId, queryClient]);

  // Delayed refetch — refetch transactions data immediately
  // (Removed 500ms delay: PostgreSQL guarantees immediate visibility after INSERT/UPDATE)
  const delayedRefetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Local state mutators for optimistic updates
  const removeTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [setTransactions]);

  const addTransactionToList = useCallback((transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  }, [setTransactions]);

  return {
    // Data
    transactions,
    filteredTransactions,
    paginatedTransactions,
    bankAccounts,
    chartAccounts,
    categories,
    customers,
    suppliers,
    totals,

    // Loading state
    isLoading,

    // Filters (with derived dates for backward compatibility)
    filters: { ...filters, startDate: dateRange.start, endDate: dateRange.end } as TransactionsFilters,
    hasActiveFilters,
    isCustomDateActive: !!customDateRange,
    setSearchTerm,
    setSelectedBankId,
    setSelectedCategoryId,
    setSelectedChartAccountId,
    setStatusFilter,
    setTypeFilter,
    setQuickFilter,
    setNatureFilter,
    setForecastTypeFilter,
    setStartDate,
    setEndDate,
    clearFilters,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage: ITEMS_PER_PAGE,

    // Refetch
    refetch: fetchData,
    delayedRefetch,

    // Local optimistic state mutators
    removeTransaction,
    addTransactionToList,

    // List modifiers
    addCustomer,
    addSupplier,
    addChartAccount,
    addCategory,
  };
}

export default useTransactionsData;
