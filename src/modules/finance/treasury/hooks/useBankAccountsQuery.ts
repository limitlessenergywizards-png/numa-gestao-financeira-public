/**
 * useBankAccountsQuery - React Query hook for bank accounts
 * 
 * Provides cached bank accounts data.
 * Works with the persistence layer for instant load times.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { bankAccountsKeys, STALE_TIMES, GC_TIMES } from '@/lib/queryKeys';
import type { Database } from '@/integrations/supabase/types';

// ============================================
// TYPES
// ============================================

type BankAccountType = Database["public"]["Enums"]["bank_account_type"];

export interface BankAccount {
  id: string;
  company_id: string;
  name: string;
  bank_name: string | null;
  agency: string | null;
  account_number: string | null;
  account_type: BankAccountType;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "entrada" | "saida";
  transaction_date: string;
}

// ============================================
// QUERY FUNCTIONS
// ============================================

async function fetchBankAccounts(companyId: string, includeInactive: boolean, signal?: AbortSignal): Promise<BankAccount[]> {
  let query = supabase
    .from("bank_accounts")
    .select("id, company_id, name, bank_name, agency, account_number, account_type, initial_balance, current_balance, is_active, created_at, updated_at")
    .eq("company_id", companyId)
    .order("name");

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.abortSignal(signal!);

  if (error) throw error;
  return (data || []) as BankAccount[];
}

async function fetchRecentTransactions(accountIds: string[], signal?: AbortSignal): Promise<Record<string, Transaction[]>> {
  if (accountIds.length === 0) return {};

  const { data } = await supabase
    .from("transactions")
    .select("id, description, amount, type, transaction_date, bank_account_id")
    .in("bank_account_id", accountIds)
    .order("transaction_date", { ascending: false })
    .limit(50)
    .abortSignal(signal!);

  if (!data) return {};

  const grouped: Record<string, Transaction[]> = {};
  interface TransactionWithBankId extends Transaction {
    bank_account_id: string;
  }
  
  (data as TransactionWithBankId[]).forEach((t) => {
    if (!grouped[t.bank_account_id]) {
      grouped[t.bank_account_id] = [];
    }
    if (grouped[t.bank_account_id].length < 5) {
      grouped[t.bank_account_id].push({
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type,
        transaction_date: t.transaction_date,
      });
    }
  });
  return grouped;
}

// ============================================
// MAIN HOOK
// ============================================

export function useBankAccountsQuery(companyId: string | null | undefined, includeInactive = false) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? bankAccountsKeys.list(companyId, includeInactive) : ['disabled'],
    queryFn: ({ signal }) => fetchBankAccounts(companyId!, includeInactive, signal),
    enabled,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });
}

export function useBankAccountsWithTransactions(companyId: string | null | undefined) {
  const enabled = !!companyId;
  const accountsQuery = useBankAccountsQuery(companyId, true);
  
  const accountIds = accountsQuery.data?.map(a => a.id) || [];
  
  const transactionsQuery = useQuery({
    queryKey: enabled && accountIds.length > 0 
      ? bankAccountsKeys.withTransactions(companyId) 
      : ['disabled'],
    queryFn: ({ signal }) => fetchRecentTransactions(accountIds, signal),
    enabled: enabled && accountIds.length > 0,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  return {
    accounts: accountsQuery.data ?? [],
    transactions: transactionsQuery.data ?? {},
    isLoading: accountsQuery.isLoading,
    isFetching: accountsQuery.isFetching || transactionsQuery.isFetching,
    refetch: () => {
      accountsQuery.refetch();
      transactionsQuery.refetch();
    },
  };
}

// ============================================
// MUTATIONS
// ============================================

interface CreateBankAccountPayload {
  company_id: string;
  name: string;
  bank_name: string | null;
  agency: string | null;
  account_number: string | null;
  account_type: BankAccountType;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
}

interface UpdateBankAccountPayload {
  name: string;
  bank_name: string | null;
  agency: string | null;
  account_number: string | null;
  account_type: BankAccountType;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
}

export function useCreateBankAccount(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBankAccountPayload) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: bankAccountsKeys.all });
      }
    },
  });
}

export function useUpdateBankAccount(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateBankAccountPayload }) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(payload)
        .eq('id', id)
        .eq('company_id', companyId!)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: bankAccountsKeys.all });
      }
    },
  });
}

export function useDeleteBankAccount(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_accounts')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deletion_reason: 'Excluído pelo usuário',
        })
        .eq('id', id)
        .eq('company_id', companyId!);
      
      if (error) throw error;
    },
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: bankAccountsKeys.all });
      }
    },
  });
}
