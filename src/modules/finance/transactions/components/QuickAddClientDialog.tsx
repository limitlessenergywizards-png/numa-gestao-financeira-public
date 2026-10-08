'use client';

import { useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useCreateCustomer, Customer } from "@/modules/crm/customers/hooks/useCustomersQuery";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UserPlus, Lightbulb } from "lucide-react";
import { maskCPF, maskCNPJ, maskPhone, unmask } from "@/lib/masks";
import { getRLSErrorMessage } from "@/lib/errorUtils";
import { quickAddClientSchema, validateWithToast } from "@/lib/validations/financial-schemas";

interface QuickAddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (customer: Customer) => void;
}

export function QuickAddClientDialog({
  open,
  onOpenChange,
  onSuccess,
}: QuickAddClientDialogProps) {
  const { currentCompany } = useCompany();
  const createMutation = useCreateCustomer(currentCompany?.id);

  const [formData, setFormData] = useState({
    name: "",
    document: "",
    email: "",
    phone: "",
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

  const handleSave = () => {
    if (!validateWithToast(quickAddClientSchema, formData)) return;
    if (!currentCompany) return;

    createMutation.mutate(
      {
        company_id: currentCompany.id,
        name: formData.name.trim(),
        document: formData.document ? unmask(formData.document) : null,
        email: formData.email.trim() || null,
        phone: formData.phone ? unmask(formData.phone) : null,
        is_active: true,
      },
      {
        onSuccess: (data) => {
          toast.success("✓ Cliente criado e selecionado");
          onSuccess(data as Customer);
          setFormData({ name: "", document: "", email: "", phone: "" });
        },
        onError: (error) => {
          console.error("Erro ao criar cliente:", error);
          toast.error("Erro ao criar cliente: " + getRLSErrorMessage(error));
        },
      }
    );
  };

  const isSaving = createMutation.isPending;

  const handleClose = () => {
    setFormData({ name: "", document: "", email: "", phone: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <UserPlus className="h-5 w-5 text-success" />
            </div>
            <div>
              <DialogTitle>Cadastro Rápido de Cliente</DialogTitle>
              <DialogDescription>
                Adicione um novo cliente para esta movimentação
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">Nome *</Label>
            <Input
              id="client_name"
              placeholder="Nome do cliente ou empresa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_document">CPF/CNPJ</Label>
            <Input
              id="client_document"
              placeholder="000.000.000-00"
              value={formData.document}
              onChange={(e) => handleDocumentChange(e.target.value)}
              maxLength={18}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_email">Email</Label>
              <Input
                id="client_email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_phone">Telefone</Label>
              <Input
                id="client_phone"
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
          <span>Para mais campos, acesse Cadastros → Clientes</span>
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
