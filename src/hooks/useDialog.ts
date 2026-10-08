'use client';

/**
 * useDialog Hook
 * 
 * Manages dialog/modal state with form data for create and edit operations.
 * Used in Customers, Suppliers, BankAccounts, Categories, etc.
 */

import { useState, useCallback } from 'react';

interface UseDialogOptions<TForm> {
  emptyFormData: TForm;
  onCloseDelay?: number;
}

interface UseDialogReturn<TItem, TForm> {
  isOpen: boolean;
  editingItem: TItem | null;
  formData: TForm;
  isEditing: boolean;
  open: () => void;
  openForEdit: (item: TItem, formMapper: (item: TItem) => TForm) => void;
  close: () => void;
  setFormData: React.Dispatch<React.SetStateAction<TForm>>;
  updateFormField: <K extends keyof TForm>(key: K, value: TForm[K]) => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useDialog<TItem, TForm>({ 
  emptyFormData,
  onCloseDelay = 200,
}: UseDialogOptions<TForm>): UseDialogReturn<TItem, TForm> {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TItem | null>(null);
  const [formData, setFormData] = useState<TForm>(emptyFormData);

  const open = useCallback(() => {
    setEditingItem(null);
    setFormData(emptyFormData);
    setIsOpen(true);
  }, [emptyFormData]);

  const openForEdit = useCallback((item: TItem, formMapper: (item: TItem) => TForm) => {
    setEditingItem(item);
    setFormData(formMapper(item));
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay clearing to allow animation to complete
    setTimeout(() => {
      setEditingItem(null);
      setFormData(emptyFormData);
    }, onCloseDelay);
  }, [emptyFormData, onCloseDelay]);

  const updateFormField = useCallback(<K extends keyof TForm>(key: K, value: TForm[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  return {
    isOpen,
    editingItem,
    formData,
    isEditing: editingItem !== null,
    open,
    openForEdit,
    close,
    setFormData,
    updateFormField,
    setIsOpen,
  };
}
