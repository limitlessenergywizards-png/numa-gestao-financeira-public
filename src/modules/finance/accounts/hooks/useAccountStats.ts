'use client';

import { useMemo } from "react";
import type { PayableStatus, ReceivableStatus } from "@/types";
import { getOverdueDays, type AccountStats } from "../types";

interface AccountWithStats {
  id: string;
  status: PayableStatus | ReceivableStatus;
  due_date: string;
  total_amount: number;
  paid_amount: number;
}

export function useAccountStats<T extends AccountWithStats>(
  accounts: T[]
): AccountStats {
  return useMemo(() => {
    const pending = accounts.filter(
      a => a.status === 'pendente' || a.status === 'parcial'
    );

    const overdue = pending.filter(
      a => getOverdueDays(a.due_date, a.status) > 0
    );

    const total = accounts.reduce(
      (sum, a) => sum + Number(a.total_amount),
      0
    );

    const paidOrReceived = accounts.reduce(
      (sum, a) => {
        if (a.status === 'pago') {
          return sum + Number(a.total_amount);
        }
        return sum + Number(a.paid_amount || 0);
      },
      0
    );

    const overdueAmount = overdue.reduce(
      (sum, a) => sum + (Number(a.total_amount) - Number(a.paid_amount)),
      0
    );

    const pendingAmount = pending.reduce(
      (sum, a) => sum + (Number(a.total_amount) - Number(a.paid_amount)),
      0
    );

    const paid = accounts.filter(
      a => a.status === 'pago'
    );

    return {
      total,
      paidOrReceived,
      pendingAmount,
      overdueAmount,
      overdueCount: overdue.length,
      totalCount: accounts.length,
      paidCount: paid.length,
      pendingCount: pending.length,
    };
  }, [accounts]);
}

// Hook for export data preparation
export function useAccountExportData<T extends {
  due_date: string;
  description: string;
  total_amount: number;
  paid_amount: number;
  status: PayableStatus | ReceivableStatus;
  supplier?: { name: string } | null;
  customer?: { name: string } | null;
}>(
  accounts: T[],
  entityType: 'supplier' | 'customer',
  statusLabels: Record<string, string>
) {
  return useMemo(() => {
    return accounts.map(account => {
      const entityName = entityType === 'supplier'
        ? account.supplier?.name
        : account.customer?.name;

      return {
        due_date: new Date(account.due_date).toLocaleDateString('pt-BR'),
        entity: entityName || '-',
        description: account.description,
        total_amount: account.total_amount,
        paid_amount: account.paid_amount,
        remaining: Number(account.total_amount) - Number(account.paid_amount),
        status: statusLabels[account.status] || account.status,
      };
    });
  }, [accounts, entityType, statusLabels]);
}

// Export columns config
export const getExportColumns = (entityLabel: string) => [
  { key: 'due_date', header: 'Vencimento' },
  { key: 'entity', header: entityLabel },
  { key: 'description', header: 'Descrição' },
  { key: 'total_amount', header: 'Valor' },
  { key: 'paid_amount', header: 'Pago' },
  { key: 'remaining', header: 'Saldo' },
  { key: 'status', header: 'Status' },
];
