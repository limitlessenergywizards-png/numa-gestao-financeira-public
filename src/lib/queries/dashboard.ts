/**
 * Shared dashboard query functions.
 *
 * Accept a Supabase client parameter so the same logic works
 * from both Server Components (server client) and Client Components (browser client).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type Client = SupabaseClient<Database>;

interface DateRange {
  start: string;
  end: string;
}

export async function fetchDashboardReceivables(
  supabase: Client,
  companyId: string,
  dateRange?: DateRange,
) {
  let query = supabase
    .from('receivables')
    .select('id, total_amount, paid_amount, due_date, status, chart_account_id')
    .eq('company_id', companyId);

  if (dateRange) {
    query = query.gte('due_date', dateRange.start).lte('due_date', dateRange.end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchDashboardPayables(
  supabase: Client,
  companyId: string,
  dateRange?: DateRange,
) {
  let query = supabase
    .from('payables')
    .select('id, total_amount, paid_amount, due_date, status, chart_account_id')
    .eq('company_id', companyId)
    .neq('status', 'cancelado');

  if (dateRange) {
    query = query.gte('due_date', dateRange.start).lte('due_date', dateRange.end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchDashboardBankAccounts(
  supabase: Client,
  companyId: string,
) {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('id, name, bank_name, current_balance, is_active')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (error) throw error;
  return data ?? [];
}

export async function fetchDashboardChartAccounts(
  supabase: Client,
  companyId: string,
  type: 'income' | 'expense',
) {
  let query = supabase
    .from('chart_of_accounts')
    .select('id, name, type')
    .eq('company_id', companyId);

  if (type === 'income') {
    query = query.eq('type', 'receita');
  } else {
    query = query.in('type', ['despesa', 'custo']);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchDashboardRecentTransactions(
  supabase: Client,
  companyId: string,
  dateRange?: DateRange,
) {
  let query = supabase
    .from('transactions')
    .select('id, description, amount, type, transaction_date, bank_account_id, nature')
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: false })
    .limit(50);

  if (dateRange) {
    query = query.gte('transaction_date', dateRange.start).lte('transaction_date', dateRange.end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
