/**
 * Common types used across the application
 * These types represent shared domain concepts
 */

// ============================================
// STATUS TYPES
// ============================================

export type PayableStatus = 'pendente' | 'parcial' | 'pago' | 'cancelado';
export type ReceivableStatus = 'pendente' | 'parcial' | 'pago' | 'cancelado';
export type TransactionType = 'entrada' | 'saida';

// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentMethod =
  | 'dinheiro'
  | 'pix'
  | 'transferencia'
  | 'boleto'
  | 'cartao'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'cheque';

// ============================================
// BANK ACCOUNT TYPES
// ============================================

export type BankAccountType = 'corrente' | 'poupanca' | 'investimento' | 'caixa';

// ============================================
// USER ROLE TYPES
// ============================================

export type AppRole = 'admin' | 'editor' | 'viewer';

// ============================================
// CHART OF ACCOUNTS TYPES
// ============================================

export type AccountEntryType = 'receita' | 'despesa' | 'custo' | 'ativo' | 'passivo' | 'patrimonio';

// DRE-specific account types (subset used in chart_of_accounts table)
export type DREAccountType = 'receita' | 'despesa' | 'custo';

// ============================================
// DRE CATEGORIES
// ============================================

export type DRECategory = 
  | 'receita_bruta'
  | 'deducoes'
  | 'receita_liquida'
  | 'custos'
  | 'lucro_bruto'
  | 'despesas_operacionais'
  | 'despesas_administrativas'
  | 'despesas_comerciais'
  | 'resultado_operacional'
  | 'resultado_financeiro'
  | 'resultado_antes_ir'
  | 'impostos'
  | 'lucro_liquido';

// ============================================
// FILTER TYPES
// ============================================

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// ============================================
// SORT TYPES
// ============================================

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T = string> {
  field: T;
  direction: SortDirection;
}
