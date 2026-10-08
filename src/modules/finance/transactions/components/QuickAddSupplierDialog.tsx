'use client';

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { SUPPLIERS_KEYS } from "@/lib/queryKeys";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Building2, Lightbulb } from "lucide-react";
import { maskCPF, maskCNPJ, maskPhone, unmask } from "@/lib/masks";
import { getErrorMessage } from "@/lib/errorUtils";

interface Supplier {
  id: string;
  company_id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
}

const supplierCategories = [
  "Serviços",
  "Materiais",
  "Tecnologia",
  "Marketing",
  "Transporte",
  "Alimentação",
  "Outros",
];

interface QuickAddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (supplier: Supplier) => void;
}

export function QuickAddSupplierDialog({
  open,
  onOpenChange,
  onSuccess,
}: QuickAddSupplierDialogProps) {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    document: "",
    email: "",
    phone: "",
    category: "",
  });

  const handleDocumentChange = (value: string) => {
    const digits = unmask(value);
    let formatted = value;

    if (digits.length <= 11) {
      formatted = maskCPF(digits);
    } else {
      formatted = maskCNPJ(digits);
    }

    setFormData({ ...formData, document: formatted });
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: maskPhone(value) });
  };

  const handleSave = async () => {
    if (!currentCompany || !formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          company_id: currentCompany.id,
          name: formData.name.trim(),
          document: formData.document ? unmask(formData.document) : null,
          email: formData.email.trim() || null,
          phone: formData.phone ? unmask(formData.phone) : null,
          category: formData.category || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("✓ Fornecedor criado e selecionado");
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEYS.all });
      onSuccess(data as Supplier);

      // Reset form
      setFormData({ name: "", document: "", email: "", phone: "", category: "" });
    } catch (error) {
      toast.error("Erro ao criar fornecedor: " + getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", document: "", email: "", phone: "", category: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Building2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Cadastro Rápido de Fornecedor</DialogTitle>
              <DialogDescription>
                Adicione um novo fornecedor para esta movimentação
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="supplier_name">Nome *</Label>
            <Input
              id="supplier_name"
              placeholder="Nome do fornecedor ou empresa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_document">CPF/CNPJ</Label>
              <Input
                id="supplier_document"
                placeholder="000.000.000-00"
                value={formData.document}
                onChange={(e) => handleDocumentChange(e.target.value)}
                maxLength={18}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {supplierCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_email">Email</Label>
              <Input
                id="supplier_email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_phone">Telefone</Label>
              <Input
                id="supplier_phone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={15}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4 flex-shrink-0" />
          <span>Para mais campos, acesse Cadastros → Fornecedores</span>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar e Selecionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
