import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { addMonths, format, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, CalendarDays } from "lucide-react";
import { RecurringTransaction, recurringEngine } from "../services/recurringEngine";

interface ProjectedItem {
    date: Date;
    amount: number;
    recurrenceName: string;
    type: 'receita' | 'despesa';
    categoryName?: string;
}

export function RecurrenceProjection() {
    // Fetch active recurrences
    const { data: projections, isLoading } = useQuery({
        queryKey: ["recurrence_projections"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("recurring_transactions")
                .select(`*, category:categories(name)`)
                .eq('status', 'active');

            if (error) throw error;

            const activeRecurrences = data as unknown as (RecurringTransaction & { category: { name: string } })[];
            const allProjections: ProjectedItem[] = [];

            // Generate projections for next 12 months
            for (const recurrence of activeRecurrences) {
                const occurrences = await recurringEngine.projectOccurrences(recurrence, 12);

                occurrences.forEach(occ => {
                    allProjections.push({
                        date: occ.date,
                        amount: occ.amount,
                        recurrenceName: recurrence.name,
                        type: recurrence.type,
                        categoryName: recurrence.category?.name
                    });
                });
            }

            // Sort by date
            return allProjections.sort((a, b) => a.date.getTime() - b.date.getTime());
        }
    });

    if (isLoading) {
        return <div className="p-8 text-center">Calculando projeções...</div>;
    }

    if (!projections || projections.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    Nenhuma projeção futura encontrada.
                </CardContent>
            </Card>
        );
    }

    // Group by month
    const groupedProjections: { [key: string]: ProjectedItem[] } = {};
    projections.forEach(item => {
        const monthKey = format(item.date, 'MMMM yyyy', { locale: ptBR });
        if (!groupedProjections[monthKey]) {
            groupedProjections[monthKey] = [];
        }
        groupedProjections[monthKey].push(item);
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Linha do Tempo (Próximos 12 meses)</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px] w-full pr-4">
                    <div className="space-y-8">
                        {Object.entries(groupedProjections).map(([month, items]) => {
                            const totalReceita = items.filter(i => i.type === 'receita').reduce((sum, i) => sum + i.amount, 0);
                            const totalDespesa = items.filter(i => i.type === 'despesa').reduce((sum, i) => sum + i.amount, 0);
                            const saldo = totalReceita - totalDespesa;

                            return (
                                <div key={month} className="space-y-4">
                                    <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur py-2 z-10 border-b">
                                        <h3 className="font-semibold capitalize flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4" />
                                            {month}
                                        </h3>
                                        <div className="text-sm space-x-4">
                                            <span className="text-green-600 font-medium">
                                                + {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalReceita)}
                                            </span>
                                            <span className="text-red-600 font-medium">
                                                - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalDespesa)}
                                            </span>
                                            <span className={`font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                = {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(saldo)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid gap-2 pl-4 border-l-2 border-muted ml-2">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-muted-foreground w-12 font-mono">
                                                        {format(item.date, 'dd/MM')}
                                                    </span>
                                                    <div>
                                                        <span className="font-medium block">{item.recurrenceName}</span>
                                                        <span className="text-xs text-muted-foreground">{item.categoryName}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium ${item.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.amount)}
                                                    </span>
                                                    {item.type === 'receita' ? (
                                                        <ArrowRight className="h-3 w-3 text-green-500 rotate-180" /> // In means left? No, arrow visualization is tricky. Let's just use color.
                                                    ) : (
                                                        <ArrowRight className="h-3 w-3 text-red-500" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
