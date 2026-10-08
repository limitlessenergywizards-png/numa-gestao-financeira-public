'use client';

import { useState, useCallback, useMemo } from "react";

export interface UseAccountSelectionReturn<T extends { id: string }> {
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  toggleSelection: (id: string) => void;
  toggleSelectAll: (items: T[]) => void;
  clearSelection: () => void;
  selectedItems: (items: T[]) => T[];
  selectedTotal: (items: T[], getRemaining: (item: T) => number) => number;
}

export function useAccountSelection<T extends { id: string }>(): UseAccountSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback((items: T[]) => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  }, [selectedIds.length]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectedItems = useCallback((items: T[]) => {
    return items.filter(item => selectedIds.includes(item.id));
  }, [selectedIds]);

  const selectedTotal = useCallback((items: T[], getRemaining: (item: T) => number) => {
    return items
      .filter(item => selectedIds.includes(item.id))
      .reduce((sum, item) => sum + getRemaining(item), 0);
  }, [selectedIds]);

  // Computed
  const isAllSelected = selectedIds.length > 0;
  const isIndeterminate = selectedIds.length > 0;

  return {
    selectedIds,
    isSelected,
    isAllSelected,
    isIndeterminate,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    selectedItems,
    selectedTotal,
  };
}

// Helper to calculate remaining amount
export const getAccountRemaining = <T extends { total_amount: number; paid_amount: number }>(
  account: T
): number => {
  return Number(account.total_amount) - Number(account.paid_amount);
};
