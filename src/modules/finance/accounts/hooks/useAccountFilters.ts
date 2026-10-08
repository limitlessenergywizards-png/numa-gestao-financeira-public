'use client';

/**
 * useAccountFilters - Persistent Account Filters Hook
 *
 * Uses Zustand filter store for localStorage persistence.
 * Filters survive page navigation, refresh, and logout/login.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { TIMING } from "@/lib/config";
import { isBefore, isAfter, startOfDay } from "date-fns";
import { useFilterStore, type AccountFilters, type AccountStatusTab, type DateFilterType } from "@/stores/filterStore";
import type { PayableStatus, ReceivableStatus } from "@/types";

// Re-export types from filterStore for convenience
export type { AccountStatusTab, DateFilterType } from "@/stores/filterStore";

export interface UseAccountFiltersReturn {
  // State
  statusTab: AccountStatusTab;
  dateType: DateFilterType;
  entityFilter: string;
  categoryFilter: string;
  costTypeFilter: string;
  searchInput: string;
  searchTerm: string; // debounced
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  hasActiveFilters: boolean;

  // Actions
  setStatusTab: (tab: AccountStatusTab) => void;
  setDateType: (type: DateFilterType) => void;
  setEntityFilter: (id: string) => void;
  setCategoryFilter: (id: string) => void;
  setCostTypeFilter: (type: string) => void;
  setSearchInput: (term: string) => void;
  setDateFrom: (date: Date | undefined) => void;
  setDateTo: (date: Date | undefined) => void;
  clearAllFilters: () => void;
}

/**
 * Hook for managing account filters with persistence.
 *
 * @param accountType - 'payables' or 'receivables' (optional, defaults to 'payables')
 */
export function useAccountFilters(accountType: 'payables' | 'receivables' = 'payables'): UseAccountFiltersReturn {
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
      filters.statusTab !== 'all' ||
      filters.dateType !== 'due' ||
      filters.entityFilter !== 'all' ||
      filters.categoryFilter !== 'all' ||
      filters.costTypeFilter !== 'all' ||
      searchTerm ||
      filters.dateFrom ||
      filters.dateTo
    );
  }, [filters.statusTab, filters.dateType, filters.entityFilter, filters.categoryFilter, filters.costTypeFilter, searchTerm, filters.dateFrom, filters.dateTo]);

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

  const setCategoryFilter = useCallback((id: string) => {
    useFilterStore.getState().setAccountFilters(accountType, { categoryFilter: id });
  }, [accountType]);

  const setCostTypeFilter = useCallback((type: string) => {
    useFilterStore.getState().setAccountFilters(accountType, { costTypeFilter: type });
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
    categoryFilter: filters.categoryFilter,
    costTypeFilter: filters.costTypeFilter,
    searchInput,
    searchTerm,
    dateFrom,
    dateTo,
    hasActiveFilters,
    setStatusTab,
    setDateType,
    setEntityFilter,
    setCategoryFilter,
    setCostTypeFilter,
    setSearchInput,
    setDateFrom,
    setDateTo,
    clearAllFilters,
  };
}

// Filter function - works for both payables and receivables
export function filterAccounts<T extends {
  status: PayableStatus | ReceivableStatus;
  due_date: string;
  issue_date: string;
  description: string;
  supplier_id?: string | null;
  customer_id?: string | null;
  category_id?: string | null;
  chart_account?: { cost_type?: string; dre_category?: string | null } | null;
}>(
  accounts: T[],
  filters: {
    statusTab: AccountStatusTab;
    dateType: DateFilterType;
    entityFilter: string;
    categoryFilter: string;
    costTypeFilter: string;
    searchTerm: string;
    dateFrom: Date | undefined;
    dateTo: Date | undefined;
  },
  entityIdField: 'supplier_id' | 'customer_id'
): T[] {
  const today = startOfDay(new Date());

  return accounts.filter(account => {
    // Status tab filter
    if (filters.statusTab === 'open') {
      if (!['pendente', 'parcial'].includes(account.status)) return false;
      if (isBefore(startOfDay(new Date(account.due_date)), today)) return false;
    } else if (filters.statusTab === 'paid') {
      if (account.status !== 'pago') return false;
    } else if (filters.statusTab === 'overdue') {
      if (!['pendente', 'parcial'].includes(account.status)) return false;
      if (!isBefore(startOfDay(new Date(account.due_date)), today)) return false;
    }

    // Entity filter (supplier or customer)
    const entityId = account[entityIdField];
    if (filters.entityFilter !== 'all' && entityId !== filters.entityFilter) {
      return false;
    }

    // Category filter
    if (filters.categoryFilter !== 'all' && account.category_id !== filters.categoryFilter) {
      return false;
    }

    // Cost type filter (fixed/variable from chart_of_accounts, or resultado_financeiro via dre_category)
    if (filters.costTypeFilter !== 'all') {
      if (filters.costTypeFilter === 'resultado_financeiro') {
        if (account.chart_account?.dre_category !== 'resultado_financeiro') return false;
      } else {
        const costType = account.chart_account?.cost_type;
        if (costType !== filters.costTypeFilter) return false;
      }
    }

    // Search term filter
    if (filters.searchTerm && !account.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }

    // Date range filter based on dateType
    if (filters.dateType !== 'payment') {
      const dateToFilter = startOfDay(new Date(
        filters.dateType === 'due' ? account.due_date : account.issue_date
      ));

      if (filters.dateFrom && isBefore(dateToFilter, startOfDay(filters.dateFrom))) {
        return false;
      }
      if (filters.dateTo && isAfter(dateToFilter, startOfDay(filters.dateTo))) {
        return false;
      }
    }

    return true;
  });
}
