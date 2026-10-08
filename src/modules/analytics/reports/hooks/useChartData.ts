'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FINANCIAL_INDICATORS_KEYS, STALE_TIMES, GC_TIMES } from '@/lib/queryKeys';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from '@/lib/periodUtils';

// ─── Types ──────────────────────────────────────────

interface MonthlyTransaction {
    transaction_date: string;
    type: string;
    amount: number;
}

interface CategoryTransaction {
    amount: number;
    type: string;
    categories: { name: string } | null;
}

interface BudgetRecord {
    category_name: string;
    amount: number;
    start_date: string;
    end_date: string;
}

// ─── Waterfall Data Point ───────────────────────────
export interface WaterfallPoint {
    name: string;
    value: number;
    fill: string;
    /** For Recharts floating bar: [start, end] */
    range: [number, number];
}

// ─── Sankey Data ────────────────────────────────────
export interface SankeyData {
    nodes: { name: string }[];
    links: { source: number; target: number; value: number }[];
}

// ─── Monthly Trend Point ────────────────────────────
export interface TrendPoint {
    month: string;
    receita: number;
    despesa: number;
    lucro: number;
}

// ─── Budget vs Actual Point ─────────────────────────
export interface BudgetVsActualPoint {
    name: string;
    orcado: number;
    realizado: number;
}

// ─── Result ─────────────────────────────────────────
export interface ChartDataResult {
    waterfall: WaterfallPoint[];
    sankey: SankeyData;
    trend: TrendPoint[];
    budgetVsActual: BudgetVsActualPoint[];
    isLoading: boolean;
    hasData: boolean;
}

// ─── Fetch Functions ────────────────────────────────

async function fetchLast12MonthsTransactions(companyId: string): Promise<MonthlyTransaction[]> {
    const startDate = format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd');

    const { data, error } = await (supabase
        .from('transactions')
        .select('transaction_date, type, amount')
        .eq('company_id', companyId)
        .eq('is_deleted', false) as any)
        .eq('status', 'completed')
        .gte('transaction_date', startDate)
        .order('transaction_date', { ascending: true });

    if (error) throw error;
    return (data ?? []) as MonthlyTransaction[];
}

async function fetchCategoryBreakdown(companyId: string, dateRange?: DateRange): Promise<CategoryTransaction[]> {
    const startDate = dateRange?.start || format(subMonths(new Date(), 1), 'yyyy-MM-dd');
    const endDate = dateRange?.end || format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await (supabase
        .from('transactions')
        .select(`amount, type, categories(name)`)
        .eq('company_id', companyId)
        .eq('is_deleted', false) as any)
        .eq('status', 'completed')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

    if (error) throw error;
    return (data ?? []) as unknown as CategoryTransaction[];
}

async function fetchActiveBudgets(companyId: string): Promise<BudgetRecord[]> {
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
        .from('orcamentos')
        .select('category_name, amount, start_date, end_date')
        .eq('company_id', companyId)
        .lte('start_date', today)
        .gte('end_date', today);

    if (error) throw error;
    return (data ?? []) as BudgetRecord[];
}

async function fetchCurrentMonthExpensesByCategory(companyId: string, dateRange?: DateRange) {
    const startDate = dateRange?.start || format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endDate = dateRange?.end || format(endOfMonth(new Date()), 'yyyy-MM-dd');

    const { data, error } = await (supabase
        .from('transactions')
        .select(`amount, chart_accounts(name)`)
        .eq('company_id', companyId)
        .eq('type', 'saida')
        .eq('is_deleted', false) as any)
        .eq('status', 'completed')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

    if (error) throw error;
    return (data ?? []) as unknown as { amount: number; categories: { name: string } | null }[];
}

// ─── Hook ───────────────────────────────────────────

export function useChartData(companyId: string | null | undefined, dateRange?: DateRange): ChartDataResult {
    const enabled = !!companyId;

    const trendQuery = useQuery({
        queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'chart-trend-12m'] : ['disabled'],
        queryFn: () => fetchLast12MonthsTransactions(companyId!),
        enabled,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
    });

    const categoryQuery = useQuery({
        queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'chart-categories', dateRange?.start, dateRange?.end] : ['disabled'],
        queryFn: () => fetchCategoryBreakdown(companyId!, dateRange),
        enabled,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
    });

    const budgetQuery = useQuery({
        queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'chart-budgets'] : ['disabled'],
        queryFn: () => fetchActiveBudgets(companyId!),
        enabled,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
    });

    const waterfallQuery = useQuery({
        queryKey: enabled ? [...FINANCIAL_INDICATORS_KEYS.indicators(companyId), 'chart-waterfall', dateRange?.start, dateRange?.end] : ['disabled'],
        queryFn: () => fetchCurrentMonthExpensesByCategory(companyId!, dateRange),
        enabled,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
    });

    const result = useMemo(() => {
        const trendRaw = trendQuery.data ?? [];
        const catRaw = categoryQuery.data ?? [];
        const budgets = budgetQuery.data ?? [];
        const expByCat = waterfallQuery.data ?? [];

        // ─── TREND (12 months line chart) ───────────────
        const monthMap = new Map<string, { receita: number; despesa: number }>();
        for (let i = 11; i >= 0; i--) {
            const d = subMonths(new Date(), i);
            const key = format(d, 'yyyy-MM');
            monthMap.set(key, { receita: 0, despesa: 0 });
        }
        trendRaw.forEach(t => {
            const key = t.transaction_date.substring(0, 7);
            const entry = monthMap.get(key);
            if (entry) {
                if (t.type === 'entrada') entry.receita += Number(t.amount);
                else entry.despesa += Number(t.amount);
            }
        });
        const trend: TrendPoint[] = [];
        monthMap.forEach((val, key) => {
            const d = new Date(key + '-15');
            trend.push({
                month: format(d, 'MMM/yy', { locale: ptBR }),
                receita: Math.round(val.receita * 100) / 100,
                despesa: Math.round(val.despesa * 100) / 100,
                lucro: Math.round((val.receita - val.despesa) * 100) / 100,
            });
        });

        // ─── WATERFALL ───────────────────────────────────
        const curMonthKey = format(new Date(), 'yyyy-MM');
        const curMonth = monthMap.get(curMonthKey) ?? { receita: 0, despesa: 0 };

        let fixedCosts = 0;
        let variableCosts = 0;
        catRaw.filter(t => t.type === 'saida').forEach(t => {
            variableCosts += Number(t.amount);
        });
        const totalExpenses = variableCosts;
        const lucro = curMonth.receita - totalExpenses;

        const waterfall: WaterfallPoint[] = [];
        let running = 0;

        waterfall.push({
            name: 'Receita',
            value: curMonth.receita,
            fill: 'hsl(142, 76%, 36%)',
            range: [0, curMonth.receita],
        });
        running = curMonth.receita;

        waterfall.push({
            name: 'Despesas',
            value: -totalExpenses,
            fill: 'hsl(0, 84%, 55%)',
            range: [running - totalExpenses, running],
        });
        running -= totalExpenses;

        waterfall.push({
            name: 'Lucro',
            value: lucro,
            fill: lucro >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 55%)',
            range: [0, running],
        });

        // ─── SANKEY ──────────────────────────────────────
        const catTotals = new Map<string, number>();
        catRaw.filter(t => t.type === 'saida').forEach(t => {
            const name = t.categories?.name ?? 'Outros';
            catTotals.set(name, (catTotals.get(name) ?? 0) + Number(t.amount));
        });

        const sortedCats = [...catTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

        const sankeyNodes: { name: string }[] = [{ name: 'Receita' }];
        const sankeyLinks: { source: number; target: number; value: number }[] = [];

        sortedCats.forEach(([catName, total]) => {
            const targetIdx = sankeyNodes.length;
            sankeyNodes.push({ name: catName });
            sankeyLinks.push({ source: 0, target: targetIdx, value: Math.round(total * 100) / 100 });
        });

        const topTotal = sortedCats.reduce((s, [, v]) => s + v, 0);
        const allExpTotal = [...catTotals.values()].reduce((s, v) => s + v, 0);
        const remaining = allExpTotal - topTotal;
        if (remaining > 0) {
            const targetIdx = sankeyNodes.length;
            sankeyNodes.push({ name: 'Outros' });
            sankeyLinks.push({ source: 0, target: targetIdx, value: Math.round(remaining * 100) / 100 });
        }

        if (lucro > 0) {
            const targetIdx = sankeyNodes.length;
            sankeyNodes.push({ name: 'Lucro' });
            sankeyLinks.push({ source: 0, target: targetIdx, value: Math.round(lucro * 100) / 100 });
        }

        const sankey: SankeyData = {
            nodes: sankeyNodes,
            links: sankeyLinks.length > 0 ? sankeyLinks : [],
        };

        // ─── BUDGET VS ACTUAL ───────────────────────────
        const expByCatMap = new Map<string, number>();
        expByCat.forEach(e => {
            const name = e.categories?.name ?? 'Outros';
            expByCatMap.set(name, (expByCatMap.get(name) ?? 0) + Number(e.amount));
        });

        const budgetVsActual: BudgetVsActualPoint[] = budgets.map(b => ({
            name: b.category_name.length > 15 ? b.category_name.substring(0, 15) + '…' : b.category_name,
            orcado: Number(b.amount),
            realizado: expByCatMap.get(b.category_name) ?? 0,
        }));

        const hasData = trendRaw.length > 0 || catRaw.length > 0;

        return { waterfall, sankey, trend, budgetVsActual, hasData };
    }, [trendQuery.data, categoryQuery.data, budgetQuery.data, waterfallQuery.data]);

    const isLoading = trendQuery.isLoading || categoryQuery.isLoading || budgetQuery.isLoading || waterfallQuery.isLoading;

    return { ...result, isLoading };
}
