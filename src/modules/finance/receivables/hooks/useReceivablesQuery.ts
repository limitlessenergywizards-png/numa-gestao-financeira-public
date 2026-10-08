/**
 * useReceivablesQuery - React Query hook for receivables
 * 
 * Provides cached receivables data with filters support.
 * Works with the persistence layer for instant load times.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { receivablesKeys, customersKeys, bankAccountsKeys, chartAccountsKeys, STALE_TIMES, GC_TIMES, ReceivablesFilters } from '@/lib/queryKeys';
import { moneyAdd, moneyToNumber } from '@/lib/money';
import { invalidateReceivablesQueries } from '@/lib/queryInvalidation';

// ============================================
// TYPES
// ============================================

export interface Receivable {
  id: string;
  company_id: string;
  customer_id: string;
  category_id: string | null;
  chart_account_id: string | null;
  description: string;
  document_number: string | null;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: 'pendente' | 'parcial' | 'pago' | 'cancelado';
  installment_number: number;
  total_installments: number;
  notes: string | null;
  recurrence: string | null;
  bank_account_id: string | null;
  payment_method: string | null;
  customer?: { name: string };
  chart_account?: { name: string; code: string; cost_type?: string; dre_category?: string | null } | null;
  category?: { name: string; type: string; color: string; icon: string } | null;
  bank_account?: { name: string } | null;
}

export interface Customer {
  id: string;
  name: string;
}

export interface BankAccount {
  id: string;
  name: string;
  current_balance: number;
}

export interface ChartAccount {
  id: string;
  name: string;
  code: string;
}

// ============================================
// QUERY FUNCTIONS
// ============================================

async function fetchReceivables(companyId: string, signal?: AbortSignal): Promise<Receivable[]> {
  const { data, error } = await supabase
    .from('receivables')
    .select(`
      id,
      company_id,
      customer_id,
      category_id,
      chart_account_id,
      description,
      document_number,
      issue_date,
      due_date,
      total_amount,
      paid_amount,
      status,
      installment_number,
      total_installments,
      notes,
      recurrence,
      bank_account_id,
      payment_method,
      customer:customers(name),
      chart_account:chart_of_accounts(name, code, cost_type, dre_category),
      category:categories(name, type, color, icon),
      bank_account:bank_accounts(name)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('due_date', { ascending: true })
    .abortSignal(signal!);

  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any) as Receivable[];
}

async function fetchCustomers(companyId: string, signal?: AbortSignal): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')
    .abortSignal(signal!);

  if (error) throw error;
  return (data || []) as Customer[];
}

async function fetchBankAccounts(companyId: string, signal?: AbortSignal): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('id, name, current_balance')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')
    .abortSignal(signal!);

  if (error) throw error;
  return (data || []) as BankAccount[];
}

async function fetchIncomeChartAccounts(companyId: string, signal?: AbortSignal): Promise<ChartAccount[]> {
  // OPTIMIZATION: Limit to 500 chart accounts per company
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('id, name, code')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .eq('type', 'receita')
    .order('code')
    .limit(500)  // ← Added limit
    .abortSignal(signal!);

  if (error) throw error;
  return (data || []) as ChartAccount[];
}

export interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
}

async function fetchIncomeCategories(companyId: string, signal?: AbortSignal): Promise<Category[]> {
  // OPTIMIZATION: Limit to 200 categories per company
  let query = supabase
    .from('categories')
    .select('id, name, type, color, icon')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .in('type', ['receita', 'ambos'])
    .order('name')
    .limit(200);  // ← Added limit

  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Category[];
}

// ============================================
// MAIN HOOK
// ============================================

export function useReceivablesQuery(companyId: string | null | undefined, filters?: ReceivablesFilters) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? receivablesKeys.list(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchReceivables(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
    placeholderData: keepPreviousData,
  });
}

// ============================================
// SUPPORTING DATA HOOKS
// ============================================

export function useCustomersForReceivables(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? customersKeys.active(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchCustomers(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

export function useBankAccountsForReceivables(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? bankAccountsKeys.list(companyId, false) : ['disabled'],
    queryFn: ({ signal }) => fetchBankAccounts(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

export function useIncomeChartAccountsForReceivables(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? chartAccountsKeys.income(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchIncomeChartAccounts(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

export function useIncomeCategoriesForReceivables(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? ['categories', 'income', companyId] : ['disabled'],
    queryFn: ({ signal }) => fetchIncomeCategories(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

// ============================================
// CONSOLIDATED FORM DATA HOOK
// ============================================

export interface ReceivablesFormData {
  customers: Customer[];
  bankAccounts: BankAccount[];
  chartAccounts: ChartAccount[];
  categories: Category[];
  isLoading: boolean;
}

/**
 * Consolidated hook that provides all reference data needed for receivables forms.
 * Combines customers, bank accounts, chart accounts, and categories into a single hook call.
 *
 * Mirrors usePayablesFormData() pattern from usePayablesQuery.ts.
 */
export function useReceivablesFormData(companyId: string | null | undefined): ReceivablesFormData {
  const enabled = !!companyId;

  const customersQuery = useQuery({
    queryKey: enabled ? customersKeys.active(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchCustomers(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  const bankAccountsQuery = useQuery({
    queryKey: enabled ? bankAccountsKeys.list(companyId, false) : ['disabled'],
    queryFn: ({ signal }) => fetchBankAccounts(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  const chartAccountsQuery = useQuery({
    queryKey: enabled ? chartAccountsKeys.income(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchIncomeChartAccounts(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  const categoriesQuery = useQuery({
    queryKey: enabled ? ['categories', 'income', companyId] : ['disabled'],
    queryFn: ({ signal }) => fetchIncomeCategories(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  return {
    customers: customersQuery.data ?? [],
    bankAccounts: bankAccountsQuery.data ?? [],
    chartAccounts: chartAccountsQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    isLoading: customersQuery.isLoading || bankAccountsQuery.isLoading || chartAccountsQuery.isLoading || categoriesQuery.isLoading,
  };
}

// ============================================
// MUTATIONS WITH OPTIMISTIC UPDATES
// ============================================

type PaymentMethodType = 'dinheiro' | 'pix' | 'transferencia' | 'boleto' | 'cartao' | 'cheque';

interface CreateReceivablePayload {
  company_id: string;
  customer_id: string;
  category_id: string | null;
  chart_account_id: string | null;
  description: string;
  document_number: string | null;
  issue_date: string;
  due_date: string;
  total_amount: number;
  installment_number?: number;
  total_installments?: number;
  parent_id?: string;
  notes: string | null;
  recurrence?: string | null;
  bank_account_id?: string | null;
  payment_method?: PaymentMethodType | null;
  status?: 'pendente' | 'parcial' | 'pago' | 'cancelado';
}

interface UpdateReceivablePayload {
  customer_id: string;
  category_id: string | null;
  chart_account_id: string | null;
  description: string;
  document_number: string | null;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount?: number;
  notes: string | null;
  recurrence?: string | null;
  bank_account_id?: string | null;
  payment_method?: PaymentMethodType | null;
  status?: 'pendente' | 'parcial' | 'pago' | 'cancelado';
}

export function useCreateReceivable(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payloads: CreateReceivablePayload | CreateReceivablePayload[]) => {
      const items = Array.isArray(payloads) ? payloads : [payloads];
      const { data: createdReceivables, error } = await supabase
        .from('receivables')
        .insert(items)
        .select();

      if (error) throw error;

      // Sync to Transactions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transactionsToCreate = createdReceivables.map((receivable: any) => ({
        company_id: receivable.company_id,
        bank_account_id: receivable.bank_account_id || '', // Note: Requires a bank account for strict relation
        chart_account_id: receivable.chart_account_id,
        category_id: receivable.category_id,
        customer_id: receivable.customer_id,
        description: receivable.description,
        amount: receivable.total_amount,
        transaction_date: receivable.due_date,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payment_method: receivable.payment_method as any,
        document_number: receivable.document_number,
        type: 'entrada' as const,
        nature: receivable.status === 'pago' ? 'realizado' : 'previsao',
        forecast_basis: `receivable:${receivable.id}`,
        notes: receivable.notes,
        recurrence: receivable.recurrence,
      }));

      // Filter out those without bank_account_id to prevent error (though they should have one if possible)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validTransactions = transactionsToCreate.filter((t: any) => t.bank_account_id !== '');

      if (validTransactions.length > 0) {
        const { error: txError } = await supabase
          .from('transactions')
          .insert(validTransactions);

        if (txError) throw txError;
      }

      return createdReceivables;
    },
    // ─── Optimistic: Append to cache INSTANTLY ───
    onMutate: async (payloads) => {
      const items = Array.isArray(payloads) ? payloads : [payloads];
      await queryClient.cancelQueries({ queryKey: receivablesKeys.all });
      const previousData = queryClient.getQueriesData<Receivable[]>({ queryKey: receivablesKeys.all });
      queryClient.setQueriesData<Receivable[]>(
        { queryKey: receivablesKeys.all },
        (old) => {
          if (!old) return old;
          const optimisticItems = items.map((item) => ({
            ...item,
            id: `optimistic-${crypto.randomUUID()}`,
            paid_amount: 0,
            status: 'pendente' as const,
            installment_number: item.installment_number ?? 1,
            total_installments: item.total_installments ?? 1,
            category_id: item.category_id ?? null,
          }));
          return [...old, ...optimisticItems] as Receivable[];
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
    },
    onSuccess: (data) => {
      // Force immediate refetch with real data (replaces optimistic items)
      const cid = data?.[0]?.company_id || companyId;
      if (cid) {
        queryClient.refetchQueries({ queryKey: receivablesKeys.list(cid) });
      }
    },
    onSettled: (_data, _error, variables) => {
      const items = Array.isArray(variables) ? variables : [variables];
      const cid = items[0]?.company_id || companyId;
      if (cid) invalidateReceivablesQueries(queryClient, cid);
    },
  });
}

export function useUpdateReceivable(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateReceivablePayload }) => {
      const { data: updatedReceivable, error } = await supabase
        .from('receivables')
        .update(payload)
        .eq('id', id)
        .eq('company_id', companyId!)
        .select()
        .single();

      if (error) throw error;

      // Update linked transaction
      if (payload.bank_account_id) {
        const { error: txError } = await supabase
          .from('transactions')
          .update({
            bank_account_id: payload.bank_account_id,
            chart_account_id: payload.chart_account_id,
            category_id: payload.category_id,
            customer_id: payload.customer_id,
            description: payload.description,
            amount: payload.total_amount,
            transaction_date: payload.due_date,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            payment_method: payload.payment_method as any,
            document_number: payload.document_number,
            notes: payload.notes,
            recurrence: payload.recurrence,
            ...(payload.status ? { nature: payload.status === 'pago' ? 'realizado' : 'previsao' } : {})
          })
          .eq('forecast_basis', `receivable:${id}`);

        if (txError) console.error("Error updating synced transaction:", txError);
      }

      return updatedReceivable;
    },
    // ─── Optimistic: Patch item in cache INSTANTLY ───
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: receivablesKeys.all });
      const previousData = queryClient.getQueriesData<Receivable[]>({ queryKey: receivablesKeys.all });
      queryClient.setQueriesData<Receivable[]>(
        { queryKey: receivablesKeys.all },
        (old) => old?.map((item) => item.id === id ? { ...item, ...payload } : item)
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      if (companyId) invalidateReceivablesQueries(queryClient, companyId);
    },
  });
}

export function useDeleteReceivable(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idOrIds: string | string[]) => {
      const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      const bases = ids.map(id => `receivable:${id}`);
      const now = new Date().toISOString();

      // Soft delete the linked payment_records
      const { error: prError } = await supabase
        .from('payment_records')
        .update({
          is_deleted: true,
          deleted_at: now,
        })
        .in('receivable_id', ids);

      if (prError) throw prError;

      // Soft delete the receivables
      const { error } = await supabase
        .from('receivables')
        .update({
          is_deleted: true,
          deleted_at: now,
          deletion_reason: 'Excluído pelo usuário',
        })
        .in('id', ids)
        .eq('company_id', companyId!);

      if (error) throw error;

      // Soft delete the linked transactions
      await supabase
        .from('transactions')
        .update({
          is_deleted: true,
          deleted_at: now,
          deletion_reason: 'Receivable excluído pelo usuário',
        })
        .in('forecast_basis', bases);
    },
    // ─── Optimistic: Remove from cache INSTANTLY ───
    onMutate: async (idOrIds) => {
      const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      await queryClient.cancelQueries({ queryKey: receivablesKeys.all });
      const previousData = queryClient.getQueriesData<Receivable[]>({ queryKey: receivablesKeys.all });
      queryClient.setQueriesData<Receivable[]>(
        { queryKey: receivablesKeys.all },
        (old) => old?.filter((item) => !ids.includes(item.id))
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      if (companyId) invalidateReceivablesQueries(queryClient, companyId);
    },
  });
}

interface PaymentPayload {
  receivable_id: string;
  bank_account_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string | null;
}

export function useRecordPayment(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PaymentPayload) => {
      const { data, error } = await supabase
        .from('payment_records')
        .insert({
          receivable_id: payload.receivable_id,
          company_id: companyId!,
          bank_account_id: payload.bank_account_id,
          amount: payload.amount,
          payment_date: payload.payment_date,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payment_method: payload.payment_method as any,
          notes: payload.notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Update transaction status to Realizado
      if (payload.receivable_id) {
        await supabase
          .from('transactions')
          .update({
            nature: 'realizado',
            transaction_date: payload.payment_date,
            // We intentionally don't update 'amount' because standard sync maintains the original estimated amount.
            // Adjustments to splits should rather happen on the payable/receivable itself.
          })
          .eq('forecast_basis', `receivable:${payload.receivable_id}`);
      }

      return data;
    },
    // ─── Optimistic: Update paid_amount and status INSTANTLY ───
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: receivablesKeys.all });
      const previousData = queryClient.getQueriesData<Receivable[]>({ queryKey: receivablesKeys.all });
      queryClient.setQueriesData<Receivable[]>(
        { queryKey: receivablesKeys.all },
        (old) => old?.map((item) => {
          if (item.id !== payload.receivable_id) return item;
          const newPaid = moneyToNumber(moneyAdd(item.paid_amount, payload.amount));
          const newStatus = newPaid >= item.total_amount ? 'pago' : 'parcial';
          return { ...item, paid_amount: newPaid, status: newStatus as Receivable['status'] };
        })
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      if (companyId) invalidateReceivablesQueries(queryClient, companyId);
    },
  });
}

export function useBulkUpdateReceivableStatus(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * OPTIMIZATION: Single Supabase RPC call replaces N+1 pattern.
     * Before: 3N round-trips (fetch + update + tx update per item).
     * After:  1 RPC call — all logic runs server-side in a single transaction.
     */
    mutationFn: async ({ ids, status }: { ids: string[]; status: 'pendente' | 'pago' }) => {
      if (!ids.length) return [];

      const { data, error } = await supabase.rpc('bulk_update_receivable_status', {
        p_ids: ids,
        p_status: status,
      });

      if (error) throw error;
      return data ?? [];
    },
    // ─── Optimistic update ───
    onMutate: async ({ ids, status }) => {
      await queryClient.cancelQueries({ queryKey: receivablesKeys.all });
      const previousData = queryClient.getQueriesData<Receivable[]>({ queryKey: receivablesKeys.all });
      queryClient.setQueriesData<Receivable[]>(
        { queryKey: receivablesKeys.all },
        (old) => old?.map((item) => {
          if (!ids.includes(item.id)) return item;
          const newPaid = status === 'pago' ? item.total_amount : 0;
          return { ...item, status, paid_amount: newPaid } as Receivable;
        })
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      if (companyId) invalidateReceivablesQueries(queryClient, companyId);
    },
  });
}

