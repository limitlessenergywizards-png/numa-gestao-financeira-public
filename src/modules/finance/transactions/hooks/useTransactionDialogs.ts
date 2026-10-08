'use client';

/**
 * useTransactionDialogs Hook
 *
 * Encapsula todos os estados de dialog e form data
 * para a pagina de transacoes.
 */

import { useState, useCallback } from 'react';
import { type Transaction } from './useTransactionsData';
import { type TransactionFormData, emptyFormData } from './useTransactionsActions';

export function useTransactionDialogs() {
  // Dialog visibility states
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [auditTransactionId, setAuditTransactionId] = useState<string | null>(null);

  // Form data states
  const [newFormData, setNewFormData] = useState<TransactionFormData>(emptyFormData);
  const [editFormData, setEditFormData] = useState<TransactionFormData>(emptyFormData);

  // Open dialog helpers
  const openNewEntry = useCallback(() => {
    setNewFormData({ ...emptyFormData, type: 'entrada' });
    setShowNewDialog(true);
  }, []);

  const openNewExit = useCallback(() => {
    setNewFormData({ ...emptyFormData, type: 'saida' });
    setShowNewDialog(true);
  }, []);

  const openEdit = useCallback((transaction: Transaction) => {
    setEditFormData({
      ...emptyFormData,
      type: transaction.type,
      bank_account_id: transaction.bank_account_id,
      chart_account_id: transaction.chart_account_id || '',
      category_id: transaction.category_id || '',
      customer_id: transaction.customer_id || '',
      supplier_id: transaction.supplier_id || '',
      payment_method: transaction.payment_method || 'dinheiro',
      amount: String(transaction.amount),
      description: transaction.description,
      transaction_date: transaction.transaction_date,
      document_number: transaction.document_number || '',
      notes: transaction.notes || '',
      nature: ((transaction as unknown as Record<string, unknown>).nature as 'realizado' | 'previsao') || 'realizado',
    });
    setEditingTransaction(transaction);
    setShowEditDialog(true);
  }, []);

  const closeNew = useCallback(() => {
    setShowNewDialog(false);
    setNewFormData(emptyFormData);
  }, []);

  const closeEdit = useCallback(() => {
    setShowEditDialog(false);
    setEditingTransaction(null);
  }, []);

  const closeDelete = useCallback(() => {
    setDeletingTransaction(null);
  }, []);

  const closeView = useCallback(() => {
    setViewingTransaction(null);
  }, []);

  const closeAudit = useCallback(() => {
    setAuditTransactionId(null);
  }, []);

  return {
    // Dialog states
    showNewDialog,
    showEditDialog,
    editingTransaction,
    deletingTransaction,
    viewingTransaction,
    auditTransactionId,
    // Form data
    newFormData,
    editFormData,
    // Setters (for TransactionDialogs props)
    setShowNewDialog,
    setNewFormData,
    setEditFormData,
    setDeletingTransaction,
    setViewingTransaction,
    setAuditTransactionId,
    // Helpers
    openNewEntry,
    openNewExit,
    openEdit,
    closeNew,
    closeEdit,
    closeDelete,
    closeView,
    closeAudit,
  };
}
