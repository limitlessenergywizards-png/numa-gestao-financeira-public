/**
 * Shared receivables query functions.
 *
 * Accept a Supabase client parameter so the same logic works
 * from both Server Components (server client) and Client Components (browser client).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type Client = SupabaseClient<Database>;

export async function fetchReceivables(
  supabase: Client,
  companyId: string,
  signal?: AbortSignal,
) {
  const { data, error } = await supabase
    .from('receivables')
    .select(`
      id, company_id, customer_id, category_id, chart_account_id,
      description, document_number, issue_date, due_date,
      total_amount, paid_amount, status, installment_number, total_installments, notes,
      recurrence, bank_account_id, payment_method,
      customer:customers(name),
      chart_account:chart_of_accounts(name, code, cost_type, dre_category),
      category:categories(name, type, color, icon),
      bank_account:bank_accounts(name)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('due_date', { ascending: true })
    .abortSignal(signal!);

  if (error) {
    if (error.code === '20') return []; // AbortError
    throw error;
  }
  return data ?? [];
}

export async function fetchReceivablesCustomers(
  supabase: Client,
  companyId: string,
) {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data ?? [];
}
