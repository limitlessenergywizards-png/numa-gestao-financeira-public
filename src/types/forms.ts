/**
 * Form data types for all forms in the application.
 * Centralized to ensure consistency across create/edit dialogs.
 */

import type {
  TransactionType,
  PaymentMethod,
  BankAccountType,
  AccountEntryType
} from './common';

// ============================================
// TRANSACTION FORMS
// ============================================

export interface TransactionFormData {
  type: TransactionType;
  bank_account_id: string;
  chart_account_id: string;
  customer_id: string;
  supplier_id: string;
  cost_center_id: string;
  amount: string;
  transaction_date: string;
  description: string;
  document_number: string;
  notes: string;
  recurrence: string;
  payment_method: string;
}

export const emptyTransactionFormData: TransactionFormData = {
  type: 'entrada',
  bank_account_id: '',
  chart_account_id: '',
  customer_id: '',
  supplier_id: '',
  cost_center_id: '',
  amount: '',
  transaction_date: new Date().toISOString().split('T')[0],
  description: '',
  document_number: '',
  notes: '',
  recurrence: '',
  payment_method: 'pix',
};

// ============================================
// PAYABLE FORMS
// ============================================

export interface PayableFormData {
  supplier_id: string;
  chart_account_id: string;
  cost_center_id: string;
  description: string;
  document_number: string;
  issue_date: string;
  due_date: string;
  total_amount: string;
  notes: string;
}

export const emptyPayableFormData: PayableFormData = {
  supplier_id: '',
  chart_account_id: '',
  cost_center_id: '',
  description: '',
  document_number: '',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '',
  total_amount: '',
  notes: '',
};

// ============================================
// RECEIVABLE FORMS
// ============================================

export interface ReceivableFormData {
  customer_id: string;
  chart_account_id: string;
  cost_center_id: string;
  description: string;
  document_number: string;
  issue_date: string;
  due_date: string;
  total_amount: string;
  total_installments: number;
  notes: string;
}

export const emptyReceivableFormData: ReceivableFormData = {
  customer_id: '',
  chart_account_id: '',
  cost_center_id: '',
  description: '',
  document_number: '',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '',
  total_amount: '',
  total_installments: 1,
  notes: '',
};

// ============================================
// PAYMENT FORMS
// ============================================

export interface PaymentFormData {
  amount: string;
  payment_date: string;
  bank_account_id: string;
  payment_method: PaymentMethod;
  notes: string;
}

export const emptyPaymentFormData: PaymentFormData = {
  amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  bank_account_id: '',
  payment_method: 'pix',
  notes: '',
};

// ============================================
// ENTITY FORMS
// ============================================

export interface CustomerFormData {
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes: string;
}

export const emptyCustomerFormData: CustomerFormData = {
  name: '',
  document: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  notes: '',
};

export interface SupplierFormData extends CustomerFormData {
  category: string;
}

export const emptySupplierFormData: SupplierFormData = {
  ...emptyCustomerFormData,
  category: '',
};

// ============================================
// BANK ACCOUNT FORMS
// ============================================

export interface BankAccountFormData {
  name: string;
  bank_name: string;
  agency: string;
  account_number: string;
  account_type: BankAccountType;
  initial_balance: string;
}

export const emptyBankAccountFormData: BankAccountFormData = {
  name: '',
  bank_name: '',
  agency: '',
  account_number: '',
  account_type: 'corrente',
  initial_balance: '0',
};

// ============================================
// CHART OF ACCOUNTS FORMS
// ============================================

export interface ChartAccountFormData {
  parent_id: string;
  code: string;
  name: string;
  type: AccountEntryType;
  dre_category: string;
}

export const emptyChartAccountFormData: ChartAccountFormData = {
  parent_id: '',
  code: '',
  name: '',
  type: 'receita',
  dre_category: '',
};

// ============================================
// COMPANY FORMS
// ============================================

export interface CompanyFormData {
  name: string;
  trading_name: string;
  document: string;
  email: string;
  phone: string;
  mobile_phone: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  logo_url: string | null;
}

export const emptyCompanyFormData: CompanyFormData = {
  name: '',
  trading_name: '',
  document: '',
  email: '',
  phone: '',
  mobile_phone: '',
  address: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zip_code: '',
  logo_url: null,
};

// ============================================
// COST CENTER FORMS
// ============================================

export interface CostCenterFormData {
  code: string;
  name: string;
  description: string;
  color: string;
}

export const emptyCostCenterFormData: CostCenterFormData = {
  code: '',
  name: '',
  description: '',
  color: '#C5A059',
};

// ============================================
// CATEGORY FORMS
// ============================================

export interface CategoryFormData {
  name: string;
  type: 'receita' | 'despesa';
  color: string;
  icon: string;
}

export const emptyCategoryFormData: CategoryFormData = {
  name: '',
  type: 'receita',
  color: '#6366f1',
  icon: 'tag',
};
