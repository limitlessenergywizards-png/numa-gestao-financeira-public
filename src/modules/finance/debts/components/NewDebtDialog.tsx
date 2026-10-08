'use client';


import { useState, useEffect } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { parseCurrencyValue } from '@/lib/masks';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DocumentInput } from '@/components/ui/document-input';
import { Debt } from '../services/debtCalculationEngine';
import { formatCurrency } from '@/lib/utils';
import { useCreditorsQuery, upsertDebt, getOrCreateSupplier, generatePayablesForDebt, addCreditor } from '../hooks/useDebtForm';


interface NewDebtDialogProps {
    debt?: Debt | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (debtId: string) => void;
}

export function NewDebtDialog({ debt, open, onOpenChange, onSuccess }: NewDebtDialogProps) {
    const { currentCompany } = useCompany();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNewCreditor, setShowNewCreditor] = useState(false);
    const [isAddingCreditor, setIsAddingCreditor] = useState(false);

    // Quick add creditor state
    const [newCreditor, setNewCreditor] = useState({
        name: '',
        document: '',
        category: 'outro',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        notes: '',
        is_active: true
    });

    const { data: suppliers = [] } = useCreditorsQuery();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            description: '',
            creditor_name: '',
            debt_type: 'parcelamento_price',
            original_amount: '',
            current_balance: '',
            interest_rate: '',
            interest_period: 'mensal',
            interest_type: 'price',
            total_installments: '',
            contract_date: format(new Date(), 'yyyy-MM-dd'),
            first_due_date: format(new Date(), 'yyyy-MM-dd'),
            due_day: '5',
            installment_amount: '',
            generate_payables: true,
        }
    });

    // Sync form when `debt` or `open` state changes
    useEffect(() => {
        if (open) {
            if (debt) {
                // Pre-populate for editing
                reset({
                    name: debt.name,
                    description: debt.description || '',
                    creditor_name: debt.creditor_name,
                    debt_type: debt.debt_type || 'outro',
                    original_amount: formatCurrency(debt.original_amount),
                    current_balance: formatCurrency(debt.current_balance),
                    interest_rate: debt.interest_rate.toString(),
                    interest_period: debt.interest_period || 'mensal',
                    interest_type: debt.interest_type || 'price',
                    total_installments: debt.total_installments?.toString() || '',
                    contract_date: debt.contract_date || format(new Date(), 'yyyy-MM-dd'),
                    first_due_date: debt.first_due_date || format(new Date(), 'yyyy-MM-dd'),
                    due_day: debt.due_day?.toString() || '5',
                    installment_amount: debt.installment_amount ? formatCurrency(debt.installment_amount) : '',
                    generate_payables: false, // Don't safely re-generate without user input when editing
                });
            } else {
                // Reset to defaults for a new insertion
                reset({
                    name: '',
                    description: '',
                    creditor_name: '',
                    debt_type: 'parcelamento_price',
                    original_amount: '',
                    current_balance: '',
                    interest_rate: '',
                    interest_period: 'mensal',
                    interest_type: 'price',
                    total_installments: '',
                    contract_date: format(new Date(), 'yyyy-MM-dd'),
                    first_due_date: format(new Date(), 'yyyy-MM-dd'),
                    due_day: '5',
                    installment_amount: '',
                    generate_payables: true,
                });
            }
        }
    }, [open, debt, reset]);

    const onSubmit = async (data: any) => {
        if (!currentCompany) return;

        setIsSubmitting(true);
        try {
            const originalAmount = parseCurrencyValue(data.original_amount);
            const currentBalance = data.current_balance ? parseCurrencyValue(data.current_balance) : originalAmount;
            const installmentAmount = data.installment_amount ? parseCurrencyValue(data.installment_amount) : null;
            const interestRate = parseFloat(data.interest_rate.replace(',', '.'));

            const payload = {
                company_id: currentCompany.id,
                name: data.name,
                description: data.description,
                creditor_name: data.creditor_name,
                debt_type: data.debt_type,
                original_amount: originalAmount,
                current_balance: currentBalance,
                interest_rate: interestRate,
                interest_period: data.interest_period,
                interest_type: data.interest_type,
                total_installments: data.total_installments ? parseInt(data.total_installments) : null,
                installment_amount: installmentAmount,
                contract_date: data.contract_date,
                first_due_date: data.first_due_date,
                due_day: parseInt(data.due_day)
            };

            const debtData = await upsertDebt(payload, debt || null);

            if (debt) {
                toast.success('Dívida atualizada com sucesso!');
            }

            if (data.generate_payables && debtData) {
                const supplierId = await getOrCreateSupplier(currentCompany.id, data.creditor_name);
                await generatePayablesForDebt(currentCompany.id, debtData, supplierId, data.total_installments);
                if (!debt) toast.success('Dívida e contas a pagar geradas com sucesso!');
            } else if (!debt) {
                toast.success('Dívida cadastrada com sucesso!');
            }

            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['payables'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            reset();
            onOpenChange(false);
            if (debtData?.id) {
                onSuccess?.(debtData.id);
            }
        } catch (error: any) {
            console.error('Error saving debt:', error);
            toast.error('Erro ao salvar dívida: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCreditor = async () => {
        if (!newCreditor.name.trim() || !currentCompany) return;
        setIsAddingCreditor(true);
        try {
            const creditorName = await addCreditor(currentCompany.id, newCreditor);

            queryClient.invalidateQueries({ queryKey: ['creditors'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setValue('creditor_name', creditorName);
            setShowNewCreditor(false);
            setNewCreditor({
                name: '', document: '', category: 'outro', email: '', phone: '',
                address: '', city: '', state: '', zip_code: '', notes: '', is_active: true
            });
            toast.success('Credor adicionado com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao adicionar credor: ' + error.message);
        } finally {
            setIsAddingCreditor(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{debt ? 'Editar Dívida' : 'Nova Dívida'}</DialogTitle>
                    <DialogDescription>
                        {debt ? 'Modifique os detalhes da dívida existente.' : 'Cadastre os detalhes da dívida para iniciar o acompanhamento.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Identification Section */}
                        <div className="md:col-span-2 mt-2">
                            <h3 className="text-sm font-semibold text-brand/80 uppercase tracking-wider border-b border-brand/10 pb-2 mb-3">
                                1. Identificação da Dívida
                            </h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Dívida *</Label>
                            <Input id="name" {...register('name', { required: true })} placeholder="Ex: Financiamento Carro" />
                            {errors.name && <span className="text-xs text-red-500">Campo obrigatório</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="creditor_name">Credor *</Label>
                            <div className="flex gap-2">
                                <Select value={watch('creditor_name')} onValueChange={(v) => setValue('creditor_name', v)}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Selecione um credor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="bg-brand/10 text-brand border-brand/20 hover:bg-brand/20 hover:text-brand"
                                    onClick={() => setShowNewCreditor(true)}
                                    title="Cadastrar Novo Credor"
                                >
                                    <UserPlus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2 lg:col-span-1">
                            <Label htmlFor="debt_type">Tipo de Dívida</Label>
                            <Select onValueChange={(v) => setValue('debt_type', v)} defaultValue="parcelamento_price">
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="parcelamento_price">Parcelamento (Price)</SelectItem>
                                    <SelectItem value="emprestimo_juros_compostos">Empréstimo (Juros Compostos)</SelectItem>
                                    <SelectItem value="cartao_credito_rotativo">Cartão de Crédito (Rotativo)</SelectItem>
                                    <SelectItem value="cheque_especial">Cheque Especial</SelectItem>
                                    <SelectItem value="parcelamento_impostos">Parcelamento Impostos</SelectItem>
                                    <SelectItem value="financiamento_imovel">Financiamento Imóvel</SelectItem>
                                    <SelectItem value="leasing">Leasing</SelectItem>
                                    <SelectItem value="outro">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 2. Values & Conditions */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-sm font-semibold text-brand/80 uppercase tracking-wider border-b border-brand/10 pb-2 mb-3">
                                2. Valores e Condições
                            </h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="original_amount">Valor Original *</Label>
                            <CurrencyInput
                                value={watch('original_amount')}
                                onChange={(v) => setValue('original_amount', v)}
                                placeholder="R$ 0,00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="current_balance">Saldo Devedor Atual (opcional)</Label>
                            <CurrencyInput
                                value={watch('current_balance')}
                                onChange={(v) => setValue('current_balance', v)}
                                placeholder="Igual ao original se vazio"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="interest_type">Sistema de Amortização</Label>
                            <Select onValueChange={(v) => setValue('interest_type', v)} defaultValue="price">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="price">Price (Parcelas Fixas)</SelectItem>
                                    <SelectItem value="sac">SAC (Amortização Constante)</SelectItem>
                                    <SelectItem value="composto">Juros Compostos (Rotativo)</SelectItem>
                                    <SelectItem value="simples">Juros Simples</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="interest_rate">Taxa de Juros (%) *</Label>
                            <div className="flex gap-2">
                                <Input type="number" step="0.01" {...register('interest_rate', { required: true })} placeholder="1.5" />
                                <Select onValueChange={(v) => setValue('interest_period', v)} defaultValue="mensal">
                                    <SelectTrigger className="w-[110px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mensal">% a.m.</SelectItem>
                                        <SelectItem value="anual">% a.a.</SelectItem>
                                        <SelectItem value="diario">% a.d.</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* 3. Installments & Deadlines */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-sm font-semibold text-brand/80 uppercase tracking-wider border-b border-brand/10 pb-2 mb-3">
                                3. Prazos e Pagamento
                            </h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="total_installments">Total de Parcelas</Label>
                            <Input type="number" {...register('total_installments')} placeholder="Ex: 24" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="installment_amount">Valor da Parcela (Se fixo)</Label>
                            <CurrencyInput
                                value={watch('installment_amount')}
                                onChange={(v) => setValue('installment_amount', v)}
                                placeholder="R$ 0,00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contract_date">Data do Contrato</Label>
                            <Input type="date" {...register('contract_date')} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="first_due_date">Data 1º Vencimento</Label>
                            <Input type="date" {...register('first_due_date')} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="due_day">Dia de Vencimento Mensal</Label>
                            <Input type="number" min="1" max="31" {...register('due_day')} />
                        </div>

                        {/* 4. Automation & Specs */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-sm font-semibold text-brand/80 uppercase tracking-wider border-b border-brand/10 pb-2 mb-3">
                                4. Automação e Observações
                            </h3>
                        </div>

                        <div className="col-span-1 md:col-span-2 flex items-center space-x-2 border border-brand/20 bg-brand/5 p-4 rounded-xl">
                            <Switch
                                id="generate_payables"
                                className="data-[state=checked]:bg-brand"
                                checked={watch('generate_payables')}
                                onCheckedChange={(v) => setValue('generate_payables', v)}
                            />
                            <div className="flex flex-col">
                                <Label htmlFor="generate_payables" className="font-medium text-foreground">Gerar Contas a Pagar</Label>
                                <span className="text-xs text-muted-foreground mt-0.5">
                                    Cria automaticamente os lançamentos no Contas a Pagar para cada parcela calculada.
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <Label htmlFor="description">Descrição / Observações</Label>
                            <Textarea {...register('description')} className="resize-none" rows={3} placeholder="Detalhes adicionais, número do contrato, etc..." />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : (debt ? 'Salvar Alterações' : 'Cadastrar Dívida')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>

            {/* Quick-add Creditor Modal */}
            <Dialog open={showNewCreditor} onOpenChange={setShowNewCreditor}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Cadastro Rápido de Credor</DialogTitle>
                        <DialogDescription>
                            Adicione um novo credor para esta dívida
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new_creditor_name">Nome *</Label>
                                <Input
                                    id="new_creditor_name"
                                    value={newCreditor.name}
                                    onChange={(e) => setNewCreditor({ ...newCreditor, name: e.target.value })}
                                    placeholder="Ex: Banco Itaú S.A."
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>CPF/CNPJ</Label>
                                <DocumentInput
                                    value={newCreditor.document}
                                    onChange={(value) => setNewCreditor({ ...newCreditor, document: value })}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Tipo/Categoria</Label>
                                <Select
                                    value={newCreditor.category}
                                    onValueChange={(value) => setNewCreditor({ ...newCreditor, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="banco">Banco</SelectItem>
                                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                                        <SelectItem value="financeira">Financeira</SelectItem>
                                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                                        <SelectItem value="governo">Governo (Impostos)</SelectItem>
                                        <SelectItem value="socio">Sócio</SelectItem>
                                        <SelectItem value="cliente">Cliente (Reembolso/Estorno)</SelectItem>
                                        <SelectItem value="outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nc_email">Email</Label>
                                <Input
                                    id="nc_email"
                                    type="email"
                                    value={newCreditor.email}
                                    onChange={(e) => setNewCreditor({ ...newCreditor, email: e.target.value })}
                                    placeholder="email@banco.com.br"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nc_phone">Telefone</Label>
                                <Input
                                    id="nc_phone"
                                    value={newCreditor.phone}
                                    onChange={(e) => setNewCreditor({ ...newCreditor, phone: e.target.value })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nc_address">Endereço</Label>
                            <Input
                                id="nc_address"
                                value={newCreditor.address}
                                onChange={(e) => setNewCreditor({ ...newCreditor, address: e.target.value })}
                                placeholder="Avenida Faria Lima, 1000"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nc_city">Cidade</Label>
                                <Input
                                    id="nc_city"
                                    value={newCreditor.city}
                                    onChange={(e) => setNewCreditor({ ...newCreditor, city: e.target.value })}
                                    placeholder="São Paulo"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nc_state">UF</Label>
                                <Input
                                    id="nc_state"
                                    value={newCreditor.state}
                                    onChange={(e) => setNewCreditor({ ...newCreditor, state: e.target.value })}
                                    placeholder="SP"
                                    maxLength={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nc_zip">CEP</Label>
                                <Input
                                    id="nc_zip"
                                    value={newCreditor.zip_code}
                                    onChange={(e) => setNewCreditor({ ...newCreditor, zip_code: e.target.value })}
                                    placeholder="00000-000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nc_notes">Observações</Label>
                            <Textarea
                                id="nc_notes"
                                value={newCreditor.notes}
                                onChange={(e) => setNewCreditor({ ...newCreditor, notes: e.target.value })}
                                placeholder="Anotações adicionais (Gerente de conta, número do contrato matriz etc.)"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowNewCreditor(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleAddCreditor}
                            disabled={!newCreditor.name.trim() || isAddingCreditor}
                        >
                            {isAddingCreditor ? 'Salvando...' : 'Salvar Credor'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
