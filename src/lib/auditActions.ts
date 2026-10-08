// Audit action constants and labels for semantic actions

export const AUDIT_ACTIONS = {
  // Basic actions (from trigger)
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  
  // Semantic actions (for use in code)
  RECONCILED: 'reconciled',
  PAYMENT_RECORDED: 'payment_recorded',
  STATUS_CHANGED: 'status_changed',
  DATE_CHANGED: 'date_changed',
} as const;

export const ACTION_LABELS: Record<string, string> = {
  INSERT: 'criou este registro',
  UPDATE: 'alterou',
  DELETE: 'excluiu este registro',
  reconciled: 'marcou como conciliado',
  payment_recorded: 'registrou pagamento',
  status_changed: 'alterou o status',
  date_changed: 'alterou a data',
};

export const ACTION_ICONS: Record<string, string> = {
  INSERT: '🟢',
  UPDATE: '🔵',
  DELETE: '🔴',
  reconciled: '✅',
  payment_recorded: '💰',
  status_changed: '🟡',
  date_changed: '📅',
};

export const ACTION_COLORS: Record<string, string> = {
  INSERT: 'bg-success/10 text-success',
  UPDATE: 'bg-blue-500/10 text-blue-500',
  DELETE: 'bg-destructive/10 text-destructive',
  reconciled: 'bg-success/10 text-success',
  payment_recorded: 'bg-amber-500/10 text-amber-500',
  status_changed: 'bg-yellow-500/10 text-yellow-500',
  date_changed: 'bg-purple-500/10 text-purple-500',
};

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}

export function getActionIcon(action: string): string {
  return ACTION_ICONS[action] || '📝';
}

export function getActionColor(action: string): string {
  return ACTION_COLORS[action] || 'bg-muted text-muted-foreground';
}

// Field labels for better readability
export const FIELD_LABELS: Record<string, string> = {
  amount: 'Valor',
  description: 'Descrição',
  transaction_date: 'Data da Transação',
  payment_method: 'Forma de Pagamento',
  reconciled: 'Conciliado',
  reconciled_at: 'Data de Conciliação',
  notes: 'Observações',
  type: 'Tipo',
  status: 'Status',
  due_date: 'Data de Vencimento',
  paid_amount: 'Valor Pago',
  total_amount: 'Valor Total',
  bank_account_id: 'Conta Bancária',
  chart_account_id: 'Categoria',
  customer_id: 'Cliente',
  supplier_id: 'Fornecedor',
  document_number: 'Nº Documento',
  original_transaction_date: 'Data Original',
};

export function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field;
}
