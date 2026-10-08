'use client';


import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency, cn } from '@/lib/utils';
import { Debt, debtCalculationEngine } from '../services/debtCalculationEngine';
import { AlertTriangle, DollarSign, Calculator, MoreVertical, Pencil, Trash2, Eye, Sparkles, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface DebtListProps {
    onViewDetail: (debt: Debt) => void;
    onPay: (debt: Debt) => void;
    onSimulate: (debt: Debt) => void;
    onEdit: (debt: Debt) => void;
    onDeleteSuccess?: () => void;
}

export function DebtList({ onViewDetail, onPay, onSimulate, onEdit, onDeleteSuccess }: DebtListProps) {
    const { currentCompany } = useCompany();
    const queryClient = useQueryClient();

    const { data: debts, isLoading } = useQuery({
        queryKey: ['debts', currentCompany?.id],
        queryFn: async () => {
            if (!currentCompany) return [];
            const { data, error } = await supabase
                .from('debts')
                .select('id, company_id, name, description, creditor_name, creditor_type, debt_type, original_amount, current_balance, paid_amount, paid_installments, status, interest_rate, interest_period, interest_type, total_installments, installment_amount, due_day, contract_date, first_due_date, paid_off_at, priority_score, created_at, updated_at')
                .eq('company_id', currentCompany.id)
                .neq('is_deleted', true)
                .order('priority_score', { ascending: false });

            if (error) throw error;
            return data as unknown as Debt[];
        },
        enabled: !!currentCompany
    });

    const handleDelete = async (debt: Debt) => {
        if (!confirm(`Tem certeza que deseja excluir a dívida "${debt.name}"? Esta ação não pode ser desfeita.`)) return;

        try {
            const { error } = await supabase
                .from('debts')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deletion_reason: 'Excluído pelo usuário',
                })
                .eq('id', debt.id)
                .eq('company_id', currentCompany!.id);

            if (error) throw error;

            toast.success('Dívida excluída com sucesso!');
            onDeleteSuccess?.();
            queryClient.invalidateQueries({ queryKey: ['debts'] });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error('Erro ao excluir: ' + error.message);
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 rounded-2xl bg-muted/20 animate-pulse border border-border/40" />
                ))}
            </div>
        );
    }

    if (!debts || debts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-3xl border-2 border-dashed border-border/40 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
                    <TrendingDown className="w-8 h-8 text-brand/40" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Sua lista de passivos está vazia</h3>
                <p className="text-muted-foreground mt-2 max-w-xs text-center">Nenhuma dívida cadastrada no momento. Ótimo sinal para sua saúde financeira!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {debts.map((debt, index) => {
                const priorityScore = debtCalculationEngine.calculatePriorityScore(debt);
                const progress = debt.original_amount > 0
                    ? ((debt.paid_amount || 0) / debt.original_amount) * 100
                    : 0;

                const isHighRisk = priorityScore > 75;

                return (
                    <div
                        key={debt.id}
                        className="group animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                    >
                        <Card
                            className="relative h-full bg-card border-border/50 overflow-hidden rounded-xl transition-[transform,box-shadow] hover:shadow-md hover:border-emerald-500/30"
                            onClick={() => onViewDetail(debt)}
                        >
                            <CardHeader className="pb-3 relative pt-5 px-5">
                                {/* Absolute positioned menu to fix alignment bugs */}
                                <div className="absolute top-3 right-3 z-20">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 transition-colors text-muted-foreground hover:text-emerald-500"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl border-border/40">
                                            <DropdownMenuItem onClick={() => onViewDetail(debt)} className="rounded-lg py-2">
                                                <Eye className="h-4 w-4 mr-2 opacity-70" />
                                                Ver Detalhes
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onEdit(debt)} className="rounded-lg py-2">
                                                <Pencil className="h-4 w-4 mr-2 opacity-70" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(debt)}
                                                className="text-destructive focus:text-destructive rounded-lg py-2"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2 opacity-70" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex flex-col gap-1 pr-8">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "px-2 py-0 h-4 rounded-md text-[9px] font-bold uppercase tracking-wider",
                                                isHighRisk ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            )}
                                        >
                                            Prioridade {priorityScore}
                                        </Badge>
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-emerald-500 transition-colors mt-1">
                                        {debt.name}
                                    </h3>
                                    <p className="text-xs font-medium text-muted-foreground/70 flex items-center gap-1.5">
                                        {debt.creditor_name}
                                    </p>
                                </div>

                                <div className="mt-4 p-4 rounded-xl bg-muted/20 dark:bg-muted/30 border border-border/10">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">Saldo Devedor</span>
                                    <div className="text-xl font-bold text-red-600 dark:text-red-500 truncate">
                                        {formatCurrency(debt.current_balance)}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 pt-0 px-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-muted/30 dark:bg-muted/10 p-2.5 rounded-lg border border-border/5">
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Juros</span>
                                        <span className={cn(
                                            "text-xs font-semibold",
                                            debt.interest_rate > 5 ? 'text-red-500' : 'text-foreground'
                                        )}>
                                            {debt.interest_rate}% <span className="text-[9px] opacity-60 font-normal">{debt.interest_period === 'mensal' ? 'a.m.' : 'a.a.'}</span>
                                        </span>
                                    </div>
                                    <div className="bg-muted/30 dark:bg-muted/10 p-2.5 rounded-lg border border-border/5 text-right">
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Parcelas</span>
                                        <span className="text-xs font-semibold text-foreground">
                                            {debt.paid_installments} <span className="text-muted-foreground/30 mx-0.5">/</span> {debt.total_installments || '∞'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                                        <span>Quitação</span>
                                        <span className="text-foreground">{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted/30 dark:bg-muted/50 rounded-full overflow-hidden">
                                        <div
                                            style={{ width: `${progress}%`, transition: 'width 1s ease-out' }}
                                            className={cn(
                                                "h-full rounded-full",
                                                isHighRisk ? "bg-red-500" : "bg-emerald-600 dark:bg-emerald-500"
                                            )}
                                        />
                                    </div>
                                </div>

                                {debt.debt_type === 'cartao_credito_rotativo' && debt.interest_rate > 8 && (
                                    <div className="p-2.5 rounded-lg bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 dark:border-red-500/10 flex gap-2.5 items-center">
                                        <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-500 shrink-0" />
                                        <p className="text-[10px] text-red-600 dark:text-red-500/90 leading-snug font-medium">Juros rotativos elevados. Considere renegociar para reduzir o custo do passivo.</p>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="pb-5 pt-1 px-5 gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                    className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-white text-xs shadow-sm shadow-emerald-600/10 transition-colors border-none"
                                    onClick={() => onPay(debt)}
                                >
                                    <TrendingDown className="w-3.5 h-3.5 mr-2" />
                                    Pagar
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 h-9 rounded-lg border-border/60 bg-background hover:bg-muted font-semibold text-xs transition-colors"
                                    onClick={() => onSimulate(debt)}
                                >
                                    <Calculator className="w-3.5 h-3.5 mr-2 opacity-70" />
                                    Simular
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
}
