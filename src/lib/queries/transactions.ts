/**
 * Shared transactions query functions.
 *
 * Accept a Supabase client parameter so the same logic works
 * from both Server Components (server client) and Client Components (browser client).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type Client = SupabaseClient<Database>;

export async function fetchTransactions(
  supabase: Client,
  companyId: string,
  filters: { startDate: string; endDate: string },
  signal?: AbortSignal,
) {
  let query = supabase
    .from('transactions')
    .select(`
      id, company_id, bank_account_id, chart_account_id,
      customer_id, supplier_id, type, amount, description,
      transaction_date, document_number, notes, payment_method,
      reconciled, reconciled_at, created_at,
      original_transaction_date, original_created_at, is_debt_payment,
      bank_account:bank_accounts(name),
      chart_account:chart_of_accounts(name, code),
      customer:customers(name),
      supplier:suppliers(name)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .gte('transaction_date', filters.startDate)
    .lte('transaction_date', filters.endDate)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === '20') return []; // AbortError
    throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((t: any) => ({
    ...t,
    reconciled: t.reconciled ?? false,
    reconciled_at: t.reconciled_at ?? null,
  }));
}
