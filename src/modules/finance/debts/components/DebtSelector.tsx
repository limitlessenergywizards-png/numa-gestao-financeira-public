'use client';


import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { useDebts } from '../hooks/useDebts';
import { NewDebtDialog } from './NewDebtDialog';

interface DebtSelectorProps {
    value: string | null;
    onChange: (value: string | null) => void;
    className?: string;
}

export function DebtSelector({ value, onChange, className }: DebtSelectorProps) {
    const { data: debts, isLoading } = useDebts();
    const [isNewDebtOpen, setIsNewDebtOpen] = useState(false);

    // If debts are loading, show a disabled selector with spinner
    if (isLoading) {
        return (
            <div className="flex gap-2">
                <Button disabled variant="outline" className="w-full justify-start text-left font-normal">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando dívidas...
                </Button>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="flex gap-2">
                <Select value={value || ''} onValueChange={(val) => onChange(val || null)}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione a dívida..." />
                    </SelectTrigger>
                    <SelectContent>
                        {debts?.map((debt) => (
                            <SelectItem key={debt.id} value={debt.id}>
                                {debt.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(debt.current_balance)}
                            </SelectItem>
                        ))}
                        {debts?.length === 0 && (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                                Nenhuma dívida ativa encontrada.
                            </div>
                        )}
                    </SelectContent>
                </Select>

                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsNewDebtOpen(true)}
                    title="Nova Dívida"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <NewDebtDialog
                open={isNewDebtOpen}
                onOpenChange={setIsNewDebtOpen}
                onSuccess={(id) => onChange(id)}
            />
        </div>
    );
}
