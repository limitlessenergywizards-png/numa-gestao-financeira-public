'use client';

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecurrenceFormData, emptyRecurrenceForm, RecurrenceTemplate } from "../types";
import { useRecurrence } from "../hooks/useRecurrence";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RecurrenceFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: RecurrenceTemplate;
    companyId: string;
}

export function RecurrenceForm({ open, onOpenChange, initialData, companyId }: RecurrenceFormProps) {
    const [formData, setFormData] = useState<RecurrenceFormData>(emptyRecurrenceForm);
    const { createRecurrence, updateRecurrence } = useRecurrence();

    // Fetch categories and bank accounts for select options
    // PERF: queryKey includes companyId to prevent cross-company cache collisions
    // PERF: select specific columns instead of select('*')
    const { data: categories } = useQuery({
        queryKey: ["categories", companyId],
        queryFn: async () => {
            const { data } = await supabase.from("categories").select("id, name, type").eq("company_id", companyId);
            return data || [];
        },
        enabled: !!companyId,
    });

    const { data: bankAccounts } = useQuery({
        queryKey: ["bank-accounts", companyId],
        queryFn: async () => {
            const { data } = await supabase.from("bank_accounts").select("id, name").eq("company_id", companyId).eq("is_active", true);
            return data || [];
        },
        enabled: !!companyId,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                amount: initialData.amount,
                type: initialData.type,
                category_id: initialData.category_id,
                bank_account_id: initialData.bank_account_id || "",
                frequency: initialData.frequency,
                start_date: new Date(initialData.start_date),
                end_date: initialData.end_date ? new Date(initialData.end_date) : undefined,
                day_of_month: String(initialData.day_of_month),
                status: initialData.status,
            });
        } else {
            setFormData(emptyRecurrenceForm);
        }
    }, [initialData, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (initialData) {
            updateRecurrence.mutate(
                { id: initialData.id, ...formData },
                { onSuccess: () => onOpenChange(false) }
            );
        } else {
            createRecurrence.mutate(
                { ...formData, company_id: companyId },
                { onSuccess: () => onOpenChange(false) }
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Recorrência" : "Nova Recorrência"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entrada">Receita</SelectItem>
                                    <SelectItem value="saida">Despesa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Frequência</Label>
                            <Select
                                value={formData.frequency}
                                onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Diária</SelectItem>
                                    <SelectItem value="weekly">Semanal</SelectItem>
                                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                                    <SelectItem value="monthly">Mensal</SelectItem>
                                    <SelectItem value="bimonthly">Bimestral</SelectItem>
                                    <SelectItem value="quarterly">Trimestral</SelectItem>
                                    <SelectItem value="semiannual">Semestral</SelectItem>
                                    <SelectItem value="annual">Anual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select
                                value={formData.category_id}
                                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories?.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Conta Bancária</Label>
                            <Select
                                value={formData.bank_account_id}
                                onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Opcional" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankAccounts?.map((acc) => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Dia Vencimento</Label>
                            <Input
                                type="number"
                                min="1"
                                max="31"
                                value={formData.day_of_month}
                                onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Início</Label>
                            <Input
                                type="date"
                                value={formData.start_date ? formData.start_date.toISOString().split('T')[0] : ''}
                                onChange={(e) => setFormData({ ...formData, start_date: new Date(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fim (Opcional)</Label>
                            <Input
                                type="date"
                                value={formData.end_date ? formData.end_date.toISOString().split('T')[0] : ''}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value) : undefined })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">Salvar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
