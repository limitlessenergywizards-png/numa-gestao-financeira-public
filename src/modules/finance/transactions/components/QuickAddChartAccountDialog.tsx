'use client';

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { CHART_ACCOUNTS_KEYS } from "@/lib/queryKeys";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, FolderPlus, Lightbulb } from "lucide-react";
import { getErrorMessage } from "@/lib/errorUtils";

// Input type - doesn't require 'type' field (for queries that don't fetch it)
interface ChartAccountInput {
  id: string;
  name: string;
  code: string;
  type?: string;
}

// Output type - always includes 'type' field (from database insert)
interface ChartAccountOutput {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface QuickAddChartAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (category: ChartAccountOutput) => void;
  transactionType: 'entrada' | 'saida';
  existingCategories: ChartAccountInput[];
}

export function QuickAddChartAccountDialog({
  open,
  onOpenChange,
  onSuccess,
  transactionType,
  existingCategories,
}: QuickAddChartAccountDialogProps) {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: transactionType === 'entrada' ? 'receita' : 'despesa',
  });

  // Generate next available code suggestion
  const suggestNextCode = () => {
    const prefix = formData.type === 'receita' ? '1' : '2';
    const sameTypeAccounts = existingCategories.filter(
      (cat) => cat.code.startsWith(prefix)
    );

    if (sameTypeAccounts.length === 0) {
      return `${prefix}.1`;
    }

    // Find the highest code number
    const codes = sameTypeAccounts.map((cat) => {
      const parts = cat.code.split('.');
      return parseInt(parts[1] || '0', 10);
    });
    const maxCode = Math.max(...codes);
    return `${prefix}.${maxCode + 1}`;
  };

  const handleTypeChange = (type: string) => {
    setFormData({ ...formData, type, code: "" });
  };

  const handleSave = async () => {
    if (!currentCompany || !formData.name.trim() || !formData.code.trim()) {
      toast.error("Código e nome são obrigatórios");
      return;
    }

    // Check for duplicate code
    const duplicateCode = existingCategories.find(
      (cat) => cat.code.toLowerCase() === formData.code.toLowerCase()
    );
    if (duplicateCode) {
      toast.error("Este código já existe");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .insert({
          company_id: currentCompany.id,
          code: formData.code.trim(),
          name: formData.name.trim(),
          type: formData.type as 'receita' | 'despesa' | 'custo',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("✓ Plano de Contas criado e selecionado");
      queryClient.invalidateQueries({ queryKey: CHART_ACCOUNTS_KEYS.all });
      onSuccess(data as ChartAccountOutput);

      // Reset form
      setFormData({
        code: "",
        name: "",
        type: transactionType === 'entrada' ? 'receita' : 'despesa',
      });
    } catch (error) {
      toast.error("Erro ao criar plano de contas: " + getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      code: "",
      name: "",
      type: transactionType === 'entrada' ? 'receita' : 'despesa',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FolderPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Novo Plano de Contas</DialogTitle>
              <DialogDescription>
                Adicione uma nova categoria ao plano de contas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_code">Código *</Label>
              <div className="flex gap-2">
                <Input
                  id="category_code"
                  placeholder="1.3"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, code: suggestNextCode() })}
                  className="whitespace-nowrap text-xs"
                >
                  Sugerir
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_name">Nome *</Label>
            <Input
              id="category_name"
              placeholder="Nome da categoria"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4 flex-shrink-0" />
          <span>Para hierarquia e mais opções, acesse Plano de Contas</span>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar e Selecionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
