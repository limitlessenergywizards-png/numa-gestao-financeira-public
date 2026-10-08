'use client';

import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useFormatters } from "@/hooks/useFormatters";
import { type AccountStatusTab, type DateFilterType } from "@/modules/finance/shared/components";
import { useCompanyState } from "@/contexts/CompanyContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ExportButton, type OcrResult } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { SelectionSummaryBar } from "@/components/ui/selection-summary-bar";
import { toast } from "sonner";
import { parseCurrencyValue } from "@/lib/masks";
import { Plus, Receipt, Loader2 } from "lucide-react";
import { QuickAddClientDialog } from "@/modules/finance/transactions/components/QuickAddClientDialog";
import { QuickAddCategoryDialog } from "@/modules/finance/transactions/components/QuickAddCategoryDialog";
import { QuickAddChartAccountDialog } from "@/modules/finance/transactions/components/QuickAddChartAccountDialog";
import { chartAccountsKeys, receivablesKeys } from "@/lib/queryKeys";
import { format, parseISO, addMonths, addDays, addWeeks, addYears } from "date-fns";
import { useCanEdit } from "@/hooks/useCanEdit";
import { STATUS_LABELS } from "@/lib/constants";
import { receivableFormSchema, validateWithToast } from "@/lib/validations/financial-schemas";
import {
  useReceivablesQuery,
  useCustomersForReceivables,
  useBankAccountsForReceivables,
  useIncomeChartAccountsForReceivables,
  useIncomeCategoriesForReceivables,
  useCreateReceivable,
  useUpdateReceivable,
  useDeleteReceivable,
  useRecordPayment,
  useBulkUpdateReceivableStatus,
  type Receivable,
} from "./hooks/useReceivablesQuery";

// Local component imports
import { AccountSummaryCards } from "./components/AccountSummaryCards";
import { AccountsTable } from "./components/AccountsTable";
import { AccountsFilterBar } from "@/modules/finance/shared/components";

// Lazy-loaded dialogs (only imported when opened)
const AccountFormDialog = lazy(() =>
  import("./components/AccountFormDialog").then(m => ({ default: m.AccountFormDialog }))
);
const PaymentRecordDialog = lazy(() =>
  import("./components/PaymentRecordDialog").then(m => ({ default: m.PaymentRecordDialog }))
);
const DeleteConfirmDialog = lazy(() =>
  import("./components/DeleteConfirmDialog").then(m => ({ default: m.DeleteConfirmDialog }))
);
import { getAccountRemaining } from "../utils";

import {
  useAccountFilters,
  filterAccounts,
  useAccountSelection,
  useAccountStats,
  getExportColumns,
} from "@/modules/finance/accounts"; // Keeping shared feature logic for now

import {
  getEmptyFormData,
  getEmptyPaymentFormData,
} from "../types";
import type { AccountFormData, PaymentFormData } from "../types";

interface OcrScanData {
  imageUrl: string;
  extractedText: string;
  extractedData: OcrResult;
}

export default function Receivables() {
  const { currentCompany } = useCompanyState();
  const queryClient = useQueryClient();
  const canEdit = useCanEdit();
  const { formatCurrency } = useFormatters();

  // Dialog states (declared early so deferred queries can check them)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // React Query hooks
  const { data: receivables = [], isLoading, isFetching, error: queryError } = useReceivablesQuery(currentCompany?.id);
  const { data: customers = [] } = useCustomersForReceivables(currentCompany?.id);
  const { data: incomeCategories = [] } = useIncomeCategoriesForReceivables(currentCompany?.id);

  // Deferred: only fetch when form/payment dialog is open (saves 2 HTTP requests on mount)
  const { data: bankAccounts = [] } = useBankAccountsForReceivables(
    isDialogOpen || isPaymentDialogOpen ? currentCompany?.id : undefined
  );
  const { data: chartAccounts = [] } = useIncomeChartAccountsForReceivables(
    isDialogOpen ? currentCompany?.id : undefined
  );

  // Mutations
  const createMutation = useCreateReceivable(currentCompany?.id);
  const updateMutation = useUpdateReceivable(currentCompany?.id);
  const deleteMutation = useDeleteReceivable(currentCompany?.id);
  const paymentMutation = useRecordPayment(currentCompany?.id);
  const bulkUpdateStatusMutation = useBulkUpdateReceivableStatus(currentCompany?.id);

  const isSaving = createMutation.isPending || updateMutation.isPending || paymentMutation.isPending || bulkUpdateStatusMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  // Feature hooks - IMPORTANT: Pass 'receivables' for proper persistence
  const filters = useAccountFilters('receivables');
  const selection = useAccountSelection<Receivable>();

  // Filter receivables
  const filteredReceivables = useMemo(() =>
    filterAccounts(receivables, {
      statusTab: filters.statusTab,
      dateType: filters.dateType,
      entityFilter: filters.entityFilter,
      categoryFilter: filters.categoryFilter,
      costTypeFilter: filters.costTypeFilter,
      searchTerm: filters.searchTerm,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    }, 'customer_id'),
    [receivables, filters.statusTab, filters.dateType, filters.entityFilter, filters.categoryFilter, filters.costTypeFilter, filters.searchTerm, filters.dateFrom, filters.dateTo]);

  // Stats
  const stats = useAccountStats(filteredReceivables);

  // Selected totals
  const selectedTotalAmount = useMemo(() =>
    selection.selectedTotal(filteredReceivables, (r) => Number(r.total_amount)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredReceivables, selection.selectedTotal]);

  const selectedPaidTotal = useMemo(() =>
    selection.selectedTotal(filteredReceivables, (r) => Number(r.paid_amount)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredReceivables, selection.selectedTotal]);

  const selectedPendingTotal = useMemo(() =>
    selection.selectedTotal(filteredReceivables, getAccountRemaining),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredReceivables, selection.selectedTotal]);

  // Additional filter JSX (must be at top level — NOT inside JSX — to respect Rules of Hooks)
  const additionalFilterContent = useMemo(() => (
    <>
      <Select value={filters.entityFilter} onValueChange={filters.setEntityFilter}>
        <SelectTrigger className="w-full sm:w-[200px] h-9">
          <SelectValue placeholder="Cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Clientes</SelectItem>
          {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.categoryFilter} onValueChange={filters.setCategoryFilter}>
        <SelectTrigger className="w-full sm:w-[200px] h-9">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas Categorias</SelectItem>
          {incomeCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.costTypeFilter} onValueChange={filters.setCostTypeFilter}>
        <SelectTrigger className="w-full sm:w-[180px] h-9">
          <SelectValue placeholder="Tipo de Custo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Tipos</SelectItem>
          <SelectItem value="fixed">Receitas Fixas</SelectItem>
          <SelectItem value="variable">Receitas Variáveis</SelectItem>
          <SelectItem value="resultado_financeiro">Resultado Financeiro</SelectItem>
        </SelectContent>
      </Select>
    </>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [filters.entityFilter, filters.categoryFilter, filters.costTypeFilter, customers, incomeCategories]);

  // UI states (isDialogOpen/isPaymentDialogOpen declared above with query hooks)
  const [formData, setFormData] = useState<AccountFormData>(getEmptyFormData());
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>(getEmptyPaymentFormData());
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null);
  const [deletingReceivable, setDeletingReceivable] = useState<Receivable | null>(null);

  // Quick add dialogs
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [showQuickAddChartAccount, setShowQuickAddChartAccount] = useState(false);

  // OCR
  const [showOcrScanner, setShowOcrScanner] = useState(false);
  const [ocrScanData, setOcrScanData] = useState<OcrScanData | null>(null);

  // Handlers
  const handleNew = useCallback(() => {
    setFormData(getEmptyFormData());
    setEditingReceivable(null);
    setShowOcrScanner(false);
    setOcrScanData(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((receivable: Receivable) => {
    setFormData({
      entity_id: receivable.customer_id,
      category_id: receivable.category_id || '',
      chart_account_id: receivable.chart_account_id || '',
      description: receivable.description,
      document_number: receivable.document_number || '',
      issue_date: receivable.issue_date,
      due_date: receivable.due_date,
      total_amount: String(receivable.total_amount),
      total_installments: String(receivable.total_installments || 1),
      notes: receivable.notes || '',
      status: receivable.status === 'pago' ? 'completed' : 'pending',
      bank_account_id: receivable.bank_account_id || '',
      payment_method: receivable.payment_method || 'boleto',
      recurrence: receivable.recurrence || '',
      recurrenceConfig: {
        frequency: 'none',
        interval: 1,
        specificDays: [],
        dayOfMonth: null,
        endDate: null,
        occurrenceLimit: null,
        isInstallment: false,
        installmentCount: null
      }
    });
    setEditingReceivable(receivable);
    setShowOcrScanner(false);
    setOcrScanData(null);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (!deletingReceivable) return;
    deleteMutation.mutate(deletingReceivable.id, {
      onSuccess: () => {
        toast.success('Conta excluída com sucesso!');
        setDeletingReceivable(null);
      },
      onError: (error: Error) => toast.error('Erro ao excluir: ' + error.message),
    });
  }, [deletingReceivable, deleteMutation]);

  const handlePayment = useCallback((receivable: Receivable) => {
    setSelectedReceivable(receivable);
    const remainingAmount = Number(receivable.total_amount) - Number(receivable.paid_amount);
    setPaymentFormData({
      ...getEmptyPaymentFormData(),
      amount: remainingAmount.toFixed(2),
    });
    setIsPaymentDialogOpen(true);
  }, []);

  const handleOcrResult = useCallback((result: OcrResult) => {
    setFormData(prev => ({
      ...prev,
      total_amount: result.amount || prev.total_amount,
      due_date: result.dueDate || prev.due_date,
      description: result.description || prev.description,
      document_number: result.documentNumber || prev.document_number,
    }));
    setOcrScanData({
      imageUrl: '',
      extractedText: result.rawText,
      extractedData: result,
    });
    setShowOcrScanner(false);
    toast.success('Dados extraídos com sucesso! Revise e complete o formulário.');
  }, []);

  const handleDuplicate = useCallback((receivable: Receivable) => {
    setFormData({
      entity_id: receivable.customer_id || '',
      category_id: receivable.category_id || '',
      chart_account_id: receivable.chart_account_id || '',
      description: `${receivable.description} (cópia)`,
      document_number: '',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: receivable.due_date,
      total_amount: String(receivable.total_amount),
      total_installments: '1',
      notes: receivable.notes || '',
      status: 'pending',
      bank_account_id: receivable.bank_account_id || '',
      payment_method: (receivable.payment_method || 'boleto') as AccountFormData['payment_method'],
      recurrence: '',
      recurrenceConfig: {
        frequency: 'none',
        interval: 1,
        specificDays: [],
        dayOfMonth: null,
        endDate: null,
        occurrenceLimit: null,
        isInstallment: false,
        installmentCount: null,
      },
    });
    setEditingReceivable(null);
    setShowOcrScanner(false);
    setOcrScanData(null);
    setIsDialogOpen(true);
    toast.info('Conta duplicada. Revise os dados e salve.');
  }, []);

  const handleSave = useCallback(() => {
    if (createMutation.isPending || updateMutation.isPending) return;

    if (!validateWithToast(receivableFormSchema, formData)) return;

    if (!currentCompany) {
      toast.error('Selecione uma empresa');
      return;
    }

    if (editingReceivable) {
      updateMutation.mutate({
        id: editingReceivable.id,
        payload: {
          customer_id: formData.entity_id,
          category_id: formData.category_id || null,
          chart_account_id: formData.chart_account_id || null,
          description: formData.description,
          document_number: formData.document_number || null,
          issue_date: formData.issue_date,
          due_date: formData.due_date,
          total_amount: parseCurrencyValue(formData.total_amount),
          notes: formData.notes || null,
          status: (formData.status === 'completed' ? 'pago' : 'pendente') as 'pago' | 'pendente',
          bank_account_id: formData.bank_account_id || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payment_method: (formData.payment_method || null) as any,
          recurrence: formData.recurrence || null,
        },
      }, {
        onSuccess: () => {
          toast.success('Conta atualizada com sucesso!');
          if (currentCompany?.id) {
            queryClient.invalidateQueries({ queryKey: receivablesKeys.list(currentCompany.id) });
          }
          setIsDialogOpen(false);
          setEditingReceivable(null);
        },
        onError: (error: Error) => toast.error('Erro ao salvar: ' + error.message),
      });
    } else {
      const rc = formData.recurrenceConfig;
      const totalAmount = parseCurrencyValue(formData.total_amount);
      const baseDate = parseISO(formData.due_date);

      let occurrencesCount = 1;
      let installmentAmount = totalAmount;

      if (rc && rc.isInstallment && rc.installmentCount) {
        occurrencesCount = rc.installmentCount;
        installmentAmount = totalAmount / occurrencesCount;
      } else if (rc && rc.frequency !== 'none') {
        // Limit to 12 if no occurrence limit and no end date are set to prevent infinite loop locally
        occurrencesCount = rc.occurrenceLimit || 12;
        installmentAmount = totalAmount; // For recurring, total amount is repeated
        if (!rc.occurrenceLimit && rc.endDate) {
          occurrencesCount = 360; // upper bound if until date
        }
      }

      const receivablesToCreate = [];
      let currentDate = baseDate;

      for (let i = 0; i < occurrencesCount; i++) {
        if (rc && !rc.isInstallment && rc.frequency !== 'none' && rc.endDate && currentDate > rc.endDate) {
          break; // Stop if we passed the end date
        }

        receivablesToCreate.push({
          company_id: currentCompany.id,
          customer_id: formData.entity_id,
          category_id: formData.category_id || null,
          chart_account_id: formData.chart_account_id || null,
          description: rc?.isInstallment
            ? `${formData.description} (${i + 1}/${occurrencesCount})`
            : formData.description,
          document_number: formData.document_number || null,
          issue_date: formData.issue_date,
          due_date: format(currentDate, 'yyyy-MM-dd'),
          total_amount: installmentAmount,
          installment_number: rc?.isInstallment ? i + 1 : 1,
          total_installments: rc?.isInstallment ? occurrencesCount : 1,
          notes: formData.notes || null,
          status: (formData.status === 'completed' && i === 0 ? 'pago' : 'pendente') as 'pago' | 'pendente',
          bank_account_id: formData.bank_account_id || null,
          payment_method: formData.payment_method || null,
          recurrence: formData.recurrence || null,
        });

        // Calculate next date if repeating
        if (rc && rc.frequency !== 'none') {
          const interval = rc.interval || 1;
          switch (rc.frequency) {
            case 'daily':
              currentDate = addDays(currentDate, interval);
              break;
            case 'weekly':
              currentDate = addWeeks(currentDate, interval);
              break;
            case 'biweekly':
              currentDate = addWeeks(currentDate, interval * 2);
              break;
            case 'monthly':
              currentDate = addMonths(currentDate, interval);
              break;
            case 'quarterly':
              currentDate = addMonths(currentDate, interval * 3);
              break;
            case 'semiannual':
              currentDate = addMonths(currentDate, interval * 6);
              break;
            case 'yearly':
              currentDate = addYears(currentDate, interval);
              break;
            default:
              currentDate = addMonths(currentDate, interval);
          }
        }
      }

      createMutation.mutate(receivablesToCreate, {
        onSuccess: () => {
          toast.success('Conta a receber criada com sucesso!');
          // Force immediate list refresh
          if (currentCompany?.id) {
            queryClient.invalidateQueries({ queryKey: receivablesKeys.list(currentCompany.id) });
          }
          setIsDialogOpen(false);
          setEditingReceivable(null);
          setOcrScanData(null);
        },
        onError: (error: Error) => toast.error('Erro ao salvar: ' + error.message),
      });
    }
  }, [currentCompany, formData, editingReceivable, createMutation, updateMutation, queryClient]);

  const handleSavePayment = useCallback(() => {
    if (paymentMutation.isPending) return;

    if (!selectedReceivable || !paymentFormData.amount || !paymentFormData.bank_account_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const amount = parseCurrencyValue(paymentFormData.amount);
    const remaining = Number(selectedReceivable.total_amount) - Number(selectedReceivable.paid_amount);

    if (amount > remaining) {
      toast.error('Valor maior que o saldo restante');
      return;
    }

    paymentMutation.mutate({
      receivable_id: selectedReceivable.id,
      bank_account_id: paymentFormData.bank_account_id,
      amount,
      payment_date: paymentFormData.payment_date,
      payment_method: paymentFormData.payment_method,
      notes: paymentFormData.notes || null,
    }, {
      onSuccess: () => {
        toast.success('Recebimento registrado com sucesso!');
        setIsPaymentDialogOpen(false);
      },
      onError: (error: Error) => toast.error('Erro ao registrar recebimento: ' + error.message),
    });
  }, [selectedReceivable, paymentFormData, paymentMutation]);

  const handleBulkDelete = async () => {
    if (!selection.selectedIds.length) return;
    try {
      await deleteMutation.mutateAsync(selection.selectedIds);
      toast.success(`${selection.selectedIds.length} item(s) excluído(s) com sucesso`);
      selection.clearSelection();
    } catch (error: unknown) {
      console.error("Error bulk deleting:", error);
      toast.error('Erro ao excluir itens selecionados: ' + (error as Error).message);
    }
  };

  const handleBulkPayment = async () => {
    if (!selection.selectedIds.length) return;
    try {
      await bulkUpdateStatusMutation.mutateAsync({ ids: selection.selectedIds, status: 'pago' });
      toast.success(`${selection.selectedIds.length} item(s) marcado(s) como pago(s)`);
      selection.clearSelection();
    } catch (error: unknown) {
      console.error("Error bulk marking as paid:", error);
      toast.error('Erro ao atualizar itens selecionados: ' + (error as Error).message);
    }
  };

  // Export data
  const exportData = useMemo(() =>
    filteredReceivables.map(r => ({
      due_date: format(new Date(r.due_date), 'dd/MM/yyyy'),
      entity: r.customer?.name || '-',
      description: r.description,
      total_amount: r.total_amount,
      paid_amount: r.paid_amount,
      remaining: Number(r.total_amount) - Number(r.paid_amount),
      status: STATUS_LABELS[r.status],
    })),
    [filteredReceivables]);

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  // Query error state
  if (queryError) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Receipt className="h-6 w-6 text-emerald-500" />
                Contas a Receber
              </h1>
            </div>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-2">
            <p className="text-destructive font-medium">Erro ao carregar contas a receber</p>
            <p className="text-sm text-muted-foreground">{(queryError as Error).message}</p>
            <Button variant="outline" size="sm" onClick={() => queryClient.refetchQueries({ queryKey: receivablesKeys.list(currentCompany?.id || '') })}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-6 w-6 text-emerald-500" />
              Contas a Receber
              {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </h1>
            <p className="text-sm text-muted-foreground">Gerencie seus recebíveis e registre recebimentos</p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={exportData}
              columns={getExportColumns('Cliente')}
              filename="contas-a-receber"
              title="Contas a Receber"
            />
            {canEdit && (
              <Button onClick={handleNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Conta
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <AccountSummaryCards
          stats={stats}
          accountType="receivable"
          currencySymbol={currentCompany?.currency_symbol || "R$ "}
        />

        {/* Filter Bar */}
        <AccountsFilterBar
          statusTab={filters.statusTab}
          onStatusTabChange={filters.setStatusTab}
          dateType={filters.dateType}
          onDateTypeChange={filters.setDateType}
          startDate={filters.dateFrom}
          endDate={filters.dateTo}
          onStartDateChange={filters.setDateFrom}
          onEndDateChange={filters.setDateTo}
          searchTerm={filters.searchInput}
          onSearchChange={filters.setSearchInput}
          onClear={filters.clearAllFilters}
          hasActiveFilters={filters.hasActiveFilters}
          additionalFilter={additionalFilterContent}
        />

        {/* Table */}
        <AccountsTable
          accounts={filteredReceivables}
          accountType="receivable"
          entityLabel="Cliente"
          paymentActionLabel="Registrar Recebimento"
          canEdit={canEdit}
          selectedIds={selection.selectedIds}
          onToggleSelection={selection.toggleSelection}
          onToggleSelectAll={() => selection.toggleSelectAll(filteredReceivables)}
          onPayment={handlePayment}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={(account) => setDeletingReceivable(account as Receivable)}
          onNew={handleNew}
          formatCurrency={formatCurrency}
          onBulkDelete={handleBulkDelete}
          onBulkPayment={handleBulkPayment}
        />
      </div>

      {/* Form Dialog */}
      <Suspense fallback={null}>
        <AccountFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          formData={formData}
          onFormChange={setFormData}
          onSave={handleSave}
          isSaving={isSaving}
          isEditing={!!editingReceivable}
          accountType="receivable"
          entities={customers}
          entityLabel="Cliente"
          onAddEntity={() => setShowQuickAddClient(true)}
          categories={incomeCategories}
          onAddCategory={() => setShowQuickAddCategory(true)}
          chartAccounts={chartAccounts}
          onAddChartAccount={() => setShowQuickAddChartAccount(true)}
          bankAccounts={bankAccounts}
          showOcr={true}
          showOcrScanner={showOcrScanner}
          onToggleOcrScanner={setShowOcrScanner}
          onOcrResult={handleOcrResult}
        />
      </Suspense>

      {/* Payment Dialog */}
      <Suspense fallback={null}>
        <PaymentRecordDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          formData={paymentFormData}
          onFormChange={setPaymentFormData}
          onSave={handleSavePayment}
          isSaving={isSaving}
          accountType="receivable"
          accountDescription={selectedReceivable?.description || ''}
          entityName={selectedReceivable?.customer?.name || ''}
          remainingBalance={selectedReceivable ? Number(selectedReceivable.total_amount) - Number(selectedReceivable.paid_amount) : 0}
          bankAccounts={bankAccounts}
          formatCurrency={formatCurrency}
        />
      </Suspense>

      {/* Delete Dialog */}
      <Suspense fallback={null}>
        <DeleteConfirmDialog
          open={!!deletingReceivable}
          onOpenChange={() => setDeletingReceivable(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          accountType="receivable"
          accountDescription={deletingReceivable?.description || ''}
          accountAmount={deletingReceivable?.total_amount || 0}
          formatCurrency={formatCurrency}
        />
      </Suspense>

      {/* Selection Summary */}
      <SelectionSummaryBar
        selectedCount={selection.selectedIds.length}
        totalValue={selectedTotalAmount}
        totalPaid={selectedPaidTotal}
        totalPending={selectedPendingTotal}
        paidLabel="Recebido"
        formatCurrency={formatCurrency}
        onClear={selection.clearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkPayment={handleBulkPayment}
      />

      {/* Quick Add Dialogs */}
      <QuickAddClientDialog
        open={showQuickAddClient}
        onOpenChange={setShowQuickAddClient}
        onSuccess={(client) => {
          setFormData(prev => ({ ...prev, entity_id: client.id }));
        }}
      />
      <QuickAddCategoryDialog
        open={showQuickAddCategory}
        onOpenChange={setShowQuickAddCategory}
        transactionType="entrada"
        existingCategories={incomeCategories}
        onSuccess={(category) => {
          setFormData(prev => ({ ...prev, category_id: category.id }));
          setShowQuickAddCategory(false);
        }}
      />
      <QuickAddChartAccountDialog
        open={showQuickAddChartAccount}
        onOpenChange={setShowQuickAddChartAccount}
        transactionType="entrada"
        existingCategories={chartAccounts}
        onSuccess={(account) => {
          if (currentCompany?.id) {
            queryClient.invalidateQueries({ queryKey: chartAccountsKeys.income(currentCompany.id) });
          }
          setFormData(prev => ({ ...prev, chart_account_id: account.id }));
          setShowQuickAddChartAccount(false);
        }}
      />
    </AppLayout>
  );
}
