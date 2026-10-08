'use client';

/**
 * useSelection Hook
 * 
 * Manages multiple item selection with toggle, select all, and clear functionality.
 * Used in Payables, Receivables, Transactions, and other list components.
 */

import { useState, useCallback, useMemo } from 'react';

interface UseSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
}

interface UseSelectionReturn<T> {
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectedItems: T[];
  selectedCount: number;
}

export function useSelection<T>({ 
  items, 
  getItemId 
}: UseSelectionOptions<T>): UseSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.length === items.length ? [] : items.map(getItemId)
    );
  }, [items, getItemId]);

  const selectAll = useCallback(() => {
    setSelectedIds(items.map(getItemId));
  }, [items, getItemId]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectedItems = useMemo(
    () => items.filter(item => selectedIds.includes(getItemId(item))),
    [items, selectedIds, getItemId]
  );

  const isAllSelected = selectedIds.length === items.length && items.length > 0;
  const isPartiallySelected = selectedIds.length > 0 && !isAllSelected;

  return {
    selectedIds,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    toggleSelection,
    toggleSelectAll,
    selectAll,
    clearSelection,
    selectedItems,
    selectedCount: selectedIds.length,
  };
}
