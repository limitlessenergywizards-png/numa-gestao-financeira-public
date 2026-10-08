/**
 * CashFlow specific types for cash flow projections and analysis.
 */

import type { PaymentMethod, TransactionType } from './common';

// ============================================
// PAYMENT RECORD RELATIONS
// ============================================

/**
 * Customer relation for payment records.
 */
export interface PaymentCustomerRelation {
  id: string;
  name: string;
}

/**
 * Supplier relation for payment records.
 */
export interface PaymentSupplierRelation {
  id: string;
  name: string;
}

/**
 * Chart account relation for payment records.
 */
export interface PaymentChartAccountRelation {
  id: string;
  name: string;
  code: string;
}

/**
 * Receivable relation in payment record.
 */
export interface PaymentReceivableRelation {
  id: string;
  company_id: string;
  description: string;
  customer: PaymentCustomerRelation | null;
  chart_of_accounts: PaymentChartAccountRelation | null;
}

/**
 * Payable relation in payment record.
 */
export interface PaymentPayableRelation {
  id: string;
  company_id: string;
  description: string;
  supplier: PaymentSupplierRelation | null;
  chart_of_accounts: PaymentChartAccountRelation | null;
}

/**
 * Complete payment record with all relations.
 */
export interface PaymentRecordWithRelations {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  notes: string | null;
  receivable_id: string | null;
  payable_id: string | null;
  bank_account_id: string;
  created_at: string;
  receivable: PaymentReceivableRelation | null;
  payable: PaymentPayableRelation | null;
}

// ============================================
// CASH FLOW TRANSACTION TYPES
// ============================================

/**
 * Detailed transaction for cash flow views.
 */
export interface CashFlowTransaction {
  id: string;
  date: string;
  description: string;
  category: string | null;
  categoryCode: string | null;
  type: TransactionType;
  amount: number;
  source: CashFlowSource;
  isProjected: boolean;
  entityName?: string;
  paymentMethod?: PaymentMethod;
}

/**
 * Source of a cash flow transaction.
 */
export type CashFlowSource =
  | 'transaction'
  | 'receivable_payment'
  | 'payable_payment'
  | 'projected_receivable'
  | 'projected_payable';

// ============================================
// DAILY/WEEKLY/MONTHLY STRUCTURES
// ============================================

/**
 * Daily cash flow detail.
 */
export interface CashFlowDailyDetail {
  date: string;
  transactions: CashFlowTransaction[];
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

/**
 * Weekly cash flow summary.
 */
export interface CashFlowWeeklyData {
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  saldoInicial: number;
  entradas: number;
  saidas: number;
  saldoFinal: number;
  days: CashFlowDailyDetail[];
}

/**
 * Category breakdown for monthly view.
 */
export interface CashFlowMonthlyCategory {
  code: string;
  name: string;
  total: number;
  transactions: CashFlowTransaction[];
}

/**
 * Monthly cash flow summary.
 */
export interface CashFlowMonthlyData {
  saldoInicial: number;
  entradas: number;
  saidas: number;
  saldoOperacional: number;
  saldoFinal: number;
  entradasByCategory: CashFlowMonthlyCategory[];
  saidasByCategory: CashFlowMonthlyCategory[];
}

// ============================================
// MATRIX VIEW TYPES
// ============================================

/**
 * Week column for matrix view.
 */
export interface CashFlowMatrixWeekColumn {
  weekNumber: number;
  weekLabel: string;
  dateRange: string;
  startDate: string;
  endDate: string;
}

/**
 * Category data for matrix view.
 */
export interface CashFlowMatrixCategoryData {
  code: string;
  name: string;
  values: Record<number, number>;
  total: number;
}

/**
 * Group data for matrix view.
 */
export interface CashFlowMatrixGroupData {
  groupName: string;
  type: TransactionType;
  categories: CashFlowMatrixCategoryData[];
  totals: Record<number, number>;
  grandTotal: number;
}

// ============================================
// PROJECTION TYPES
// ============================================

/**
 * Cash flow projection point.
 */
export interface CashFlowProjectionPoint {
  date: string;
  projected: number;
  actual?: number;
  saldoProjetado: number;
  saldoReal?: number;
}

/**
 * Projection scenario.
 */
export interface CashFlowScenario {
  id: string;
  name: string;
  description?: string;
  adjustmentPercentage: number;
  projectionData: CashFlowProjectionPoint[];
}

/**
 * Alert for cash flow issues.
 */
export interface CashFlowAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  date?: string;
  amount?: number;
}

// ============================================
// BANK ACCOUNT SUMMARY
// ============================================

/**
 * Bank account with balance for cash flow.
 */
export interface CashFlowBankAccount {
  id: string;
  name: string;
  bankName: string | null;
  currentBalance: number;
  projectedBalance?: number;
}

/**
 * Combined bank balances summary.
 */
export interface CashFlowBalanceSummary {
  totalCurrentBalance: number;
  totalProjectedBalance: number;
  accounts: CashFlowBankAccount[];
}

// ============================================
// RECEIVABLE/PAYABLE PROJECTIONS
// ============================================

/**
 * Projected receivable for cash flow.
 */
export interface ProjectedReceivable {
  id: string;
  dueDate: string;
  expectedAmount: number;
  customerId: string;
  customerName: string;
  description: string;
  probability: number;
}

/**
 * Projected payable for cash flow.
 */
export interface ProjectedPayable {
  id: string;
  dueDate: string;
  expectedAmount: number;
  supplierId: string;
  supplierName: string;
  description: string;
  isRecurring: boolean;
}
