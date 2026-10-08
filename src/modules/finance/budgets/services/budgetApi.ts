import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError } from '@/lib/handleError';
import { Budget, CreateBudgetPayload, UpdateBudgetPayload } from '../types';

/**
 * Fetch budgets for a specific company, optionally filtered by a date range
 */
export async function fetchBudgets(
    companyId: string,
    startDate?: string,
    endDate?: string
): Promise<Budget[]> {
    let query = supabase
        .from('orcamentos')
        .select('id, company_id, target_type, category_code, category_name, amount, period_type, start_date, end_date, notes, created_by, created_at, updated_at')
        .eq('company_id', companyId)
        .eq('is_deleted', false)
        .order('start_date', { ascending: false });

    if (startDate) {
        query = query.gte('start_date', startDate);
    }

    if (endDate) {
        query = query.lte('end_date', endDate);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error);
    return (data || []) as Budget[];
}

/**
 * Fetch a single budget by ID (with ownership check)
 */
export async function fetchBudgetById(id: string, companyId: string): Promise<Budget | null> {
    const { data, error } = await supabase
        .from('orcamentos')
        .select('id, company_id, target_type, category_code, category_name, amount, period_type, start_date, end_date, notes, created_by, created_at, updated_at')
        .eq('id', id)
        .eq('company_id', companyId)
        .eq('is_deleted', false)
        .maybeSingle();

    if (error) handleSupabaseError(error);
    return data as Budget | null;
}

/**
 * Create a new budget
 */
export async function createBudget(
    payload: CreateBudgetPayload
): Promise<Budget> {
    const { data, error } = await supabase
        .from('orcamentos')
        .insert(payload)
        .select()
        .single();

    if (error) handleSupabaseError(error);
    return data as Budget;
}

/**
 * Update an existing budget (with ownership check)
 */
export async function updateBudget(
    id: string,
    companyId: string,
    payload: UpdateBudgetPayload
): Promise<Budget> {
    const { data, error } = await supabase
        .from('orcamentos')
        .update(payload)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();

    if (error) handleSupabaseError(error);
    return data as Budget;
}

/**
 * Soft delete a budget (with ownership check — never hard delete financial data)
 */
export async function deleteBudget(id: string, companyId: string): Promise<void> {
    const { error } = await supabase
        .from('orcamentos')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deletion_reason: 'Excluído pelo usuário',
        })
        .eq('id', id)
        .eq('company_id', companyId);

    if (error) handleSupabaseError(error);
}
