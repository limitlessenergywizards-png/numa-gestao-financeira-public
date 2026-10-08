'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { maskCurrencyInput } from '@/lib/masks';
import { PeriodType, TargetType, Budget, CreateBudgetPayload } from '../types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Category } from '@/modules/finance/categories/hooks/useCategories';

const periodTypeLabels: Record<PeriodType, string> = {
    daily: 'Diário',
    weekly: 'Semanal',
    biweekly: 'Quinzenal',
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    semiannual: 'Semestral',
    annual: 'Anual',
};

interface BudgetFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (payload: CreateBudgetPayload) => Promise<void>;
    initialData?: Budget | null;
}

export function BudgetFormDialog({
    open,
    onOpenChange,
    onSave,
    initialData,
}: BudgetFormDialogProps) {
    const { currentCompany } = useCompany();
    const isEdit = !!initialData;

    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState<Partial<CreateBudgetPayload>>({
        period_type: 'monthly',
    });

    // Fetch Chart of Accounts for the category selection
    const { data: chartAccounts = [], isLoading: isLoadingAccounts } = useQuery({
        queryKey: ['chart_accounts_budget', currentCompany?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('chart_of_accounts')
                .select('id, company_id, parent_id, code, name, type, nature, is_analytical, dre_category, is_active')
                .eq('company_id', currentCompany?.id)
                .order('code');
            if (error) throw error;
            return data || [];
        },
        enabled: !!currentCompany?.id && open,
    });

    // Fetch simple Categories
    const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories_budget', currentCompany?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('id, company_id, name, type, color, icon, is_active')
                .eq('company_id', currentCompany?.id)
                .eq('is_active', true)
                .order('name');
            if (error) throw error;
            return (data || []) as Category[];
        },
        enabled: !!currentCompany?.id && open,
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    target_type: initialData.target_type || 'chart_account',
                    category_code: initialData.category_code,
                    category_name: initialData.category_name,
                    amount: initialData.amount,
                    period_type: initialData.period_type,
                    start_date: initialData.start_date,
                    end_date: initialData.end_date,
                    notes: initialData.notes,
                });
            } else {
                setFormData({
                    target_type: 'chart_account',
                    category_code: '',
                    category_name: '',
                    amount: 0,
                    period_type: 'monthly',
                    start_date: '',
                    end_date: '',
                    notes: '',
                });
            }
        }
    }, [open, initialData]);

    const handleFieldChange = (field: keyof CreateBudgetPayload, value: CreateBudgetPayload[keyof CreateBudgetPayload]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCategoryChange = (code: string) => {
        if (formData.target_type === 'chart_account') {
            const account = chartAccounts.find(a => a.code === code);
            setFormData(prev => ({
                ...prev,
                category_code: code,
                category_name: account ? account.name : '',
            }));
        } else {
            const category = categories.find(c => c.id === code);
            setFormData(prev => ({
                ...prev,
                category_code: code,
                category_name: category ? category.name : '',
            }));
        }
    };

    const handleTargetTypeChange = (type: TargetType) => {
        setFormData(prev => ({
            ...prev,
            target_type: type,
            category_code: '',
            category_name: '',
        }));
    };

    const handleDisplayAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskCurrencyInput(e.target.value);
        const numeric = Number(masked.replace(/\./g, '').replace(',', '.'));
        handleFieldChange('amount', numeric);
    };

    const getDisplayAmount = (num: number = 0) => {
        if (!num) return '';
        return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleSubmit = async () => {
        if (!currentCompany?.id || !formData.category_code || !formData.amount || !formData.start_date || !formData.end_date) return;

        setIsSaving(true);
        try {
            await onSave({
                company_id: currentCompany.id,
                target_type: formData.target_type as TargetType || 'chart_account',
                category_code: formData.category_code,
                category_name: formData.category_name || '',
                amount: formData.amount,
                period_type: formData.period_type as PeriodType,
                start_date: formData.start_date,
                end_date: formData.end_date,
                notes: formData.notes,
            });
            onOpenChange(false);
        } catch (_err) {
            // Toast is handled by the mutation's onError callback
        } finally {
            setIsSaving(false);
        }
    };

    // Only allow saving if minimal required fields are filled
    const isValid = formData.category_code && formData.amount && formData.start_date && formData.end_date;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Atualize os dados do seu orçamento.' : 'Defina um limite de gastos ou meta de receitas para um período específico.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Tabs value={formData.target_type} onValueChange={(val) => handleTargetTypeChange(val as TargetType)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="chart_account" disabled={isEdit}>Plano de Contas</TabsTrigger>
                            <TabsTrigger value="category" disabled={isEdit}>Categorias Simples</TabsTrigger>
                        </TabsList>

                        <div className="mt-4">
                            {formData.target_type === 'chart_account' ? (
                                <div className="space-y-2">
                                    <Label>Plano de Contas *</Label>
                                    <Select
                                        value={formData.category_code}
                                        onValueChange={handleCategoryChange}
                                        disabled={isLoadingAccounts || isEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o plano de contas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {chartAccounts.map((account) => (
                                                <SelectItem key={account.id} value={account.code}>
                                                    {account.code} - {account.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Categoria *</Label>
                                    <Select
                                        value={formData.category_code}
                                        onValueChange={handleCategoryChange}
                                        disabled={isLoadingCategories || isEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </Tabs>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="budget-amount">Valor Orçado *</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                                    R$
                                </span>
                                <Input
                                    id="budget-amount"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0,00"
                                    className="pl-10 font-medium"
                                    value={getDisplayAmount(formData.amount)}
                                    onChange={handleDisplayAmountChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Período *</Label>
                            <Select
                                value={formData.period_type}
                                onValueChange={(val) => handleFieldChange('period_type', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(periodTypeLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Data Inicial *</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date || ''}
                                onChange={(e) => handleFieldChange('start_date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">Data Final *</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={formData.end_date || ''}
                                onChange={(e) => handleFieldChange('end_date', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Anotações (opcional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Detalhes ou justificativa para este limite."
                            value={formData.notes || ''}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSaving || !isValid}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Atualizar Orçamento' : 'Criar Orçamento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
