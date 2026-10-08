/**
 * useTransactionsQuery - React Query hook for transactions
 * 
 * Provides cached transactions data with filters support.
 * Works with the persistence layer for instant load times.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { transactionsKeys, bankAccountsKeys, chartAccountsKeys, customersKeys, suppliersKeys, dashboardKeys, dreKeys, cashFlowKeys, STALE_TIMES, GC_TIMES, TransactionsFilters } from '@/lib/queryKeys';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Helper function to invalidate financial queries for specific company only
function invalidateFinancialQueries(queryClient: ReturnType<typeof useQueryClient>, companyId: string) {
  // Only invalidate queries containing this companyId - not all queries
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return Array.isArray(key) && key.includes(companyId);
    }
  });
}

// ============================================
// TYPES
// ============================================

export interface Transaction {
  id: string;
  company_id: string;
  bank_account_id: string;
  chart_account_id: string | null;
  customer_id: string | null;
  supplier_id: string | null;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  transaction_date: string;
  document_number: string | null;
  notes: string | null;
  payment_method: string | null;
  reconciled: boolean;
  reconciled_at: string | null;
  created_at: string;
  original_transaction_date: string | null;
  original_created_at: string | null;
  is_debt_payment?: boolean;
  bank_account?: { name: string };
  chart_account?: { name: string; code: string } | null;
  customer?: { name: string } | null;
  supplier?: { name: string } | null;
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
  type: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
}

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
}

// ============================================
// QUERY FUNCTIONS
// ============================================

async function fetchTransactions(companyId: string, filters: TransactionsFilters, signal?: AbortSignal): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      company_id,
      bank_account_id,
      chart_account_id,
      customer_id,
      supplier_id,
      type,
      amount,
      description,
      transaction_date,
      document_number,
      notes,
      payment_method,
      reconciled,
      reconciled_at,
      created_at,
      original_transaction_date,
      original_created_at,
      is_debt_payment,
      bank_account:bank_accounts(name),
      chart_account:chart_of_accounts(name, code),
      customer:customers(name),
      supplier:suppliers(name)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .gte('transaction_date', filters.startDate)
    .lte('transaction_date', filters.endDate)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .abortSignal(signal!);

  if (error) throw error;

  return (data || []).map(t => ({
    ...t,
    reconciled: t.reconciled ?? false,
    reconciled_at: t.reconciled_at ?? null,
  })) as Transaction[];
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

async function fetchChartAccounts(companyId: string, signal?: AbortSignal): Promise<ChartAccount[]> {
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('id, name, code, type')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('code')
    .abortSignal(signal!);

  if (error) throw error;
  return (data || []) as ChartAccount[];
}

async function fetchCustomers(companyId: string, signal?: AbortSignal): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('id, company_id, name, document, email, phone')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')
    .abortSignal(signal!);

  if (error) throw error;
  return (data || []) as Customer[];
}

async function fetchSuppliers(companyId: string, signal?: AbortSignal): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, company_id, name, document, email, phone, category')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')
    .abortSignal(signal!);

  if (error) throw error;
  return (data || []) as Supplier[];
}

// ============================================
// MAIN HOOK
// ============================================

export function useTransactionsQuery(companyId: string | null | undefined, filters: TransactionsFilters) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? transactionsKeys.list(companyId, filters) : ['disabled'],
    queryFn: ({ signal }) => fetchTransactions(companyId!, filters, signal),
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
    placeholderData: keepPreviousData,
  });
}

// ============================================
// SUPPORTING DATA HOOKS
// ============================================

export function useBankAccountsForTransactions(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? bankAccountsKeys.list(companyId, false) : ['disabled'],
    queryFn: ({ signal }) => fetchBankAccounts(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

export function useChartAccountsForTransactions(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? chartAccountsKeys.list(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchChartAccounts(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

export function useCustomersForTransactions(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? customersKeys.active(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchCustomers(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

export function useSuppliersForTransactions(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? suppliersKeys.active(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchSuppliers(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

// ============================================
// MUTATIONS
// ============================================

interface CreateTransactionPayload {
  company_id: string;
  bank_account_id: string;
  chart_account_id: string | null;
  customer_id?: string | null;
  supplier_id?: string | null;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  transaction_date: string;
  payment_method: string;
  document_number: string | null;
  notes: string | null;
}

interface UpdateTransactionPayload {
  bank_account_id: string;
  chart_account_id: string | null;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  transaction_date: string;
  payment_method: string;
  document_number: string | null;
  notes: string | null;
}

export function useCreateTransaction(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTransactionPayload) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // ─── Optimistic: Append to cache INSTANTLY ───
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: transactionsKeys.all });
      const previousData = queryClient.getQueriesData<Transaction[]>({ queryKey: transactionsKeys.all });

      queryClient.setQueriesData<Transaction[]>(
        { queryKey: transactionsKeys.all },
        (old) => {
          if (!old) return old;
          const optimistic: Transaction = {
            ...payload,
            id: `optimistic-${crypto.randomUUID()}`,
            customer_id: payload.customer_id ?? null,
            supplier_id: payload.supplier_id ?? null,
            reconciled: false,
            reconciled_at: null,
            created_at: new Date().toISOString(),
            original_transaction_date: null,
            original_created_at: null,
          };
          return [optimistic, ...old];
        }
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error('Erro ao criar transação.');
    },
    onSuccess: () => {
      toast.success('Transação criada com sucesso!');
    },
    onSettled: () => {
      if (companyId) invalidateFinancialQueries(queryClient, companyId);
    },
  });
}

export function useUpdateTransaction(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateTransactionPayload }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', id)
        .eq('company_id', companyId!)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // ─── Optimistic: Patch item in cache INSTANTLY ───
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: transactionsKeys.all });
      const previousData = queryClient.getQueriesData<Transaction[]>({ queryKey: transactionsKeys.all });

      queryClient.setQueriesData<Transaction[]>(
        { queryKey: transactionsKeys.all },
        (old) => old?.map((t) => t.id === id ? { ...t, ...payload } : t)
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error('Erro ao atualizar transação.');
    },
    onSuccess: () => {
      toast.success('Transação atualizada!');
    },
    onSettled: () => {
      if (companyId) invalidateFinancialQueries(queryClient, companyId);
    },
  });
}

export function useDeleteTransaction(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch transaction to see if it's linked to an external entity
      const { data: tx } = await supabase
        .from('transactions')
        .select('forecast_basis')
        .eq('id', id)
        .eq('company_id', companyId!)
        .single();

      if (tx?.forecast_basis?.startsWith('payable:')) {
        const payableId = tx.forecast_basis.replace('payable:', '');
        await supabase.from('payables').update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deletion_reason: 'Excluído pelo usuário',
        }).eq('id', payableId).eq('company_id', companyId!);
      } else if (tx?.forecast_basis?.startsWith('receivable:')) {
        const receivableId = tx.forecast_basis.replace('receivable:', '');
        await supabase.from('receivables').update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deletion_reason: 'Excluído pelo usuário',
        }).eq('id', receivableId).eq('company_id', companyId!);
      }

      // AUDIT FIX: Soft delete instead of hard delete
      const { error } = await supabase
        .from('transactions')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id,
        })
        .eq('id', id)
        .eq('company_id', companyId!);

      if (error) throw error;
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: transactionsKeys.all });

      // Snapshot current data for rollback
      const previousTransactions = queryClient.getQueriesData({ queryKey: transactionsKeys.all });

      // Optimistically remove from all transaction caches
      queryClient.setQueriesData({ queryKey: transactionsKeys.all }, (old: Transaction[] | undefined) =>
        old?.filter(t => t.id !== id) || []
      );

      return { previousTransactions };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTransactions) {
        context.previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Erro ao excluir transação.');
    },
    onSuccess: () => {
      toast.success('Transação excluída.');
    },
    onSettled: () => {
      if (companyId) {
        invalidateFinancialQueries(queryClient, companyId);
      }
    },
  });
}

export function useReconcileTransaction(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          reconciled: true,
          reconciled_at: new Date().toISOString(),
          reconciled_by: user?.id
        })
        .eq('id', id)
        .eq('company_id', companyId!);

      if (error) throw error;
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: transactionsKeys.all });

      // Snapshot current data for rollback
      const previousTransactions = queryClient.getQueriesData({ queryKey: transactionsKeys.all });

      // Optimistically update to reconciled
      queryClient.setQueriesData({ queryKey: transactionsKeys.all }, (old: Transaction[] | undefined) =>
        old?.map(t => t.id === id ? { ...t, reconciled: true, reconciled_at: new Date().toISOString() } : t) || []
      );

      return { previousTransactions };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTransactions) {
        context.previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Erro ao conciliar transação.');
    },
    onSuccess: () => {
      toast.success('Transação conciliada!');
    },
    onSettled: () => {
      if (companyId) {
        invalidateFinancialQueries(queryClient, companyId);
      }
    },
  });
}

export function useBulkReconcileTransactions(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          reconciled: true,
          reconciled_at: new Date().toISOString(),
          reconciled_by: user?.id
        })
        .in('id', ids)
        .eq('company_id', companyId!);

      if (error) throw error;
    },
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: transactionsKeys.all });

      const previousTransactions = queryClient.getQueriesData({ queryKey: transactionsKeys.all });

      const idsSet = new Set(ids);
      queryClient.setQueriesData({ queryKey: transactionsKeys.all }, (old: Transaction[] | undefined) =>
        old?.map(t => idsSet.has(t.id) ? { ...t, reconciled: true, reconciled_at: new Date().toISOString() } : t) || []
      );

      return { previousTransactions };
    },
    onError: (_err, _ids, context) => {
      if (context?.previousTransactions) {
        context.previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Erro ao conciliar transações.');
    },
    onSuccess: () => {
      toast.success('Transações conciliadas!');
    },
    onSettled: () => {
      if (companyId) {
        invalidateFinancialQueries(queryClient, companyId);
      }
    },
  });
}

export function useBulkDeleteTransactions(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // AUDIT FIX: Soft delete instead of hard delete
      const { error } = await supabase
        .from('transactions')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id,
        })
        .in('id', ids)
        .eq('company_id', companyId!);

      if (error) throw error;
    },
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: transactionsKeys.all });

      const previousTransactions = queryClient.getQueriesData({ queryKey: transactionsKeys.all });

      const idsSet = new Set(ids);
      queryClient.setQueriesData({ queryKey: transactionsKeys.all }, (old: Transaction[] | undefined) =>
        old?.filter(t => !idsSet.has(t.id)) || []
      );

      return { previousTransactions };
    },
    onError: (_err, _ids, context) => {
      if (context?.previousTransactions) {
        context.previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Erro ao excluir transações.');
    },
    onSuccess: () => {
      toast.success('Transações excluídas.');
    },
    onSettled: () => {
      if (companyId) {
        invalidateFinancialQueries(queryClient, companyId);
      }
    },
  });
}

export function useDuplicateTransaction(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Transaction) => {
      if (!companyId) throw new Error('Company ID is required');

      const payload = {
        company_id: companyId,
        bank_account_id: transaction.bank_account_id,
        chart_account_id: transaction.chart_account_id,
        customer_id: transaction.customer_id,
        supplier_id: transaction.supplier_id,
        type: transaction.type,
        amount: transaction.amount,
        description: `${transaction.description} (cópia)`,
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: transaction.payment_method,
        document_number: null,
        notes: transaction.notes,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // ─── Optimistic: Append duplicate to cache INSTANTLY ───
    onMutate: async (transaction) => {
      await queryClient.cancelQueries({ queryKey: transactionsKeys.all });
      const previousData = queryClient.getQueriesData<Transaction[]>({ queryKey: transactionsKeys.all });

      queryClient.setQueriesData<Transaction[]>(
        { queryKey: transactionsKeys.all },
        (old) => {
          if (!old) return old;
          const optimistic: Transaction = {
            ...transaction,
            id: `optimistic-${crypto.randomUUID()}`,
            description: `${transaction.description} (cópia)`,
            transaction_date: format(new Date(), 'yyyy-MM-dd'),
            document_number: null,
            reconciled: false,
            reconciled_at: null,
            created_at: new Date().toISOString(),
          };
          return [optimistic, ...old];
        }
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error('Erro ao duplicar transação.');
    },
    onSuccess: () => {
      toast.success('Transação duplicada!');
    },
    onSettled: () => {
      if (companyId) invalidateFinancialQueries(queryClient, companyId);
    },
  });
}
