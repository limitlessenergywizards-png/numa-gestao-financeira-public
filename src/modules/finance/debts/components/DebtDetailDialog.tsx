'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Calculator, CalendarDays, Percent, TrendingDown, Receipt } from 'lucide-react';
import { Debt, debtCalculationEngine, PaymentSchedule } from '../services/debtCalculationEngine';

interface DebtDetailDialogProps {
    debt: Debt | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPay: (debt: Debt) => void;
    onSimulate: (debt: Debt) => void;
}

export function DebtDetailDialog({ debt, open, onOpenChange, onPay, onSimulate }: DebtDetailDialogProps) {
    const schedule = useMemo(() => {
        if (!debt) return [];
        try {
            return debtCalculationEngine.calculatePaymentSchedule(debt);
        } catch {
            return [];
        }
    }, [debt]);

    const totalInterest = useMemo(() => {
        return schedule.reduce((sum, s) => sum + s.interest, 0);
    }, [schedule]);

    const totalPayable = useMemo(() => {
        return schedule.reduce((sum, s) => sum + s.total, 0);
    }, [schedule]);

    if (!debt) return null;

    const progress = debt.original_amount > 0
        ? ((debt.paid_amount || 0) / debt.original_amount) * 100
        : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        {debt.name}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Credor: {debt.creditor_name}
                    </DialogDescription>
                </DialogHeader>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    <SummaryCard
                        icon={<DollarSign className="h-4 w-4" />}
                        label="Saldo Devedor"
                        value={formatCurrency(debt.current_balance)}
                        variant="destructive"
                    />
                    <SummaryCard
                        icon={<TrendingDown className="h-4 w-4" />}
                        label="Total Pago"
                        value={formatCurrency(debt.paid_amount || 0)}
                        variant="success"
                    />
                    <SummaryCard
                        icon={<Percent className="h-4 w-4" />}
                        label="Taxa de Juros"
                        value={`${debt.interest_rate}% ${debt.interest_period === 'mensal' ? 'a.m.' : 'a.a.'}`}
                    />
                    <SummaryCard
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Parcelas"
                        value={`${debt.paid_installments}/${debt.total_installments || '∞'}`}
                    />
                </div>

                {/* Progress */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progresso de Pagamento</span>
                        <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Interest Summary */}
                {schedule.length > 0 && (
                    <div className="flex gap-4 text-sm p-3 rounded-lg bg-muted/50 border">
                        <div className="flex-1">
                            <span className="text-muted-foreground">Total de Juros:</span>
                            <span className="ml-2 font-semibold text-amber-500">{formatCurrency(totalInterest)}</span>
                        </div>
                        <div className="flex-1 text-right">
                            <span className="text-muted-foreground">Total a Pagar:</span>
                            <span className="ml-2 font-semibold">{formatCurrency(totalPayable)}</span>
                        </div>
                    </div>
                )}

                <Separator />

                {/* Payment Schedule Table */}
                <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Cronograma de Parcelas
                    </h3>

                    {schedule.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Não foi possível calcular o cronograma para esta dívida.
                        </p>
                    ) : (
                        <div className="max-h-[280px] overflow-y-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                                    <tr className="text-xs text-muted-foreground">
                                        <th className="text-left py-2 px-3 font-medium">#</th>
                                        <th className="text-left py-2 px-3 font-medium">Vencimento</th>
                                        <th className="text-right py-2 px-3 font-medium">Principal</th>
                                        <th className="text-right py-2 px-3 font-medium">Juros</th>
                                        <th className="text-right py-2 px-3 font-medium">Parcela</th>
                                        <th className="text-right py-2 px-3 font-medium">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedule.map((row, i) => {
                                        const isPaid = i < (debt.paid_installments || 0);
                                        return (
                                            <tr
                                                key={i}
                                                className={`border-t border-border/30 transition-colors ${isPaid ? 'opacity-50 line-through' : 'hover:bg-muted/30'
                                                    }`}
                                            >
                                                <td className="py-2 px-3 tabular-nums">
                                                    {row.installment_number}
                                                    {isPaid && (
                                                        <Badge variant="outline" className="ml-1 text-[8px] px-1 py-0 h-3 bg-green-500/15 text-green-400 border-green-500/30">
                                                            PAGO
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-2 px-3">{format(row.due_date, 'dd/MM/yyyy', { locale: ptBR })}</td>
                                                <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(row.principal)}</td>
                                                <td className="py-2 px-3 text-right tabular-nums text-amber-500">{formatCurrency(row.interest)}</td>
                                                <td className="py-2 px-3 text-right tabular-nums font-medium">{formatCurrency(row.total)}</td>
                                                <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">{formatCurrency(row.balance)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button className="flex-1" onClick={() => onPay(debt)}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Registrar Pagamento
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => onSimulate(debt)}>
                        <Calculator className="w-4 h-4 mr-2" />
                        Simular Quitação
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function SummaryCard({
    icon,
    label,
    value,
    variant,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    variant?: 'destructive' | 'success';
}) {
    return (
        <div className="p-3 rounded-lg border bg-card/50 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                {icon}
                {label}
            </div>
            <p className={`text-sm font-bold ${variant === 'destructive' ? 'text-destructive' :
                    variant === 'success' ? 'text-green-500' : 'text-foreground'
                }`}>
                {value}
            </p>
        </div>
    );
}
