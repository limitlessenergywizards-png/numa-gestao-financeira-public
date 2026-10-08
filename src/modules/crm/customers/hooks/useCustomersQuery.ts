/**
 * useCustomersQuery - React Query hook for customers
 * 
 * Provides cached customers data with cross-invalidation.
 * Works with the persistence layer for instant load times.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  customersKeys,
  receivablesKeys,
  dashboardKeys,
  STALE_TIMES,
  GC_TIMES
} from '@/lib/queryKeys';

// ============================================
// CROSS-INVALIDATION HELPER
// ============================================

function invalidateCustomerRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: customersKeys.all });
  queryClient.invalidateQueries({ queryKey: receivablesKeys.all });
  queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
}

// ============================================
// TYPES
// ============================================

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// QUERY FUNCTIONS
// ============================================

async function fetchCustomers(companyId: string, search?: string, signal?: AbortSignal): Promise<Customer[]> {
  let query = supabase
    .from('customers')
    .select('id, company_id, name, document, email, phone, address, city, state, zip_code, notes, is_active, created_at, updated_at')
    .eq('company_id', companyId)
    .order('name');

  if (search) {
    query = query.or(`name.ilike.%${search}%,document.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query.abortSignal(signal!);

  if (error) throw error;
  return (data || []) as Customer[];
}

async function fetchActiveCustomers(companyId: string, signal?: AbortSignal): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('id, company_id, name, document, email, phone, address, city, state, zip_code, notes, is_active, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')
    .abortSignal(signal!);

  if (error) throw error;
  return (data || []) as Customer[];
}

// ============================================
// MAIN HOOKS
// ============================================

export function useCustomersQuery(companyId: string | null | undefined, search?: string) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? customersKeys.list(companyId, search) : ['disabled'],
    queryFn: ({ signal }) => fetchCustomers(companyId!, search, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

export function useActiveCustomersQuery(companyId: string | null | undefined) {
  const enabled = !!companyId;

  return useQuery({
    queryKey: enabled ? customersKeys.active(companyId) : ['disabled'],
    queryFn: ({ signal }) => fetchActiveCustomers(companyId!, signal),
    enabled,
    staleTime: STALE_TIMES.REFERENCE,
    gcTime: GC_TIMES.REFERENCE,
  });
}

// ============================================
// MUTATIONS
// ============================================

interface CreateCustomerPayload {
  company_id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

interface UpdateCustomerPayload {
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export function useCreateCustomer(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCustomerPayload) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) {
        invalidateCustomerRelatedQueries(queryClient);
      }
    },
  });
}

export function useUpdateCustomer(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateCustomerPayload }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', id)
        .eq('company_id', companyId!)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) {
        invalidateCustomerRelatedQueries(queryClient);
      }
    },
  });
}

export function useDeleteCustomer(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check usage in transactions
      const { count: txCount, error: txError } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', id);

      if (txError) throw txError;

      // Check usage in receivables
      const { count: recCount, error: recError } = await supabase
        .from('receivables')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', id);

      if (recError) throw recError;

      const isInUse = (txCount || 0) > 0 || (recCount || 0) > 0;

      if (isInUse) {
        const { error } = await supabase
          .from('customers')
          .update({ is_active: false })
          .eq('id', id)
          .eq('company_id', companyId!);

        if (error) throw error;
        return { type: 'soft' };
      } else {
        const { error } = await supabase
          .from('customers')
          .update({ is_active: false })
          .eq('id', id)
          .eq('company_id', companyId!);

        if (error) throw error;
        return { type: 'hard' };
      }
    },
    onSuccess: () => {
      if (companyId) {
        invalidateCustomerRelatedQueries(queryClient);
      }
    },
  });
}
