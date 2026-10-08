/**
 * Shared payables query functions.
 *
 * Accept a Supabase client parameter so the same logic works
 * from both Server Components (server client) and Client Components (browser client).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type Client = SupabaseClient<Database>;

export async function fetchPayables(
  supabase: Client,
  companyId: string,
  signal?: AbortSignal,
) {
  const { data, error } = await supabase
    .from('payables')
    .select(`
      id, company_id, supplier_id, category_id, chart_account_id, cost_center_id,
      description, document_number, issue_date, due_date,
      total_amount, paid_amount, status, installment_number, total_installments, notes,
      is_debt_payment,
      supplier:suppliers(name),
      chart_account:chart_of_accounts(name, code, cost_type, dre_category),
      category:categories(name)
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

export async function fetchPayablesSuppliers(
  supabase: Client,
  companyId: string,
) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data ?? [];
}
