import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, type, color, icon, is_active")
        .order("name");
      return data || [];
    },
  });
}

export function useBankAccountsQuery() {
  return useQuery({
    queryKey: ["bank_accounts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_accounts")
        .select("id, name, bank_name, is_active")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });
}

interface RecurringPayload {
  name: string;
  amount: number;
  type: string;
  category_id: string;
  frequency: string;
  start_date: string;
  end_date?: string | null;
  create_as_forecast: boolean;
  skip_weekends: boolean;
  bank_account_id?: string | null;
}

export function useCreateRecurringMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createRecurring = async (values: RecurringPayload) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Usuário não autenticado");

    const { data: userCompany } = await supabase
      .from("user_companies")
      .select("company_id")
      .eq("user_id", userData.user.id)
      .eq("is_default", true)
      .single();

    if (!userCompany) throw new Error("Empresa não encontrada");

    const payload = {
      company_id: userCompany.company_id,
      name: values.name,
      amount: values.amount,
      type: values.type,
      category_id: values.category_id,
      frequency: values.frequency,
      start_date: values.start_date,
      end_date: values.end_date || null,
      day_of_month:
        values.frequency === "mensal"
          ? new Date(values.start_date).getDate()
          : null,
      create_as_forecast: values.create_as_forecast,
      skip_weekends: values.skip_weekends,
      status: "active",
      bank_account_id: values.bank_account_id || null,
    };

    const { error } = await supabase
      .from("recurring_transactions")
      .insert(payload);

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ["recurring_transactions"] });
  };

  return { createRecurring, toast };
}
