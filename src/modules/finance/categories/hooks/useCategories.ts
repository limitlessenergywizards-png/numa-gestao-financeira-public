import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";

export interface Category {
  id: string;
  company_id: string;
  name: string;
  type: "receita" | "despesa" | "ambos";
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryInsert = Omit<Category, "id" | "created_at" | "updated_at">;
export type CategoryUpdate = Partial<Omit<Category, "id" | "company_id" | "created_at" | "updated_at">>;

export function useCategories() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const queryKey = ["categories", currentCompany?.id];

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      const { data, error } = await supabase
        .from("categories")
        .select("id, company_id, name, type, color, icon, is_active, created_at, updated_at")
        .eq("company_id", currentCompany.id)
        .order("name");

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!currentCompany?.id,
    staleTime: 1000 * 60 * 5,
  });

  const createCategory = useMutation({
    mutationFn: async (category: CategoryInsert) => {
      const { data, error } = await supabase
        .from("categories")
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Categoria criada", { description: "A categoria foi criada com sucesso." });
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar categoria", { description: error.message });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: CategoryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .eq("company_id", currentCompany!.id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Categoria atualizada", { description: "A categoria foi atualizada com sucesso." });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar categoria", { description: error.message });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: false })
        .eq("id", id)
        .eq("company_id", currentCompany!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Categoria excluída", { description: "A categoria foi excluída com sucesso." });
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir categoria", { description: error.message });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("categories")
        .update({ is_active })
        .eq("id", id)
        .eq("company_id", currentCompany!.id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onMutate: async ({ id, is_active }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Category[]>(queryKey);
      queryClient.setQueryData<Category[]>(queryKey, (old) =>
        old?.map((cat) => (cat.id === id ? { ...cat, is_active } : cat))
      );
      return { previous };
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error("Erro ao alterar status", { description: error.message });
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleActive,
  };
}
