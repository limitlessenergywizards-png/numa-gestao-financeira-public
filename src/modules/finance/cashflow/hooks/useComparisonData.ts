'use client';

import { useMemo } from 'react';
import { startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface MonthlyComparisonData {
    month: string;
    monthLabel: string;
    entradas: number;
    saidas: number;
    saldo: number;
    saldoAcumulado: number;
}

export function useComparisonData(transactions: any[], saldoInicial: number = 0) {
    return useMemo(() => {
        // Get last 6 months range
        const today = new Date();
        const endDate = endOfMonth(today);
        const startDate = startOfMonth(subMonths(today, 5));

        const months = eachMonthOfInterval({ start: startDate, end: endDate });

        let currentBalance = saldoInicial; // This should ideally be the balance at the start of the 6-month period

        // NOTE: To do this accurately, we'd need the balance at `startDate`.
        // If saldoInicial is "current balance", we'd need to work backwards.
        // If saldoInicial is "starting balance of the filter period", it might not match this 6-month view if filters are different.
        // For now, let's assume raw transactions and calculate metrics for these months.

        return months.map(month => {
            const monthTransactions = transactions.filter(t =>
                isSameMonth(new Date(t.date), month)
            );

            const entradas = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const saidas = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const saldo = entradas - saidas;
            currentBalance += saldo; // This accumulation logic might be flawed if currentBalance isn't initialized correctly for the start of this specific range.

            return {
                month: format(month, 'yyyy-MM'),
                monthLabel: format(month, 'MMM', { locale: ptBR }).toUpperCase(),
                entradas,
                saidas,
                saldo,
                saldoAcumulado: currentBalance
            };
        });
    }, [transactions, saldoInicial]);
}
