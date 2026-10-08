/**
 * API response types and filter interfaces.
 * Used for consistent typing of API calls and query parameters.
 */

// ============================================
// GENERIC RESPONSE TYPES
// ============================================

/**
 * Generic API response wrapper for single item responses.
 */
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Paginated response for list queries.
 */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Mutation result for create/update/delete operations.
 */
export interface MutationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// FILTER TYPES
// ============================================

/**
 * Base filter interface for list queries.
 */
export interface BaseFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Transaction-specific filters.
 */
export interface TransactionFilters extends BaseFilters {
  type?: 'entrada' | 'saida';
  bankAccountId?: string;
  chartAccountId?: string;
  costCenterId?: string;
  customerId?: string;
  supplierId?: string;
  reconciled?: boolean;
  paymentMethod?: string;
}

/**
 * Payable-specific filters.
 */
export interface PayableFilters extends BaseFilters {
  supplierId?: string;
  chartAccountId?: string;
  costCenterId?: string;
  status?: 'pendente' | 'parcial' | 'pago' | 'cancelado' | 'all';
}

/**
 * Receivable-specific filters.
 */
export interface ReceivableFilters extends BaseFilters {
  customerId?: string;
  chartAccountId?: string;
  costCenterId?: string;
  status?: 'pendente' | 'parcial' | 'pago' | 'cancelado' | 'all';
}

/**
 * Customer/Supplier-specific filters.
 */
export interface EntityFilters extends BaseFilters {
  isActive?: boolean;
  category?: string;
}

/**
 * Bank account filters.
 */
export interface BankAccountFilters extends BaseFilters {
  accountType?: 'corrente' | 'poupanca' | 'investimento' | 'caixa';
  isActive?: boolean;
}

/**
 * Chart of accounts filters.
 */
export interface ChartAccountFilters extends BaseFilters {
  type?: 'receita' | 'despesa' | 'ativo' | 'passivo' | 'patrimonio';
  dreCategory?: string;
  isActive?: boolean;
  parentId?: string;
}

// ============================================
// QUERY RESULT TYPES
// ============================================

/**
 * Common query result structure from React Query.
 */
export interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Mutation result structure from React Query.
 */
export interface MutationState {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
}

// ============================================
// SUPABASE QUERY HELPERS
// ============================================

/**
 * Type for Supabase query with relations (joins).
 * Use when you need to type queries with select().
 */
export type QueryWithRelations<
  TTable,
  TRelations extends Record<string, unknown> = Record<string, never>
> = TTable & TRelations;

/**
 * Type for handling nullable relations from Supabase.
 */
export type RelationData<T> = T | null;

// ============================================
// SORT TYPES
// ============================================

export type SortOrder = 'asc' | 'desc';

export interface SortConfig<TField extends string = string> {
  field: TField;
  order: SortOrder;
}

// ============================================
// BULK OPERATION TYPES
// ============================================

export interface BulkOperationResult {
  successful: string[];
  failed: Array<{
    id: string;
    error: string;
  }>;
  totalProcessed: number;
}
