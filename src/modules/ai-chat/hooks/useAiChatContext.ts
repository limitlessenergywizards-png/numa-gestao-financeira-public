'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useDashboardQueries } from '@/modules/analytics/dashboard/hooks/useDashboardQueries';
import { getDateRange } from '@/lib/periodUtils';

export interface AiChatContextData {
    companyId?: string;
    userName?: string;
    companyName?: string;
    currentBalance?: number;
    monthlyReceivables?: number;
    monthlyPayables?: number;
    overdueReceivables?: number;
    overduePayables?: number;
}

export function useAiChatContext(): AiChatContextData {
    const { profile } = useAuth();
    const { currentCompany } = useCompany();

    // Get current month's data
    const dateRange = useMemo(() => getDateRange('month'), []);
    const { receivables, payables, bankAccounts } = useDashboardQueries(currentCompany?.id, dateRange, { minimal: true });

    const contextData = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];

        // Calculate current balance
        const currentBalance = bankAccounts.reduce((sum, acc) => sum + acc.current_balance, 0);

        // Calculate receivables
        let monthlyReceivables = 0;
        let overdueReceivables = 0;

        receivables.forEach(r => {
            monthlyReceivables += Number(r.total_amount);
            if (r.due_date < today) {
                overdueReceivables += (Number(r.total_amount) - Number(r.paid_amount));
            }
        });

        // Calculate payables
        let monthlyPayables = 0;
        let overduePayables = 0;

        payables.forEach(p => {
            monthlyPayables += Number(p.total_amount);
            if (p.due_date < today) {
                overduePayables += (Number(p.total_amount) - Number(p.paid_amount));
            }
        });

        return {
            companyId: currentCompany?.id,
            userName: profile?.full_name || 'Usuário',
            companyName: currentCompany?.name || 'Empresa',
            currentBalance,
            monthlyReceivables,
            monthlyPayables,
            overdueReceivables,
            overduePayables,
        };
    }, [profile, currentCompany, receivables, payables, bankAccounts]);

    return contextData;
}
