
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export interface SimpleDebt {
    id: string;
    name: string;
    creditor_name: string;
    current_balance: number;
}

export function useDebts() {
    const { currentCompany } = useCompany();

    return useQuery({
        queryKey: ['debts', 'active', currentCompany?.id],
        queryFn: async () => {
            if (!currentCompany?.id) return [];

            const { data, error } = await supabase
                .from('debts')
                .select('id, name, creditor_name, current_balance')
                .eq('company_id', currentCompany.id)
                .eq('status', 'active')
                .order('name');

            if (error) throw error;
            return data as SimpleDebt[];
        },
        enabled: !!currentCompany?.id
    });
}
