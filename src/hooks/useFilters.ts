'use client';

/**
 * useFilters Hook
 * 
 * Manages filter state with clear functionality and active filter detection.
 * Used in Payables, Receivables, Transactions, Customers, Suppliers, etc.
 */

import { useState, useCallback, useMemo } from 'react';

type FilterValue = string | number | boolean | Date | undefined | null;

interface UseFiltersOptions<T extends Record<string, FilterValue>> {
  initialFilters: T;
  defaultValues: T;
}

interface UseFiltersReturn<T extends Record<string, FilterValue>> {
  filters: T;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  setFilters: (partial: Partial<T>) => void;
  clearFilters: () => void;
  resetFilter: <K extends keyof T>(key: K) => void;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  isFilterActive: <K extends keyof T>(key: K) => boolean;
}

export function useFilters<T extends Record<string, FilterValue>>({
  initialFilters,
  defaultValues,
}: UseFiltersOptions<T>): UseFiltersReturn<T> {
  const [filters, setFiltersState] = useState<T>(initialFilters);

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setFilters = useCallback((partial: Partial<T>) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultValues);
  }, [defaultValues]);

  const resetFilter = useCallback(<K extends keyof T>(key: K) => {
    setFiltersState(prev => ({ ...prev, [key]: defaultValues[key] }));
  }, [defaultValues]);

  const isFilterActive = useCallback(<K extends keyof T>(key: K) => {
    return filters[key] !== defaultValues[key];
  }, [filters, defaultValues]);

  const { hasActiveFilters, activeFiltersCount } = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(filters) as (keyof T)[]) {
      if (filters[key] !== defaultValues[key]) {
        count++;
      }
    }
    return { hasActiveFilters: count > 0, activeFiltersCount: count };
  }, [filters, defaultValues]);

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    resetFilter,
    hasActiveFilters,
    activeFiltersCount,
    isFilterActive,
  };
}
