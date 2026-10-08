'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminCustomer {
  id: string;
  company_id: string;
  company_name: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminSupplier {
  id: string;
  company_id: string;
  company_name: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CRMStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  companiesWithCustomers: number;
  companiesWithSuppliers: number;
  topCompanyByCustomers: { name: string; count: number } | null;
  topCompanyBySuppliers: { name: string; count: number } | null;
  recentCustomers: number;
  recentSuppliers: number;
}

export function useAdminCRM() {
  const { user, isSuperAdmin } = useAuth();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || !isSuperAdmin) return;

    setIsLoading(true);
    try {
      // Fetch companies map first
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name');

      const companiesMap = new Map(companiesData?.map(c => [c.id, c.name]) || []);

      // Fetch customers and suppliers in parallel
      const [customersRes, suppliersRes] = await Promise.all([
        supabase
          .from('customers')
          .select('id, company_id, name, document, email, phone, city, state, is_active, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('suppliers')
          .select('id, company_id, name, document, email, phone, category, city, state, is_active, created_at')
          .order('created_at', { ascending: false }),
      ]);

      if (customersRes.error) throw customersRes.error;
      if (suppliersRes.error) throw suppliersRes.error;

      setCustomers(
        (customersRes.data || []).map(c => ({
          ...c,
          company_name: companiesMap.get(c.company_id) || 'Empresa',
        }))
      );

      setSuppliers(
        (suppliersRes.data || []).map(s => ({
          ...s,
          company_name: companiesMap.get(s.company_id) || 'Empresa',
        }))
      );
    } catch (error) {
      console.error('[useAdminCRM] Error fetching CRM data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo<CRMStats>(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString();

    const activeCustomers = customers.filter(c => c.is_active).length;
    const activeSuppliers = suppliers.filter(s => s.is_active).length;

    // Companies with CRM data
    const customerCompanies = new Set(customers.map(c => c.company_id));
    const supplierCompanies = new Set(suppliers.map(s => s.company_id));

    // Top company by customers
    const custByCompany = new Map<string, { name: string; count: number }>();
    for (const c of customers) {
      const existing = custByCompany.get(c.company_id);
      if (existing) existing.count++;
      else custByCompany.set(c.company_id, { name: c.company_name, count: 1 });
    }
    let topCust: { name: string; count: number } | null = null;
    for (const v of custByCompany.values()) {
      if (!topCust || v.count > topCust.count) topCust = v;
    }

    // Top company by suppliers
    const suppByCompany = new Map<string, { name: string; count: number }>();
    for (const s of suppliers) {
      const existing = suppByCompany.get(s.company_id);
      if (existing) existing.count++;
      else suppByCompany.set(s.company_id, { name: s.company_name, count: 1 });
    }
    let topSupp: { name: string; count: number } | null = null;
    for (const v of suppByCompany.values()) {
      if (!topSupp || v.count > topSupp.count) topSupp = v;
    }

    return {
      totalCustomers: customers.length,
      activeCustomers,
      inactiveCustomers: customers.length - activeCustomers,
      totalSuppliers: suppliers.length,
      activeSuppliers,
      inactiveSuppliers: suppliers.length - activeSuppliers,
      companiesWithCustomers: customerCompanies.size,
      companiesWithSuppliers: supplierCompanies.size,
      topCompanyByCustomers: topCust,
      topCompanyBySuppliers: topSupp,
      recentCustomers: customers.filter(c => c.created_at >= cutoff).length,
      recentSuppliers: suppliers.filter(s => s.created_at >= cutoff).length,
    };
  }, [customers, suppliers]);

  return {
    customers,
    suppliers,
    stats,
    isLoading,
    refresh: fetchData,
  };
}
