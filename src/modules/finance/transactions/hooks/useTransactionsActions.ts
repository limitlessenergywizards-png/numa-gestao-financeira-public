'use client';

/**
 * useTransactionsActions Hook
 *
 * Hook para todas as ações CRUD de transações.
 * Centraliza create, update, delete, reconcile, duplicate.
 *
 * Business logic (Supabase operations) is delegated to
 * ../services/transactionMutations.ts
 */

import { useState, useCallback, useRef, useLayoutEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyState } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStableCallback } from '@/hooks/useStableCallback';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';
import { parseCurrencyValue } from '@/lib/masks';
import { invalidateFinancialQueries } from '@/lib/queryInvalidation';
import type { RecurrenceConfig } from '../components/RecurrenceSelector';
import type { Transaction, TransactionType } from './useTransactionsData';
import {
  createRecurringTransactions,
  insertStandardTransaction,
  syncNewTransactionToPayable,
  syncNewTransactionToReceivable,
  createPayableForRealized,
  createReceivableForRealized,
  insertPaymentRecordForLinked,
  handleDebtPayment,
  updateTransactionWithSync,
  cascadeSoftDeleteTransaction,
  cascadeBulkSoftDelete,
  convertForecastRpc,
  reverseTransactionRpc,
} from '../services/transactionMutations';

export interface TransactionFormData {
  type: TransactionType;
  bank_account_id: string;
  chart_account_id: string;
  category_id: string;
  customer_id: string;
  supplier_id: string;
  payment_method: string;
  amount: string;
  description: string;
  transaction_date: string;
  document_number: string;
  notes: string;
  recurrence: string;
  recurrenceConfig?: RecurrenceConfig;
  // Forecast fields
  nature: 'realizado' | 'previsao';
  forecast_type: 'orcamento' | 'estimativa' | 'simulacao' | '';
  forecast_confidence: number;
  forecast_basis: string;
  forecast_notes: string;
  debtPayment: boolean;
  debtId: string | null;
}

export const emptyFormData: TransactionFormData = {
  type: 'entrada',
  bank_account_id: '',
  chart_account_id: '',
  category_id: '',
  customer_id: '',
  supplier_id: '',
  payment_method: 'dinheiro',
  amount: '',
  description: '',
  transaction_date: format(new Date(), 'yyyy-MM-dd'),
  document_number: '',
  notes: '',
  recurrence: '',
  nature: 'realizado',
  forecast_type: '',
  forecast_confidence: 80,
  forecast_basis: '',
  forecast_notes: '',
  debtPayment: false,
  debtId: null,
};

interface UseTransactionsActionsOptions {
  onSuccess?: () => void;
  onTransactionCreated?: (transaction: Transaction) => void;
  onTransactionDeleted?: (id: string) => void;
}

export function useTransactionsActions(options: UseTransactionsActionsOptions = {}) {
  const { currentCompany } = useCompanyState();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const [pendingDateChange, setPendingDateChange] = useState<{
    original: Date;
    new: Date;
    callback: () => Promise<void>;
  } | null>(null);

  const onSuccessRef = useRef(options.onSuccess);
  const onCreatedRef = useRef(options.onTransactionCreated);
  const onDeletedRef = useRef(options.onTransactionDeleted);
  useLayoutEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onCreatedRef.current = options.onTransactionCreated;
    onDeletedRef.current = options.onTransactionDeleted;
  });

  // Create new transaction
  const createTransaction = useStableCallback(async (formData: TransactionFormData) => {
    if (isSaving) {
      console.warn('Block: Ação já em andamento (Race Condition Sec)');
      return false;
    }

    if (!currentCompany || !formData.bank_account_id || !formData.amount || !formData.description?.trim()) {
      toast.error('Preencha descrição válida, valor e conta bancária');
      return false;
    }

    const parsedAmount = parseCurrencyValue(formData.amount);
    if (parsedAmount <= 0 || !Number.isFinite(parsedAmount)) {
      toast.error('Valor inválido. Informe um valor numérico válido maior que zero.');
      return false;
    }

    if (formData.nature === 'realizado') {
      if (formData.type === 'saida' && !formData.supplier_id) {
        toast.error('Selecione um fornecedor para registrar a saída');
        return false;
      }
      if (formData.type === 'entrada' && !formData.customer_id) {
        toast.error('Selecione um cliente para registrar a entrada');
        return false;
      }
    }

    setIsSaving(true);
    let createdTransactionId: string | null = null;
    let createdTransaction: Transaction | null = null;

    try {
      if (formData.recurrenceConfig && formData.recurrenceConfig.frequency !== 'none') {
        await createRecurringTransactions(currentCompany.id, formData, parsedAmount);
      } else {
        // Realizado + supplier/customer linked: create payable/receivable FIRST,
        // then transaction with forecast_basis already set, then payment_record.
        // This avoids the duplicate-credit bug (trigger update_bank_balance_on_transaction
        // skips when forecast_basis matches payable:/receivable:, and handle_payment_changes
        // is the single source of truth for the saldo update).
        const isRealizadoLinked =
          !formData.forecast_basis &&
          formData.nature === 'realizado' &&
          ((formData.type === 'saida' && !!formData.supplier_id) ||
            (formData.type === 'entrada' && !!formData.customer_id));

        if (isRealizadoLinked) {
          const isSaida = formData.type === 'saida';
          const linkedId = isSaida
            ? await createPayableForRealized(currentCompany.id, formData, parsedAmount)
            : await createReceivableForRealized(currentCompany.id, formData, parsedAmount);
          const forecastBasis = `${isSaida ? 'payable' : 'receivable'}:${linkedId}`;

          const txData = await insertStandardTransaction(
            currentCompany.id,
            { ...formData, forecast_basis: forecastBasis },
            parsedAmount,
          );
          createdTransactionId = txData.id;
          createdTransaction = txData as Transaction;

          await insertPaymentRecordForLinked({
            companyId: currentCompany.id,
            bankAccountId: formData.bank_account_id || null,
            amount: parsedAmount,
            paymentDate: formData.transaction_date,
            paymentMethod: formData.payment_method,
            payableId: isSaida ? linkedId : undefined,
            receivableId: isSaida ? undefined : linkedId,
            notes: `Baixa automática (sincronizada a partir de Nova ${isSaida ? 'Saída' : 'Entrada'})`,
          });
        } else {
          const txData = await insertStandardTransaction(currentCompany.id, formData, parsedAmount);
          createdTransactionId = txData.id;
          createdTransaction = txData as Transaction;

          // Legacy sync flow for previsao with linked supplier/customer
          // (creates payable/receivable as pendente; doesn't trigger duplicate bug
          // because no payment_record is created when nature='previsao')
          if (!formData.forecast_basis && createdTransactionId) {
            const syncParams = {
              companyId: currentCompany.id,
              transactionId: createdTransactionId,
              formData,
              parsedAmount,
              userId: user?.id,
            };

            if (formData.type === 'saida' && formData.supplier_id) {
              await syncNewTransactionToPayable(syncParams);
            } else if (formData.type === 'entrada' && formData.customer_id) {
              await syncNewTransactionToReceivable(syncParams);
            }
          }
        }
      }

      // Debt payment
      if (
        createdTransactionId &&
        formData.type === 'saida' &&
        formData.nature === 'realizado' &&
        formData.debtPayment &&
        formData.debtId
      ) {
        try {
          await handleDebtPayment({
            companyId: currentCompany.id,
            transactionId: createdTransactionId,
            debtId: formData.debtId,
            parsedAmount,
            transactionDate: formData.transaction_date,
          });
        } catch {
          toast.error('Erro ao vincular pagamento à dívida.');
        }
      }

      toast.success(`${formData.type === 'entrada' ? 'Entrada' : 'Saída'} registrada!`);
      // Delay invalidation by 300ms to allow dialog exit animation (200ms) to complete
      // before React Query refetches cause a re-render. A mid-animation re-render can
      // corrupt the Radix Presence state machine, permanently locking scroll.
      if (currentCompany?.id) {
        const companyId = currentCompany.id;
        setTimeout(() => invalidateFinancialQueries(queryClient, companyId), 300);
      }
      if (createdTransaction) {
        onCreatedRef.current?.({
          ...createdTransaction,
          reconciled: createdTransaction.reconciled ?? false,
          reconciled_at: createdTransaction.reconciled_at ?? null,
          recurrence: createdTransaction.recurrence ?? null,
          category_id: createdTransaction.category_id ?? null,
          nature: createdTransaction.nature ?? 'realizado',
        });
      }
      onSuccessRef.current?.();
      return true;
    } catch (error) {
      toast.error('Erro ao salvar: ' + getErrorMessage(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  });

  // Update existing transaction
  const updateTransaction = useStableCallback(async (
    transactionId: string,
    formData: TransactionFormData,
    originalDate?: string,
    skipDateCheck = false
  ) => {
    if (isSaving) {
      console.warn('Block: Ação já em andamento (Race Condition Sec)');
      return false;
    }

    if (!formData.bank_account_id || !formData.amount || !formData.description?.trim()) {
      toast.error('Preencha todos os campos obrigatórios com valores válidos');
      return false;
    }

    if (!skipDateCheck && originalDate) {
      const origDate = parseISO(originalDate);
      const newDate = parseISO(formData.transaction_date);
      const daysDiff = Math.abs(differenceInDays(newDate, origDate));

      if (daysDiff > 7) {
        setPendingDateChange({
          original: origDate,
          new: newDate,
          callback: async () => {
            await performUpdate(transactionId, formData);
          },
        });
        return 'pending_confirmation';
      }
    }

    return performUpdate(transactionId, formData);
  });

  const performUpdate = async (transactionId: string, formData: TransactionFormData) => {
    if (!currentCompany) return false;
    setIsSaving(true);
    try {
      await updateTransactionWithSync({
        transactionId,
        companyId: currentCompany.id,
        formData,
      });
      toast.success('Movimentação atualizada!');
      // Delay invalidation by 300ms to allow dialog exit animation (200ms) to complete
      // before React Query refetches cause a re-render that could corrupt Presence state.
      if (currentCompany?.id) {
        const companyId = currentCompany.id;
        setTimeout(() => invalidateFinancialQueries(queryClient, companyId), 300);
      }
      onSuccessRef.current?.();
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'RECONCILED') {
        toast.error('Transação conciliada não pode ser editada. Use estorno + novo lançamento.');
      } else {
        toast.error('Erro ao salvar: ' + getErrorMessage(error));
      }
      return false;
    } finally {
      setIsSaving(false);
      setPendingDateChange(null);
    }
  };

  const confirmDateChange = useStableCallback(async () => {
    if (pendingDateChange) {
      await pendingDateChange.callback();
      setPendingDateChange(null);
    }
  });

  const cancelDateChange = useCallback(() => {
    setPendingDateChange(null);
  }, []);

  // Soft-delete transaction
  const deleteTransaction = useStableCallback(async (transactionId: string) => {
    if (isDeleting) {
      console.warn('Block: Exclusão já em andamento (Race Condition Sec)');
      return false;
    }
    if (!currentCompany) return false;
    setIsDeleting(true);
    try {
      await cascadeSoftDeleteTransaction(transactionId, currentCompany.id, user?.id);
      toast.success('Movimentação excluída!');
      // Delay invalidation by 300ms to allow AlertDialog exit animation to complete
      if (currentCompany?.id) {
        const companyId = currentCompany.id;
        setTimeout(() => invalidateFinancialQueries(queryClient, companyId), 300);
      }
      onDeletedRef.current?.(transactionId);
      onSuccessRef.current?.();
      return true;
    } catch (error) {
      toast.error('Erro ao excluir: ' + getErrorMessage(error));
      return false;
    } finally {
      setIsDeleting(false);
    }
  });

  // Reconcile single transaction
  const reconcileTransaction = useStableCallback(async (transactionId: string) => {
    if (isSaving) {
      console.warn('Block: Ação já em andamento (Race Condition Sec)');
      return false;
    }
    if (!currentCompany) return false;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          reconciled: true,
          reconciled_at: new Date().toISOString(),
          reconciled_by: user?.id,
        })
        .eq('id', transactionId)
        .eq('company_id', currentCompany.id);

      if (error) throw error;
      toast.success('Transação conciliada!');
      if (currentCompany?.id) invalidateFinancialQueries(queryClient, currentCompany.id);
      onSuccessRef.current?.();
      return true;
    } catch (error) {
      toast.error('Erro ao conciliar: ' + getErrorMessage(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  });

  // Duplicate transaction
  const duplicateTransaction = useStableCallback(async (transaction: Transaction) => {
    if (!currentCompany) return false;
    if (isSaving) {
      console.warn('Block: Ação já em andamento (Race Condition Sec)');
      return false;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        company_id: currentCompany.id,
        bank_account_id: transaction.bank_account_id,
        chart_account_id: transaction.chart_account_id,
        category_id: transaction.category_id,
        customer_id: transaction.customer_id,
        supplier_id: transaction.supplier_id,
        type: transaction.type,
        amount: transaction.amount,
        description: `${transaction.description} (cópia)`,
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: transaction.payment_method,
        document_number: null,
        notes: transaction.notes,
        recurrence: transaction.recurrence,
      });
      if (error) throw error;

      toast.success('Transação duplicada!');
      if (currentCompany?.id) invalidateFinancialQueries(queryClient, currentCompany.id);
      onSuccessRef.current?.();
      return true;
    } catch (error) {
      toast.error('Erro ao duplicar: ' + getErrorMessage(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  });

  // Bulk reconcile
  const bulkReconcile = useStableCallback(async (ids: string[]) => {
    if (ids.length === 0) return false;
    if (isProcessingBulk) {
      console.warn('Block: Ação em massa já em andamento (Race Condition Sec)');
      return false;
    }
    setIsProcessingBulk(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          reconciled: true,
          reconciled_at: new Date().toISOString(),
          reconciled_by: user?.id,
        })
        .in('id', ids)
        .eq('company_id', currentCompany!.id);

      if (error) throw error;
      toast.success(`${ids.length} transações conciliadas!`);
      if (currentCompany?.id) invalidateFinancialQueries(queryClient, currentCompany.id);
      onSuccessRef.current?.();
      return true;
    } catch (error) {
      toast.error('Erro ao conciliar: ' + getErrorMessage(error));
      return false;
    } finally {
      setIsProcessingBulk(false);
    }
  });

  // Bulk soft-delete
  const bulkDelete = useStableCallback(async (ids: string[]) => {
    if (ids.length === 0) return false;
    if (isProcessingBulk) {
      console.warn('Block: Ação em massa já em andamento (Race Condition Sec)');
      return false;
    }
    setIsProcessingBulk(true);
    try {
      await cascadeBulkSoftDelete(ids, currentCompany!.id, user?.id);
      toast.success(`${ids.length} transações excluídas!`);
      if (currentCompany?.id) invalidateFinancialQueries(queryClient, currentCompany.id);
      onSuccessRef.current?.();
      return true;
    } catch (error) {
      toast.error('Erro ao excluir: ' + getErrorMessage(error));
      return false;
    } finally {
      setIsProcessingBulk(false);
    }
  });

  // Convert forecast to actual via RPC
  const convertForecastToActual = useStableCallback(async (
    forecastId: string,
    actualAmount: number,
    keepForecast: boolean = true,
    transactionDate?: string
  ): Promise<boolean> => {
    if (!currentCompany || !user) {
      toast.error('Empresa ou usuário não identificado');
      return false;
    }
    if (actualAmount <= 0 || !Number.isFinite(actualAmount)) {
      toast.error('O valor deve ser maior que zero e numérico.');
      return false;
    }
    if (isSaving) {
      console.warn('Block: Ação já em andamento (Race Condition Sec)');
      return false;
    }
    setIsSaving(true);
    try {
      const result = await convertForecastRpc(
        forecastId,
        actualAmount,
        keepForecast,
        transactionDate ?? format(new Date(), 'yyyy-MM-dd'),
        user.id
      );
      const sign = result.deviation_percent > 0 ? '+' : '';
      toast.success(`Previsão convertida! Desvio: ${sign}${result.deviation_percent}%`);
      if (currentCompany?.id) invalidateFinancialQueries(queryClient, currentCompany.id);
      onSuccessRef.current?.();
      return true;
    } catch (error) {
      toast.error('Erro ao converter: ' + getErrorMessage(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  });

  // Reverse transaction via RPC
  const reverseTransaction = useStableCallback(async (transactionId: string, reason: string = 'Estorno') => {
    if (isSaving) {
      console.warn('Block: Ação já em andamento (Race Condition Sec)');
      return false;
    }
    setIsSaving(true);
    try {
      const reversalId = await reverseTransactionRpc(transactionId, user?.id, reason);
      toast.success('Estorno realizado com sucesso!');
      if (currentCompany?.id) invalidateFinancialQueries(queryClient, currentCompany.id);
      onSuccessRef.current?.();
      return reversalId;
    } catch (error) {
      toast.error('Erro ao estornar: ' + getErrorMessage(error));
      return null;
    } finally {
      setIsSaving(false);
    }
  });

  return {
    isSaving,
    isDeleting,
    isProcessingBulk,
    pendingDateChange,
    confirmDateChange,
    cancelDateChange,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    reconcileTransaction,
    duplicateTransaction,
    convertForecastToActual,
    reverseTransaction,
    bulkReconcile,
    bulkDelete,
  };
}

export default useTransactionsActions;
