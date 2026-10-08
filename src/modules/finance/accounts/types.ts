import { format } from "date-fns";
import type { PayableStatus, ReceivableStatus, PaymentMethod } from "@/types";

// Discriminator for account type
export type AccountType = 'payable' | 'receivable';

// Form data interfaces (used for both create and edit)
export interface AccountFormData {
  entity_id: string; // supplier_id or customer_id
  chart_account_id: string;
  description: string;
  document_number: string;
  issue_date: string;
  due_date: string;
  total_amount: string;
  total_installments: string;
  notes: string;
}

export interface PaymentFormData {
  amount: string;
  payment_date: string;
  bank_account_id: string;
  payment_method: PaymentMethod;
  notes: string;
}

// Stats interface
export interface AccountStats {
  total: number;
  paidOrReceived: number;
  pendingAmount: number;
  overdueAmount: number;
  overdueCount: number;
  totalCount: number;
  paidCount: number;
  pendingCount: number;
}

// Export column definition
export interface ExportColumn {
  key: string;
  header: string;
}

// Base account interface (common fields between Payable and Receivable)
export interface BaseAccount {
  id: string;
  company_id: string;
  description: string;
  document_number: string | null;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  installment_number: number | null;
  total_installments: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  chart_account?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

// Entity (supplier or customer) minimal interface
export interface AccountEntity {
  id: string;
  name: string;
}

// Bank account minimal interface for selects
export interface BankAccountOption {
  id: string;
  name: string;
  current_balance: number;
}

// Chart account minimal interface for selects
export interface ChartAccountOption {
  id: string;
  code: string;
  name: string;
}

// Filter state interface
export interface AccountFilterState {
  statusTab: 'open' | 'paid' | 'overdue';
  dateType: 'due' | 'issue' | 'payment';
  entityFilter: string;
  searchTerm: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

// Config for account type-specific labels and colors
export interface AccountTypeConfig {
  type: AccountType;
  title: string;
  subtitle: string;
  icon: 'payable' | 'receivable';
  entityLabel: string; // "Fornecedor" or "Cliente"
  entityLabelPlural: string;
  paidLabel: string; // "Pago" or "Recebido"
  paymentActionLabel: string; // "Registrar Pagamento" or "Registrar Recebimento"
  paymentDialogTitle: string;
  primaryColor: string; // "sky" for payables, "teal" for receivables
  exportFilename: string;
}

// Payables specific config
export const PAYABLES_CONFIG: AccountTypeConfig = {
  type: 'payable',
  title: 'Contas a Pagar',
  subtitle: 'Gerencie suas despesas e pagamentos',
  icon: 'payable',
  entityLabel: 'Fornecedor',
  entityLabelPlural: 'Fornecedores',
  paidLabel: 'Pago',
  paymentActionLabel: 'Registrar Pagamento',
  paymentDialogTitle: 'Registrar Pagamento',
  primaryColor: 'sky',
  exportFilename: 'contas-a-pagar',
};

// Receivables specific config
export const RECEIVABLES_CONFIG: AccountTypeConfig = {
  type: 'receivable',
  title: 'Contas a Receber',
  subtitle: 'Gerencie seus recebíveis e registre recebimentos',
  icon: 'receivable',
  entityLabel: 'Cliente',
  entityLabelPlural: 'Clientes',
  paidLabel: 'Recebido',
  paymentActionLabel: 'Registrar Recebimento',
  paymentDialogTitle: 'Registrar Recebimento',
  primaryColor: 'teal',
  exportFilename: 'contas-a-receber',
};

// Empty form data helpers
export const getEmptyFormData = (): AccountFormData => ({
  entity_id: '',
  chart_account_id: '',
  description: '',
  document_number: '',
  issue_date: format(new Date(), 'yyyy-MM-dd'),
  due_date: format(new Date(), 'yyyy-MM-dd'),
  total_amount: '',
  total_installments: '1',
  notes: '',
});

export const getEmptyPaymentFormData = (): PaymentFormData => ({
  amount: '',
  payment_date: format(new Date(), 'yyyy-MM-dd'),
  bank_account_id: '',
  payment_method: 'pix',
  notes: '',
});

// Overdue days calculation
export const getOverdueDays = (
  dueDate: string,
  status: PayableStatus | ReceivableStatus
): number => {
  if (status === 'pago' || status === 'cancelado') return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (today > due) {
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 0;
};
