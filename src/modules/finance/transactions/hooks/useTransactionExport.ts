'use client';

/**
 * useTransactionExport Hook
 *
 * Prepara dados e colunas para export de transacoes.
 * Memoiza o resultado para evitar recalculo a cada render.
 */

import { useMemo } from 'react';
import { format } from 'date-fns';
import { type Transaction } from './useTransactionsData';
import { paymentMethodLabels } from '../constants';

export function useTransactionExport(
  filteredTransactions: Transaction[],
  formatCurrency: (value: number) => string,
) {
  const exportColumns = useMemo(() => [
    { key: 'transaction_date', header: 'Data' },
    { key: 'description', header: 'Descrição' },
    { key: 'type', header: 'Tipo' },
    { key: 'status', header: 'Status' },
    { key: 'payment_method', header: 'Forma Pgto' },
    { key: 'category', header: 'Categoria' },
    { key: 'bank_account', header: 'Conta Bancária' },
    { key: 'amount', header: 'Valor' },
  ], []);

  const exportData = useMemo(() =>
    filteredTransactions.map(t => ({
      transaction_date: format(new Date(t.transaction_date), 'dd/MM/yyyy'),
      description: t.description,
      type: t.type === 'entrada' ? 'Entrada' : 'Saída',
      status: t.reconciled ? 'Conciliado' : 'Pendente',
      payment_method: paymentMethodLabels[t.payment_method || 'dinheiro']?.label || '-',
      category: t.chart_account ? `${t.chart_account.code} - ${t.chart_account.name}` : '-',
      bank_account: t.bank_account?.name || '-',
      amount: formatCurrency(Number(t.amount)),
    })),
    [filteredTransactions, formatCurrency]
  );

  return { exportColumns, exportData };
}
