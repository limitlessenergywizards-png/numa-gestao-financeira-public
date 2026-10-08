'use client';

/**
 * useConfirmDelete Hook
 * 
 * Manages delete confirmation dialog state with execute functionality.
 * Used in Customers, Suppliers, BankAccounts, Categories, etc.
 */

import { useState, useCallback } from 'react';

interface UseConfirmDeleteOptions {
  onCloseDelay?: number;
}

interface UseConfirmDeleteReturn<T> {
  itemToDelete: T | null;
  isOpen: boolean;
  isDeleting: boolean;
  confirmDelete: (item: T) => void;
  cancelDelete: () => void;
  executeDelete: (onDelete: (item: T) => Promise<void>) => Promise<void>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useConfirmDelete<T>(
  options: UseConfirmDeleteOptions = {}
): UseConfirmDeleteReturn<T> {
  const { onCloseDelay = 200 } = options;
  
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = useCallback((item: T) => {
    setItemToDelete(item);
    setIsOpen(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setItemToDelete(null), onCloseDelay);
  }, [onCloseDelay]);

  const executeDelete = useCallback(async (onDelete: (item: T) => Promise<void>) => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(itemToDelete);
      setIsOpen(false);
      setItemToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }, [itemToDelete]);

  return {
    itemToDelete,
    isOpen,
    isDeleting,
    confirmDelete,
    cancelDelete,
    executeDelete,
    setIsOpen,
  };
}
