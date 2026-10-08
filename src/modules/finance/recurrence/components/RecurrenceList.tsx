'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit2, RefreshCw, Trash2, Power, Pause, Play } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { RecurringTransaction } from "../services/recurringEngine";

export function RecurrenceList() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { currentCompany } = useCompany();

    const { data: recurrences, isLoading } = useQuery({
        queryKey: ["recurring_transactions"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("recurring_transactions")
                .select(`
          *,
          category:categories(name),
          bank_account:bank_accounts(name)
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as unknown as (RecurringTransaction & { category: { name: string }, bank_account?: { name: string } })[];
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'active' | 'paused' }) => {
            const newStatus = status === 'active' ? 'paused' : 'active';
            const { error } = await supabase
                .from('recurring_transactions')
                .update({ status: newStatus })
                .eq('id', id)
                .eq('company_id', currentCompany!.id);

            if (error) throw error;
            return newStatus;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recurring_transactions"] });
            toast({ title: "Status atualizado com sucesso" });
        },
        onError: () => {
            toast({ title: "Erro ao atualizar status", variant: "destructive" });
        }
    });

    const materializeMutation = useMutation({
        mutationFn: async (id: string) => {
            // We need to call the engine. Since engine is client-side for now (until we move to Edge Function), we can call it here.
            // Import dynamically to avoid SSR issues if any (though this is SPA)
            const { recurringEngine } = await import('../services/recurringEngine');
            const count = await recurringEngine.materializeOccurrences(id);
            return count;
        },
        onSuccess: (count) => {
            toast({ title: `Processado com sucesso`, description: `${count} ocorrências geradas.` });
            queryClient.invalidateQueries({ queryKey: ["recurring_transactions"] });
        },
        onError: (err) => {
            toast({ title: "Erro ao materializar", description: err.message, variant: "destructive" });
        }
    });

    if (isLoading) {
        return <div className="p-8 text-center">Carregando recorrências...</div>;
    }

    if (!recurrences || recurrences.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    Nenhuma recorrência cadastrada ainda.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recorrências Ativas</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px] w-full pr-4">
                    <div className="space-y-4">
                        {recurrences.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${item.type === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {/* Status Icon */}
                                        {item.status === 'active' ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{item.name}</h3>
                                        <div className="text-sm text-muted-foreground flex gap-2 items-center">
                                            <span>{item.category?.name}</span>
                                            <span>•</span>
                                            <span className="capitalize">{item.frequency}</span>
                                            {item.bank_account && (
                                                <>
                                                    <span>•</span>
                                                    <span>{item.bank_account.name}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Próx: {format(new Date(item.start_date), "dd/MM/yyyy", { locale: ptBR })}
                                            {/* Simplificado, idealmente calcularíamos a próxima data real */}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className={`font-bold ${item.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.amount)}
                                        </div>
                                        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                                            {item.status === 'active' ? 'Ativo' : 'Pausado'}
                                        </Badge>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => materializeMutation.mutate(item.id)}
                                            title="Processar agora (Gerar lançamentos)"
                                            disabled={materializeMutation.isPending}
                                        >
                                            <RefreshCw className={`h-4 w-4 ${materializeMutation.isPending ? 'animate-spin' : ''}`} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleStatusMutation.mutate({ id: item.id, status: item.status as 'active' | 'paused' })}
                                            disabled={item.status === 'ended'}
                                            title={item.status === 'active' ? "Pausar" : "Ativar"}
                                        >
                                            {item.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon">
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
