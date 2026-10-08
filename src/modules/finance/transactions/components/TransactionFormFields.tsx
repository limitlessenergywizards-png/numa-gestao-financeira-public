'use client';

/**
 * TransactionFormFields
 *
 * Shared form body for both the New and Edit transaction dialogs.
 * Accepts formData + onChange props so the parent controls state.
 */

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { FolderPlus, Target, ScanLine, Camera, CalendarDays, Tag, UserPlus, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { maskCurrencyInput } from '@/lib/masks';
import { DebtSelector } from '@/modules/finance/debts/components/DebtSelector';
import { RecurrenceSelector, type RecurrenceConfig } from './RecurrenceSelector';
import { DateEditField } from './DateEditField';
import { paymentMethodLabels } from '../constants';
import type { TransactionFormData } from '../hooks/useTransactionsActions';
import type { Transaction, TransactionType, BankAccount, ChartAccount, Customer, Supplier, Category } from '../hooks/useTransactionsData';

interface FormErrors {
  description?: string;
  amount?: string;
  transaction_date?: string;
  bank_account_id?: string;
}

export interface TransactionFormFieldsProps {
  formData: TransactionFormData;
  onFormDataChange: (data: TransactionFormData) => void;

  bankAccounts: BankAccount[];
  chartAccounts: ChartAccount[];
  categories: Category[];
  customers: Customer[];
  suppliers: Supplier[];

  // Validation
  errors?: FormErrors;
  onErrorClear?: (field: keyof FormErrors) => void;

  // New-only features
  showOcrBanner?: boolean;
  onOcrClick?: () => void;

  // Edit-only features
  editingTransaction?: Transaction | null;

  // Quick-add handlers
  onQuickAddClient: () => void;
  onQuickAddSupplier: () => void;
  onQuickAddCategory: () => void;
  onQuickAddChartAccount: () => void;
}

const DEFAULT_RECURRENCE_CONFIG: RecurrenceConfig = {
  frequency: 'none',
  interval: 1,
  specificDays: [],
  dayOfMonth: null,
  endDate: null,
  occurrenceLimit: null,
  isInstallment: false,
  installmentCount: null,
};

export function TransactionFormFields({
  formData,
  onFormDataChange,
  bankAccounts,
  chartAccounts,
  categories,
  customers,
  suppliers,
  errors,
  onErrorClear,
  showOcrBanner,
  onOcrClick,
  editingTransaction,
  onQuickAddClient,
  onQuickAddSupplier,
  onQuickAddCategory,
  onQuickAddChartAccount,
}: TransactionFormFieldsProps) {
  const isEditMode = !!editingTransaction;
  const idPrefix = isEditMode ? 'edit' : 'new';

  const filteredChartAccounts = useCallback(
    (type: TransactionType) =>
      chartAccounts.filter((ca) => {
        if (type === 'entrada') return ca.type === 'receita';
        return ca.type === 'despesa' || ca.type === 'custo';
      }),
    [chartAccounts]
  );

  const filteredCategories = useCallback(
    (type: TransactionType) =>
      categories.filter((cat) => {
        if (cat.type === 'ambos') return true;
        if (type === 'entrada') return cat.type === 'receita';
        return cat.type === 'despesa';
      }),
    [categories]
  );

  const clearError = (field: keyof FormErrors) => onErrorClear?.(field);

  return (
    <div className="space-y-4">
      {/* OCR Scan Banner (New only) */}
      {showOcrBanner && onOcrClick && (
        <button
          type="button"
          onClick={onOcrClick}
          className={cn(
            'w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed transition-[border-color,box-shadow] group',
            'border-brand/30 hover:border-brand/60 bg-brand/5 hover:bg-brand/10'
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

      {/* Entity (Cliente / Fornecedor) */}
      <div
        className="transition-opacity duration-300 ease-in-out"
        style={{
          display: 'grid',
          gridTemplateRows: formData.type === 'saida' && formData.debtPayment ? '0fr' : '1fr',
          opacity: formData.type === 'saida' && formData.debtPayment ? 0 : 1,
        }}
      >
        <div className="overflow-hidden">
          <div className="space-y-1.5 pb-0.5">
            <Label className="text-xs font-medium">
              {formData.type === 'entrada' ? 'Cliente' : 'Fornecedor'}
            </Label>
            <div className="flex gap-2">
              {formData.type === 'entrada' ? (
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => onFormDataChange({ ...formData, customer_id: value })}
                >
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                    {customers.length === 0 && (
                      <div className="p-2 text-xs text-muted-foreground text-center">Nenhum cliente cadastrado</div>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => onFormDataChange({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue placeholder="Selecione o fornecedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                    {suppliers.length === 0 && (
                      <div className="p-2 text-xs text-muted-foreground text-center">Nenhum fornecedor cadastrado</div>
                    )}
                  </SelectContent>
                </Select>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => formData.type === 'entrada' ? onQuickAddClient() : onQuickAddSupplier()}
                      className="h-9 w-9 shrink-0"
                    >
                      {formData.type === 'entrada' ? (
                        <UserPlus className="h-4 w-4 text-success" />
                      ) : (
                        <Building2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {formData.type === 'entrada' ? 'Adicionar Cliente' : 'Adicionar Fornecedor'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-1.5">
        <Label
          htmlFor={`${idPrefix}_description`}
          className={cn('text-xs font-medium', errors?.description && 'text-destructive')}
        >
          Descrição *
        </Label>
        <Input
          id={`${idPrefix}_description`}
          placeholder={formData.type === 'entrada' ? 'Ex: Venda de produtos' : 'Ex: Compra de materiais'}
          className={cn('h-9 text-sm', errors?.description && 'border-destructive focus-visible:ring-destructive')}
          value={formData.description}
          onChange={(e) => {
            onFormDataChange({ ...formData, description: e.target.value });
            if (errors?.description) clearError('description');
          }}
        />
        {errors?.description && <span className="text-[10px] text-destructive">{errors.description}</span>}
      </div>

      {/* Valor Total */}
      <div className="space-y-1.5">
        <Label
          htmlFor={`${idPrefix}_amount`}
          className={cn('text-xs font-medium', errors?.amount && 'text-destructive')}
        >
          Valor Total *
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">R$</span>
          <Input
            id={`${idPrefix}_amount`}
            type="text"
            inputMode="numeric"
            placeholder="0,00"
            className={cn('pl-10 font-medium h-9 text-sm', errors?.amount && 'border-destructive focus-visible:ring-destructive')}
            value={formData.amount}
            onChange={(e) => {
              onFormDataChange({ ...formData, amount: maskCurrencyInput(e.target.value) });
              if (errors?.amount) clearError('amount');
            }}
          />
        </div>
        {errors?.amount && <span className="text-[10px] text-destructive">{errors.amount}</span>}
      </div>

      {/* Debt Payment Toggle */}
      {formData.type === 'saida' && formData.nature === 'realizado' && (
        <div className="space-y-3 border rounded-md p-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${idPrefix}_debt_payment`} className="text-sm font-medium cursor-pointer">
              Pagamento de Dívida?
            </Label>
            <Switch
              id={`${idPrefix}_debt_payment`}
              checked={formData.debtPayment}
              onCheckedChange={(checked) =>
                onFormDataChange({ ...formData, debtPayment: checked, debtId: checked ? formData.debtId : null })
              }
            />
          </div>
          {formData.debtPayment && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Selecione a Dívida</Label>
              <DebtSelector value={formData.debtId} onChange={(value) => onFormDataChange({ ...formData, debtId: value })} />
            </div>
          )}
        </div>
      )}

      {/* Date field */}
      <div className="space-y-1.5">
        {isEditMode ? (
          <DateEditField
            label="Data da Transação"
            value={formData.transaction_date}
            originalValue={editingTransaction?.original_transaction_date || editingTransaction?.transaction_date}
            onChange={(date) => {
              if (date) onFormDataChange({ ...formData, transaction_date: format(date, 'yyyy-MM-dd') });
            }}
            recordId={editingTransaction?.id}
            showOriginal={!!editingTransaction?.original_transaction_date}
            warningText={
              formData.transaction_date !== editingTransaction?.transaction_date
                ? 'Alterar a data afetará os relatórios'
                : undefined
            }
          />
        ) : (
          <>
            <Label className="text-xs font-medium">Vencimento *</Label>
            <Popover modal>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-9 text-sm',
                    !formData.transaction_date && 'text-muted-foreground'
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {formData.transaction_date
                    ? format(parseISO(formData.transaction_date), "dd 'de' MMM, yyyy", { locale: ptBR })
                    : 'Selecione...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[200]" align="start">
                <Calendar
                  mode="single"
                  selected={formData.transaction_date ? parseISO(formData.transaction_date) : undefined}
                  onSelect={(date) => date && onFormDataChange({ ...formData, transaction_date: format(date, 'yyyy-MM-dd') })}
                  captionLayout="dropdown"
                  fromYear={2020}
                  toYear={2030}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      {/* Categoria */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Categoria</Label>
        <div className="flex gap-2">
          <Select
            value={formData.category_id}
            onValueChange={(value) => onFormDataChange({ ...formData, category_id: value })}
          >
            <SelectTrigger className="flex-1 h-9 text-sm">
              <SelectValue placeholder="Selecionar categoria..." />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories(formData.type).map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="icon" onClick={onQuickAddCategory} className="h-9 w-9 shrink-0">
                  <Tag className="h-4 w-4 text-brand" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adicionar Categoria</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Plano de Contas */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Plano de Contas</Label>
        <div className="flex gap-2">
          <Select
            value={formData.chart_account_id}
            onValueChange={(value) => onFormDataChange({ ...formData, chart_account_id: value })}
          >
            <SelectTrigger className="flex-1 h-9 text-sm">
              <SelectValue placeholder="Selecionar plano..." />
            </SelectTrigger>
            <SelectContent>
              {filteredChartAccounts(formData.type).map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="icon" onClick={onQuickAddChartAccount} className="h-9 w-9 shrink-0">
                  <FolderPlus className="h-4 w-4 text-info" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adicionar Plano de Contas</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Data Emissão + Nº Documento (New) or Date + Nº Documento (Edit) */}
      <div className="grid grid-cols-2 gap-4">
        {!isEditMode && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Data Emissão</Label>
            <Popover modal>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-9 text-sm',
                    !formData.transaction_date && 'text-muted-foreground'
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {formData.transaction_date ? format(parseISO(formData.transaction_date), 'dd/MM/yyyy') : 'Selecione...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[200]" align="start">
                <Calendar
                  mode="single"
                  selected={formData.transaction_date ? parseISO(formData.transaction_date) : undefined}
                  onSelect={(date) => date && onFormDataChange({ ...formData, transaction_date: format(date, 'yyyy-MM-dd') })}
                  captionLayout="dropdown"
                  fromYear={2020}
                  toYear={2030}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {isEditMode && (
          <div className="space-y-1.5">
            <DateEditField
              label="Data da Transação"
              value={formData.transaction_date}
              originalValue={editingTransaction?.original_transaction_date || editingTransaction?.transaction_date}
              onChange={(date) => {
                if (date) onFormDataChange({ ...formData, transaction_date: format(date, 'yyyy-MM-dd') });
              }}
              recordId={editingTransaction?.id}
              showOriginal={!!editingTransaction?.original_transaction_date}
              warningText={
                formData.transaction_date !== editingTransaction?.transaction_date
                  ? 'Alterar a data afetará os relatórios'
                  : undefined
              }
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Nº Documento</Label>
          <Input
            value={formData.document_number}
            onChange={(e) => onFormDataChange({ ...formData, document_number: e.target.value })}
            placeholder="Ex: NF-001"
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Conta Bancária + Forma de Pagamento */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Conta Bancária</Label>
          <Select
            value={formData.bank_account_id}
            onValueChange={(value) => {
              onFormDataChange({ ...formData, bank_account_id: value });
              if (errors?.bank_account_id) clearError('bank_account_id');
            }}
          >
            <SelectTrigger className={cn('h-9 text-sm', errors?.bank_account_id && 'border-destructive')}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Forma de Pagamento</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => onFormDataChange({ ...formData, payment_method: value })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(paymentMethodLabels).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Recorrência */}
      <div className="space-y-1.5">
        <RecurrenceSelector
          value={formData.recurrenceConfig || DEFAULT_RECURRENCE_CONFIG}
          onChange={(val) => onFormDataChange({ ...formData, recurrenceConfig: val })}
        />
      </div>

      {/* Observações */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Observações</Label>
        <Textarea
          id={`${idPrefix}_notes`}
          placeholder="Notas adicionais..."
          className="min-h-[60px] text-sm resize-none"
          value={formData.notes}
          onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>

      {/* Nature Toggle */}
      <Tabs
        value={formData.nature || 'realizado'}
        onValueChange={(val) => onFormDataChange({ ...formData, nature: val as TransactionFormData['nature'] })}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl h-10">
          <TabsTrigger value="realizado" className="rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Realizado
          </TabsTrigger>
          <TabsTrigger value="previsao" className="rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Previsão
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Forecast section */}
      {formData.nature === 'previsao' && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-warning tracking-wider">
            <Target className="w-3 h-3" />
            Detalhes da Previsão
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select
                value={formData.forecast_type || 'estimativa'}
                onValueChange={(value) => onFormDataChange({ ...formData, forecast_type: value as TransactionFormData['forecast_type'] })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orcamento">Orçamento (Meta)</SelectItem>
                  <SelectItem value="estimativa">Estimativa</SelectItem>
                  <SelectItem value="simulacao">Simulação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs">Confiança</Label>
                <span className="text-xs text-muted-foreground">{formData.forecast_confidence || 80}%</span>
              </div>
              <Slider
                value={[formData.forecast_confidence || 80]}
                max={100}
                step={5}
                onValueChange={([val]) => onFormDataChange({ ...formData, forecast_confidence: val })}
                className="py-2"
              />
            </div>
          </div>

          {isEditMode && (
            <div className="space-y-1.5">
              <Label className="text-xs">Base da Previsão</Label>
              <Input
                id={`${idPrefix}_forecast_basis`}
                placeholder="Ex: Contrato anual, Média histórica..."
                className="h-9 text-sm"
                value={formData.forecast_basis || ''}
                onChange={(e) => onFormDataChange({ ...formData, forecast_basis: e.target.value })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
