'use client';


import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowRight, Target, AlertTriangle } from 'lucide-react';
import { maskCurrencyInput, parseCurrencyValue } from '@/lib/masks';
import { type Transaction } from '@/modules/finance/transactions/hooks/useTransactionsData';

interface ForecastConversionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    forecast: Transaction | null;
    onConfirm: (forecastId: string, actualAmount: number, keepForecast: boolean, date: string) => Promise<boolean>;
}

export function ForecastConversionDialog({
    isOpen,
    onOpenChange,
    forecast,
    onConfirm
}: ForecastConversionDialogProps) {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [keepForecast, setKeepForecast] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deviation, setDeviation] = useState<{ value: number; percent: number } | null>(null);

    useEffect(() => {
        if (isOpen && forecast) {
            setAmount(maskCurrencyInput(forecast.amount.toFixed(2)));
            setDate(forecast.transaction_date);
            setKeepForecast(true); // Default to keeping history
        }
    }, [isOpen, forecast]);

    // Calculate deviation whenever amount changes (safe against division by zero)
    useEffect(() => {
        if (forecast && amount) {
            const actualVal = parseCurrencyValue(amount);
            const forecastVal = forecast.amount;

            if (forecastVal === 0) {
                setDeviation({ value: actualVal, percent: actualVal > 0 ? 100 : 0 });
            } else {
                const diff = actualVal - forecastVal;
                const percent = (diff / forecastVal) * 100;
                setDeviation({ value: diff, percent });
            }
        } else {
            setDeviation(null);
        }
    }, [amount, forecast]);

    const handleConfirm = async () => {
        if (!forecast) return;

        const parsedAmount = parseCurrencyValue(amount);

        // Defensive validation
        if (parsedAmount <= 0 || !Number.isFinite(parsedAmount)) {
            return; // Button stays enabled, user can correct
        }

        if (!date || isNaN(Date.parse(date))) {
            return;
        }

        setIsSubmitting(true);
        try {
            const success = await onConfirm(forecast.id, parsedAmount, keepForecast, date);
            if (success) {
                onOpenChange(false);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!forecast) return null;

    const getDeviationColor = () => {
        if (!deviation) return 'text-muted-foreground';
        const absPercent = Math.abs(deviation.percent);
        if (absPercent < 10) return 'text-success';
        if (absPercent < 20) return 'text-yellow-600';
        return 'text-destructive';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Converter Previsão em Realizado</DialogTitle>
                    <DialogDescription>
                        Confirme os valores para transformar esta previsão em um lançamento real.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Previsão</span>
                            <div className="flex items-center gap-2 font-medium">
                                <Target className="w-4 h-4 text-muted-foreground" />
                                R$ {forecast.amount.toFixed(2)}
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
                        <div className="space-y-1 text-right">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Realizado</span>
                            <div className="flex items-center justify-end gap-2 font-bold text-lg">
                                R$
                                <Input
                                    value={amount}
                                    onChange={(e) => setAmount(maskCurrencyInput(e.target.value))}
                                    className="w-32 h-8 text-right font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {deviation && (
                        <div className={`flex items-center justify-center gap-2 text-sm font-medium ${getDeviationColor()}`}>
                            {Math.abs(deviation.percent) > 20 && <AlertTriangle className="w-4 h-4" />}
                            Desvio: {deviation.value > 0 ? '+' : ''}{deviation.value.toFixed(2)} ({deviation.value > 0 ? '+' : ''}{deviation.percent.toFixed(1)}%)
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="conv_date" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                            Data do Lançamento
                        </Label>
                        <Input
                            id="conv_date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="h-9"
                        />
                    </div>

                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="keep_forecast"
                            checked={keepForecast}
                            onCheckedChange={(c) => setKeepForecast(!!c)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="keep_forecast"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Manter histórico da previsão
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Se desmarcado, a previsão será excluída. Recomendamos manter para análise de assertividade.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Conversão
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
