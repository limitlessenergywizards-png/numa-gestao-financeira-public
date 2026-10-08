/**
 * DRE Budget API Service
 * 
 * All Supabase operations for the dre_budget table.
 */

import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError } from '@/lib/handleError';

// ============================================
// TYPES
// ============================================

export interface DREBudgetRow {
  id: string;
  company_id: string;
  period_year: number;
  period_month: number;
  category_code: string;
  category_name: string;
  budgeted_value: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDREBudgetPayload {
  company_id: string;
  period_year: number;
  period_month: number;
  category_code: string;
  category_name: string;
  budgeted_value: number;
  created_by: string;
}

export interface UpdateDREBudgetPayload {
  budgeted_value: number;
}

// ============================================
// QUERY FUNCTIONS
// ============================================

export async function fetchDREBudget(
  companyId: string,
  year: number,
  month: number
): Promise<DREBudgetRow[]> {
  const { data, error } = await supabase
    .from('dre_budget')
    .select('id, company_id, period_year, period_month, category_code, category_name, budgeted_value, created_by, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('period_year', year)
    .eq('period_month', month)
    .order('category_code');

  if (error) handleSupabaseError(error);
  return (data || []) as DREBudgetRow[];
}

export async function fetchDREBudgetByCategory(
  companyId: string,
  year: number,
  month: number,
  categoryCode: string
): Promise<DREBudgetRow | null> {
  const { data, error } = await supabase
    .from('dre_budget')
    .select('id, company_id, period_year, period_month, category_code, category_name, budgeted_value, created_by, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('period_year', year)
    .eq('period_month', month)
    .eq('category_code', categoryCode)
    .maybeSingle();

  if (error) handleSupabaseError(error);
  return data as DREBudgetRow | null;
}

export async function fetchDREBudgetYear(
  companyId: string,
  year: number
): Promise<DREBudgetRow[]> {
  const { data, error } = await supabase
    .from('dre_budget')
    .select('id, company_id, period_year, period_month, category_code, category_name, budgeted_value, created_by, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('period_year', year)
    .order('period_month')
    .order('category_code');

  if (error) handleSupabaseError(error);
  return (data || []) as DREBudgetRow[];
}

// ============================================
// MUTATION FUNCTIONS
// ============================================

export async function createDREBudgetItem(
  payload: CreateDREBudgetPayload
): Promise<DREBudgetRow> {
  const { data, error } = await supabase
    .from('dre_budget')
    .insert(payload)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data as DREBudgetRow;
}

export async function updateDREBudgetItem(
  id: string,
  companyId: string,
  payload: UpdateDREBudgetPayload
): Promise<void> {
  const { error } = await supabase
    .from('dre_budget')
    .update({ budgeted_value: payload.budgeted_value })
    .eq('id', id)
    .eq('company_id', companyId);

  if (error) handleSupabaseError(error);
}

export async function upsertDREBudgetItem(
  payload: CreateDREBudgetPayload
): Promise<DREBudgetRow> {
  // Check if exists
  const existing = await fetchDREBudgetByCategory(
    payload.company_id,
    payload.period_year,
    payload.period_month,
    payload.category_code
  );

  if (existing) {
    await updateDREBudgetItem(existing.id, payload.company_id, { budgeted_value: payload.budgeted_value });
    return { ...existing, budgeted_value: payload.budgeted_value };
  }

  return createDREBudgetItem(payload);
}

export async function deleteDREBudgetItem(id: string, companyId: string): Promise<void> {
  const { error } = await supabase
    .from('dre_budget')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deletion_reason: 'Excluído pelo usuário',
    })
    .eq('id', id)
    .eq('company_id', companyId);

  if (error) handleSupabaseError(error);
}

// ============================================
// BULK OPERATIONS
// ============================================

export async function replacePeriodBudget(
  companyId: string,
  year: number,
  month: number,
  items: Omit<CreateDREBudgetPayload, 'company_id' | 'period_year' | 'period_month'>[]
): Promise<void> {
  // Soft delete existing budget for period
  const { error: deleteError } = await supabase
    .from('dre_budget')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deletion_reason: 'Substituído por novo orçamento do período',
    })
    .eq('company_id', companyId)
    .eq('period_year', year)
    .eq('period_month', month);

  if (deleteError) handleSupabaseError(deleteError);

  // Insert new items
  if (items.length > 0) {
    const insertItems = items.map(item => ({
      company_id: companyId,
      period_year: year,
      period_month: month,
      ...item,
    }));

    const { error: insertError } = await supabase
      .from('dre_budget')
      .insert(insertItems);

    if (insertError) handleSupabaseError(insertError);
  }
}

export async function copyBudgetFromPeriod(
  companyId: string,
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
  userId: string
): Promise<number> {
  // Fetch source budget
  const sourceBudget = await fetchDREBudget(companyId, fromYear, fromMonth);

  if (sourceBudget.length === 0) {
    return 0;
  }

  // Map to new period
  const newItems = sourceBudget.map(item => ({
    company_id: item.company_id,
    period_year: toYear,
    period_month: toMonth,
    category_code: item.category_code,
    category_name: item.category_name,
    budgeted_value: item.budgeted_value,
    created_by: userId,
  }));

  await replacePeriodBudget(companyId, toYear, toMonth, newItems);

  return newItems.length;
}
