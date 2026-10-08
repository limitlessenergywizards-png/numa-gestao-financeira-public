'use client';

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecurrenceTemplate } from "../types";
import { shouldGenerateTransaction } from "../utils/dateUtils";
import { toast } from "sonner";

export function useRecurrenceAutomation() {
    const queryClient = useQueryClient();

    // Fetch active recurrences
    const { data: recurrences } = useQuery({
        queryKey: ["active-recurrences"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("recurrence_templates")
                .select("id, company_id, name, amount, type, category_id, bank_account_id, frequency, start_date, end_date, day_of_month, last_generated_date, status, created_at, updated_at")
                .eq("status", "active");

            if (error) {
                console.error("Erro ao buscar recorrências ativas:", error);
                return [];
            }
            return data as RecurrenceTemplate[];
        },
        // Run periodically or just on mount
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    const generateTransactionMutation = useMutation({
        mutationFn: async ({ template, dueDate }: { template: RecurrenceTemplate; dueDate: Date }) => {
            // 1. Create transaction
            const { error: txError } = await supabase.from("transactions").insert({
                company_id: template.company_id,
                description: template.name,
                amount: template.amount,
                type: template.type,
                category_id: template.category_id,
                bank_account_id: template.bank_account_id,
                transaction_date: dueDate.toISOString().split("T")[0],
                status: "pendente",
                recurrence_template_id: template.id,
                recurrence: "recorrente",
            });

            if (txError) throw txError;

            // 2. Update last_generated_date
            const { error: updateError } = await supabase
                .from("recurrence_templates")
                .update({ last_generated_date: dueDate.toISOString().split("T")[0] })
                .eq("id", template.id);

            if (updateError) throw updateError;

            return template.name;
        },
        onSuccess: () => {
            // Invalidate once after batch
            queryClient.invalidateQueries({ queryKey: ["active-recurrences"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
    });

    useEffect(() => {
        if (!recurrences || recurrences.length === 0) return;

        const checkAndGenerateBatch = async () => {
            const tasks: Array<{ template: RecurrenceTemplate; dueDate: Date }> = [];

            // 1. Identify all needed generations
            for (const template of recurrences) {
                const dueDate = shouldGenerateTransaction(template);
                if (dueDate) {
                    tasks.push({ template, dueDate });
                }
            }

            // 2. Execute in parallel if any
            if (tasks.length > 0) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`[Recurrence] Processing batch of ${tasks.length} items`);
                }

                try {
                    await Promise.all(
                        tasks.map(task =>
                            generateTransactionMutation.mutateAsync(task)
                        )
                    );

                    if (tasks.length === 1) {
                        toast.success("1 transação recorrente gerada.");
                    } else {
                        toast.success(`${tasks.length} transações recorrentes geradas.`);
                    }
                } catch (error) {
                    console.error("Erro ao processar lote de recorrências:", error);
                    toast.error("Erro ao gerar algumas transações recorrentes.");
                }
            }
        };

        checkAndGenerateBatch();
    }, [recurrences]);
}
