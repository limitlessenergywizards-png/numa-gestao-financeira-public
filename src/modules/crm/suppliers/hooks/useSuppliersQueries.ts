import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SUPPLIERS_KEYS, STALE_TIMES, GC_TIMES } from "@/lib/queryKeys";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierFormData {
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes: string;
  category: string;
  is_active: boolean;
}

export const emptyFormData: SupplierFormData = {
  name: "",
  document: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  notes: "",
  category: "",
  is_active: true,
};

interface PendingStats {
  pendingCount: number;
  totalPending: number;
}

// ============================================
// QUERY FUNCTIONS
// ============================================

async function fetchSuppliers(companyId: string, signal?: AbortSignal): Promise<Supplier[]> {
  // Define categories that belong to 'Credores' to exclude them from 'Fornecedores'
  const creditorCategories = ['banco', 'financeira', 'cartao_credito', 'socio', 'governo'];

  const { data, error } = await supabase
    .from("suppliers")
    .select("id, company_id, name, document, email, phone, address, city, state, zip_code, notes, category, is_active, created_at, updated_at")
    .eq("company_id", companyId)
    .not('category', 'in', `(${creditorCategories.join(',')})`)
    .order("name")
    .abortSignal(signal!);

  if (error) throw error;
  return (data || []) as Supplier[];
}

async function fetchPendingStats(companyId: string, signal?: AbortSignal): Promise<PendingStats> {
  const { data, error } = await supabase
    .from("payables")
    .select("supplier_id, total_amount, paid_amount")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .in("status", ["pendente", "parcial"])
    .abortSignal(signal!);

  if (error) throw error;

  const uniqueSuppliers = new Set((data || []).map((p) => p.supplier_id));
  const total = (data || []).reduce((acc, p) => acc + (p.total_amount - p.paid_amount), 0);

  return { pendingCount: uniqueSuppliers.size, totalPending: total };
}

// ============================================
// MAIN HOOK
// ============================================

export function useSuppliersQueries(companyId: string | undefined) {
  const queryClient = useQueryClient();

  const suppliersQuery = useQuery({
    queryKey: SUPPLIERS_KEYS.list(companyId!),
    queryFn: ({ signal }) => fetchSuppliers(companyId!, signal),
    enabled: !!companyId,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  const pendingStatsQuery = useQuery({
    queryKey: SUPPLIERS_KEYS.pendingStats(companyId!),
    queryFn: ({ signal }) => fetchPendingStats(companyId!, signal),
    enabled: !!companyId,
    staleTime: STALE_TIMES.FINANCIAL,
    gcTime: GC_TIMES.FINANCIAL,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEYS.list(companyId!) });
    queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEYS.pendingStats(companyId!) });
  };

  const saveMutation = useMutation({
    mutationFn: async ({ formData, editingId }: { formData: SupplierFormData; editingId?: string }) => {
      const supplierData = {
        company_id: companyId!,
        name: formData.name.trim(),
        document: formData.document.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip_code: formData.zip_code.trim() || null,
        notes: formData.notes.trim() || null,
        category: formData.category.trim() || null,
        is_active: formData.is_active,
      };

      if (editingId) {
        const { error } = await supabase
          .from("suppliers")
          .update(supplierData)
          .eq("id", editingId)
          .eq("company_id", companyId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("suppliers")
          .insert(supplierData);
        if (error) throw error;
      }
    },
    onSuccess: (_, { formData, editingId }) => {
      toast.success(editingId ? "Fornecedor atualizado" : "Fornecedor criado", {
        description: `${formData.name} foi ${editingId ? "atualizado" : "adicionado"} com sucesso.`,
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar fornecedor", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      // Check usage in transactions
      const { count: txCount, error: txError } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", supplierId);

      if (txError) throw txError;

      // Check usage in payables
      const { count: payCount, error: payError } = await supabase
        .from("payables")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", supplierId);

      if (payError) throw payError;

      const isInUse = (txCount || 0) > 0 || (payCount || 0) > 0;

      if (isInUse) {
        const { error } = await supabase
          .from("suppliers")
          .update({ is_active: false })
          .eq("id", supplierId)
          .eq("company_id", companyId!);
        if (error) throw error;
        return { type: "soft" };
      } else {
        const { error } = await supabase
          .from("suppliers")
          .update({ is_active: false })
          .eq("id", supplierId)
          .eq("company_id", companyId!);
        if (error) throw error;
        return { type: "hard" };
      }
    },
    onSuccess: (data) => {
      if (data?.type === "soft") {
        toast.success("Fornecedor inativado", {
          description: "O fornecedor possui transações vinculadas e não pode ser excluído permanentemente. Por conta disso, ele foi desativado."
        });
      } else {
        toast.success("Fornecedor excluído", { description: "Fornecedor foi excluído com sucesso." });
      }
      invalidate();
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir fornecedor", { description: error.message });
    },
  });

  return {
    suppliers: suppliersQuery.data ?? [],
    pendingCount: pendingStatsQuery.data?.pendingCount ?? 0,
    totalPending: pendingStatsQuery.data?.totalPending ?? 0,
    isLoading: suppliersQuery.isLoading,
    saveMutation,
    deleteMutation,
  };
}
