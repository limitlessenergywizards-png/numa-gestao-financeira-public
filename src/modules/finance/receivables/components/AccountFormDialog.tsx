'use client';

import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Building2, UserPlus, FolderPlus, Scan, X, TrendingUp, TrendingDown, ScanLine, Camera, CalendarDays, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import { OcrScanner, type OcrResult } from "@/components/shared";
import { maskCurrencyInput } from "@/lib/masks";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { RecurrenceSelector } from "../../transactions/components/RecurrenceSelector";
import type { AccountFormData, AccountType, AccountEntity, ChartAccountOption, BankAccountOption } from "../../types";

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: AccountFormData;
  onFormChange: (data: AccountFormData) => void;
  onSave: () => void;
  isSaving: boolean;
  isEditing: boolean;
  accountType: AccountType;

  // Entities (suppliers or customers)
  entities: AccountEntity[];
  entityLabel: string;
  onAddEntity: () => void;

  // Chart accounts
  chartAccounts: ChartAccountOption[];
  onAddChartAccount: () => void;

  // Categories
  categories?: { id: string; name: string }[];
  onAddCategory?: () => void;

  // Bank Accounts
  bankAccounts: BankAccountOption[];

  // OCR (optional, only for payables)
  showOcr?: boolean;
  showOcrScanner?: boolean;
  onToggleOcrScanner?: (show: boolean) => void;
  onOcrResult?: (result: OcrResult) => void;
}

export const AccountFormDialog = memo(({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSave,
  isSaving,
  isEditing,
  accountType,
  entities,
  entityLabel,
  onAddEntity,
  chartAccounts,
  onAddChartAccount,
  categories = [],
  onAddCategory,
  bankAccounts,
  showOcr = false,
  showOcrScanner = false,
  onToggleOcrScanner,
  onOcrResult,
}: AccountFormDialogProps) => {
  const isPayer = accountType === 'payable';
  const isEntrada = !isPayer;
  const EntityIcon = isPayer ? Building2 : UserPlus;

  const updateField = <K extends keyof AccountFormData>(
    field: K,
    value: AccountFormData[K]
  ) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 flex flex-col max-h-[85vh]">
          {/* Fixed Header — identical to TransactionDialogs */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl transition-colors",
                isEntrada ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                {isEntrada ? (
                  <TrendingUp className="h-5 w-5 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="h-5 w-5 stroke-[2.5]" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">
                  {isEditing ? 'Editar' : 'Nova'} {isPayer ? 'Conta a Pagar' : 'Conta a Receber'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground/70 text-sm">
                  {isEditing ? 'Altere os dados da conta' : 'Preencha os dados da conta'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Body — identical structure to TransactionDialogs */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

            {/* OCR Scan Banner — only when showOcr enabled */}
            {showOcr && !isEditing && !showOcrScanner && onToggleOcrScanner && (
              <button
                type="button"
                onClick={() => onToggleOcrScanner(true)}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed transition-[border-color,box-shadow] group",
                  "border-brand/30 hover:border-brand/60 bg-brand/5 hover:bg-brand/10"
                )}
              >
                <div className="p-2 rounded-lg bg-brand/10 text-brand group-hover:bg-brand/20 transition-colors">
                  <ScanLine className="h-5 w-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-foreground">Escanear Documento</p>
                  <p className="text-xs text-muted-foreground">Cupom fiscal, nota fiscal, boleto ou recibo</p>
                </div>
                <Camera className="h-4 w-4 text-muted-foreground group-hover:text-brand transition-colors" />
              </button>
            )}

            {showOcrScanner && onToggleOcrScanner && onOcrResult && (
              <div className="border rounded-lg p-4 mb-4">
                <OcrScanner onResult={onOcrResult} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleOcrScanner(false)}
                  className="mt-2"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar OCR
                </Button>
              </div>
            )}

            {/* Entity (Cliente / Fornecedor) — full-width */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{entityLabel}</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.entity_id}
                  onValueChange={(v) => updateField('entity_id', v)}
                >
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue placeholder={`Selecione o ${entityLabel.toLowerCase()}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                    {entities.length === 0 && <div className="p-2 text-xs text-muted-foreground text-center">Nenhum {entityLabel.toLowerCase()} cadastrado</div>}
                  </SelectContent>
                </Select>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={onAddEntity}
                        className="h-9 w-9 shrink-0"
                      >
                        <EntityIcon className={cn("h-4 w-4", isEntrada ? "text-success" : "text-destructive")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Adicionar {entityLabel}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Descrição — full-width */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Descrição *</Label>
              <Input
                placeholder={isPayer ? "Ex: Compra de materiais" : "Ex: Venda de produtos"}
                className="h-9 text-sm"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            {/* Valor Total — full-width */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Valor Total *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                  R$
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  className="pl-10 font-medium h-9 text-sm"
                  value={formData.total_amount}
                  onChange={(e) => updateField('total_amount', maskCurrencyInput(e.target.value))}
                />
              </div>
            </div>

            {/* Vencimento — Date Popover */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Vencimento *</Label>
              <Popover modal>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !formData.due_date && "text-muted-foreground")}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(parseISO(formData.due_date), "dd 'de' MMM, yyyy", { locale: ptBR }) : "Selecione..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[200]" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date ? parseISO(formData.due_date) : undefined}
                    onSelect={(date) => date && updateField('due_date', format(date, 'yyyy-MM-dd'))}
                    locale={ptBR}
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={2030}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Categoria</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.category_id}
                  onValueChange={(v) => updateField('category_id', v)}
                >
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue placeholder="Selecionar categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {onAddCategory && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={onAddCategory}
                          className="h-9 w-9 shrink-0"
                        >
                          <Tag className="h-4 w-4 text-brand" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Adicionar Categoria</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            {/* Plano de Contas — with add button */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Plano de Contas</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.chart_account_id}
                  onValueChange={(v) => updateField('chart_account_id', v)}
                >
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue placeholder="Selecionar plano..." />
                  </SelectTrigger>
                  <SelectContent>
                    {chartAccounts.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={onAddChartAccount}
                        className="h-9 w-9 shrink-0"
                      >
                        <FolderPlus className="h-4 w-4 text-info" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Adicionar Plano de Contas</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Data Emissão + Nº Documento — grid 2 cols */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Data Emissão</Label>
                <Popover modal>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !formData.issue_date && "text-muted-foreground")}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {formData.issue_date ? format(parseISO(formData.issue_date), "dd/MM/yyyy") : "Selecione..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[200]" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.issue_date ? parseISO(formData.issue_date) : undefined}
                      onSelect={(date) => date && updateField('issue_date', format(date, 'yyyy-MM-dd'))}
                      locale={ptBR}
                      captionLayout="dropdown"
                      fromYear={2020}
                      toYear={2030}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nº Documento</Label>
                <Input
                  value={formData.document_number}
                  onChange={(e) => updateField('document_number', e.target.value)}
                  placeholder="Ex: NF-001"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Conta Bancária + Forma de Pagamento — grid 2 cols */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Conta Bancária</Label>
                <Select
                  value={formData.bank_account_id}
                  onValueChange={(v) => updateField('bank_account_id', v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts?.map(account => (
                      <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Forma de Pagamento</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(v) => updateField('payment_method', v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tipo de lançamento — using RecurrenceSelector */}
            <div className="space-y-1.5">
              <RecurrenceSelector
                value={formData.recurrenceConfig}
                onChange={(val) => updateField('recurrenceConfig', val)}
              />
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Observações</Label>
              <Textarea
                placeholder="Notas adicionais..."
                className="min-h-[60px] text-sm resize-none"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
              />
            </div>

            {/* Status Toggle — Pago / Em aberto (maps to Realizado / Previsão) */}
            <Tabs
              value={formData.status || 'pending'}
              onValueChange={(val) => updateField('status', val as AccountFormData['status'])}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl h-10">
                <TabsTrigger value="completed" className="rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">Pago</TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">Em aberto</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Fixed Footer — identical to TransactionDialogs */}
          <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-5 border-border/50">
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              disabled={isSaving}
              className={cn(
                "h-10 px-6 font-semibold transition-colors text-white shadow-md",
                isEntrada
                  ? "bg-success hover:bg-success/90 shadow-success/20"
                  : "bg-destructive hover:bg-destructive/90 shadow-destructive/20"
              )}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? 'Atualizar' : 'Confirmar'} {isPayer ? 'Pagamento' : 'Recebimento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OCR Scanner Dialog */}
      {showOcrScanner && onToggleOcrScanner && onOcrResult && (
        <Dialog open={showOcrScanner} onOpenChange={onToggleOcrScanner}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Escanear Documento</DialogTitle>
              <DialogDescription>
                Tire uma foto ou selecione uma imagem do documento
              </DialogDescription>
            </DialogHeader>
            <OcrScanner
              onResult={onOcrResult}
              onError={(error) => console.error(`Erro no OCR: ${error}`)}
            />
            <p className="text-xs text-muted-foreground text-center">
              Suporta: Cupom fiscal, Nota fiscal, Boleto, Recibo, Comprovante
            </p>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

AccountFormDialog.displayName = 'AccountFormDialog';
