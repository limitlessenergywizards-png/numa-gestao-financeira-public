/**
 * Transactions Feature Module
 * 
 * Encapsulates all transaction-related functionality:
 * - Components: Table, filters, forms, dialogs, bulk actions
 * - Hooks: Data fetching, CRUD, selection, export, keyboard shortcuts
 * - Services: Supabase CRUD for transactions
 */

// Components
export * from "./components/TransactionsSummaryCards";
export * from "./components/TransactionsFilterBar";
export * from "./components/TransactionsBulkActions";
export * from "./components/TransactionDetailsDialog";
export * from "./components/TransactionAuditDrawer";
export * from "./components/QuickAddButtons";
export * from "./components/QuickAddClientDialog";
export * from "./components/QuickAddSupplierDialog";
export * from "./components/QuickAddCategoryDialog";
export * from "./components/FloatingTransactionMenu";
export * from "./components/DateEditField";
export * from "./components/DateChangeConfirmDialog";
export * from "./components/TransactionRow";
export * from "./components/TransactionsTable";
export * from "./components/TransactionsPagination";
export * from "./components/TransactionsTotalsFooter";
export { paymentMethodLabels } from "./constants";

// Hooks
export * from "./hooks/useTransactionsData";
export * from "./hooks/useTransactionsActions";
export * from "./hooks/useTransactionsSelection";
export * from "./hooks/useTransactionDialogs";
export * from "./hooks/useTransactionExport";
export * from "./hooks/useTransactionKeyboardShortcuts";
export {
  useTransactionsQuery,
  useBankAccountsForTransactions,
  useChartAccountsForTransactions,
  useCustomersForTransactions,
  useSuppliersForTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useReconcileTransaction,
  useBulkReconcileTransactions,
  useBulkDeleteTransactions,
  useDuplicateTransaction,
} from "./hooks/useTransactionsQuery";

export { default } from "./TransactionsPage";
