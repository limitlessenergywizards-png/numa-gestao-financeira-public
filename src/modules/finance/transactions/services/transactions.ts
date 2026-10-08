/**
 * Transactions API Service
 * 
 * All Supabase operations for the transactions table.
 */

import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError } from '@/lib/handleError';
import type { TransactionType } from '@/types/common';

// ============================================
// TYPES
// ============================================

export interface TransactionRow {
  id: string;
  company_id: string;
  bank_account_id: string;
  chart_account_id: string | null;
  customer_id: string | null;
  supplier_id: string | null;
  cost_center_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  transaction_date: string;
  document_number: string | null;
  notes: string | null;
  payment_method: string | null;
  reconciled: boolean;
  reconciled_at: string | null;
  reconciled_by: string | null;
  original_transaction_date: string | null;
  original_created_at: string | null;
  created_at: string;
  bank_account?: { name: string };
  chart_account?: { name: string; code: string } | null;
  customer?: { name: string } | null;
  supplier?: { name: string } | null;
}

export interface TransactionFilters {
  startDate: string;
  endDate: string;
  type?: TransactionType;
  reconciled?: boolean;
  bankAccountId?: string;
  chartAccountId?: string;
}

export interface CreateTransactionPayload {
  company_id: string;
  bank_account_id: string;
  chart_account_id?: string | null;
  customer_id?: string | null;
  supplier_id?: string | null;
  cost_center_id?: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  transaction_date: string;
  payment_method: string;
  document_number?: string | null;
  notes?: string | null;
}

export interface UpdateTransactionPayload {
  bank_account_id?: string;
  chart_account_id?: string | null;
  customer_id?: string | null;
  supplier_id?: string | null;
  cost_center_id?: string | null;
  type?: TransactionType;
  amount?: number;
  description?: string;
  transaction_date?: string;
  payment_method?: string;
  document_number?: string | null;
  notes?: string | null;
}

// ============================================
// QUERY FUNCTIONS
// ============================================

const TRANSACTION_SELECT = `
  id,
  company_id,
  bank_account_id,
  chart_account_id,
  customer_id,
  supplier_id,
  cost_center_id,
  type,
  amount,
  description,
  transaction_date,
  document_number,
  notes,
  payment_method,
  reconciled,
  reconciled_at,
  reconciled_by,
  original_transaction_date,
  original_created_at,
  created_at,
  bank_account:bank_accounts(name),
  chart_account:chart_of_accounts(name, code),
  customer:customers(name),
  supplier:suppliers(name)
`;

export async function fetchTransactions(
  companyId: string,
  filters: TransactionFilters
): Promise<TransactionRow[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(TRANSACTION_SELECT)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .gte('transaction_date', filters.startDate)
    .lte('transaction_date', filters.endDate)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);

  return (data || []).map(t => ({
    ...t,
    reconciled: t.reconciled ?? false,
    reconciled_at: t.reconciled_at ?? null,
  })) as TransactionRow[];
}

export async function fetchTransactionById(id: string, companyId: string): Promise<TransactionRow | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select(TRANSACTION_SELECT)
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) handleSupabaseError(error);
  return data as TransactionRow | null;
}

// ============================================
// MUTATION FUNCTIONS
// ============================================

export async function createTransaction(
  payload: CreateTransactionPayload
): Promise<TransactionRow> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data as TransactionRow;
}

export async function updateTransaction(
  id: string,
  companyId: string,
  payload: UpdateTransactionPayload
): Promise<TransactionRow> {
  const { data, error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data as TransactionRow;
}

// AUDIT FIX: Soft delete (never hard-delete financial records)
export async function deleteTransaction(id: string, companyId: string, userId?: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId || null,
    })
    .eq('id', id)
    .eq('company_id', companyId);

  if (error) handleSupabaseError(error);
}

export async function reconcileTransaction(
  id: string,
  companyId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({
      reconciled: true,
      reconciled_at: new Date().toISOString(),
      reconciled_by: userId,
    })
    .eq('id', id)
    .eq('company_id', companyId);

  if (error) handleSupabaseError(error);
}

export async function unreconcileTransaction(id: string, companyId: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({
      reconciled: false,
      reconciled_at: null,
      reconciled_by: null,
    })
    .eq('id', id)
    .eq('company_id', companyId);

  if (error) handleSupabaseError(error);
}

// ============================================
// BULK OPERATIONS
// ============================================

// AUDIT FIX: Bulk soft delete (never hard-delete financial records)
export async function bulkDeleteTransactions(ids: string[], companyId: string, userId?: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId || null,
    })
    .in('id', ids)
    .eq('company_id', companyId);

  if (error) handleSupabaseError(error);
}

export async function bulkReconcileTransactions(
  ids: string[],
  companyId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({
      reconciled: true,
      reconciled_at: new Date().toISOString(),
      reconciled_by: userId,
    })
    .in('id', ids)
    .eq('company_id', companyId);

  if (error) handleSupabaseError(error);
}

export async function duplicateTransaction(
  transaction: TransactionRow,
  newDate: string
): Promise<TransactionRow> {
  const payload: CreateTransactionPayload = {
    company_id: transaction.company_id,
    bank_account_id: transaction.bank_account_id,
    chart_account_id: transaction.chart_account_id,
    customer_id: transaction.customer_id,
    supplier_id: transaction.supplier_id,
    cost_center_id: transaction.cost_center_id,
    type: transaction.type,
    amount: transaction.amount,
    description: `${transaction.description} (cópia)`,
    transaction_date: newDate,
    payment_method: transaction.payment_method || 'dinheiro',
    document_number: null,
    notes: transaction.notes,
  };

  return createTransaction(payload);
}
