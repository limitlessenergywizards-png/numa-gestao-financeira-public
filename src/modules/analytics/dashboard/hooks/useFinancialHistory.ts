import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, format, parseISO, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface MonthlyFinancialData {
    month: string; // "Jan", "Fev", etc.
    fullDate: string; // "2023-01-01" for sorting
    receitas: number;
    despesas: number;
}

export function useFinancialHistory(companyId: string | null | undefined) {
    const enabled = !!companyId;

    return useQuery({
        queryKey: ["dashboard", "financial_history", companyId],
        queryFn: async () => {
            if (!companyId) return [];

            // Calculate the start date (6 months ago from the start of the current month)
            const today = new Date();
            const startDate = startOfMonth(subMonths(today, 5)); // Current month + 5 previous months = 6 months
            const endDate = endOfMonth(today);

            const startDateStr = format(startDate, "yyyy-MM-dd");
            const endDateStr = format(endDate, "yyyy-MM-dd");

            // Fetch realized transactions within the date range
            const { data: transactions, error } = await supabase
                .from("transactions")
                .select("amount, type, transaction_date")
                .eq("company_id", companyId)
                .eq("nature", "realizado")
                .eq("is_deleted", false)
                .gte("transaction_date", startDateStr)
                .lte("transaction_date", endDateStr);

            if (error) {
                console.error("Error fetching financial history:", error);
                throw error;
            }

            // Initialize the last 6 months with zero values
            const monthsMap = new Map<string, MonthlyFinancialData>();

            for (let i = 0; i < 6; i++) {
                const date = subMonths(today, i);
                const monthKey = format(date, "yyyy-MM");
                const monthLabel = format(date, "MMM", { locale: ptBR });

                // Capitalize first letter of month (jan -> Jan)
                const formattedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

                monthsMap.set(monthKey, {
                    month: formattedLabel,
                    fullDate: monthKey,
                    receitas: 0,
                    despesas: 0
                });
            }

            // Aggregate transaction data
            transactions?.forEach((tx) => {
                const date = parseISO(tx.transaction_date);
                const monthKey = format(date, "yyyy-MM");

                if (monthsMap.has(monthKey)) {
                    const entry = monthsMap.get(monthKey)!;
                    const amount = Number(tx.amount);

                    if (tx.type === "entrada") {
                        entry.receitas += amount;
                    } else if (tx.type === "saida") {
                        entry.despesas += amount;
                    }
                }
            });

            // Convert map to array and sort by date
            const result = Array.from(monthsMap.values()).sort((a, b) =>
                a.fullDate.localeCompare(b.fullDate)
            );

            return result;
        },
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
