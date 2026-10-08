import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CHART_ACCOUNTS_KEYS, STALE_TIMES, GC_TIMES } from "@/lib/queryKeys";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

// ============================================
// TYPES
// ============================================

export type AccountEntryType = Database["public"]["Enums"]["account_entry_type"];

export interface ChartAccount {
  id: string;
  company_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  type: AccountEntryType;
  cost_type: 'fixed' | 'variable';
  nature: string;
  is_analytical: boolean;
  dre_category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChartAccountFormData {
  parent_id: string;
  code: string;
  name: string;
  type: AccountEntryType;
  cost_type: 'fixed' | 'variable';
  nature: string;
  is_analytical: boolean;
  dre_category: string;
  is_active: boolean;
}

export const emptyFormData: ChartAccountFormData = {
  parent_id: "",
  code: "",
  name: "",
  type: "receita",
  cost_type: "variable",
  nature: "devedora",
  is_analytical: true,
  dre_category: "",
  is_active: true,
};

// ============================================
// QUERY FUNCTIONS
// ============================================

async function fetchChartAccounts(companyId: string, signal?: AbortSignal): Promise<ChartAccount[]> {
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("id, company_id, parent_id, code, name, type, cost_type, nature, is_analytical, dre_category, is_active, created_at, updated_at")
    .eq("company_id", companyId)
    .order("code")
    .limit(1000)
    .abortSignal(signal!);

  if (error) throw error;
  return (data || []) as unknown as ChartAccount[];
}

// ============================================
// MAIN HOOK
// ============================================

export function useChartAccountsQueries(companyId: string | undefined) {
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: CHART_ACCOUNTS_KEYS.list(companyId!),
    queryFn: ({ signal }) => fetchChartAccounts(companyId!, signal),
    enabled: !!companyId,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: CHART_ACCOUNTS_KEYS.list(companyId!) });
  };

  const saveMutation = useMutation({
    mutationFn: async ({
      formData,
      editingId,
    }: {
      formData: ChartAccountFormData;
      editingId?: string;
    }) => {
      const accountData = {
        company_id: companyId!,
        parent_id: formData.parent_id || null,
        code: formData.code.trim(),
        name: formData.name.trim(),
        type: formData.type,
        cost_type: formData.cost_type,
        nature: formData.nature,
        is_analytical: formData.is_analytical,
        dre_category: formData.dre_category.trim() || null,
        is_active: formData.is_active,
      };

      if (editingId) {
        const { error } = await supabase
          .from("chart_of_accounts")
          .update(accountData)
          .eq("id", editingId)
          .eq("company_id", companyId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("chart_of_accounts")
          .insert(accountData);
        if (error) throw error;
      }
    },
    onSuccess: (_, { formData, editingId }) => {
      toast.success(editingId ? "Conta atualizada" : "Conta criada", {
        description: `${formData.name} foi ${editingId ? "atualizada" : "adicionada"} com sucesso.`,
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
        .from("chart_of_accounts")
        .update({ is_active: false })
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
    isLoading: accountsQuery.isLoading,
    error: accountsQuery.error,
    saveMutation,
    deleteMutation,
    invalidate,
  };
}
