/**
 * Centralized type exports
 * Import types from this file for cleaner imports
 */

// ============================================
// COMMON TYPES
// ============================================

export type {
  PayableStatus,
  ReceivableStatus,
  TransactionType,
  PaymentMethod,
  BankAccountType,
  AccountEntryType,
  DRECategory,
  DateRange,
  PaginationParams,
  SortDirection,
  SortConfig,
} from './common';

// ============================================
// FINANCIAL ENTITY TYPES
// ============================================

export type {
  Transaction,
  TransactionWithRelations,
  Payable,
  PayableWithRelations,
  Receivable,
  ReceivableWithRelations,
  PaymentRecord,
  BankAccount,
  ChartAccount,
  CostCenter,
  Customer,
  Supplier,
  DetailedTransaction,
  DailyDetail,
  WeeklyData,
  MonthlyCategory,
  MonthlyData,
  FinancialStats,
  PayableStats,
  ReceivableStats,
} from './financial';

// ============================================
// FORM DATA TYPES
// ============================================

export type {
  TransactionFormData,
  PayableFormData,
  ReceivableFormData,
  PaymentFormData,
  CustomerFormData,
  SupplierFormData,
  BankAccountFormData,
  ChartAccountFormData,
  CompanyFormData,
  CostCenterFormData,
  CategoryFormData,
} from './forms';

export {
  emptyTransactionFormData,
  emptyPayableFormData,
  emptyReceivableFormData,
  emptyPaymentFormData,
  emptyCustomerFormData,
  emptySupplierFormData,
  emptyBankAccountFormData,
  emptyChartAccountFormData,
  emptyCompanyFormData,
  emptyCostCenterFormData,
  emptyCategoryFormData,
} from './forms';

// ============================================
// API TYPES
// ============================================

export type {
  ApiResponse,
  PaginatedResponse,
  MutationResult,
  BaseFilters,
  TransactionFilters,
  PayableFilters,
  ReceivableFilters,
  EntityFilters,
  BankAccountFilters,
  ChartAccountFilters,
  QueryResult,
  MutationState,
  QueryWithRelations,
  RelationData,
  SortOrder,
  BulkOperationResult,
} from './api';

// ============================================
// DRE TYPES
// ============================================

export type {
  ChartAccountRelation,
  DRETransactionItem,
  DREReceivableItem,
  DREPayableItem,
  DREGroupableItem,
  DRECategoryGroup,
  DRECategoryItem,
  DRELineItem,
  DRESection,
  DRECalculation,
  DREMargins,
  DREComparison,
  DREBudgetEntry,
  DREBudgetComparison,
  DREMonthlyPoint,
  DREYearComparison,
} from './dre';

// ============================================
// CASHFLOW TYPES
// ============================================

export type {
  PaymentCustomerRelation,
  PaymentSupplierRelation,
  PaymentChartAccountRelation,
  PaymentReceivableRelation,
  PaymentPayableRelation,
  PaymentRecordWithRelations,
  CashFlowTransaction,
  CashFlowSource,
  CashFlowDailyDetail,
  CashFlowWeeklyData,
  CashFlowMonthlyCategory,
  CashFlowMonthlyData,
  CashFlowMatrixWeekColumn,
  CashFlowMatrixCategoryData,
  CashFlowMatrixGroupData,
  CashFlowProjectionPoint,
  CashFlowScenario,
  CashFlowAlert,
  CashFlowBankAccount,
  CashFlowBalanceSummary,
  ProjectedReceivable,
  ProjectedPayable,
} from './cashflow';
