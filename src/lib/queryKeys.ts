/**
 * Unified Query Keys Factory
 * 
 * Single source of truth for all React Query keys.
 * Ensures prefetch and page queries use identical keys for cache hits.
 * 
 * Pattern: ['domain', 'resource', entityId, ...modifiers]
 */

// ============================================
// STALE AND GC TIME CONFIGURATIONS
// ============================================

/** Stale time configurations (in milliseconds)
 *
 * STRATEGY:
 * - Dashboard: always fresh (computed aggregations)
 * - Financial: 15s (transactions, payables/receivables - frequent updates)
 * - Semi-volatile: 60s (lists that change moderately)
 * - Reference: 5-10min (lookup tables, catch external edits)
 * - Historical: 2-5min (cached reports, slower update)
 * - Realtime: 0s (actively subscribed data via Supabase Realtime)
 */
export const STALE_TIMES = {
  /** Dashboard & volatile aggregations - 30s (realtime handles freshness) */
  DASHBOARD: 30 * 1000,

  /** Core financial data - 60s (realtime invalidation handles freshness) */
  FINANCIAL: 60 * 1000,

  /** Semi-volatile lists (payables/receivables) - revalidate every 60 seconds */
  SEMI_VOLATILE: 60 * 1000,

  /** Historical data - refresh every 3 minutes */
  HISTORICAL: 3 * 60 * 1000,

  /** Editable reference data (suppliers, customers, categories) - refresh every 5 minutes
   * Catches changes from other users or external syncs without being too aggressive */
  EDITABLE_REFERENCE: 5 * 60 * 1000,

  /** Static reference data (chart of accounts structure) - refresh every 10 minutes */
  REFERENCE: 10 * 60 * 1000,

  /** Real-time data - always fresh (actively subscribed) */
  REALTIME: 0,

  /** Immutable data (countries, states) - never stale */
  IMMUTABLE: Infinity,
} as const;

/** Garbage collection time configurations
 *
 * STRATEGY:
 * - Keep financial data briefly in memory (avoid re-fetching during quick navigations)
 * - Keep reference data longer (lookup tables change infrequently)
 * - Clean up aggressively when not in use to free memory for large datasets
 */
export const GC_TIMES = {
  /** Core financial data - keep for 10 minutes after last use */
  FINANCIAL: 10 * 60 * 1000,

  /** Historical data - keep for 30 minutes after last use */
  HISTORICAL: 30 * 60 * 1000,

  /** Editable reference data - keep for 30 minutes */
  EDITABLE_REFERENCE: 30 * 60 * 1000,

  /** Static reference data - keep for 1 hour (very stable) */
  REFERENCE: 60 * 60 * 1000,
} as const;

// ============================================
// DASHBOARD KEYS
// ============================================

export const DASHBOARD_KEYS = {
  all: ['dashboard'] as const,

  // Core resources - with optional period filtering
  receivables: (companyId: string, dateRange?: { start: string; end: string }) =>
    dateRange
      ? ['dashboard', 'receivables', companyId, 'period', dateRange.start, dateRange.end] as const
      : ['dashboard', 'receivables', companyId] as const,

  payables: (companyId: string, dateRange?: { start: string; end: string }) =>
    dateRange
      ? ['dashboard', 'payables', companyId, 'period', dateRange.start, dateRange.end] as const
      : ['dashboard', 'payables', companyId] as const,

  bankAccounts: (companyId: string) =>
    ['dashboard', 'bank-accounts', companyId] as const,

  transactions: (companyId: string, dateRange?: { start: string; end: string }) =>
    dateRange
      ? ['dashboard', 'transactions', companyId, 'period', dateRange.start, dateRange.end] as const
      : ['dashboard', 'transactions', companyId] as const,

  chartAccounts: (companyId: string, type?: string) =>
    type
      ? ['dashboard', 'chart-accounts', companyId, type] as const
      : ['dashboard', 'chart-accounts', companyId] as const,

  // Derived queries for specific use cases
  receivablesOverdue: (companyId: string) =>
    ['dashboard', 'receivables', companyId, 'overdue'] as const,

  receivablesMonth: (companyId: string, month: string) =>
    ['dashboard', 'receivables', companyId, 'month', month] as const,

  receivablesLastMonth: (companyId: string) =>
    ['dashboard', 'receivables', companyId, 'last-month'] as const,

  payablesOverdue: (companyId: string) =>
    ['dashboard', 'payables', companyId, 'overdue'] as const,

  payablesMonth: (companyId: string, month: string) =>
    ['dashboard', 'payables', companyId, 'month', month] as const,

  payablesLastMonth: (companyId: string) =>
    ['dashboard', 'payables', companyId, 'last-month'] as const,

  // Aggregated sums for trend calculations
  receivablesLastMonthSum: (companyId: string) =>
    ['dashboard', 'receivables', companyId, 'last-month', 'sum'] as const,

  payablesLastMonthSum: (companyId: string) =>
    ['dashboard', 'payables', companyId, 'last-month', 'sum'] as const,

  transactionsRecent: (companyId: string, dateRange?: { start: string; end: string }) =>
    dateRange
      ? ['dashboard', 'transactions', companyId, 'recent', 'period', dateRange.start, dateRange.end] as const
      : ['dashboard', 'transactions', companyId, 'recent'] as const,

  // Chart of accounts by type
  chartAccountsExpense: (companyId: string) =>
    ['dashboard', 'chart-accounts', companyId, 'expense'] as const,

  chartAccountsIncome: (companyId: string) =>
    ['dashboard', 'chart-accounts', companyId, 'income'] as const,
} as const;

// ============================================
// TRANSACTIONS KEYS
// ============================================

export interface TransactionsFilters {
  startDate: string;
  endDate: string;
  bankAccountId?: string;
  categoryId?: string;
  type?: 'entrada' | 'saida';
  status?: 'reconciled' | 'pending';
  search?: string;
}

export const TRANSACTIONS_KEYS = {
  all: ['transactions'] as const,

  list: (companyId: string, filters?: TransactionsFilters) =>
    filters
      ? ['transactions', 'list', companyId, filters] as const
      : ['transactions', 'list', companyId] as const,

  detail: (transactionId: string) =>
    ['transactions', 'detail', transactionId] as const,

  byBankAccount: (companyId: string, bankAccountId: string) =>
    ['transactions', 'bank-account', companyId, bankAccountId] as const,
} as const;

// ============================================
// RECEIVABLES KEYS
// ============================================

export interface ReceivablesFilters {
  status?: string;
  customerId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const RECEIVABLES_KEYS = {
  all: ['receivables'] as const,

  lists: () => ['receivables', 'list'] as const,

  list: (companyId: string, filters?: ReceivablesFilters) =>
    filters
      ? ['receivables', 'list', companyId, filters] as const
      : ['receivables', 'list', companyId] as const,

  details: () => ['receivables', 'detail'] as const,

  detail: (receivableId: string) =>
    ['receivables', 'detail', receivableId] as const,

  totals: () => ['receivables', 'totals'] as const,

  totalsByCompany: (companyId: string) =>
    ['receivables', 'totals', companyId] as const,

  overdue: (companyId: string) =>
    ['receivables', 'overdue', companyId] as const,

  byMonth: (companyId: string, month: string) =>
    ['receivables', 'month', companyId, month] as const,

  byCustomer: (companyId: string, customerId: string) =>
    ['receivables', 'customer', companyId, customerId] as const,
} as const;

// ============================================
// PAYABLES KEYS
// ============================================

export interface PayablesFilters {
  status?: string;
  supplierId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const PAYABLES_KEYS = {
  all: ['payables'] as const,

  lists: () => ['payables', 'list'] as const,

  list: (companyId: string, filters?: PayablesFilters) =>
    filters
      ? ['payables', 'list', companyId, filters] as const
      : ['payables', 'list', companyId] as const,

  details: () => ['payables', 'detail'] as const,

  detail: (payableId: string) =>
    ['payables', 'detail', payableId] as const,

  totals: () => ['payables', 'totals'] as const,

  totalsByCompany: (companyId: string) =>
    ['payables', 'totals', companyId] as const,

  overdue: (companyId: string) =>
    ['payables', 'overdue', companyId] as const,

  byMonth: (companyId: string, month: string) =>
    ['payables', 'month', companyId, month] as const,

  bySupplier: (companyId: string, supplierId: string) =>
    ['payables', 'supplier', companyId, supplierId] as const,
} as const;

// ============================================
// BANK ACCOUNTS KEYS
// ============================================

export const BANK_ACCOUNTS_KEYS = {
  all: ['bank-accounts'] as const,

  list: (companyId: string, includeInactive?: boolean) =>
    includeInactive
      ? ['bank-accounts', 'list', companyId, 'all'] as const
      : ['bank-accounts', 'list', companyId, 'active'] as const,

  detail: (accountId: string) =>
    ['bank-accounts', 'detail', accountId] as const,

  withTransactions: (companyId: string) =>
    ['bank-accounts', 'with-transactions', companyId] as const,
} as const;

// ============================================
// CUSTOMERS KEYS
// ============================================

export const CUSTOMERS_KEYS = {
  all: ['customers'] as const,

  list: (companyId: string, search?: string) =>
    search
      ? ['customers', 'list', companyId, search] as const
      : ['customers', 'list', companyId] as const,

  detail: (customerId: string) =>
    ['customers', 'detail', customerId] as const,

  active: (companyId: string) =>
    ['customers', 'active', companyId] as const,
} as const;

// ============================================
// SUPPLIERS KEYS
// ============================================

export const SUPPLIERS_KEYS = {
  all: ['suppliers'] as const,

  list: (companyId: string, search?: string) =>
    search
      ? ['suppliers', 'list', companyId, search] as const
      : ['suppliers', 'list', companyId] as const,

  detail: (supplierId: string) =>
    ['suppliers', 'detail', supplierId] as const,

  active: (companyId: string) =>
    ['suppliers', 'active', companyId] as const,

  pendingStats: (companyId: string) =>
    ['suppliers', 'pending-stats', companyId] as const,
} as const;

// ============================================
// CREDITORS KEYS
// ============================================

export const CREDITORS_KEYS = {
  all: ['creditors'] as const,

  list: (companyId: string) =>
    ['creditors', 'list', companyId] as const,

  detail: (creditorId: string) =>
    ['creditors', 'detail', creditorId] as const,
} as const;

// ============================================
// CHART OF ACCOUNTS KEYS
// ============================================

export const CHART_ACCOUNTS_KEYS = {
  all: ['chart-accounts'] as const,

  list: (companyId: string) =>
    ['chart-accounts', 'list', companyId] as const,

  detail: (accountId: string) =>
    ['chart-accounts', 'detail', accountId] as const,

  byType: (companyId: string, type: string) =>
    ['chart-accounts', 'type', companyId, type] as const,

  income: (companyId: string) =>
    ['chart-accounts', 'income', companyId] as const,

  expense: (companyId: string) =>
    ['chart-accounts', 'expense', companyId] as const,
} as const;

// ============================================
// CATEGORIES KEYS
// ============================================

export const CATEGORIES_KEYS = {
  all: ['categories'] as const,

  list: (companyId: string) =>
    ['categories', 'list', companyId] as const,

  detail: (categoryId: string) =>
    ['categories', 'detail', categoryId] as const,

  byType: (companyId: string, type: string) =>
    ['categories', 'type', companyId, type] as const,

  expense: (companyId: string) =>
    ['categories', 'expense', companyId] as const,

  income: (companyId: string) =>
    ['categories', 'income', companyId] as const,
} as const;

// ============================================
// COST CENTERS KEYS
// ============================================

export const COST_CENTERS_KEYS = {
  all: ['cost-centers'] as const,

  list: (companyId: string) =>
    ['cost-centers', 'list', companyId] as const,

  detail: (costCenterId: string) =>
    ['cost-centers', 'detail', costCenterId] as const,

  active: (companyId: string) =>
    ['cost-centers', 'active', companyId] as const,
} as const;

// ============================================
// DRE KEYS
// ============================================

export const DRE_KEYS = {
  all: ['dre'] as const,

  data: (companyId: string, period: string) =>
    ['dre', 'data', companyId, period] as const,

  budget: (companyId: string, year: number, month: number) =>
    ['dre', 'budget', companyId, year, month] as const,

  notes: (companyId: string, year: number, month: number) =>
    ['dre', 'notes', companyId, year, month] as const,
} as const;

// ============================================
// CASH FLOW KEYS
// ============================================

export const CASH_FLOW_KEYS = {
  all: ['cashflow'] as const,

  projection: (companyId: string, days: number) =>
    ['cashflow', 'projection', companyId, days] as const,

  daily: (companyId: string, date: string) =>
    ['cashflow', 'daily', companyId, date] as const,

  weekly: (companyId: string, weekStart: string) =>
    ['cashflow', 'weekly', companyId, weekStart] as const,

  monthly: (companyId: string, month: string) =>
    ['cashflow', 'monthly', companyId, month] as const,
} as const;

// ============================================
// BUDGETS KEYS
// ============================================

export const BUDGETS_KEYS = {
  all: ['budgets'] as const,

  list: (companyId: string, startDate?: string, endDate?: string) =>
    ['budgets', 'list', companyId, { startDate, endDate }] as const,

  detail: (budgetId: string) =>
    ['budgets', 'detail', budgetId] as const,

  transactions: (companyId: string, minDate?: string, maxDate?: string) =>
    ['budgets', 'transactions', companyId, { minDate, maxDate }] as const,
} as const;

// ============================================
// FINANCIAL INDICATORS KEYS
// ============================================

export const FINANCIAL_INDICATORS_KEYS = {
  all: ['financial-indicators'] as const,

  indicators: (companyId: string) =>
    ['financial-indicators', 'indicators', companyId] as const,

  cashMismatch: (companyId: string) =>
    ['financial-indicators', 'cash-mismatch', companyId] as const,
} as const;

// ============================================
// USER CONTEXT KEYS
// ============================================

export const USER_CONTEXT_KEYS = {
  all: ['user-context'] as const,

  context: (userId: string) =>
    ['user-context', userId] as const,
} as const;

// ============================================
// LEGACY ALIASES (for backwards compatibility)
// TODO: Migrate all consumers to SCREAMING_SNAKE_CASE, then remove
// ============================================

/** @deprecated Use DASHBOARD_KEYS instead */
export const dashboardKeys = DASHBOARD_KEYS;
/** @deprecated Use TRANSACTIONS_KEYS instead */
export const transactionsKeys = TRANSACTIONS_KEYS;
/** @deprecated Use RECEIVABLES_KEYS instead */
export const receivablesKeys = RECEIVABLES_KEYS;
/** @deprecated Use PAYABLES_KEYS instead */
export const payablesKeys = PAYABLES_KEYS;
/** @deprecated Use BANK_ACCOUNTS_KEYS instead */
export const bankAccountsKeys = BANK_ACCOUNTS_KEYS;
/** @deprecated Use CUSTOMERS_KEYS instead */
export const customersKeys = CUSTOMERS_KEYS;
/** @deprecated Use SUPPLIERS_KEYS instead */
export const suppliersKeys = SUPPLIERS_KEYS;
/** @deprecated Use CHART_ACCOUNTS_KEYS instead */
export const chartAccountsKeys = CHART_ACCOUNTS_KEYS;
/** @deprecated Use CATEGORIES_KEYS instead */
export const categoriesKeys = CATEGORIES_KEYS;
/** @deprecated Use COST_CENTERS_KEYS instead */
export const costCentersKeys = COST_CENTERS_KEYS;
/** @deprecated Use BUDGETS_KEYS instead */
export const budgetsKeys = BUDGETS_KEYS;
/** @deprecated Use DRE_KEYS instead */
export const dreKeys = DRE_KEYS;
/** @deprecated Use CASH_FLOW_KEYS instead */
export const cashFlowKeys = CASH_FLOW_KEYS;
/** @deprecated Use CREDITORS_KEYS instead */
export const creditorsKeys = CREDITORS_KEYS;

// ============================================
// UNIFIED QUERY KEYS FACADE
// ============================================

/**
 * Unified query keys object for ergonomic access.
 *
 * Usage: queryKeys.payables.list(companyId)
 *
 * This is a pure facade over the existing *_KEYS exports.
 * Both forms produce identical keys — use whichever you prefer.
 */
export const queryKeys = {
  dashboard: DASHBOARD_KEYS,
  transactions: TRANSACTIONS_KEYS,
  receivables: RECEIVABLES_KEYS,
  payables: PAYABLES_KEYS,
  bankAccounts: BANK_ACCOUNTS_KEYS,
  customers: CUSTOMERS_KEYS,
  suppliers: SUPPLIERS_KEYS,
  creditors: CREDITORS_KEYS,
  chartAccounts: CHART_ACCOUNTS_KEYS,
  categories: CATEGORIES_KEYS,
  costCenters: COST_CENTERS_KEYS,
  dre: DRE_KEYS,
  cashFlow: CASH_FLOW_KEYS,
  budgets: BUDGETS_KEYS,
  financialIndicators: FINANCIAL_INDICATORS_KEYS,
  user: USER_CONTEXT_KEYS,
} as const;
