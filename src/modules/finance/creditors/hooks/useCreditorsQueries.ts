import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CREDITORS_KEYS, SUPPLIERS_KEYS, STALE_TIMES, GC_TIMES } from "@/lib/queryKeys";
import { toast } from "sonner";

export interface Creditor {
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

export interface CreditorFormData {
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

export const emptyFormData: CreditorFormData = {
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

async function fetchCreditors(companyId: string, signal?: AbortSignal): Promise<Creditor[]> {
    const { data, error } = await supabase
        .from("suppliers")
        .select("id, company_id, name, document, email, phone, address, city, state, zip_code, notes, category, is_active, created_at, updated_at")
        .eq("company_id", companyId)
        .in("category", ["banco", "financeira", "cartao_credito", "socio", "governo", "cartorio", "pessoa_fisica", "outro"])
        .order("name")
        .abortSignal(signal!);

    if (error) throw error;
    return data || [];
}

export function useCreditorsQueries(companyId: string | undefined) {
    const queryClient = useQueryClient();

    const creditorsQuery = useQuery({
        queryKey: CREDITORS_KEYS.list(companyId!),
        queryFn: ({ signal }) => fetchCreditors(companyId!, signal),
        enabled: !!companyId,
        staleTime: STALE_TIMES.FINANCIAL,
        gcTime: GC_TIMES.FINANCIAL,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: CREDITORS_KEYS.list(companyId!) });
        queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEYS.list(companyId!) });
    };

    const saveMutation = useMutation({
        mutationFn: async ({ formData, editingId }: { formData: CreditorFormData; editingId?: string }) => {
            const dbData = {
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
                const { error } = await supabase.from("suppliers").update(dbData).eq("id", editingId).eq("company_id", companyId!);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("suppliers").insert(dbData);
                if (error) throw error;
            }
        },
        onSuccess: (_, { formData, editingId }) => {
            toast.success(editingId ? "Credor atualizado" : "Credor criado", {
                description: `${formData.name} foi ${editingId ? "atualizado" : "adicionado"} com sucesso.`,
            });
            invalidate();
        },
        onError: (error: Error) => {
            toast.error("Erro ao salvar credor", { description: error.message });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            // Check usage in transactions
            const { count: txCount, error: txError } = await supabase
                .from("transactions")
                .select("id", { count: "exact", head: true })
                .eq("supplier_id", id);

            if (txError) throw txError;

            // Check usage in payables
            const { count: payCount, error: payError } = await supabase
                .from("payables")
                .select("id", { count: "exact", head: true })
                .eq("supplier_id", id);

            if (payError) throw payError;

            const isInUse = (txCount || 0) > 0 || (payCount || 0) > 0;

            if (isInUse) {
                const { error } = await supabase
                    .from("suppliers")
                    .update({ is_active: false })
                    .eq("id", id)
                    .eq("company_id", companyId!);
                if (error) throw error;
                return { type: "soft" };
            } else {
                const { error } = await supabase.from("suppliers").update({ is_active: false }).eq("id", id).eq("company_id", companyId!);
                if (error) throw error;
                return { type: "hard" };
            }
        },
        onSuccess: (data) => {
            if (data?.type === "soft") {
                toast.success("Credor inativado", {
                    description: "O credor possui transações vinculadas e não pode ser excluído permanentemente. Por conta disso, ele foi desativado."
                });
            } else {
                toast.success("Credor excluído com sucesso.");
            }
            invalidate();
        },
        onError: (error: Error) => {
            toast.error("Erro ao excluir credor", { description: error.message });
        },
    });

    return {
        creditors: creditorsQuery.data ?? [],
        isLoading: creditorsQuery.isLoading,
        saveMutation,
        deleteMutation,
    };
}
