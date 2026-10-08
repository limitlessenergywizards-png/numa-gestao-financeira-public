'use client';

/**
 * Transactions Page - Refatorada
 *
 * Pagina principal de movimentacoes financeiras.
 * Usa hooks e componentes especializados para performance otimizada.
 *
 * Antes: 65KB, 1800+ linhas, multiplos useEffects cascateando
 * Depois: ~8KB, ~280 linhas, logica distribuida em 6 hooks especializados
 */

import { lazy, Suspense, useCallback, useState } from 'react';
import { useCompanyState } from '@/contexts/CompanyContext';
import { useCanEdit } from '@/hooks/useCanEdit';
import { useFormatters } from '@/hooks/useFormatters';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ExportButton } from '@/components/shared';
import { transactionSchema, validateWithToast } from '@/lib/validations/financial-schemas';

// Custom hooks (Local Module)
import { useTransactionsData } from './hooks/useTransactionsData';
import { useTransactionsActions } from './hooks/useTransactionsActions';
import { useTransactionsSelection } from './hooks/useTransactionsSelection';
import { useTransactionDialogs } from './hooks/useTransactionDialogs';
import { useTransactionKeyboardShortcuts } from './hooks/useTransactionKeyboardShortcuts';
import { useTransactionExport } from './hooks/useTransactionExport';
import type { Transaction } from './hooks/useTransactionsData';

// Eagerly loaded components (visible on mount)
import { TransactionsSummaryCards } from './components/TransactionsSummaryCards';
import { TransactionsFilterBar } from './components/TransactionsFilterBar';
import { TransactionsBulkActions } from './components/TransactionsBulkActions';
import { FloatingTransactionMenu } from './components/FloatingTransactionMenu';
import { TransactionsTable } from './components/TransactionsTable';
import { TransactionsTotalsFooter } from './components/TransactionsTotalsFooter';

// Lazy-loaded components (dialogs only visible on user interaction, chart below fold)
const TransactionDialogs = lazy(() => import('./components/TransactionDialogs').then(m => ({ default: m.TransactionDialogs })));
const ForecastConversionDialog = lazy(() => import('./components/ForecastConversionDialog').then(m => ({ default: m.ForecastConversionDialog })));
const ForecastAccuracyChart = lazy(() => import('./components/ForecastAccuracyChart').then(m => ({ default: m.ForecastAccuracyChart })));

export default function Transactions() {
  const { currentCompany } = useCompanyState();
  const canEdit = useCanEdit();
  const { formatCurrency } = useFormatters();
  const [forecastToConvert, setForecastToConvert] = useState<Transaction | null>(null);

  // Data hook - handles all fetching, filtering, pagination
  const {
    paginatedTransactions,
    filteredTransactions,
    bankAccounts,
    chartAccounts,
    categories,
    customers,
    suppliers,
    totals,
    isLoading,
    filters,
    hasActiveFilters,
    isCustomDateActive,
    setSearchTerm,
    setSelectedBankId,
    setSelectedCategoryId,
    setSelectedChartAccountId,
    setStatusFilter,
    setTypeFilter,
    setQuickFilter,
    setStartDate,
    setEndDate,
    clearFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    refetch,
    delayedRefetch,
    removeTransaction,
    addTransactionToList,
    addCustomer,
    addSupplier,
    addChartAccount,
    addCategory,
    setNatureFilter, // New exported setter
    setForecastTypeFilter,
  } = useTransactionsData();

  // Actions hook - handles CRUD operations
  const {
    isSaving,
    isDeleting,
    isProcessingBulk,
    pendingDateChange,
    confirmDateChange,
    cancelDateChange,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    reconcileTransaction,
    duplicateTransaction,
    convertForecastToActual,
    bulkReconcile,
    bulkDelete,
  } = useTransactionsActions({
    onSuccess: delayedRefetch,
    onTransactionCreated: addTransactionToList,
    onTransactionDeleted: removeTransaction,
  });

  // Realtime subscription handled by BackgroundServices
  // Cache listener in useTransactionsData will detect when transactions are invalidated

  // Selection hook - handles multi-select for bulk actions
  const {
    selectedIds,
    selectedTotals,
    isAllSelected,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
    removeFromSelection,
  } = useTransactionsSelection(paginatedTransactions);

  // Dialog states hook - manages all dialog visibility and form data
  const {
    showNewDialog,
    showEditDialog,
    editingTransaction,
    deletingTransaction,
    viewingTransaction,
    auditTransactionId,
    newFormData,
    editFormData,
    setShowNewDialog,
    setNewFormData,
    setEditFormData,
    setDeletingTransaction,
    setViewingTransaction,
    setAuditTransactionId,
    openNewEntry,
    openNewExit,
    openEdit,
    closeEdit,
    closeDelete,
    closeView,
    closeAudit,
  } = useTransactionDialogs();

  // Keyboard shortcuts (Ctrl+E = new entry, Ctrl+S = new exit)
  useTransactionKeyboardShortcuts({ canEdit, onNewEntry: openNewEntry, onNewExit: openNewExit });



  // Export data preparation (memoized)
  const { exportColumns, exportData } = useTransactionExport(filteredTransactions, formatCurrency);

  const handleConvertForecast = useCallback((transaction: Transaction) => {
    setForecastToConvert(transaction);
  }, []);

  const handleConfirmConversion = useCallback(async (forecastId: string, actualAmount: number, keepForecast: boolean, date: string) => {
    if (!convertForecastToActual) return false;
    return await convertForecastToActual(forecastId, actualAmount, keepForecast, date);
  }, [convertForecastToActual]);

  // Loading state
  const isInitialLoading = isLoading && paginatedTransactions.length === 0;

  // Save handlers
  const handleSaveNew = useCallback(async () => {
    if (!validateWithToast(transactionSchema, newFormData)) return;
    const success = await createTransaction(newFormData);
    if (success) {
      setShowNewDialog(false);
    }
  }, [newFormData, createTransaction, setShowNewDialog]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingTransaction) return;
    if (!validateWithToast(transactionSchema, editFormData)) return;
    const result = await updateTransaction(
      editingTransaction.id,
      editFormData,
      editingTransaction.transaction_date
    );
    if (result === true) {
      closeEdit();
    }
  }, [editingTransaction, editFormData, updateTransaction, closeEdit]);

  const handleDelete = useCallback(async () => {
    if (!deletingTransaction) return;
    const success = await deleteTransaction(deletingTransaction.id);
    if (success) {
      removeFromSelection([deletingTransaction.id]);
      closeDelete();
    }
  }, [deletingTransaction, deleteTransaction, removeFromSelection, closeDelete]);

  const handleBulkReconcile = useCallback(async () => {
    const success = await bulkReconcile(selectedIds);
    if (success) clearSelection();
  }, [selectedIds, bulkReconcile, clearSelection]);

  const handleBulkDelete = useCallback(async () => {
    const success = await bulkDelete(selectedIds);
    if (success) clearSelection();
  }, [selectedIds, bulkDelete, clearSelection]);

  // No company selected
  if (!currentCompany) {
    return (
      <AppLayout title="Movimentações Financeiras">
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-muted-foreground">Selecione uma empresa para continuar</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Movimentações Financeiras"
      description="Visualize e gerencie todas as transações"
      actions={
        <div className="flex items-center gap-2">
          {filteredTransactions.length > 0 && (
            <ExportButton
              data={exportData}
              columns={exportColumns}
              filename={`movimentacoes-${format(new Date(), 'yyyy-MM-dd')}`}
              title="Movimentações Financeiras"
              subtitle={filters.startDate && filters.endDate ? `${format(filters.startDate, 'dd/MM/yyyy')} a ${format(filters.endDate, 'dd/MM/yyyy')}` : 'Todo o Período'}
            />
          )}
          {canEdit && (
            <>
              <Button
                onClick={openNewEntry}
                className="bg-success hover:bg-success/90 gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Entrada
              </Button>
              <Button
                onClick={openNewExit}
                variant="destructive"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Saída
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <TransactionsSummaryCards
          totalEntradas={totals.entradas}
          totalSaidas={totals.saidas}
          saldo={totals.saldo}
          pendingCount={totals.pendingCount}
          pendingAmount={totals.pendingAmount}
          entradasCount={totals.entradasCount}
          saidasCount={totals.saidasCount}
          totalCount={totals.totalCount}
          formatCurrency={formatCurrency}
        />

        {/* Filter Bar */}
        <TransactionsFilterBar
          searchTerm={filters.searchTerm}
          onSearchChange={setSearchTerm}
          natureFilter={filters.natureFilter}
          onNatureChange={setNatureFilter}
          selectedBankId={filters.selectedBankId}
          onBankChange={setSelectedBankId}
          selectedCategoryId={filters.selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
          statusFilter={filters.statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={filters.typeFilter}
          onTypeChange={setTypeFilter}
          forecastTypeFilter={filters.forecastTypeFilter}
          onForecastTypeChange={setForecastTypeFilter}
          startDate={filters.startDate}
          endDate={filters.endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          quickFilter={filters.quickFilter}
          onQuickFilterChange={setQuickFilter}
          onClearFilters={clearFilters}
          bankAccounts={bankAccounts}
          chartAccounts={chartAccounts}
          categories={categories}
          selectedChartAccountId={filters.selectedChartAccountId}
          onChartAccountChange={setSelectedChartAccountId}
          hasActiveFilters={hasActiveFilters}
          isCustomDateActive={isCustomDateActive}
        />

        {/* Data Table */}
        <TransactionsTable
          transactions={paginatedTransactions as Transaction[]}
          selectedIds={selectedIds}
          onSelectOne={handleSelectOne}
          onSelectAll={handleSelectAll}
          isAllSelected={isAllSelected}
          isLoading={isInitialLoading}
          onView={setViewingTransaction}
          onEdit={openEdit}
          onDelete={setDeletingTransaction}
          onReconcile={(t) => reconcileTransaction(t.id)}
          onDuplicate={duplicateTransaction}
          onConvert={handleConvertForecast}
          onViewAudit={setAuditTransactionId}
          formatCurrency={formatCurrency}
          canEdit={canEdit}
          // Restored props
          totalFiltered={filteredTransactions.length}
          hasActiveFilters={hasActiveFilters}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />

        {/* Totals Footer */}
        <TransactionsTotalsFooter
          totalEntradas={totals.entradas}
          totalSaidas={totals.saidas}
          saldo={totals.saldo}
          transactionCount={filteredTransactions.length}
          formatCurrency={formatCurrency}
        />

        {/* Forecast Accuracy Chart (lazy-loaded - below fold) */}
        <Suspense fallback={null}>
        <ForecastAccuracyChart />
        </Suspense>

        {/* Bulk Actions Bar */}
        <TransactionsBulkActions
          selectedCount={selectedIds.length}
          selectedEntradas={selectedTotals.entradas}
          selectedSaidas={selectedTotals.saidas}
          selectedSaldo={selectedTotals.saldo}
          formatCurrency={formatCurrency}
          onReconcile={handleBulkReconcile}
          onDelete={handleBulkDelete}
          onClear={clearSelection}
          isProcessing={isProcessingBulk}
        />

        {/* Dialogs (lazy-loaded - only visible on user interaction) */}
        <Suspense fallback={null}>
        <TransactionDialogs
          showNewDialog={showNewDialog}
          onShowNewDialogChange={setShowNewDialog}
          showEditDialog={showEditDialog}
          onShowEditDialogChange={(show) => !show && closeEdit()}
          deletingTransaction={deletingTransaction}
          onDeleteCancel={closeDelete}
          viewingTransaction={viewingTransaction}
          onViewClose={closeView}
          auditTransactionId={auditTransactionId}
          onAuditClose={closeAudit}
          pendingDateChange={pendingDateChange || null}
          onDateChangeConfirm={confirmDateChange}
          onDateChangeCancel={cancelDateChange}
          newFormData={newFormData}
          onNewFormDataChange={setNewFormData}
          editFormData={editFormData}
          onEditFormDataChange={setEditFormData}
          editingTransaction={editingTransaction}
          bankAccounts={bankAccounts}
          chartAccounts={chartAccounts}
          categories={categories}
          customers={customers}
          suppliers={suppliers}
          onSaveNew={handleSaveNew}
          onSaveEdit={handleSaveEdit}
          onDelete={handleDelete}
          isSaving={isSaving}
          isDeleting={isDeleting}
          formatCurrency={formatCurrency}
          onCustomerAdded={addCustomer}
          onSupplierAdded={addSupplier}
          onCategoryAdded={addCategory}
          onChartAccountAdded={addChartAccount}
        />

        <ForecastConversionDialog
          isOpen={!!forecastToConvert}
          onOpenChange={(open) => !open && setForecastToConvert(null)}
          forecast={forecastToConvert}
          onConfirm={handleConfirmConversion}
        />
        </Suspense>
        {/* Floating Action Button */}
        <FloatingTransactionMenu
          onNewEntry={openNewEntry}
          onNewExit={openNewExit}
          disabled={!canEdit}
        />
      </div>
    </AppLayout>
  );
}
