'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Calculator, TrendingDown, Percent, Wallet, Sparkles } from 'lucide-react';
import { Debt, debtCalculationEngine } from '../services/debtCalculationEngine';

interface DebtSimulationDialogProps {
    debt: Debt | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DebtSimulationDialog({ debt, open, onOpenChange }: DebtSimulationDialogProps) {
    const [discountPercent, setDiscountPercent] = useState(0);
    const [payoffDate, setPayoffDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const simulation = useMemo(() => {
        if (!debt) return null;
        try {
            return debtCalculationEngine.simulateEarlyPayoff(
                debt,
                new Date(payoffDate),
                discountPercent
            );
        } catch {
            return null;
        }
    }, [debt, payoffDate, discountPercent]);

    if (!debt) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-blue-500" />
                        Simulação de Quitação
                    </DialogTitle>
                    <DialogDescription>
                        Simule o pagamento antecipado de "{debt.name}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Data de Quitação</Label>
                            <Input
                                type="date"
                                value={payoffDate}
                                onChange={(e) => setPayoffDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label>Desconto Negociado</Label>
                                <span className="text-sm font-bold text-primary">{discountPercent}%</span>
                            </div>
                            <Slider
                                value={[discountPercent]}
                                onValueChange={([v]) => setDiscountPercent(v)}
                                min={0}
                                max={50}
                                step={1}
                                className="cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>0%</span>
                                <span>25%</span>
                                <span>50%</span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Results */}
                    {simulation && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                Resultado da Simulação
                            </h4>

                            <div className="space-y-2">
                                <ResultRow
                                    icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                                    label="Saldo Devedor Atual"
                                    value={formatCurrency(simulation.currentBalance)}
                                />
                                {discountPercent > 0 && (
                                    <ResultRow
                                        icon={<Percent className="h-4 w-4 text-green-500" />}
                                        label={`Desconto (${discountPercent}%)`}
                                        value={`- ${formatCurrency(simulation.discountAmount)}`}
                                        variant="success"
                                    />
                                )}
                                <Separator />
                                <ResultRow
                                    icon={<TrendingDown className="h-4 w-4 text-primary" />}
                                    label="Valor Final para Quitação"
                                    value={formatCurrency(simulation.finalPayoff)}
                                    variant="highlight"
                                    bold
                                />
                                <ResultRow
                                    icon={<Sparkles className="h-4 w-4 text-amber-500" />}
                                    label="Economia Total (juros + desconto)"
                                    value={formatCurrency(simulation.interestSaved)}
                                    variant="success"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ResultRow({
    icon,
    label,
    value,
    variant,
    bold,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    variant?: 'success' | 'highlight';
    bold?: boolean;
}) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {icon}
                {label}
            </div>
            <span className={`text-sm tabular-nums ${bold ? 'font-bold text-base' : 'font-semibold'
                } ${variant === 'success' ? 'text-green-500' :
                    variant === 'highlight' ? 'text-primary' : 'text-foreground'
                }`}>
                {value}
            </span>
        </div>
    );
}
