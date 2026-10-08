'use client';

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { maskCurrencyInput } from "@/lib/masks";
import type { PaymentMethod } from "@/types";
import type { PaymentFormData, AccountType, BankAccountOption } from "../../types";

interface PaymentRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PaymentFormData;
  onFormChange: (data: PaymentFormData) => void;
  onSave: () => void;
  isSaving: boolean;
  accountType: AccountType;

  // Account info for display
  accountDescription: string;
  entityName: string;
  remainingBalance: number;

  // Bank accounts
  bankAccounts: BankAccountOption[];
  formatCurrency: (value: number) => string;
}

export const PaymentRecordDialog = memo(({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSave,
  isSaving,
  accountType,
  accountDescription,
  entityName,
  remainingBalance,
  bankAccounts,
  formatCurrency,
}: PaymentRecordDialogProps) => {
  const isPayer = accountType === 'payable';
  const title = isPayer ? 'Registrar Pagamento' : 'Registrar Recebimento';
  const dateLabel = isPayer ? 'Data do Pagamento *' : 'Data do Recebimento *';
  const notesPlaceholder = isPayer ? 'Notas sobre o pagamento...' : 'Notas sobre o recebimento...';
  const confirmLabel = isPayer ? 'Confirmar Pagamento' : 'Confirmar Recebimento';

  const updateField = <K extends keyof PaymentFormData>(
    field: K,
    value: PaymentFormData[K]
  ) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {accountDescription} - {entityName || 'Sem ' + (isPayer ? 'fornecedor' : 'cliente')}
            <br />
            Saldo: {formatCurrency(remainingBalance)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount */}
          <div>
            <Label>Valor *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                R$
              </span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                className="pl-10 font-medium"
                value={formData.amount}
                onChange={(e) => updateField('amount', maskCurrencyInput(e.target.value))}
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <Label>{dateLabel}</Label>
            <Input
              type="date"
              value={formData.payment_date}
              onChange={(e) => updateField('payment_date', e.target.value)}
            />
          </div>

          {/* Bank Account */}
          <div>
            <Label>Conta Bancária *</Label>
            <Select
              value={formData.bank_account_id}
              onValueChange={(v) => updateField('bank_account_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({formatCurrency(b.current_balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div>
            <Label>Forma de Pagamento</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(v: PaymentMethod) => updateField('payment_method', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder={notesPlaceholder}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

PaymentRecordDialog.displayName = 'PaymentRecordDialog';
