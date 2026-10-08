'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FINANCIAL_INDICATORS_KEYS, STALE_TIMES, GC_TIMES } from '@/lib/queryKeys';
import { differenceInDays, parseISO, format, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from '@/lib/periodUtils';

// ─── Types ──────────────────────────────────────────
interface TransactionRecord {
    amount: number;
    type: string;
    transaction_date: string;
    chart_accounts: { cost_type: 'fixed' | 'variable' } | null;
}

interface OverdueReceivable {
    total_amount: number;
    paid_amount: number;
    due_date: string;
    status: string;
}

interface BankBalance {
    current_balance: number;
}

interface PendingItem {
    total_amount: number;
    paid_amount: number;
}

// ─── Result Interface ───────────────────────────────
export interface StrategicIndicatorsResult {
    receitaBruta: number;
    totalDespesas: number;
    lucroLiquido: number;
    margemLiquida: number;
    ebitda: number;
    margemEbitda: number;
    lucroOperacional: number;
    margemContribuicao: number;
    margemContribuicaoPct: number;
    liquidezCorrente: number;
    liquidezSeca: number;
    liquidezImediata: number;
    disponivelImediato: number;
    indiceEndividamento: number;
    totalObrigacoes: number;
    totalAtivos: number;
    cicloOperacional: number;
    cicloFinanceiro: number;
    necessidadeCapitalGiro: number;
    taxaInadimplencia: number;
    totalVencido: number;
    totalRecebiveis: number;
    agingBuckets: {
        d1_15: number;
        d16_30: number;
        d31_60: number;
        d60plus: number;
    };
    isLoading: boolean;
    hasData: boolean;
}

// ─── Fetch Functions ────────────────────────────────

async function fetchCurrentMonthTransactions(companyId: string, dateRange?: DateRange): Promise<TransactionRecord[]> {
    const startDate = dateRange?.start || format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endDate = dateRange?.end || format(endOfMonth(new Date()), 'yyyy-MM-dd');

    const { data, error } = await (supabase
        .from('transactions')
        .select(`amount, type, transaction_date, chart_accounts(cost_type)`)
        .eq('company_id', companyId)
        .eq('is_deleted', false) as any)
        .eq('status', 'completed')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

    if (error) throw error;
    return (data ?? []) as TransactionRecord[];
}

async function fetchBankBalances(companyId: string): Promise<BankBalance[]> {
    const { data, error } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('company_id', companyId)
        .eq('is_active', true);

    if (error) throw error;
    return (data ?? []) as BankBalance[];
}

async function fetchAllPendingReceivables(companyId: string): Promise<PendingItem[]> {
    const { data, error } = await supabase
        .from('receivables')
        .select('total_amount, paid_amount')
        .eq('company_id', companyId)
        .in('status', ['pendente', 'parcial']);

    if (error) throw error;
    return (data ?? []) as PendingItem[];
}

async function fetchAllPendingPayables(companyId: string): Promise<PendingItem[]> {
    const { data, error } = await supabase
        .from('payables')
        .select('total_amount, paid_amount')
        .eq('company_id', companyId)
        .in('status', ['pendente', 'parcial']);

    if (error) throw error;
    return (data ?? []) as PendingItem[];
}

async function fetchOverdueReceivables(companyId: string): Promise<OverdueReceivable[]> {
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
        .from('receivables')
        .select('total_amount, paid_amount, due_date, status')
        .eq('company_id', companyId)
        .in('status', ['pendente', 'parcial'])
        .lt('due_date', today);

    if (error) throw error;
    return (data ?? []) as OverdueReceivable[];
}

async function fetchTotalReceivablesAll(companyId: string): Promise<PendingItem[]> {
    const { data, error } = await supabase
        .from('receivables')
        .select('total_amount, paid_amount')
        .eq('company_id', companyId)
        .neq('status', 'cancelado');

    if (error) throw error;
    return (data ?? []) as PendingItem[];
}

// ─── Hook ───────────────────────────────────────────

export function useStrategicIndicators(
    companyId: string | null | undefined,
    pmr: number,
    pmp: number,
    dateRange?: DateRange,
): StrategicIndicatorsResult {
    const enabled = !!companyId;

    const txQuery = useQuery({
        queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'strategic-tx', dateRange?.start, dateRange?.end] : ['disabled'],
        queryFn: () => fetchCurrentMonthTransactions(companyId!, dateRange),
        enabled,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
    });

    const bankQuery = useQuery({
        queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'strategic-banks'] : ['disabled'],
        queryFn: () => fetchBankBalances(companyId!),
        enabled,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
    });

    // PERF: Reuse same queryKeys as useFinancialIndicators for identical data.
    // React Query deduplicates: 2 fewer network requests on reports page.
    const recvQuery = useQuery({
        queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'pending-receivables'] : ['disabled'],
        queryFn: () => fetchAllPendingReceivables(companyId!),
        enabled,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
    });

    const payQuery = useQuery({
        queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'pending-payables'] : ['disabled'],
        queryFn: () => fetchAllPendingPayables(companyId!),
        enabled,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
    });

    const overdueQuery = useQuery({
        queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'strategic-overdue'] : ['disabled'],
        queryFn: () => fetchOverdueReceivables(companyId!),
        enabled,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
    });

    const totalRecvQuery = useQuery({
        queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'strategic-total-recv'] : ['disabled'],
        queryFn: () => fetchTotalReceivablesAll(companyId!),
        enabled,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
    });

    const result = useMemo((): Omit<StrategicIndicatorsResult, 'isLoading'> => {
        const transactions = txQuery.data ?? [];
        const banks = bankQuery.data ?? [];
        const pendingRecv = recvQuery.data ?? [];
        const pendingPay = payQuery.data ?? [];
        const overdueRecv = overdueQuery.data ?? [];
        const totalRecvAll = totalRecvQuery.data ?? [];

        // ─── RENTABILIDADE ──────────────────────────────
        const receitaBruta = transactions
            .filter(t => t.type === 'entrada')
            .reduce((s, t) => s + Number(t.amount), 0);

        let totalFixedCosts = 0;
        let totalVariableCosts = 0;
        transactions
            .filter(t => t.type === 'saida')
            .forEach(t => {
                const amt = Number(t.amount);
                if (t.chart_accounts?.cost_type === 'fixed') {
                    totalFixedCosts += amt;
                } else {
                    totalVariableCosts += amt;
                }
            });

        const totalDespesas = totalFixedCosts + totalVariableCosts;
        const lucroLiquido = receitaBruta - totalDespesas;
        const margemLiquida = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;
        const ebitda = receitaBruta - totalDespesas;
        const margemEbitda = receitaBruta > 0 ? (ebitda / receitaBruta) * 100 : 0;
        const lucroOperacional = receitaBruta - totalDespesas;
        const margemContribuicao = receitaBruta - totalVariableCosts;
        const margemContribuicaoPct = receitaBruta > 0 ? (margemContribuicao / receitaBruta) * 100 : 0;

        // ─── LIQUIDEZ ───────────────────────────────────
        const disponivelImediato = banks.reduce((s, b) => s + Number(b.current_balance), 0);

        const totalRecvPending = pendingRecv.reduce(
            (s, r) => s + (Number(r.total_amount) - Number(r.paid_amount)), 0
        );
        const totalPayPending = pendingPay.reduce(
            (s, p) => s + (Number(p.total_amount) - Number(p.paid_amount)), 0
        );

        const ativoCirculante = disponivelImediato + totalRecvPending;
        const liquidezCorrente = totalPayPending > 0 ? ativoCirculante / totalPayPending : 0;
        const liquidezSeca = liquidezCorrente;
        const liquidezImediata = totalPayPending > 0 ? disponivelImediato / totalPayPending : 0;

        // ─── ENDIVIDAMENTO ──────────────────────────────
        const totalObrigacoes = totalPayPending;
        const totalAtivos = ativoCirculante;
        const indiceEndividamento = totalAtivos > 0 ? (totalObrigacoes / totalAtivos) * 100 : 0;

        // ─── CICLOS FINANCEIROS ─────────────────────────
        const cicloOperacional = pmr;
        const cicloFinanceiro = pmr - pmp;

        const diasNoMes = 30;
        const receitaDiaria = receitaBruta / diasNoMes;
        const despesaDiaria = totalDespesas / diasNoMes;
        const necessidadeCapitalGiro = (pmr * receitaDiaria) - (pmp * despesaDiaria);

        // ─── INADIMPLÊNCIA ──────────────────────────────
        const today = new Date();

        const totalVencido = overdueRecv.reduce(
            (s, r) => s + (Number(r.total_amount) - Number(r.paid_amount)), 0
        );
        const totalRecebiveis = totalRecvAll.reduce(
            (s, r) => s + Number(r.total_amount), 0
        );
        const taxaInadimplencia = totalRecebiveis > 0 ? (totalVencido / totalRecebiveis) * 100 : 0;

        // Aging buckets
        let d1_15 = 0, d16_30 = 0, d31_60 = 0, d60plus = 0;
        overdueRecv.forEach(r => {
            const dueDate = parseISO(r.due_date);
            const daysOverdue = differenceInDays(today, dueDate);
            const balance = Number(r.total_amount) - Number(r.paid_amount);

            if (daysOverdue <= 15) d1_15 += balance;
            else if (daysOverdue <= 30) d16_30 += balance;
            else if (daysOverdue <= 60) d31_60 += balance;
            else d60plus += balance;
        });

        const hasData = transactions.length > 0 || pendingRecv.length > 0 || pendingPay.length > 0 || banks.length > 0;

        return {
            receitaBruta, totalDespesas, lucroLiquido, margemLiquida,
            ebitda, margemEbitda, lucroOperacional,
            margemContribuicao, margemContribuicaoPct,
            liquidezCorrente, liquidezSeca, liquidezImediata, disponivelImediato,
            indiceEndividamento, totalObrigacoes, totalAtivos,
            cicloOperacional, cicloFinanceiro, necessidadeCapitalGiro,
            taxaInadimplencia, totalVencido, totalRecebiveis,
            agingBuckets: { d1_15, d16_30, d31_60, d60plus },
            hasData,
        };
    }, [txQuery.data, bankQuery.data, recvQuery.data, payQuery.data, overdueQuery.data, totalRecvQuery.data, pmr, pmp]);

    const isLoading = txQuery.isLoading || bankQuery.isLoading || recvQuery.isLoading ||
        payQuery.isLoading || overdueQuery.isLoading || totalRecvQuery.isLoading;

    return { ...result, isLoading };
}
