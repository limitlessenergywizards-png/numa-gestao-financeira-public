/**
 * Centralized constants for the application
 * Use SCREAMING_SNAKE_CASE for all constants
 */

import type { PayableStatus, ReceivableStatus, PaymentMethod } from '@/types';

// ============================================
// STATUS LABELS & COLORS
// ============================================

export const STATUS_LABELS: Record<PayableStatus | ReceivableStatus, string> = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  pago: 'Pago',
  cancelado: 'Cancelado',
} as const;

export const STATUS_COLORS: Record<PayableStatus | ReceivableStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  parcial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pago: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelado: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400',
} as const;

// ============================================
// PAYMENT METHOD LABELS & COLORS
// ============================================

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  transferencia: 'Transferência',
  boleto: 'Boleto',
  cartao: 'Cartão',
  cartao_debito: 'Débito',
  cartao_credito: 'Crédito',
  cheque: 'Cheque',
} as const;

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  pix: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cartao: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  cartao_debito: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  cartao_credito: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  boleto: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  transferencia: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  dinheiro: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cheque: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400',
} as const;

// ============================================
// TRANSACTION TYPE LABELS
// ============================================

export const TRANSACTION_TYPE_LABELS = {
  entrada: 'Entrada',
  saida: 'Saída',
} as const;

// ============================================
// BANK ACCOUNT TYPE LABELS
// ============================================

export const BANK_ACCOUNT_TYPE_LABELS = {
  corrente: 'Conta Corrente',
  poupanca: 'Poupança',
  investimento: 'Investimento',
  caixa: 'Caixa',
} as const;

// ============================================
// DRE CATEGORY LABELS
// ============================================

export const DRE_CATEGORY_LABELS = {
  receita_bruta: 'Receita Bruta',
  deducoes: 'Deduções',
  receita_liquida: 'Receita Líquida',
  custos: 'Custos',
  lucro_bruto: 'Lucro Bruto',
  despesas_operacionais: 'Despesas Operacionais',
  despesas_administrativas: 'Despesas Administrativas',
  despesas_comerciais: 'Despesas Comerciais',
  resultado_operacional: 'Resultado Operacional',
  resultado_financeiro: 'Resultado Financeiro',
  resultado_antes_ir: 'Resultado Antes IR',
  impostos: 'Impostos',
  lucro_liquido: 'Lucro Líquido',
} as const;

// ============================================
// DATE FORMAT CONSTANTS
// ============================================

export const DATE_FORMATS = {
  display: 'dd/MM/yyyy',
  displayShort: 'dd/MM',
  displayWithTime: 'dd/MM/yyyy HH:mm',
  api: 'yyyy-MM-dd',
  monthYear: 'MMMM yyyy',
  weekday: 'EEEE',
} as const;

// ============================================
// PAGINATION DEFAULTS
// ============================================

export const PAGINATION_DEFAULTS = {
  pageSize: 50,
  pageSizeOptions: [10, 25, 50, 100] as const,
} as const;

// ============================================
// EMPTY FORM DATA TEMPLATES
// ============================================

export const EMPTY_TRANSACTION_FORM = {
  type: 'saida' as const,
  description: '',
  amount: '',
  transaction_date: new Date().toISOString().split('T')[0],
  bank_account_id: '',
  chart_account_id: '',
  customer_id: '',
  supplier_id: '',
  cost_center_id: '',
  document_number: '',
  notes: '',
  payment_method: 'pix' as const,
} as const;

export const EMPTY_PAYABLE_FORM = {
  supplier_id: '',
  chart_account_id: '',
  cost_center_id: '',
  description: '',
  document_number: '',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '',
  total_amount: '',
  notes: '',
  installments: 1,
} as const;

export const EMPTY_RECEIVABLE_FORM = {
  customer_id: '',
  chart_account_id: '',
  description: '',
  document_number: '',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '',
  total_amount: '',
  notes: '',
  installments: 1,
} as const;

// ============================================
// QUICK FILTER LABELS
// ============================================

export const QUICK_FILTER_LABELS = {
  today: 'Hoje',
  week: 'Esta Semana',
  month: 'Este Mês',
} as const;
 
 // ============================================
 // ACCOUNT FILTER LABELS
 // ============================================
 
 export const STATUS_TAB_LABELS = {
   open: 'Em Aberto',
   paid: 'Pagos',
   overdue: 'Vencidos',
 } as const;
 
 export const DATE_TYPE_LABELS = {
   due: 'Vencimento',
   issue: 'Emissão',
   payment: 'Pagamento',
 } as const;

// ============================================
// ROLE LABELS
// ============================================

export const ROLE_LABELS = {
  admin: 'Administrador',
  editor: 'Gerente',
  viewer: 'Visualizador',
} as const;

// ============================================
// CHART OF ACCOUNTS TYPE LABELS & COLORS
// ============================================

export const CHART_ACCOUNT_TYPE_LABELS = {
  receita: 'Receita',
  despesa: 'Despesa',
  custo: 'Custo',
} as const;

export const CHART_ACCOUNT_TYPE_COLORS = {
  receita: 'bg-success/10 text-success border-success/20',
  despesa: 'bg-destructive/10 text-destructive border-destructive/20',
  custo: 'bg-warning/10 text-warning border-warning/20',
} as const;

// ============================================
// AUDIT FIELD LABELS
// ============================================

export const AUDIT_FIELD_LABELS = {
  amount: 'Valor',
  description: 'Descrição',
  transaction_date: 'Data',
  payment_method: 'Forma de Pagamento',
  bank_account_id: 'Conta Bancária',
  chart_account_id: 'Categoria',
  notes: 'Observações',
  document_number: 'Documento',
  reconciled: 'Conciliado',
  type: 'Tipo',
} as const;

// ============================================
// TRANSACTION PAYMENT METHOD WITH ICONS
// ============================================

export const PAYMENT_METHOD_WITH_ICONS = {
  dinheiro: { label: 'Dinheiro', icon: 'Banknote' },
  pix: { label: 'PIX', icon: 'Zap' },
  cartao_debito: { label: 'Débito', icon: 'CreditCard' },
  cartao_credito: { label: 'Crédito', icon: 'CreditCard' },
  boleto: { label: 'Boleto', icon: 'Receipt' },
  transferencia: { label: 'Transf.', icon: 'Wallet' },
} as const;

// ============================================
// AUTH TIMEOUTS
// ============================================

/** Maximum time to wait for auth/user context before showing timeout UI */
export const AUTH_LOADING_TIMEOUT_MS = 8_000;

// ============================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================

export { APP_CONFIG, TIMING, PAGINATION, CACHE, UPLOAD, VALIDATION, FEATURES } from './config';
export { ROUTES, PUBLIC_ROUTES, MAIN_ROUTES, REPORT_ROUTES, SETTINGS_ROUTES, ADMIN_ROUTES } from './routes';
export { GLASS_STYLES, BUTTON_STYLES, CARD_STYLES, INPUT_STYLES, LAYOUT_STYLES, ANIMATION_STYLES, STATUS_STYLES } from './styles';
