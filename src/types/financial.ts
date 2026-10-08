/**
 * Financial entity types
 * Types for transactions, payables, receivables, and related entities
 */

import type {
  PayableStatus,
  ReceivableStatus,
  TransactionType,
  PaymentMethod,
  BankAccountType,
  AccountEntryType
} from './common';

// ============================================
// TRANSACTION TYPES
// ============================================

export interface Transaction {
  id: string;
  company_id: string;
  bank_account_id: string;
  chart_account_id: string | null;
  customer_id: string | null;
  supplier_id: string | null;
  cost_center_id: string | null;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  description: string;
  document_number: string | null;
  notes: string | null;
  payment_method: string | null;
  reconciled: boolean;
  reconciled_at: string | null;
  reconciled_by: string | null;
  original_transaction_date: string | null;
  original_created_at: string | null;
  bank_statement_ref: string | null;
  recurrence: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithRelations extends Transaction {
  bank_account?: { name: string } | null;
  chart_account?: { name: string; code: string } | null;
  customer?: { name: string } | null;
  supplier?: { name: string } | null;
  cost_center?: { name: string; code: string } | null;
}

// ============================================
// PAYABLE TYPES
// ============================================

export interface Payable {
  id: string;
  company_id: string;
  supplier_id: string;
  chart_account_id: string | null;
  cost_center_id: string | null;
  description: string;
  document_number: string | null;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: PayableStatus;
  installment_number: number | null;
  total_installments: number | null;
  parent_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayableWithRelations extends Payable {
  supplier?: { name: string } | null;
  chart_account?: { name: string; code: string } | null;
  cost_center?: { name: string; code: string } | null;
}

// ============================================
// RECEIVABLE TYPES
// ============================================

export interface Receivable {
  id: string;
  company_id: string;
  customer_id: string;
  chart_account_id: string | null;
  description: string;
  document_number: string | null;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: ReceivableStatus;
  installment_number: number;
  total_installments: number;
  notes: string | null;
}

export interface ReceivableWithRelations extends Receivable {
  customer?: { name: string } | null;
  chart_account?: { name: string; code: string } | null;
}

// ============================================
// PAYMENT RECORD TYPES
// ============================================

export interface PaymentRecord {
  id: string;
  receivable_id: string | null;
  payable_id: string | null;
  bank_account_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
}

// ============================================
// BANK ACCOUNT TYPES
// ============================================

export interface BankAccount {
  id: string;
  company_id: string;
  name: string;
  bank_name: string | null;
  agency: string | null;
  account_number: string | null;
  account_type: BankAccountType;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// CHART OF ACCOUNTS TYPES
// ============================================

export interface ChartAccount {
  id: string;
  company_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  type: AccountEntryType;
  cost_type: 'fixed' | 'variable';
  dre_category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// COST CENTER TYPES
// ============================================

export interface CostCenter {
  id: string;
  company_id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// CUSTOMER & SUPPLIER TYPES
// ============================================

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// CASH FLOW TYPES
// ============================================

export interface DetailedTransaction {
  id: string;
  date: string;
  description: string;
  category: string | null;
  categoryCode: string | null;
  type: TransactionType;
  amount: number;
  source: 'transaction' | 'receivable_payment' | 'payable_payment' | 'projected_receivable' | 'projected_payable';
  isProjected: boolean;
}

export interface DailyDetail {
  date: string;
  transactions: DetailedTransaction[];
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

export interface WeeklyData {
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  saldoInicial: number;
  entradas: number;
  saidas: number;
  saldoFinal: number;
  days: DailyDetail[];
}

export interface MonthlyCategory {
  code: string;
  name: string;
  total: number;
  transactions: DetailedTransaction[];
}

export interface MonthlyData {
  saldoInicial: number;
  entradas: number;
  saidas: number;
  saldoOperacional: number;
  saldoFinal: number;
  entradasByCategory: MonthlyCategory[];
  saidasByCategory: MonthlyCategory[];
}

// ============================================
// STATISTICS TYPES
// ============================================

export interface FinancialStats {
  total: number;
  pending: number;
  overdue: number;
  paid: number;
  count: number;
}

export interface PayableStats extends FinancialStats {
  overdueCount: number;
}

export interface ReceivableStats extends FinancialStats {
  overdueCount: number;
}

// ============================================
// FILTER TYPES
// ============================================

export type AccountStatusTab = 'open' | 'paid' | 'overdue';
export type DateFilterType = 'due' | 'issue' | 'payment';
