'use client';

/**
 * useFilterStore Hooks
 *
 * React hooks that connect to the Zustand filter store.
 * Provides reactive updates with granular subscriptions.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useDebounce } from '@/hooks/useDebounce';
import { TIMING } from '@/lib/config';
import {
  useFilterStore,
  DEFAULT_ACCOUNT_FILTERS,
  type AccountFilters,
  type AccountStatusTab,
  type DateFilterType,
  type DashboardFilters,
  type DREFilters,
  type CashFlowFilters,
  type TransactionFilters,
} from '@/stores/filterStore';

// ============================================
// FILTER STORE INITIALIZATION HOOK
// ============================================

/**
 * Initialize filter store with current company.
 * Call this once in your app root or layout component.
 */
export function useFilterStoreInit(): void {
  const { currentCompany } = useCompany();
  const initialize = useFilterStore((s) => s.initialize);
  const reset = useFilterStore((s) => s.reset);

  useEffect(() => {
    if (currentCompany?.id) {
      initialize(currentCompany.id);
    } else {
      reset();
    }
  }, [currentCompany?.id, initialize, reset]);

  // Ensure filters are flushed to localStorage before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentCompany?.id) {
        try {
          useFilterStore.getState().persist();
        } catch (error) {
          console.error('[useFilterStore] Error persisting filters on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentCompany?.id]);
}

// ============================================
// ACCOUNTS FILTERS HOOK (Payables/Receivables)
// ============================================

export interface UsePersistedAccountFiltersReturn {
  // State
  statusTab: AccountStatusTab;
  dateType: DateFilterType;
  entityFilter: string;
  searchInput: string;
  searchTerm: string; // debounced
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  hasActiveFilters: boolean;

  // Actions
  setStatusTab: (tab: AccountStatusTab) => void;
  setDateType: (type: DateFilterType) => void;
  setEntityFilter: (id: string) => void;
  setSearchInput: (term: string) => void;
  setDateFrom: (date: Date | undefined) => void;
  setDateTo: (date: Date | undefined) => void;
  clearAllFilters: () => void;
}

export function usePersistedAccountFilters(
  accountType: 'payables' | 'receivables'
): UsePersistedAccountFiltersReturn {
  // Granular Zustand selector — only re-renders when this account type's filters change
  const filters = useFilterStore((s) => s.accounts[accountType]);

  const [searchInput, setSearchInputLocal] = useState(filters.searchTerm);

  // Sync searchInput when filters change externally (e.g., clearAllFilters)
  useEffect(() => {
    setSearchInputLocal(filters.searchTerm);
  }, [filters.searchTerm]);

  // Debounce search input
  const searchTerm = useDebounce(searchInput, TIMING.DEBOUNCE_DELAY);

  // Update store when debounced search changes
  useEffect(() => {
    if (searchTerm !== filters.searchTerm) {
      useFilterStore.getState().setAccountFilters(accountType, { searchTerm });
    }
  }, [searchTerm, filters.searchTerm, accountType]);

  // Convert ISO strings to Date objects
  const dateFrom = useMemo(
    () => (filters.dateFrom ? new Date(filters.dateFrom) : undefined),
    [filters.dateFrom]
  );

  const dateTo = useMemo(
    () => (filters.dateTo ? new Date(filters.dateTo) : undefined),
    [filters.dateTo]
  );

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.statusTab !== 'open' ||
      filters.dateType !== 'due' ||
      filters.entityFilter !== 'all' ||
      searchTerm ||
      filters.dateFrom ||
      filters.dateTo
    );
  }, [filters.statusTab, filters.dateType, filters.entityFilter, searchTerm, filters.dateFrom, filters.dateTo]);

  // Actions — use getState() to avoid subscribing to action references
  const setStatusTab = useCallback((tab: AccountStatusTab) => {
    useFilterStore.getState().setAccountFilters(accountType, { statusTab: tab });
  }, [accountType]);

  const setDateType = useCallback((type: DateFilterType) => {
    useFilterStore.getState().setAccountFilters(accountType, { dateType: type });
  }, [accountType]);

  const setEntityFilter = useCallback((id: string) => {
    useFilterStore.getState().setAccountFilters(accountType, { entityFilter: id });
  }, [accountType]);

  const setSearchInput = useCallback((term: string) => {
    setSearchInputLocal(term);
  }, []);

  const setDateFrom = useCallback((date: Date | undefined) => {
    useFilterStore.getState().setAccountFilters(accountType, {
      dateFrom: date ? date.toISOString() : null,
    });
  }, [accountType]);

  const setDateTo = useCallback((date: Date | undefined) => {
    useFilterStore.getState().setAccountFilters(accountType, {
      dateTo: date ? date.toISOString() : null,
    });
  }, [accountType]);

  const clearAllFilters = useCallback(() => {
    useFilterStore.getState().clearAccountFilters(accountType);
    setSearchInputLocal('');
  }, [accountType]);

  return {
    statusTab: filters.statusTab,
    dateType: filters.dateType,
    entityFilter: filters.entityFilter,
    searchInput,
    searchTerm,
    dateFrom,
    dateTo,
    hasActiveFilters,
    setStatusTab,
    setDateType,
    setEntityFilter,
    setSearchInput,
    setDateFrom,
    setDateTo,
    clearAllFilters,
  };
}

// ============================================
// DASHBOARD FILTERS HOOK
// ============================================

export interface UsePersistedDashboardFiltersReturn {
  filters: DashboardFilters;
  setPeriod: (period: string) => void;
  setBankAccountId: (id: string) => void;
  setShowProjections: (show: boolean) => void;
  clearFilters: () => void;
}

export function usePersistedDashboardFilters(): UsePersistedDashboardFiltersReturn {
  const filters = useFilterStore((s) => s.dashboard);

  const setPeriod = useCallback((period: string) => {
    useFilterStore.getState().setDashboardFilters({ period });
  }, []);

  const setBankAccountId = useCallback((id: string) => {
    useFilterStore.getState().setDashboardFilters({ bankAccountId: id });
  }, []);

  const setShowProjections = useCallback((show: boolean) => {
    useFilterStore.getState().setDashboardFilters({ showProjections: show });
  }, []);

  const clearFilters = useCallback(() => {
    useFilterStore.getState().clearDashboardFilters();
  }, []);

  return {
    filters,
    setPeriod,
    setBankAccountId,
    setShowProjections,
    clearFilters,
  };
}

// ============================================
// DRE FILTERS HOOK
// ============================================

export interface UsePersistedDREFiltersReturn {
  filters: DREFilters;
  setViewMode: (mode: DREFilters['viewMode']) => void;
  setYear: (year: number) => void;
  setMonth: (month: number) => void;
  setQuarter: (quarter: number) => void;
  setShowBudget: (show: boolean) => void;
  setShowVariation: (show: boolean) => void;
  clearFilters: () => void;
}

export function usePersistedDREFilters(): UsePersistedDREFiltersReturn {
  const filters = useFilterStore((s) => s.dre);

  const setViewMode = useCallback((mode: DREFilters['viewMode']) => {
    useFilterStore.getState().setDREFilters({ viewMode: mode });
  }, []);

  const setYear = useCallback((year: number) => {
    useFilterStore.getState().setDREFilters({ year });
  }, []);

  const setMonth = useCallback((month: number) => {
    useFilterStore.getState().setDREFilters({ month });
  }, []);

  const setQuarter = useCallback((quarter: number) => {
    useFilterStore.getState().setDREFilters({ quarter });
  }, []);

  const setShowBudget = useCallback((show: boolean) => {
    useFilterStore.getState().setDREFilters({ showBudget: show });
  }, []);

  const setShowVariation = useCallback((show: boolean) => {
    useFilterStore.getState().setDREFilters({ showVariation: show });
  }, []);

  const clearFilters = useCallback(() => {
    useFilterStore.getState().clearDREFilters();
  }, []);

  return {
    filters,
    setViewMode,
    setYear,
    setMonth,
    setQuarter,
    setShowBudget,
    setShowVariation,
    clearFilters,
  };
}

// ============================================
// CASH FLOW FILTERS HOOK
// ============================================

export interface UsePersistedCashFlowFiltersReturn {
  filters: CashFlowFilters;
  startDate: Date | undefined;
  endDate: Date | undefined;
  setViewMode: (mode: CashFlowFilters['viewMode']) => void;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
  setBankAccountId: (id: string) => void;
  setShowProjections: (show: boolean) => void;
  setGroupBy: (groupBy: CashFlowFilters['groupBy']) => void;
  clearFilters: () => void;
}

export function usePersistedCashFlowFilters(): UsePersistedCashFlowFiltersReturn {
  const filters = useFilterStore((s) => s.cashFlow);

  const startDate = useMemo(
    () => (filters.startDate ? new Date(filters.startDate) : undefined),
    [filters.startDate]
  );

  const endDate = useMemo(
    () => (filters.endDate ? new Date(filters.endDate) : undefined),
    [filters.endDate]
  );

  const setViewMode = useCallback((mode: CashFlowFilters['viewMode']) => {
    useFilterStore.getState().setCashFlowFilters({ viewMode: mode });
  }, []);

  const setStartDate = useCallback((date: Date | undefined) => {
    useFilterStore.getState().setCashFlowFilters({
      startDate: date ? date.toISOString() : null,
    });
  }, []);

  const setEndDate = useCallback((date: Date | undefined) => {
    useFilterStore.getState().setCashFlowFilters({
      endDate: date ? date.toISOString() : null,
    });
  }, []);

  const setBankAccountId = useCallback((id: string) => {
    useFilterStore.getState().setCashFlowFilters({ bankAccountId: id });
  }, []);

  const setShowProjections = useCallback((show: boolean) => {
    useFilterStore.getState().setCashFlowFilters({ showProjections: show });
  }, []);

  const setGroupBy = useCallback((groupBy: CashFlowFilters['groupBy']) => {
    useFilterStore.getState().setCashFlowFilters({ groupBy });
  }, []);

  const clearFilters = useCallback(() => {
    useFilterStore.getState().clearCashFlowFilters();
  }, []);

  return {
    filters,
    startDate,
    endDate,
    setViewMode,
    setStartDate,
    setEndDate,
    setBankAccountId,
    setShowProjections,
    setGroupBy,
    clearFilters,
  };
}

// ============================================
// TRANSACTIONS FILTERS HOOK
// ============================================

export interface UsePersistedTransactionFiltersReturn {
  filters: TransactionFilters;
  searchInput: string;
  searchTerm: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  hasActiveFilters: boolean;
  setBankAccountId: (id: string) => void;
  setCategoryId: (id: string) => void;
  setType: (type: TransactionFilters['type']) => void;
  setStatus: (status: TransactionFilters['status']) => void;
  setSearchInput: (term: string) => void;
  setDateFrom: (date: Date | undefined) => void;
  setDateTo: (date: Date | undefined) => void;
  clearFilters: () => void;
}

export function usePersistedTransactionFilters(): UsePersistedTransactionFiltersReturn {
  const filters = useFilterStore((s) => s.transactions);
  const [searchInput, setSearchInputLocal] = useState(filters.searchTerm);

  // Sync searchInput when filters change externally
  useEffect(() => {
    setSearchInputLocal(filters.searchTerm);
  }, [filters.searchTerm]);

  const searchTerm = useDebounce(searchInput, TIMING.DEBOUNCE_DELAY);

  useEffect(() => {
    if (searchTerm !== filters.searchTerm) {
      useFilterStore.getState().setTransactionFilters({ searchTerm });
    }
  }, [searchTerm, filters.searchTerm]);

  const dateFrom = useMemo(
    () => (filters.dateFrom ? new Date(filters.dateFrom) : undefined),
    [filters.dateFrom]
  );

  const dateTo = useMemo(
    () => (filters.dateTo ? new Date(filters.dateTo) : undefined),
    [filters.dateTo]
  );

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.bankAccountId !== 'all' ||
      filters.categoryId !== 'all' ||
      filters.type !== 'all' ||
      filters.status !== 'all' ||
      searchTerm ||
      filters.dateFrom ||
      filters.dateTo
    );
  }, [filters.bankAccountId, filters.categoryId, filters.type, filters.status, searchTerm, filters.dateFrom, filters.dateTo]);

  const setBankAccountId = useCallback((id: string) => {
    useFilterStore.getState().setTransactionFilters({ bankAccountId: id });
  }, []);

  const setCategoryId = useCallback((id: string) => {
    useFilterStore.getState().setTransactionFilters({ categoryId: id });
  }, []);

  const setType = useCallback((type: TransactionFilters['type']) => {
    useFilterStore.getState().setTransactionFilters({ type });
  }, []);

  const setStatus = useCallback((status: TransactionFilters['status']) => {
    useFilterStore.getState().setTransactionFilters({ status });
  }, []);

  const setSearchInput = useCallback((term: string) => {
    setSearchInputLocal(term);
  }, []);

  const setDateFrom = useCallback((date: Date | undefined) => {
    useFilterStore.getState().setTransactionFilters({
      dateFrom: date ? date.toISOString() : null,
    });
  }, []);

  const setDateTo = useCallback((date: Date | undefined) => {
    useFilterStore.getState().setTransactionFilters({
      dateTo: date ? date.toISOString() : null,
    });
  }, []);

  const clearFilters = useCallback(() => {
    useFilterStore.getState().clearTransactionFilters();
    setSearchInputLocal('');
  }, []);

  return {
    filters,
    searchInput,
    searchTerm,
    dateFrom,
    dateTo,
    hasActiveFilters,
    setBankAccountId,
    setCategoryId,
    setType,
    setStatus,
    setSearchInput,
    setDateFrom,
    setDateTo,
    clearFilters,
  };
}
