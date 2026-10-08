import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { RecurrenceTemplate, RecurrenceFormData } from "../types";
import { toast } from "sonner";

export const useRecurrence = () => {
    const queryClient = useQueryClient();
    const { currentCompany } = useCompany();

    const { data: recurrences, isLoading } = useQuery({
        queryKey: ["recurrence-templates"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("recurrence_templates")
                .select(`
          *,
          category:categories(name),
          bank_account:bank_accounts(name)
        `)
                .order("created_at", { ascending: false });

            if (error) {
                toast.error("Erro ao carregar recorrências");
                throw error;
            }

            return data as RecurrenceTemplate[];
        },
    });

    const createRecurrence = useMutation({
        mutationFn: async (formData: RecurrenceFormData & { company_id: string }) => {
            const { data, error } = await supabase.from("recurrence_templates").insert({
                company_id: formData.company_id,
                name: formData.name,
                amount: formData.amount,
                type: formData.type,
                category_id: formData.category_id,
                bank_account_id: formData.bank_account_id || null,
                frequency: formData.frequency,
                start_date: formData.start_date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
                end_date: formData.end_date?.toISOString().split("T")[0] || null,
                day_of_month: parseInt(formData.day_of_month),
                status: formData.status,
            }).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recurrence-templates"] });
            toast.success("Recorrência criada com sucesso!");
        },
        onError: (error) => {
            toast.error(`Erro ao criar recorrência: ${error.message}`);
        },
    });

    const updateRecurrence = useMutation({
        mutationFn: async ({ id, ...formData }: Partial<RecurrenceFormData> & { id: string }) => {
            const updateData: any = { ...formData };
            if (formData.start_date) updateData.start_date = formData.start_date.toISOString().split("T")[0];
            if (formData.end_date) updateData.end_date = formData.end_date.toISOString().split("T")[0];
            if (formData.day_of_month) updateData.day_of_month = parseInt(formData.day_of_month);

            const { data, error } = await supabase
                .from("recurrence_templates")
                .update(updateData)
                .eq("id", id)
                .eq("company_id", currentCompany!.id)
                .select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recurrence-templates"] });
            toast.success("Recorrência atualizada com sucesso!");
        },
        onError: (error) => {
            toast.error(`Erro ao atualizar recorrência: ${error.message}`);
        },
    });

    const deleteRecurrence = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("recurrence_templates").update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deletion_reason: 'Excluído pelo usuário',
            }).eq("id", id).eq("company_id", currentCompany!.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recurrence-templates"] });
            toast.success("Recorrência excluída com sucesso!");
        },
        onError: (error) => {
            toast.error(`Erro ao excluir recorrência: ${error.message}`);
        },
    });

    return {
        recurrences,
        isLoading,
        createRecurrence,
        updateRecurrence,
        deleteRecurrence,
    };
};
