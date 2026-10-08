'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Target, CalendarDays, MoreVertical, Edit, Trash2, TrendingDown, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { StatsGrid, StatItem } from '@/components/ui/stats-grid';
import { BudgetFormDialog } from './components/BudgetFormDialog';
import { useBudgets } from './hooks/useBudgets';
import { BudgetWithRealized } from './types';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function BudgetsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<BudgetWithRealized | null>(null);

    const {
        budgets,
        isLoading,
        createBudget,
        updateBudget,
        deleteBudget,
    } = useBudgets();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCreateOrUpdate = async (payload: any) => {
        if (editingBudget) {
            await updateBudget({ id: editingBudget.id, payload });
        } else {
            await createBudget(payload);
        }
        setIsDialogOpen(false);
    };

    const handleEdit = (budget: BudgetWithRealized) => {
        setEditingBudget(budget);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
            await deleteBudget(id);
        }
    };

    const openNewDialog = () => {
        setEditingBudget(null);
        setIsDialogOpen(true);
    };

    // Global stats
    const globalStats = useMemo((): StatItem[] | null => {
        if (!budgets.length) return null;
        const totalBudgeted = budgets.reduce((acc, b) => acc + b.amount, 0);
        const totalRealized = budgets.reduce((acc, b) => acc + b.realized_amount, 0);
        const burnRate = totalBudgeted > 0 ? (totalRealized / totalBudgeted) * 100 : 0;

        return [
            {
                title: "Total Orçado",
                value: totalBudgeted.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                icon: Target,
                color: "primary",
            },
            {
                title: "Total Realizado",
                value: totalRealized.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                icon: TrendingDown,
                color: burnRate > 85 ? "destructive" : "info",
            },
            {
                title: "Burn Rate Geral",
                value: `${burnRate.toFixed(1)}%`,
                icon: DollarSign,
                color: burnRate >= 100 ? "destructive" : burnRate > 80 ? "warning" : "success",
            },
        ];
    }, [budgets]);

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Orçamentos"
                    description="Defina metas financeiras e limites de gastos por categoria e período"
                    actions={
                        <Button onClick={openNewDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Orçamento
                        </Button>
                    }
                />

                {/* Stats summary */}
                {globalStats && !isLoading && (
                    <StatsGrid stats={globalStats} columns={3} variant="vibrant" />
                )}

                {/* Content */}
                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-48 rounded-lg" />
                        ))}
                    </div>
                ) : budgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <Target className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">Nenhum orçamento encontrado</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Crie seu primeiro orçamento para acompanhar metas de gastos e receitas.
                        </p>
                        <Button className="mt-4" onClick={openNewDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Orçamento
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {budgets.map((budget) => {
                            const isOverBudget = budget.progress_percentage >= 100;
                            const isWarning = budget.progress_percentage >= 85 && !isOverBudget;

                            const progressColor = isOverBudget
                                ? 'bg-destructive'
                                : isWarning
                                    ? 'bg-warning'
                                    : 'bg-brand';

                            return (
                                <Card key={budget.id} className="group overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                {/* Status badge */}
                                                {isOverBudget ? (
                                                    <Badge variant="destructive" className="text-[10px] uppercase tracking-wider">
                                                        <AlertCircle className="w-3 h-3 mr-1" /> Estourado
                                                    </Badge>
                                                ) : isWarning ? (
                                                    <Badge className="bg-warning text-warning-foreground hover:bg-warning/80 text-[10px] uppercase tracking-wider">
                                                        <TrendingDown className="w-3 h-3 mr-1" /> Atenção
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-success/10 text-success border-success/20 text-[10px] uppercase tracking-wider" variant="outline">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Saudável
                                                    </Badge>
                                                )}

                                                <CardTitle className="text-base font-semibold">
                                                    {budget.category_name}
                                                </CardTitle>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    {format(parseISO(budget.start_date), "dd 'de' MMM", { locale: ptBR })}
                                                    {' a '}
                                                    {format(parseISO(budget.end_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(budget)}>
                                                        <Edit className="h-4 w-4 mr-2" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(budget.id)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-2 pb-5">
                                        <div className="flex justify-between items-end mb-3">
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Realizado</p>
                                                <p className={cn("text-2xl font-bold", isOverBudget ? 'text-destructive' : 'text-foreground')}>
                                                    {budget.realized_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Orçado</p>
                                                <p className="text-lg font-medium text-foreground/80">
                                                    {budget.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>{budget.progress_percentage.toFixed(1)}%</span>
                                                {budget.variance_amount < 0 ? (
                                                    <span className="text-destructive">
                                                        {Math.abs(budget.variance_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} excedido
                                                    </span>
                                                ) : (
                                                    <span className="text-success">
                                                        {budget.variance_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} restante
                                                    </span>
                                                )}
                                            </div>
                                            <Progress
                                                value={Math.min(budget.progress_percentage, 100)}
                                                className="h-2"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Dialog */}
                {isDialogOpen && (
                    <BudgetFormDialog
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                        initialData={editingBudget}
                        onSave={handleCreateOrUpdate}
                    />
                )}
            </div>
        </AppLayout>
    );
}
