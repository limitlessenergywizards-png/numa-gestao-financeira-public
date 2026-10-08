'use client';

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Tag } from "lucide-react";
import { getErrorMessage } from "@/lib/errorUtils";
import { Category } from "@/modules/finance/transactions/hooks/useTransactionsData";

interface QuickAddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (category: Category) => void;
  transactionType: 'entrada' | 'saida';
  existingCategories: Category[];
}

const PRESET_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#F59E0B", // amber
  "#84CC16", // lime
  "#22C55E", // green
  "#06B6D4", // cyan
  "#3B82F6", // blue
  "#6366F1", // indigo
  "#A855F7", // purple
  "#EC4899", // pink
  "#64748B", // slate
];

export function QuickAddCategoryDialog({
  open,
  onOpenChange,
  onSuccess,
  transactionType,
  existingCategories,
}: QuickAddCategoryDialogProps) {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: transactionType === 'entrada' ? 'receita' : 'despesa',
    color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
  });

  const handleTypeChange = (type: string) => {
    setFormData({ ...formData, type });
  };

  const handleSave = async () => {
    if (!currentCompany || !formData.name.trim()) {
      toast.error("Nome da categoria é obrigatório");
      return;
    }

    // Check for duplicate name
    const duplicate = existingCategories.find(
      (cat) => cat.name.toLowerCase() === formData.name.toLowerCase() && cat.type === formData.type
    );
    if (duplicate) {
      toast.error("Já existe uma categoria com este nome");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          company_id: currentCompany.id,
          name: formData.name.trim(),
          type: formData.type as 'receita' | 'despesa',
          color: formData.color,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("✓ Categoria criada e selecionada");
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onSuccess(data as Category);

      // Reset form (keep type consistent with current context)
      setFormData({
        name: "",
        type: transactionType === 'entrada' ? 'receita' : 'despesa',
        color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      });
    } catch (error) {
      toast.error("Erro ao criar categoria: " + getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      type: transactionType === 'entrada' ? 'receita' : 'despesa',
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10">
              <Tag className="h-5 w-5 text-brand" />
            </div>
            <div>
              <DialogTitle>Nova Categoria</DialogTitle>
              <DialogDescription>
                Categorize suas transações para organizar seu fluxo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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

          <div className="space-y-2">
            <Label htmlFor="category_name">Nome da Categoria *</Label>
            <Input
              id="category_name"
              placeholder="Ex: Alimentação, Transporte..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Cor da Etiqueta</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-6 h-6 rounded-full transition-[transform,box-shadow] ${formData.color === color
                    ? "ring-2 ring-offset-2 ring-foreground scale-110"
                    : "hover:scale-105 opacity-70 hover:opacity-100"
                    }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar Categoria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
