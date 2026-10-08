/**
 * useBudgets - React Query hooks for budgets (orcamentos)
 *
 * Query + mutation hooks with optimistic updates, rollback, and toast feedback.
 * Follows the Omniscient Cache protocol.
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchBudgets, createBudget, updateBudget, deleteBudget } from '../services/budgetApi';
import { Budget, BudgetWithRealized, CreateBudgetPayload, UpdateBudgetPayload } from '../types';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BUDGETS_KEYS, STALE_TIMES, GC_TIMES } from '@/lib/queryKeys';
import { invalidateBudgetQueries } from '@/lib/queryInvalidation';

export function useBudgets(startDate?: string, endDate?: string) {
    const { currentCompany } = useCompany();
    const queryClient = useQueryClient();
    const companyId = currentCompany?.id;

    // 1. Fetch budgets for the company
    const { data: budgets, isLoading: isBudgetsLoading, isFetching: isBudgetsFetching, error: budgetsError } = useQuery({
        queryKey: BUDGETS_KEYS.list(companyId || '', startDate, endDate),
        queryFn: () => fetchBudgets(companyId!, startDate, endDate),
        enabled: !!companyId,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
        placeholderData: keepPreviousData,
    });

    // 2. Fetch realized amounts via server-side RPC (runs in PARALLEL with budgets query)
    const { data: realizedAmounts, isLoading: isRealizedLoading } = useQuery({
        queryKey: BUDGETS_KEYS.transactions(companyId || '', startDate, endDate),
        queryFn: async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.rpc as any)('get_budget_realized_amounts', {
                p_company_id: companyId!,
            });
            if (error) throw error;
            return (data || []) as Array<{ budget_id: string; realized_amount: number }>;
        },
        enabled: !!companyId,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
    });

    // 3. Merge budgets with realized amounts (simple Map lookup — O(B))
    const budgetsWithRealized = useMemo<BudgetWithRealized[]>(() => {
        if (!budgets) return [];
        const realizedMap = new Map(
            (realizedAmounts || []).map(r => [r.budget_id, Number(r.realized_amount)])
        );
        return budgets.map((budget) => {
            const realized_amount = realizedMap.get(budget.id) ?? 0;
            const progress_percentage = budget.amount > 0 ? (realized_amount / budget.amount) * 100 : 0;
            const variance_amount = budget.amount - realized_amount;
            return {
                ...budget,
                realized_amount,
                progress_percentage: Math.min(progress_percentage, 100),
                variance_amount,
            };
        });
    }, [budgets, realizedAmounts]);

    // ═══════════════════════════════════════════════════════════
    // MUTATIONS WITH OPTIMISTIC UPDATES
    // ═══════════════════════════════════════════════════════════

    const createMutation = useMutation({
        mutationFn: (payload: CreateBudgetPayload) => createBudget(payload),
        // ─── Optimistic: Append to cache INSTANTLY ───
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: BUDGETS_KEYS.all });
            const previousData = queryClient.getQueriesData<Budget[]>({ queryKey: BUDGETS_KEYS.all });

            queryClient.setQueriesData<Budget[]>(
                { queryKey: BUDGETS_KEYS.all },
                (old) => {
                    if (!old) return old;
                    const optimistic: Budget = {
                        ...payload,
                        id: `optimistic-${crypto.randomUUID()}`,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                    return [optimistic, ...old];
                }
            );
            return { previousData };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousData) {
                for (const [key, data] of context.previousData) {
                    queryClient.setQueryData(key, data);
                }
            }
            toast.error('Erro ao criar orçamento. Tente novamente.');
        },
        onSuccess: () => {
            toast.success('Orçamento criado com sucesso!');
        },
        onSettled: () => {
            invalidateBudgetQueries(queryClient, companyId!);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateBudgetPayload }) => updateBudget(id, companyId!, payload),
        // ─── Optimistic: Patch item in cache INSTANTLY ───
        onMutate: async ({ id, payload }) => {
            await queryClient.cancelQueries({ queryKey: BUDGETS_KEYS.all });
            const previousData = queryClient.getQueriesData<Budget[]>({ queryKey: BUDGETS_KEYS.all });

            queryClient.setQueriesData<Budget[]>(
                { queryKey: BUDGETS_KEYS.all },
                (old) => old?.map((item) =>
                    item.id === id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item
                )
            );
            return { previousData };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousData) {
                for (const [key, data] of context.previousData) {
                    queryClient.setQueryData(key, data);
                }
            }
            toast.error('Erro ao atualizar orçamento. Tente novamente.');
        },
        onSuccess: () => {
            toast.success('Orçamento atualizado!');
        },
        onSettled: () => {
            invalidateBudgetQueries(queryClient, companyId!);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteBudget(id, companyId!),
        // ─── Optimistic: Remove from cache INSTANTLY ───
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: BUDGETS_KEYS.all });
            const previousData = queryClient.getQueriesData<Budget[]>({ queryKey: BUDGETS_KEYS.all });

            queryClient.setQueriesData<Budget[]>(
                { queryKey: BUDGETS_KEYS.all },
                (old) => old?.filter((item) => item.id !== id)
            );
            return { previousData };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousData) {
                for (const [key, data] of context.previousData) {
                    queryClient.setQueryData(key, data);
                }
            }
            toast.error('Erro ao excluir orçamento. Tente novamente.');
        },
        onSuccess: () => {
            toast.success('Orçamento excluído.');
        },
        onSettled: () => {
            invalidateBudgetQueries(queryClient, companyId!);
        },
    });

    return {
        budgets: budgetsWithRealized,
        isLoading: isBudgetsLoading || isRealizedLoading,
        isFetching: isBudgetsFetching,
        error: budgetsError,
        createBudget: createMutation.mutateAsync,
        updateBudget: updateMutation.mutateAsync,
        deleteBudget: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
