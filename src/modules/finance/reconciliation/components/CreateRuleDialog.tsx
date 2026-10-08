'use client';


import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { transactionRulesService, CreateRuleDTO } from '@/modules/finance/reconciliation/services/transactionRules';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateRuleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultKeyword: string;
    companyId: string;
}

export function CreateRuleDialog({
    open,
    onOpenChange,
    defaultKeyword,
    companyId,
}: CreateRuleDialogProps) {
    const [keyword, setKeyword] = useState(defaultKeyword);
    const [matchType, setMatchType] = useState<'contains' | 'exact' | 'starts_with'>('contains');
    const [categoryId, setCategoryId] = useState('');
    const queryClient = useQueryClient();

    // Fetch categories
    const { data: categories = [] } = useQuery({
        queryKey: ['categories', companyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .eq('company_id', companyId)
                .eq('type', 'despesa') // Assume mostly expenses for now
                .order('name');

            if (error) throw error;
            return data;
        },
        enabled: !!companyId && open,
    });

    const createRuleMutation = useMutation({
        mutationFn: async (data: CreateRuleDTO) => {
            return transactionRulesService.createRule(data);
        },
        onSuccess: () => {
            toast.success('Regra criada com sucesso');
            queryClient.invalidateQueries({ queryKey: ['transaction-rules'] });
            onOpenChange(false);
        },
        onError: (error) => {
            console.error(error);
            toast.error('Erro ao criar regra');
        }
    });

    const handleSubmit = () => {
        if (!keyword || !categoryId) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        createRuleMutation.mutate({
            company_id: companyId,
            keyword,
            description_match_type: matchType,
            category_id: categoryId,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Criar Regra de Categorização</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Palavra-chave</Label>
                        <Input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Ex: Uber"
                        />
                        <p className="text-xs text-muted-foreground">
                            Transações contendo este termo serão categorizadas automaticamente.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de Correspondência</Label>
                        <Select value={matchType} onValueChange={(v: any) => setMatchType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="contains">Contém</SelectItem>
                                <SelectItem value="exact">Exato</SelectItem>
                                <SelectItem value="starts_with">Começa com</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat: any) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={createRuleMutation.isPending}>
                        {createRuleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Criar Regra
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
