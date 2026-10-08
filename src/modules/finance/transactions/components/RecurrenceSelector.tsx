'use client';

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Check, Repeat, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly' | 'custom';
export type CustomIntervalUnit = 'days' | 'weeks' | 'months' | 'years';

export interface RecurrenceConfig {
    frequency: RecurrenceFrequency;
    interval: number; // e.g., every 2 weeks
    specificDays: number[]; // e.g., [1,3,5] for Mon,Wed,Fri
    dayOfMonth: number | null; // e.g., 15
    endDate: Date | null;
    occurrenceLimit: number | null;
    // Installment mode
    isInstallment: boolean;
    installmentCount: number | null;
}

interface RecurrenceSelectorProps {
    value: RecurrenceConfig;
    onChange: (value: RecurrenceConfig) => void;
    className?: string;
}

const WEEKDAYS = [
    { label: 'D', value: 0 },
    { label: 'S', value: 1 },
    { label: 'T', value: 2 },
    { label: 'Q', value: 3 },
    { label: 'Q', value: 4 },
    { label: 'S', value: 5 },
    { label: 'S', value: 6 },
];

export function RecurrenceSelector({ value, onChange, className }: RecurrenceSelectorProps) {
    const [endType, setEndType] = useState<'never' | 'date' | 'occurrences'>(
        value.endDate ? 'date' : value.occurrenceLimit ? 'occurrences' : 'never'
    );

    // Mode: 'once' | 'installment' | 'recurring'
    const mode = value.isInstallment ? 'installment' : value.frequency !== 'none' ? 'recurring' : 'once';

    const handleModeChange = (newMode: string) => {
        if (newMode === 'once') {
            onChange({
                ...value,
                frequency: 'none',
                isInstallment: false,
                installmentCount: null,
                occurrenceLimit: null,
                endDate: null,
            });
        } else if (newMode === 'installment') {
            onChange({
                ...value,
                frequency: 'monthly',
                interval: 1,
                isInstallment: true,
                installmentCount: value.installmentCount || 12,
                occurrenceLimit: value.installmentCount || 12,
                endDate: null,
            });
        } else if (newMode === 'recurring') {
            onChange({
                ...value,
                frequency: 'monthly',
                interval: 1,
                isInstallment: false,
                installmentCount: null,
            });
        }
    };

    const handleFrequencyChange = (freq: string) => {
        onChange({
            ...value,
            frequency: freq as RecurrenceFrequency,
            interval: value.interval || 1,
        });
    };

    const handleInstallmentCountChange = (count: number) => {
        onChange({
            ...value,
            installmentCount: count,
            occurrenceLimit: count,
        });
    };

    const toggleWeekday = (day: number) => {
        const current = value.specificDays || [];
        const newDays = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day].sort();
        onChange({ ...value, specificDays: newDays });
    };

    return (
        <div className={cn("space-y-4 border rounded-xl p-4 bg-muted/20", className)}>
            {/* Mode Selector: Uma vez / Parcelado / Recorrente */}
            <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tipo de lançamento</Label>
                <div className="grid grid-cols-3 gap-1 bg-muted/50 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => handleModeChange('once')}
                        className={cn(
                            "flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                            mode === 'once'
                                ? "bg-card shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Uma vez
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModeChange('installment')}
                        className={cn(
                            "flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                            mode === 'installment'
                                ? "bg-card shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <CreditCard className="h-3 w-3" />
                        Parcelado
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModeChange('recurring')}
                        className={cn(
                            "flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                            mode === 'recurring'
                                ? "bg-card shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Repeat className="h-3 w-3" />
                        Recorrente
                    </button>
                </div>
            </div>

            {/* ── Installment Mode ── */}
            {mode === 'installment' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Nº de parcelas</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={2}
                                    max={360}
                                    value={value.installmentCount || ''}
                                    onChange={(e) => handleInstallmentCountChange(parseInt(e.target.value) || 2)}
                                    placeholder="12"
                                    className="h-9 text-sm"
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap font-medium">
                                    x
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Frequência</Label>
                            <Select value={value.frequency} onValueChange={handleFrequencyChange}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Diária</SelectItem>
                                    <SelectItem value="weekly">Semanal</SelectItem>
                                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                                    <SelectItem value="monthly">Mensal</SelectItem>
                                    <SelectItem value="quarterly">Trimestral</SelectItem>
                                    <SelectItem value="semiannual">Semestral</SelectItem>
                                    <SelectItem value="yearly">Anual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Preview */}
                    {value.installmentCount && value.installmentCount > 0 && (
                        <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5 flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>
                                Serão geradas <strong className="text-foreground">{value.installmentCount} parcelas</strong>
                                {' '}com descrição <strong className="text-foreground">"Parcela 1/{value.installmentCount}"</strong>,{' '}
                                <strong className="text-foreground">"Parcela 2/{value.installmentCount}"</strong>, etc.
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Recurring Mode ── */}
            {mode === 'recurring' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    {/* Frequency & Interval Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Frequência</Label>
                            <Select value={value.frequency} onValueChange={handleFrequencyChange}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Diariamente</SelectItem>
                                    <SelectItem value="weekly">Semanalmente</SelectItem>
                                    <SelectItem value="biweekly">Quinzenalmente</SelectItem>
                                    <SelectItem value="monthly">Mensalmente</SelectItem>
                                    <SelectItem value="quarterly">Trimestralmente</SelectItem>
                                    <SelectItem value="semiannual">Semestralmente</SelectItem>
                                    <SelectItem value="yearly">Anualmente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">A cada (Intervalo)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={1}
                                    value={value.interval}
                                    onChange={(e) => onChange({ ...value, interval: parseInt(e.target.value) || 1 })}
                                    className="h-9 text-sm"
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {value.frequency === 'daily' && (value.interval === 1 ? 'dia' : 'dias')}
                                    {value.frequency === 'weekly' && (value.interval === 1 ? 'semana' : 'semanas')}
                                    {value.frequency === 'biweekly' && (value.interval === 1 ? 'quinzena' : 'quinzenas')}
                                    {value.frequency === 'monthly' && (value.interval === 1 ? 'mês' : 'meses')}
                                    {value.frequency === 'quarterly' && (value.interval === 1 ? 'trimestre' : 'trimestres')}
                                    {value.frequency === 'semiannual' && (value.interval === 1 ? 'semestre' : 'semestres')}
                                    {value.frequency === 'yearly' && (value.interval === 1 ? 'ano' : 'anos')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Weekday Selector (Only for Weekly) */}
                    {value.frequency === 'weekly' && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-xs font-medium">Dias da semana</Label>
                            <div className="flex justify-between gap-1">
                                {WEEKDAYS.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleWeekday(day.value)}
                                        className={cn(
                                            "h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-colors",
                                            value.specificDays?.includes(day.value)
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-background border hover:bg-muted"
                                        )}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Monthly Specifics (Only for Monthly) */}
                    {value.frequency === 'monthly' && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-xs font-medium">No dia</Label>
                            <Input
                                type="number"
                                min={1}
                                max={31}
                                value={value.dayOfMonth || ''}
                                onChange={(e) => onChange({ ...value, dayOfMonth: parseInt(e.target.value) || null })}
                                placeholder="Ex: 15"
                                className="h-9 text-sm"
                            />
                        </div>
                    )}

                    {/* End Condition */}
                    <div className="space-y-3 pt-2 border-t mt-2">
                        <Label className="text-xs font-medium">Termina em:</Label>

                        <div className="space-y-2">
                            {/* Never */}
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEndType('never');
                                        onChange({ ...value, endDate: null, occurrenceLimit: null });
                                    }}
                                    className={cn(
                                        "h-4 w-4 rounded-full border flex items-center justify-center",
                                        endType === 'never' ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                    )}
                                >
                                    {endType === 'never' && <Check className="h-3 w-3" />}
                                </button>
                                <span className="text-sm cursor-pointer" onClick={() => setEndType('never')}>Nunca (Indeterminado)</span>
                            </div>

                            {/* On Date */}
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setEndType('date')}
                                    className={cn(
                                        "h-4 w-4 rounded-full border flex items-center justify-center",
                                        endType === 'date' ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                    )}
                                >
                                    {endType === 'date' && <Check className="h-3 w-3" />}
                                </button>
                                <span className="text-sm cursor-pointer w-16" onClick={() => setEndType('date')}>Na data:</span>
                                <Popover modal>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            disabled={endType !== 'date'}
                                            className={cn(
                                                "h-8 text-xs justify-start text-left font-normal w-32",
                                                !value.endDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-3 w-3" />
                                            {value.endDate ? format(value.endDate, "dd/MM/yyyy") : "Selecione"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 z-[200]" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={value.endDate || undefined}
                                            onSelect={(date) => onChange({ ...value, endDate: date || null })}
                                            captionLayout="dropdown"
                                            fromYear={2020}
                                            toYear={2030}
                                            initialFocus
                                            locale={ptBR}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* After Occurrences */}
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setEndType('occurrences')}
                                    className={cn(
                                        "h-4 w-4 rounded-full border flex items-center justify-center",
                                        endType === 'occurrences' ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                    )}
                                >
                                    {endType === 'occurrences' && <Check className="h-3 w-3" />}
                                </button>
                                <span className="text-sm cursor-pointer" onClick={() => setEndType('occurrences')}>Após</span>
                                <Input
                                    type="number"
                                    min={1}
                                    disabled={endType !== 'occurrences'}
                                    value={value.occurrenceLimit || ''}
                                    onChange={(e) => onChange({ ...value, occurrenceLimit: parseInt(e.target.value) || null })}
                                    className="h-8 w-16 text-sm"
                                />
                                <span className="text-sm">ocorrências</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
