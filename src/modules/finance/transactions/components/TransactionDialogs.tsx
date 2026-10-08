'use client';

/**
 * TransactionDialogs Component
 *
 * Componente que agrupa todos os dialogs relacionados a transações.
 * Gerencia estados de dialogs de forma centralizada.
 *
 * Form fields are rendered by the shared TransactionFormFields component.
 */

import { memo, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateChangeConfirmDialog } from './DateChangeConfirmDialog';
import { TransactionDetailsDialog } from './TransactionDetailsDialog';
import { TransactionAuditDrawer } from './TransactionAuditDrawer';
import { TransactionFormFields } from './TransactionFormFields';

import { QuickAddClientDialog } from './QuickAddClientDialog';
import { QuickAddSupplierDialog } from './QuickAddSupplierDialog';
import { QuickAddCategoryDialog } from './QuickAddCategoryDialog';
import { QuickAddChartAccountDialog } from './QuickAddChartAccountDialog';
import { OcrScanner, type OcrResult } from '@/components/shared';
import type { Transaction, BankAccount, ChartAccount, Customer, Supplier, Category } from '../hooks/useTransactionsData';
import type { TransactionFormData } from '../hooks/useTransactionsActions';
import { paymentMethodLabels } from '../constants';

// eslint-disable-next-line react-refresh/only-export-components
export { paymentMethodLabels };

interface TransactionDialogsProps {
  // Dialog states
  showNewDialog: boolean;
  onShowNewDialogChange: (show: boolean) => void;
  showEditDialog: boolean;
  onShowEditDialogChange: (show: boolean) => void;
  deletingTransaction: Transaction | null;
  onDeleteCancel: () => void;
  viewingTransaction: Transaction | null;
  onViewClose: () => void;
  auditTransactionId: string | null;
  onAuditClose: () => void;

  // Date change confirmation
  pendingDateChange: { original: Date; new: Date } | null;
  onDateChangeConfirm: () => void;
  onDateChangeCancel: () => void;

  // Form data
  newFormData: TransactionFormData;
  onNewFormDataChange: (data: TransactionFormData) => void;
  editFormData: TransactionFormData;
  onEditFormDataChange: (data: TransactionFormData) => void;
  editingTransaction: Transaction | null;

  // Data for selects
  bankAccounts: BankAccount[];
  chartAccounts: ChartAccount[];
  categories: Category[];
  customers: Customer[];
  suppliers: Supplier[];

  // Actions
  onSaveNew: () => Promise<void>;
  onSaveEdit: () => Promise<void>;
  onDelete: () => Promise<void>;

  // Loading states
  isSaving: boolean;
  isDeleting: boolean;

  // Formatting
  formatCurrency: (value: number) => string;

  // Quick add callbacks
  onCustomerAdded: (customer: Customer) => void;
  onSupplierAdded: (supplier: Supplier) => void;
  onCategoryAdded: (category: Category) => void;
  onChartAccountAdded: (account: ChartAccount) => void;
}

export const TransactionDialogs = memo(function TransactionDialogs({
  showNewDialog,
  onShowNewDialogChange,
  showEditDialog,
  onShowEditDialogChange,
  deletingTransaction,
  onDeleteCancel,
  viewingTransaction,
  onViewClose,
  auditTransactionId,
  onAuditClose,
  pendingDateChange,
  onDateChangeConfirm,
  onDateChangeCancel,
  newFormData,
  onNewFormDataChange,
  editFormData,
  onEditFormDataChange,
  editingTransaction,
  bankAccounts,
  chartAccounts,
  categories,
  customers,
  suppliers,
  onSaveNew,
  onSaveEdit,
  onDelete,
  isSaving,
  isDeleting,
  formatCurrency,
  onCustomerAdded,
  onSupplierAdded,
  onCategoryAdded,
  onChartAccountAdded,
}: TransactionDialogsProps) {

  // Local dialog states
  const [showOcrScanner, setShowOcrScanner] = useState(false);
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [showQuickAddSupplier, setShowQuickAddSupplier] = useState(false);
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [showQuickAddChartAccount, setShowQuickAddChartAccount] = useState(false);

  // Validation State
  const [errors, setErrors] = useState<{
    description?: string;
    amount?: string;
    transaction_date?: string;
    bank_account_id?: string;
  }>({});

  const validateForm = (data: TransactionFormData) => {
    const newErrors: typeof errors = {};
    if (!data.description.trim()) newErrors.description = 'Descrição é obrigatória';
    if (!data.amount || data.amount === '0,00') newErrors.amount = 'Valor é obrigatório';
    if (!data.transaction_date) newErrors.transaction_date = 'Data é obrigatória';
    if (!data.bank_account_id) newErrors.bank_account_id = 'Conta é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveNew = async () => {
    if (validateForm(newFormData)) {
      await onSaveNew();
    }
  };

  const handleSaveEdit = async () => {
    if (validateForm(editFormData)) {
      await onSaveEdit();
    }
  };

  const handleErrorClear = useCallback((field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  // OCR result handler
  const handleOcrResult = useCallback((data: OcrResult) => {
    onNewFormDataChange({
      ...newFormData,
      amount: data.amount || newFormData.amount,
      description: data.description || newFormData.description,
      transaction_date: data.dueDate || newFormData.transaction_date,
      document_number: data.documentNumber || newFormData.document_number,
    });
    setShowOcrScanner(false);
  }, [newFormData, onNewFormDataChange]);

  const sharedSelectData = { bankAccounts, chartAccounts, categories, customers, suppliers };
  const quickAddHandlers = {
    onQuickAddClient: () => setShowQuickAddClient(true),
    onQuickAddSupplier: () => setShowQuickAddSupplier(true),
    onQuickAddCategory: () => setShowQuickAddCategory(true),
    onQuickAddChartAccount: () => setShowQuickAddChartAccount(true),
  };

  return (
    <>
      {/* New Transaction Dialog */}
      <Dialog open={showNewDialog} onOpenChange={onShowNewDialogChange}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 flex flex-col max-h-[85vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl transition-colors",
                newFormData.type === 'entrada' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                {newFormData.type === 'entrada' ? (
                  <TrendingUp className="h-5 w-5 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="h-5 w-5 stroke-[2.5]" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">
                  Nova {newFormData.type === 'entrada' ? 'Entrada' : 'Saída'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground/70 text-sm">
                  Preencha os dados da movimentação
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-6 py-5">
            <TransactionFormFields
              formData={newFormData}
              onFormDataChange={onNewFormDataChange}
              errors={errors}
              onErrorClear={handleErrorClear}
              showOcrBanner
              onOcrClick={() => setShowOcrScanner(true)}
              {...sharedSelectData}
              {...quickAddHandlers}
            />
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0">
            <Button variant="outline" onClick={() => onShowNewDialogChange(false)} className="h-10 px-5 border-border/50">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNew}
              disabled={isSaving}
              className={cn(
                "h-10 px-6 font-semibold transition-colors text-white shadow-md",
                newFormData.type === 'entrada'
                  ? "bg-success hover:bg-success/90 shadow-success/20"
                  : "bg-destructive hover:bg-destructive/90 shadow-destructive/20"
              )}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar {newFormData.type === 'entrada' ? 'Entrada' : 'Saída'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEditDialog} onOpenChange={onShowEditDialogChange}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 flex flex-col max-h-[85vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl transition-colors",
                editFormData.type === 'entrada' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                {editFormData.type === 'entrada' ? (
                  <TrendingUp className="h-5 w-5 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="h-5 w-5 stroke-[2.5]" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">
                  Editar {editFormData.type === 'entrada' ? 'Entrada' : 'Saída'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground/70 text-sm">
                  Altere os dados da movimentação
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-6 py-5">
            <TransactionFormFields
              formData={editFormData}
              onFormDataChange={onEditFormDataChange}
              editingTransaction={editingTransaction}
              {...sharedSelectData}
              {...quickAddHandlers}
            />
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0">
            <Button variant="outline" onClick={() => onShowEditDialogChange(false)} className="h-10 px-5 border-border/50">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className={cn(
                "h-10 px-6 font-semibold transition-colors text-white shadow-md",
                editFormData.type === 'entrada'
                  ? "bg-success hover:bg-success/90 shadow-success/20"
                  : "bg-destructive hover:bg-destructive/90 shadow-destructive/20"
              )}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTransaction} onOpenChange={() => onDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a movimentação "{deletingTransaction?.description}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        transaction={viewingTransaction}
        open={!!viewingTransaction}
        onOpenChange={(open) => !open && onViewClose()}
        formatCurrency={formatCurrency}
        onViewFullAudit={() => {
          // Will trigger audit drawer
        }}
      />

      {/* Audit Drawer */}
      <TransactionAuditDrawer
        transactionId={auditTransactionId}
        open={!!auditTransactionId}
        onOpenChange={(open) => !open && onAuditClose()}
      />

      {/* OCR Scanner Dialog */}
      <Dialog open={showOcrScanner} onOpenChange={setShowOcrScanner}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Escanear Documento</DialogTitle>
            <DialogDescription>
              Tire uma foto ou selecione uma imagem do documento
            </DialogDescription>
          </DialogHeader>
          <OcrScanner
            onResult={handleOcrResult}
            onError={(error) => console.error(`Erro no OCR: ${error}`)}
          />
          <p className="text-xs text-muted-foreground text-center">
            Suporta: Cupom fiscal, Nota fiscal, Boleto, Recibo, Comprovante
          </p>
        </DialogContent>
      </Dialog>

      {/* Date Change Confirmation Dialog */}
      {pendingDateChange && (
        <DateChangeConfirmDialog
          open={true}
          onOpenChange={() => onDateChangeCancel()}
          originalDate={pendingDateChange.original}
          newDate={pendingDateChange.new}
          onConfirm={onDateChangeConfirm}
          onCancel={onDateChangeCancel}
        />
      )}

      {/* Quick Add Client Dialog */}
      <QuickAddClientDialog
        open={showQuickAddClient}
        onOpenChange={setShowQuickAddClient}
        onSuccess={(customer) => {
          onCustomerAdded(customer);
          onNewFormDataChange({ ...newFormData, customer_id: customer.id });
          setShowQuickAddClient(false);
        }}
      />

      {/* Quick Add Supplier Dialog */}
      <QuickAddSupplierDialog
        open={showQuickAddSupplier}
        onOpenChange={setShowQuickAddSupplier}
        onSuccess={(supplier) => {
          onSupplierAdded(supplier);
          onNewFormDataChange({ ...newFormData, supplier_id: supplier.id });
          setShowQuickAddSupplier(false);
        }}
      />

      {/* Quick Add Category Dialog */}
      <QuickAddCategoryDialog
        open={showQuickAddCategory}
        onOpenChange={setShowQuickAddCategory}
        transactionType={newFormData.type}
        existingCategories={categories}
        onSuccess={(category) => {
          onCategoryAdded(category);
          onNewFormDataChange({ ...newFormData, category_id: category.id });
          setShowQuickAddCategory(false);
        }}
      />

      {/* Quick Add Chart Account Dialog */}
      <QuickAddChartAccountDialog
        open={showQuickAddChartAccount}
        onOpenChange={setShowQuickAddChartAccount}
        transactionType={newFormData.type}
        existingCategories={chartAccounts}
        onSuccess={(account) => {
          onChartAccountAdded(account);
          onNewFormDataChange({ ...newFormData, chart_account_id: account.id });
          setShowQuickAddChartAccount(false);
        }}
      />
    </>
  );
});

export default TransactionDialogs;
