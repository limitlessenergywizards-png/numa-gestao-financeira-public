'use client';

/**
 * useTransactionsSelection Hook
 * 
 * Hook para gerenciar seleção de transações para bulk actions.
 */

import { useState, useCallback, useMemo } from 'react';
import type { Transaction } from './useTransactionsData';

export function useTransactionsSelection(paginatedTransactions: Transaction[]) {
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());

  // Derive array for consumers that need it (bulk operations, etc.)
  const selectedIds = useMemo(() => Array.from(selectedSet), [selectedSet]);

  // Select all on current page
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedSet(new Set(paginatedTransactions.map(t => t.id)));
    } else {
      setSelectedSet(new Set());
    }
  }, [paginatedTransactions]);

  // Select/deselect single item — O(1) instead of O(n)
  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedSet(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedSet(new Set());
  }, []);

  // Remove specific IDs from selection
  const removeFromSelection = useCallback((ids: string[]) => {
    setSelectedSet(prev => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  }, []);

  // Check if all on page are selected — O(n) with Set.has O(1) per check
  const isAllSelected = useMemo(() => {
    return paginatedTransactions.length > 0 &&
           selectedSet.size === paginatedTransactions.length &&
           paginatedTransactions.every(t => selectedSet.has(t.id));
  }, [selectedSet, paginatedTransactions]);

  // Get selected transactions — O(n) with Set.has O(1) per check
  const selectedTransactions = useMemo(() => {
    return paginatedTransactions.filter(t => selectedSet.has(t.id));
  }, [paginatedTransactions, selectedSet]);

  // Calculate totals for selected
  const selectedTotals = useMemo(() => {
    const entradas = selectedTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const saidas = selectedTransactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      entradas,
      saidas,
      saldo: entradas - saidas
    };
  }, [selectedTransactions]);

  return {
    selectedIds,
    selectedCount: selectedSet.size,
    selectedTotals,
    isAllSelected,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
    removeFromSelection,
  };
}

export default useTransactionsSelection;
