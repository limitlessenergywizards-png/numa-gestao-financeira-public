import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BANK_ACCOUNTS_KEYS, STALE_TIMES, GC_TIMES } from "@/lib/queryKeys";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

// ============================================
// TYPES
// ============================================

export type BankAccountType = Database["public"]["Enums"]["bank_account_type"];

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

export interface BankAccountFormData {
  name: string;
  bank_name: string;
  agency: string;
  account_number: string;
  account_type: BankAccountType;
  initial_balance: string;
  is_active: boolean;
}

export const emptyFormData: BankAccountFormData = {
  name: "",
  bank_name: "",
  agency: "",
  account_number: "",
  account_type: "corrente",
  initial_balance: "0",
  is_active: true,
};

// ============================================
// QUERY FUNCTIONS
// ============================================

async function fetchBankAccounts(companyId: string, signal?: AbortSignal): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("id, company_id, name, bank_name, agency, account_number, account_type, initial_balance, current_balance, is_active, created_at, updated_at")
    .eq("company_id", companyId)
    .order("name")
    .abortSignal(signal!);

  if (error) throw error;
  return data || [];
}

async function fetchRecentTransactions(
  accountIds: string[],
  signal?: AbortSignal
): Promise<Record<string, Transaction[]>> {
  if (accountIds.length === 0) return {};

  const { data, error } = await supabase
    .from("transactions")
    .select("id, description, amount, type, transaction_date, bank_account_id")
    .in("bank_account_id", accountIds)
    .order("transaction_date", { ascending: false })
    .limit(50)
    .abortSignal(signal!);

  if (error) throw error;

  const grouped: Record<string, Transaction[]> = {};
  (data || []).forEach((t: any) => {
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

export function useBankAccountsQueries(companyId: string | undefined) {
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: BANK_ACCOUNTS_KEYS.list(companyId!, true),
    queryFn: ({ signal }) => fetchBankAccounts(companyId!, signal),
    enabled: !!companyId,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  const accountIds = (accountsQuery.data || []).map((a) => a.id);
  const transactionsQuery = useQuery({
    queryKey: BANK_ACCOUNTS_KEYS.withTransactions(companyId!),
    queryFn: ({ signal }) => fetchRecentTransactions(accountIds, signal),
    enabled: !!companyId && accountIds.length > 0,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: BANK_ACCOUNTS_KEYS.list(companyId!, true) });
    queryClient.invalidateQueries({ queryKey: BANK_ACCOUNTS_KEYS.withTransactions(companyId!) });
  };

  const saveMutation = useMutation({
    mutationFn: async ({
      formData,
      editingAccount,
    }: {
      formData: BankAccountFormData;
      editingAccount?: BankAccount | null;
    }) => {
      const initialBalance = parseFloat(formData.initial_balance) || 0;

      const accountData = {
        company_id: companyId!,
        name: formData.name.trim(),
        bank_name: formData.bank_name.trim() || null,
        agency: formData.agency.trim() || null,
        account_number: formData.account_number.trim() || null,
        account_type: formData.account_type,
        initial_balance: initialBalance,
        current_balance: editingAccount ? editingAccount.current_balance : initialBalance,
        is_active: formData.is_active,
      };

      if (editingAccount) {
        const balanceDiff = initialBalance - editingAccount.initial_balance;
        const newCurrentBalance = editingAccount.current_balance + balanceDiff;

        const { error } = await supabase
          .from("bank_accounts")
          .update({ ...accountData, current_balance: newCurrentBalance })
          .eq("id", editingAccount.id)
          .eq("company_id", companyId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bank_accounts")
          .insert(accountData);
        if (error) throw error;
      }
    },
    onSuccess: (_, { formData, editingAccount }) => {
      toast.success(editingAccount ? "Conta atualizada" : "Conta criada", {
        description: `${formData.name} foi ${editingAccount ? "atualizada" : "adicionada"} com sucesso.`,
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar conta", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("bank_accounts")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deletion_reason: 'Excluído pelo usuário',
        })
        .eq("id", accountId)
        .eq("company_id", companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta excluída", { description: "Conta foi excluída com sucesso." });
      invalidate();
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir conta", { description: error.message });
    },
  });

  return {
    accounts: accountsQuery.data ?? [],
    transactions: transactionsQuery.data ?? {},
    isLoading: accountsQuery.isLoading,
    saveMutation,
    deleteMutation,
  };
}
