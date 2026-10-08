/**
 * DRE Notes API Service
 * 
 * All Supabase operations for the dre_notes table.
 */

import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError } from '@/lib/handleError';

// ============================================
// TYPES
// ============================================

export interface DRENoteRow {
  id: string;
  company_id: string;
  chart_account_id: string | null;
  dre_line_id: string;
  period_year: number;
  period_month: number;
  note: string;
  is_important: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDRENotePayload {
  company_id: string;
  chart_account_id?: string | null;
  dre_line_id: string;
  period_year: number;
  period_month: number;
  note: string;
  is_important?: boolean;
  created_by: string;
}

export interface UpdateDRENotePayload {
  note?: string;
  is_important?: boolean;
  chart_account_id?: string | null;
}

// ============================================
// QUERY FUNCTIONS
// ============================================

export async function fetchDRENotes(
  companyId: string,
  year: number,
  month: number
): Promise<DRENoteRow[]> {
  const { data, error } = await supabase
    .from('dre_notes')
    .select('id, company_id, chart_account_id, dre_line_id, period_year, period_month, note, is_important, created_by, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('period_year', year)
    .eq('period_month', month);

  if (error) handleSupabaseError(error);
  return (data || []) as DRENoteRow[];
}

export async function fetchDRENoteById(id: string, companyId: string): Promise<DRENoteRow | null> {
  const { data, error } = await supabase
    .from('dre_notes')
    .select('id, company_id, chart_account_id, dre_line_id, period_year, period_month, note, is_important, created_by, created_at, updated_at')
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) handleSupabaseError(error);
  return data as DRENoteRow | null;
}

export async function fetchDRENoteByLine(
  companyId: string,
  year: number,
  month: number,
  lineId: string
): Promise<DRENoteRow | null> {
  const { data, error } = await supabase
    .from('dre_notes')
    .select('id, company_id, chart_account_id, dre_line_id, period_year, period_month, note, is_important, created_by, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('period_year', year)
    .eq('period_month', month)
    .eq('dre_line_id', lineId)
    .maybeSingle();

  if (error) handleSupabaseError(error);
  return data as DRENoteRow | null;
}

export async function fetchImportantNotes(
  companyId: string,
  year: number,
  month: number
): Promise<DRENoteRow[]> {
  const { data, error } = await supabase
    .from('dre_notes')
    .select('id, company_id, chart_account_id, dre_line_id, period_year, period_month, note, is_important, created_by, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('period_year', year)
    .eq('period_month', month)
    .eq('is_important', true);

  if (error) handleSupabaseError(error);
  return (data || []) as DRENoteRow[];
}

// ============================================
// MUTATION FUNCTIONS
// ============================================

export async function createDRENote(
  payload: CreateDRENotePayload
): Promise<DRENoteRow> {
  const { data, error } = await supabase
    .from('dre_notes')
    .insert({
      company_id: payload.company_id,
      chart_account_id: payload.chart_account_id ?? null,
      dre_line_id: payload.dre_line_id,
      period_year: payload.period_year,
      period_month: payload.period_month,
      note: payload.note,
      is_important: payload.is_important ?? false,
      created_by: payload.created_by,
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data as DRENoteRow;
}

export async function updateDRENote(
  id: string,
  companyId: string,
  payload: UpdateDRENotePayload
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.note !== undefined) updateData.note = payload.note;
  if (payload.is_important !== undefined) updateData.is_important = payload.is_important;
  if (payload.chart_account_id !== undefined) updateData.chart_account_id = payload.chart_account_id;

  const { error } = await supabase
    .from('dre_notes')
    .update(updateData)
    .eq('id', id)
    .eq('company_id', companyId);

  if (error) handleSupabaseError(error);
}

export async function upsertDRENote(
  payload: CreateDRENotePayload
): Promise<DRENoteRow> {
  // Check if exists
  const existing = await fetchDRENoteByLine(
    payload.company_id,
    payload.period_year,
    payload.period_month,
    payload.dre_line_id
  );

  if (existing) {
    await updateDRENote(existing.id, payload.company_id, {
      note: payload.note,
      is_important: payload.is_important,
      chart_account_id: payload.chart_account_id,
    });
    return {
      ...existing,
      note: payload.note,
      is_important: payload.is_important ?? existing.is_important,
      chart_account_id: payload.chart_account_id ?? existing.chart_account_id,
    };
  }

  return createDRENote(payload);
}

export async function deleteDRENote(id: string, companyId: string): Promise<void> {
  const { error } = await supabase
    .from('dre_notes')
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

export async function deleteNotesByPeriod(
  companyId: string,
  year: number,
  month: number
): Promise<void> {
  const { error } = await supabase
    .from('dre_notes')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deletion_reason: `Exclusão em lote do período ${year}-${month}`,
    })
    .eq('company_id', companyId)
    .eq('period_year', year)
    .eq('period_month', month);

  if (error) handleSupabaseError(error);
}
