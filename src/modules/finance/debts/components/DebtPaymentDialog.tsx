'use client';

import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Debt, debtCalculationEngine } from '../services/debtCalculationEngine';

interface DebtPaymentDialogProps {
    debt: Debt | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DebtPaymentDialog({ debt, open, onOpenChange }: DebtPaymentDialogProps) {
    const { currentCompany } = useCompany();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate next installment info
    const nextInstallment = useMemo(() => {
        if (!debt) return null;
        try {
            const schedule = debtCalculationEngine.calculatePaymentSchedule(debt);
            return schedule[debt.paid_installments || 0] || null;
        } catch {
            return null;
        }
    }, [debt]);

    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [bankAccountId, setBankAccountId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('transferencia');

    // Reset form when dialog opens with new debt
    useMemo(() => {
        if (open && nextInstallment) {
            setPaymentAmount(nextInstallment.total.toFixed(2).replace('.', ','));
        }
    }, [open, nextInstallment]);

    // Fetch bank accounts
    const { data: bankAccounts } = useQuery({
        queryKey: ['bank_accounts', currentCompany?.id],
        queryFn: async () => {
            if (!currentCompany) return [];
            const { data } = await supabase
                .from('bank_accounts')
                .select('id, name')
                .eq('company_id', currentCompany.id)
                .eq('is_active', true)
                .order('name');
            return data || [];
        },
        enabled: !!currentCompany && open,
    });

    const parseCurrency = (value: string): number => {
        return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
    };

    const handleSubmit = useCallback(async () => {
        if (!debt || !currentCompany || !bankAccountId) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }

        const amount = parseCurrency(paymentAmount);
        if (amount <= 0) {
            toast.error('O valor do pagamento deve ser positivo.');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create a realized transaction
            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .insert({
                    company_id: currentCompany.id,
                    bank_account_id: bankAccountId,
                    supplier_id: null,
                    type: 'saida',
                    amount,
                    description: `${debt.name} - Pagamento parcela ${(debt.paid_installments || 0) + 1}`,
                    transaction_date: paymentDate,
                    nature: 'realizado',
                    is_debt_payment: true,
                    payment_method: paymentMethod,
                })
                .select('id')
                .single();

            if (txError) throw txError;

            // 2. Create debt_payment record
            const { error: dpError } = await supabase
                .from('debt_payments')
                .insert({
                    debt_id: debt.id,
                    company_id: currentCompany.id,
                    transaction_id: txData.id,
                    payment_date: paymentDate,
                    due_date: paymentDate,
                    principal_amount: amount,
                    interest_amount: 0,
                    total_amount: amount,
                    balance_after: Math.max(0, debt.current_balance - amount),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any);

            if (dpError) console.error('Error creating debt_payment:', dpError);

            // 3. Update debt balance via engine
            await debtCalculationEngine.updateDebtBalance(debt.id, amount);

            // 4. Update linked payable (next pending one for this debt)
            const { data: nextPayable } = await supabase
                .from('payables')
                .select('id')
                .eq('debt_id', debt.id)
                .eq('company_id', currentCompany!.id)
                .eq('status', 'pendente')
                .order('due_date')
                .limit(1)
                .single();

            if (nextPayable) {
                await supabase
                    .from('payables')
                    .update({
                        status: 'pago',
                        paid_amount: amount,
                        payment_date: paymentDate,
                    })
                    .eq('id', nextPayable.id)
                    .eq('company_id', currentCompany!.id);

                // Update linked forecast transaction to realizado
                await supabase
                    .from('transactions')
                    .update({ nature: 'realizado', forecast_type: null })
                    .eq('forecast_basis', `payable:${nextPayable.id}`);
            }

            // 5. Invalidate caches
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['payables'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });

            toast.success(`Pagamento de ${formatCurrency(amount)} registrado com sucesso!`);
            onOpenChange(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Error recording payment:', error);
            toast.error('Erro ao registrar pagamento: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    }, [debt, currentCompany, bankAccountId, paymentAmount, paymentDate, paymentMethod, queryClient, onOpenChange]);

    if (!debt) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        Registrar Pagamento
                    </DialogTitle>
                    <DialogDescription>
                        {debt.name} — Parcela {(debt.paid_installments || 0) + 1}
                        {debt.total_installments ? `/${debt.total_installments}` : ''}
                    </DialogDescription>
                </DialogHeader>

                {/* Info banner */}
                {nextInstallment && (
                    <div className="text-sm p-3 rounded-lg bg-muted/50 border space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor sugerido:</span>
                            <span className="font-semibold">{formatCurrency(nextInstallment.total)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Saldo devedor atual:</span>
                            <span className="font-semibold text-destructive">{formatCurrency(debt.current_balance)}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Valor do Pagamento *</Label>
                        <Input
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="0,00"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Conta Bancária *</Label>
                        <Select value={bankAccountId} onValueChange={setBankAccountId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a conta" />
                            </SelectTrigger>
                            <SelectContent>
                                {bankAccounts?.map((bank) => (
                                    <SelectItem key={bank.id} value={bank.id}>
                                        {bank.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Método</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                    <SelectItem value="cartao_debito">Débito</SelectItem>
                                    <SelectItem value="cartao_credito">Crédito</SelectItem>
                                    <SelectItem value="transferencia">Transferência</SelectItem>
                                    <SelectItem value="boleto">Boleto</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !bankAccountId}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirmar Pagamento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
