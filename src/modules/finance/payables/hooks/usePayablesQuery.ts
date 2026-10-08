/**
 * usePayablesQuery - React Query hook for payables
 * 
 * Provides cached payables data with filters support.
 * Works with the persistence layer for instant load times.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { payablesKeys, suppliersKeys, bankAccountsKeys, chartAccountsKeys, STALE_TIMES, GC_TIMES, PayablesFilters } from '@/lib/queryKeys';
import { moneyAdd, moneyToNumber } from '@/lib/money';
import { invalidatePayablesQueries } from '@/lib/queryInvalidation';

// ============================================
// TYPES
// ============================================

export interface Payable {
  id: string;
  company_id: string;
  supplier_id: string | null;
  category_id: string | null;
  chart_account_id: string | null;
  cost_center_id: string | null;
  description: string;
  document_number: string | null;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: 'pendente' | 'parcial' | 'pago' | 'cancelado';
  installment_number: number | null;
  total_installments: number | null;
  notes: string | null;
  bank_account_id?: string | null;
  payment_method?: string | null;
  recurrence?: string | null;
  supplier?: { name: string };
  chart_account?: { name: string; code: string; cost_type?: string; dre_category?: string | null } | null;
  category?: { name: string } | null;
  is_debt_payment?: boolean | null;
}

export interface Supplier {
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

export interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
}

// ============================================
// QUERY FUNCTIONS
// ============================================

async function fetchPayables(companyId: string, signal?: AbortSignal): Promise<Payable[]> {
  let query = supabase
    .from('payables')
    .select(`
      id,
      company_id,
      supplier_id,
      category_id,
      chart_account_id,
      cost_center_id,
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
      supplier:suppliers(name),
      chart_account:chart_of_accounts(name, code, cost_type, dre_category),
      category:categories(name),
      is_debt_payment
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('due_date', { ascending: true });

  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Payable[];
}

async function fetchSuppliers(companyId: string, signal?: AbortSignal): Promise<Supplier[]> {
  let query = supabase
    .from('suppliers')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name');

  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Supplier[];
}

async function fetchBankAccounts(companyId: string, signal?: AbortSignal): Promise<BankAccount[]> {
  let query = supabase
    .from('bank_accounts')
    .select('id, name, current_balance')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name');

  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as BankAccount[];
}

async function fetchExpenseChartAccounts(companyId: string, signal?: AbortSignal): Promise<ChartAccount[]> {
  // OPTIMIZATION: Limit to 500 chart accounts per company
  // This prevents memory bloat for companies with many chart accounts
  // If needed, UI can implement pagination for selection
  let query = supabase
    .from('chart_of_accounts')
    .select('id, name, code')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .in('type', ['despesa', 'custo'])
    .order('code')
    .limit(500);  // ← Added limit

  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ChartAccount[];
}

async function fetchExpenseCategories(companyId: string, signal?: AbortSignal): Promise<Category[]> {
  // OPTIMIZATION: Limit to 200 categories per company
  // Categories are typically managed, so this limit should not be an issue
  let query = supabase
    .from('categories')
    .select('id, name, type, color, icon')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .in('type', ['despesa', 'ambos'])
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

export function usePayablesQuery(companyId: string | null | undefined, filters?: PayablesFilters) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? payablesKeys.list(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchPayables(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
    placeholderData: keepPreviousData,
  });
}

// ============================================
// SUPPORTING DATA HOOKS (CONSOLIDATED)
// ============================================

/**
 * OPTIMIZATION: Consolidated form data hook
 *
 * Instead of calling 5 separate hooks (suppliers, bankAccounts, chartAccounts, categories),
 * this returns all reference data needed for the payables form.
 *
 * BEFORE: 5 queries (one for each reference table)
 * AFTER: 4 queries (but uses efficient caching - often served from cache)
 *
 * Usage: const formData = usePayablesFormData(companyId);
 */
export interface PayablesFormData {
  suppliers: Supplier[];
  bankAccounts: BankAccount[];
  chartAccounts: ChartAccount[];
  categories: Category[];
  isLoading: boolean;
}

export function usePayablesFormData(companyId: string | null | undefined): PayablesFormData {
  const enabled = !!companyId;

  const suppliersQuery = useQuery({
    queryKey: enabled ? suppliersKeys.active(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchSuppliers(companyId!, signal),
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
    queryKey: enabled ? chartAccountsKeys.expense(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchExpenseChartAccounts(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  const categoriesQuery = useQuery({
    queryKey: enabled ? ['categories', 'expense', companyId] : ['disabled'],
    queryFn: ({ signal }) => fetchExpenseCategories(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  return {
    suppliers: suppliersQuery.data ?? [],
    bankAccounts: bankAccountsQuery.data ?? [],
    chartAccounts: chartAccountsQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    isLoading: suppliersQuery.isLoading || bankAccountsQuery.isLoading || chartAccountsQuery.isLoading || categoriesQuery.isLoading,
  };
}

// DEPRECATED: Use usePayablesFormData instead
// Kept for backwards compatibility
export function useSuppliersForPayables(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? suppliersKeys.active(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchSuppliers(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

// DEPRECATED: Use usePayablesFormData instead
export function useBankAccountsForPayables(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? bankAccountsKeys.list(companyId, false) : ['disabled'],
    queryFn: ({ signal }) => fetchBankAccounts(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

// DEPRECATED: Use usePayablesFormData instead
export function useExpenseChartAccountsForPayables(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? chartAccountsKeys.expense(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchExpenseChartAccounts(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

// DEPRECATED: Use usePayablesFormData instead
export function useExpenseCategoriesForPayables(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? ['categories', 'expense', companyId] : ['disabled'],
    queryFn: ({ signal }) => fetchExpenseCategories(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

// ============================================
// MUTATIONS WITH OPTIMISTIC UPDATES
// ============================================

type PaymentMethodType = 'dinheiro' | 'pix' | 'transferencia' | 'boleto' | 'cartao' | 'cheque';

interface CreatePayablePayload {
  company_id: string;
  supplier_id: string;
  category_id?: string | null;
  chart_account_id: string | null;
  cost_center_id?: string | null;
  description: string;
  document_number: string | null;
  issue_date: string;
  due_date: string;
  total_amount: number;
  installment_number?: number;
  total_installments?: number;
  parent_id?: string;
  notes: string | null;
  status?: 'pendente' | 'pago';
  bank_account_id?: string | null;
  payment_method?: PaymentMethodType | null;
  recurrence?: string | null;
  is_debt_payment?: boolean;
  debt_id?: string | null;
}

interface UpdatePayablePayload {
  supplier_id: string;
  category_id?: string | null;
  chart_account_id: string | null;
  cost_center_id?: string | null;
  description: string;
  document_number: string | null;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount?: number;
  notes: string | null;
  status?: 'pendente' | 'pago';
  bank_account_id?: string | null;
  payment_method?: PaymentMethodType | null;
  recurrence?: string | null;
  is_debt_payment?: boolean;
  debt_id?: string | null;
}

export function useCreatePayable(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payloads: CreatePayablePayload | CreatePayablePayload[]) => {
      const items = Array.isArray(payloads) ? payloads : [payloads];
      const { data: createdPayables, error } = await supabase
        .from('payables')
        .insert(items as unknown as Parameters<ReturnType<typeof supabase.from>['insert']>[0])
        .select();

      if (error) throw error;

      // Sync to Transactions
      const transactionsToCreate = createdPayables.map((payable) => ({
        company_id: payable.company_id,
        bank_account_id: payable.bank_account_id || '', // Note: Requires a bank account
        chart_account_id: payable.chart_account_id,
        category_id: payable.category_id,
        supplier_id: payable.supplier_id,
        description: payable.description,
        amount: payable.total_amount,
        transaction_date: payable.due_date,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payment_method: payable.payment_method as any,
        document_number: payable.document_number,
        type: 'saida' as const,
        nature: payable.status === 'pago' ? 'realizado' : 'previsao',
        forecast_basis: `payable:${payable.id}`,
        notes: payable.notes,
        recurrence: payable.recurrence,
        is_debt_payment: payable.is_debt_payment || false,
      }));

      // Filter out those without bank_account_id to prevent error (though they should have one if possible)
      const validTransactions = transactionsToCreate.filter(t => t.bank_account_id !== '');

      if (validTransactions.length > 0) {
        const { error: txError } = await supabase
          .from('transactions')
          .insert(validTransactions);

        if (txError) {
          // Rollback compensatory: delete payables already created to maintain consistency
          await supabase.from('payables').delete().in('id', createdPayables.map(p => p.id));
          throw txError;
        }
      }

      // ─── Sync to Debts (batch RPC — replaces N+1 loop) ───
      const debtPayments = createdPayables
        .filter(p => p.is_debt_payment && p.debt_id)
        .map(p => ({
          debt_id: p.debt_id,
          company_id: p.company_id,
          payment_date: p.due_date,
          due_date: p.due_date,
          principal_amount: p.total_amount,
          total_amount: p.total_amount,
        }));

      if (debtPayments.length > 0) {
        const { error: debtError } = await supabase.rpc('process_debt_payments', {
          p_payments: debtPayments,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        if (debtError) {
          console.error('Error processing debt payments:', debtError);
        }
      }

      return createdPayables;
    },
    // ─── Optimistic: Append to cache INSTANTLY ───
    onMutate: async (payloads) => {
      const items = Array.isArray(payloads) ? payloads : [payloads];
      // Cancel in-flight fetches to prevent overwrite
      await queryClient.cancelQueries({ queryKey: payablesKeys.all });
      // Snapshot for rollback
      const previousData = queryClient.getQueriesData<Payable[]>({ queryKey: payablesKeys.all });
      // Optimistic insert
      queryClient.setQueriesData<Payable[]>(
        { queryKey: payablesKeys.all },
        (old) => {
          if (!old) return old;
          const optimisticItems = items.map((item) => ({
            ...item,
            id: `optimistic-${crypto.randomUUID()}`,
            paid_amount: 0,
            status: 'pendente' as const,
            category_id: item.category_id ?? null,
            cost_center_id: item.cost_center_id ?? null,
            installment_number: item.installment_number ?? null,
            total_installments: item.total_installments ?? null,
          }));
          return [...old, ...optimisticItems];
        }
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      // Rollback on failure
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      if (companyId) invalidatePayablesQueries(queryClient, companyId);
    },
  });
}

export function useUpdatePayable(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdatePayablePayload }) => {
      // Auto-sync paid_amount based on manual status change
      const finalPayload = { ...payload };
      if (finalPayload.status === 'pago') {
        finalPayload.paid_amount = finalPayload.total_amount;
      } else if (finalPayload.status === 'pendente') {
        finalPayload.paid_amount = 0;
      }

      const { data: updatedPayable, error } = await supabase
        .from('payables')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(finalPayload as any)
        .eq('id', id)
        .eq('company_id', companyId!)
        .select()
        .single();

      if (error) throw error;

      // Update linked transaction
      if (updatedPayable) {
        const { error: txError } = await supabase
          .from('transactions')
          .update({
            bank_account_id: updatedPayable.bank_account_id || undefined,
            chart_account_id: updatedPayable.chart_account_id,
            category_id: updatedPayable.category_id,
            supplier_id: updatedPayable.supplier_id,
            description: updatedPayable.description,
            amount: updatedPayable.total_amount,
            transaction_date: updatedPayable.due_date,
            payment_method: updatedPayable.payment_method,
            document_number: updatedPayable.document_number,
            nature: updatedPayable.status === 'pago' ? 'realizado' : 'previsao',
            notes: updatedPayable.notes,
            recurrence: updatedPayable.recurrence,
            is_debt_payment: updatedPayable.is_debt_payment || false,
          })
          .eq('forecast_basis', `payable:${updatedPayable.id}`);

        if (txError) throw txError;
      }

      return updatedPayable;
    },
    // ─── Optimistic: Patch item in cache INSTANTLY ───
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: payablesKeys.all });
      const previousData = queryClient.getQueriesData<Payable[]>({ queryKey: payablesKeys.all });
      queryClient.setQueriesData<Payable[]>(
        { queryKey: payablesKeys.all },
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
      if (companyId) invalidatePayablesQueries(queryClient, companyId);
    },
  });
}

export function useDeletePayable(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idOrIds: string | string[]) => {
      const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      const bases = ids.map(id => `payable:${id}`);
      const now = new Date().toISOString();

      // Soft delete the linked payment_records
      const { error: prError } = await supabase
        .from('payment_records')
        .update({
          is_deleted: true,
          deleted_at: now,
        })
        .in('payable_id', ids);

      if (prError) throw prError;

      // Soft delete the linked transactions
      const { error: txError } = await supabase
        .from('transactions')
        .update({
          is_deleted: true,
          deleted_at: now,
          deletion_reason: 'Payable excluído pelo usuário',
        })
        .in('forecast_basis', bases);

      if (txError) throw txError;

      // Soft delete the payables
      const { error } = await supabase
        .from('payables')
        .update({
          is_deleted: true,
          deleted_at: now,
          deletion_reason: 'Excluído pelo usuário',
        })
        .in('id', ids)
        .eq('company_id', companyId!);

      if (error) throw error;
    },
    // ─── Optimistic: Remove from cache INSTANTLY ───
    onMutate: async (idOrIds) => {
      const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      await queryClient.cancelQueries({ queryKey: payablesKeys.all });
      const previousData = queryClient.getQueriesData<Payable[]>({ queryKey: payablesKeys.all });
      queryClient.setQueriesData<Payable[]>(
        { queryKey: payablesKeys.all },
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
      if (companyId) invalidatePayablesQueries(queryClient, companyId);
    },
  });
}

interface PaymentPayload {
  payable_id: string;
  bank_account_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string | null;
}

export function useRecordPayablePayment(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PaymentPayload) => {
      const { data, error } = await supabase
        .from('payment_records')
        .insert({
          payable_id: payload.payable_id,
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

      const { data: updatedPayable } = await supabase
        .from('payables')
        .select('status, total_amount')
        .eq('id', payload.payable_id)
        .single();

      if (updatedPayable) {
        await supabase
          .from('transactions')
          .update({
            nature: updatedPayable.status === 'pago' ? 'realizado' : 'previsao',
            payment_method: payload.payment_method,
            bank_account_id: payload.bank_account_id,
            transaction_date: payload.payment_date,
          })
          .eq('forecast_basis', `payable:${payload.payable_id}`);
      }

      return data;
    },
    // ─── Optimistic: Update paid_amount and status INSTANTLY ───
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: payablesKeys.all });
      const previousData = queryClient.getQueriesData<Payable[]>({ queryKey: payablesKeys.all });
      queryClient.setQueriesData<Payable[]>(
        { queryKey: payablesKeys.all },
        (old) => old?.map((item) => {
          if (item.id !== payload.payable_id) return item;
          const newPaid = moneyToNumber(moneyAdd(item.paid_amount, payload.amount));
          const newStatus = newPaid >= item.total_amount ? 'pago' : 'parcial';
          return { ...item, paid_amount: newPaid, status: newStatus as Payable['status'] };
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
      if (companyId) invalidatePayablesQueries(queryClient, companyId);
    },
  });
}

export function useBulkUpdatePayableStatus(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * OPTIMIZATION: Single Supabase RPC call replaces N+1 pattern.
     * Before: 3N round-trips (fetch + update + tx update per item).
     * After:  1 RPC call — all logic runs server-side in a single transaction.
     */
    mutationFn: async ({ ids, status }: { ids: string[]; status: 'pendente' | 'pago' }) => {
      if (!ids.length) return [];

      const { data, error } = await supabase.rpc('bulk_update_payable_status', {
        p_ids: ids,
        p_status: status,
      });

      if (error) throw error;
      return data ?? [];
    },
    // ─── Optimistic update ───
    onMutate: async ({ ids, status }) => {
      await queryClient.cancelQueries({ queryKey: payablesKeys.all });
      const previousData = queryClient.getQueriesData<Payable[]>({ queryKey: payablesKeys.all });
      queryClient.setQueriesData<Payable[]>(
        { queryKey: payablesKeys.all },
        (old) => old?.map((item) => {
          if (!ids.includes(item.id)) return item;
          const newPaid = status === 'pago' ? item.total_amount : 0;
          return { ...item, status, paid_amount: newPaid } as Payable;
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
      if (companyId) invalidatePayablesQueries(queryClient, companyId);
    },
  });
}

