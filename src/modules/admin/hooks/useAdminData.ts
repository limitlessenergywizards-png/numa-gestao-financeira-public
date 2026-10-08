'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/lib/supabase/edge-functions';
import { EDGE_FUNCTIONS } from '@/lib/api-endpoints';
import { useAuth } from '@/contexts/AuthContext';
import { getEdgeFunctionErrorMessage } from '@/lib/errorUtils';

export interface AdminCompany {
  id: string;
  name: string;
  trading_name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  is_headquarters: boolean;
  parent_company_id: string | null;
  created_at: string;
  user_count?: number;
}

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  companies: {
    company_id: string;
    company_name: string;
    role: 'admin' | 'editor' | 'viewer';
  }[];
  last_activity_date: string | null;
  created_at: string;
  trial_started_at?: string | null;
}

export interface AdminInvitation {
  id: string;
  email: string;
  company_id: string;
  company_name?: string;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: string;
  inviter_name?: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  user_id: string;
  user_name?: string;
  company_id: string;
  company_name?: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminSubscription {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan_name: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface BillingStats {
  mrr: number;
  arr: number;
  totalSubscribers: number;
  activeTrials: number;
  churnedThisMonth: number;
  conversionRate: number;
  averageRevenuePerUser: number;
  planDistribution: {
    Iniciante: number;
    Estrategista: number;
    Mestre: number;
    trial: number;
    free: number;
  };
}

export interface AdminStats {
  totalCompanies: number;
  totalUsers: number;
  pendingInvitations: number;
  activeToday: number;
}

interface GlobalDataResponse {
  companies: AdminCompany[];
  users: AdminUser[];
  invitations: AdminInvitation[];
  auditLogs: AdminAuditLog[];
  subscriptions: AdminSubscription[];
  billingStats: BillingStats;
  stats: AdminStats;
}

export function useAdminData() {
  const { user, isSuperAdmin } = useAuth();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [billingStats, setBillingStats] = useState<BillingStats>({
    mrr: 0,
    arr: 0,
    totalSubscribers: 0,
    activeTrials: 0,
    churnedThisMonth: 0,
    conversionRate: 0,
    averageRevenuePerUser: 0,
    planDistribution: {
      Iniciante: 0,
      Estrategista: 0,
      Mestre: 0,
      trial: 0,
      free: 0,
    },
  });
  const [stats, setStats] = useState<AdminStats>({
    totalCompanies: 0,
    totalUsers: 0,
    pendingInvitations: 0,
    activeToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);

  // Fetch global data via edge function (for super admin mode)
  const fetchGlobalData = useCallback(async (): Promise<GlobalDataResponse | null> => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[useAdminData] Fetching global data via edge function...');
    }

    const { data, error } = await invokeEdgeFunction<GlobalDataResponse>(EDGE_FUNCTIONS.ADMIN_GLOBAL_DATA);

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        const msg = await getEdgeFunctionErrorMessage(error);
        console.error('[useAdminData] Error fetching global data:', msg);
      }
      return null;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[useAdminData] Global data received:', {
        companies: data?.companies?.length,
        users: data?.users?.length,
        subscriptions: data?.subscriptions?.length,
        billingStats: data?.billingStats,
      });
    }

    return data as GlobalDataResponse;
  }, []);

  const fetchCompanies = useCallback(async (isSuperAdmin: boolean) => {
    if (!user) return [];

    let companyIds: string[] = [];

    if (!isSuperAdmin) {
      const { data: userCompanies, error: ucError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (ucError) {
        console.error('Error fetching user companies:', ucError);
        return [];
      }
      companyIds = userCompanies?.map(uc => uc.company_id) || [];
      if (companyIds.length === 0) return [];
    }

    // If super admin, fetch all companies. Otherwise fetch by IDs
    const query = supabase.from('companies').select('id, name, trading_name, document, email, phone, is_headquarters, parent_company_id, created_at').order('name');
    if (!isSuperAdmin) {
      query.in('id', companyIds);
    }

    const { data: companiesData, error: compError } = await query;

    if (compError) {
      console.error('Error fetching companies:', compError);
      return [];
    }

    // Single query to count users per company (replaces N+1 individual count queries)
    const companyIdsList = (companiesData || []).map(c => c.id);
    const { data: userCompanyRows } = await supabase
      .from('user_companies')
      .select('company_id')
      .in('company_id', companyIdsList);

    const countMap = new Map<string, number>();
    (userCompanyRows || []).forEach(uc => {
      countMap.set(uc.company_id, (countMap.get(uc.company_id) || 0) + 1);
    });

    const companiesWithCounts: AdminCompany[] = (companiesData || []).map(company => ({
      ...company,
      user_count: countMap.get(company.id) || 0,
    }));

    return companiesWithCounts;
  }, [user]);

  const fetchUsers = useCallback(async (companyIds: string[], isSuperAdmin: boolean) => {
    if (companyIds.length === 0 && !isSuperAdmin) return [];

    let userIds: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let userCompaniesData: any[] | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rolesData: any[] | null = null;

    if (isSuperAdmin) {
      // Super admin fetches all user companies mapping
      const { data } = await supabase.from('user_companies').select('user_id, company_id');
      userCompaniesData = data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userIds = [...new Set((data as any[])?.map(uc => uc.user_id) || [])];

      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      rolesData = roles;
    } else {
      const { data, error: ucError } = await supabase
        .from('user_companies')
        .select('user_id, company_id')
        .in('company_id', companyIds);

      if (ucError) {
        console.error('Error fetching user_companies:', ucError);
        return [];
      }
      userCompaniesData = data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userIds = [...new Set((data as any[])?.map(uc => uc.user_id) || [])];

      const rolesQuery = supabase.from('user_roles').select('user_id, role');
      if (!isSuperAdmin) {
        rolesQuery.in('user_id', userIds);
      }
      const { data: roles, error: rolesError } = await rolesQuery;

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }
      rolesData = roles;
    }

    if (userIds.length === 0) return [];

    const profilesQuery = supabase.from('profiles').select('id, user_id, full_name, avatar_url, job_title, last_activity_date, created_at, trial_started_at');
    if (!isSuperAdmin) {
      profilesQuery.in('user_id', userIds);
    }
    const { data: profilesData, error: profError } = await profilesQuery;

    if (profError) {
      console.error('Error fetching profiles:', profError);
      return [];
    }

    const companiesQuery = supabase.from('companies').select('id, name');
    if (!isSuperAdmin) {
      companiesQuery.in('id', companyIds);
    }
    const { data: companiesData } = await companiesQuery;

    const companiesMap = new Map(companiesData?.map(c => [c.id, c.name]) || []);
    const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

    const usersMap = new Map<string, AdminUser>();

    for (const profile of profilesData || []) {
      const userCompanies = (userCompaniesData || [])
        .filter(uc => uc.user_id === profile.user_id)
        .map(uc => ({
          company_id: uc.company_id,
          company_name: companiesMap.get(uc.company_id) || 'Empresa',
          role: (rolesMap.get(profile.user_id) || 'viewer') as 'admin' | 'editor' | 'viewer',
        }));

      usersMap.set(profile.user_id, {
        id: profile.id,
        user_id: profile.user_id,
        email: '', // Requires edge function to get Auth emails
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        job_title: profile.job_title,
        companies: userCompanies,
        last_activity_date: profile.last_activity_date,
        created_at: profile.created_at,
        trial_started_at: profile.trial_started_at,
      });
    }

    return Array.from(usersMap.values());
  }, []);

  const fetchInvitations = useCallback(async (companyIds: string[], isSuperAdmin: boolean) => {
    if (companyIds.length === 0 && !isSuperAdmin) return [];

    let query = supabase
      .from('user_invitations')
      .select('id, company_id, email, role, invited_by, expires_at, accepted_at, created_at')
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (!isSuperAdmin) {
      query = query.in('company_id', companyIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching invitations:', error);
      return [];
    }

    const companyQuery = supabase.from('companies').select('id, name');
    if (!isSuperAdmin) {
      companyQuery.in('id', companyIds);
    }
    const { data: companiesData } = await companyQuery;

    const companiesMap = new Map(companiesData?.map(c => [c.id, c.name]) || []);

    return (data || []).map(inv => ({
      ...inv,
      company_name: companiesMap.get(inv.company_id) || 'Empresa',
    }));
  }, []);

  const fetchAuditLogs = useCallback(async (companyIds: string[], isSuperAdmin: boolean) => {
    if (companyIds.length === 0 && !isSuperAdmin) return [];

    let query = supabase
      .from('audit_logs')
      .select('id, action, table_name, record_id, user_id, company_id, old_data, new_data, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!isSuperAdmin) {
      query = query.in('company_id', companyIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    const companyQuery = supabase.from('companies').select('id, name');
    if (!isSuperAdmin) {
      companyQuery.in('id', companyIds);
    }
    const { data: companiesData } = await companyQuery;

    const companiesMap = new Map(companiesData?.map(c => [c.id, c.name]) || []);

    const userIds = [...new Set((data || []).map(log => log.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.full_name]) || []);

    return (data || []).map(log => ({
      ...log,
      company_name: companiesMap.get(log.company_id) || 'Empresa',
      user_name: profilesMap.get(log.user_id) || 'Usuário',
      old_data: log.old_data as Record<string, unknown> | null,
      new_data: log.new_data as Record<string, unknown> | null,
    }));
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Always use super admin mode for users with admin role,
      // regardless of company associations
      if (isSuperAdmin) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[useAdminData] Super admin mode enabled');
        }
        setIsSuperAdminMode(true);

        const globalData = await fetchGlobalData();

        if (globalData) {
          setCompanies(globalData.companies);
          setUsers(globalData.users);
          setInvitations(globalData.invitations);
          setAuditLogs(globalData.auditLogs);
          setSubscriptions(globalData.subscriptions || []);
          setBillingStats(globalData.billingStats || {
            mrr: 0,
            arr: 0,
            totalSubscribers: 0,
            activeTrials: 0,
            churnedThisMonth: 0,
            conversionRate: 0,
            averageRevenuePerUser: 0,
            planDistribution: { Iniciante: 0, Estrategista: 0, Mestre: 0, trial: 0, free: 0 },
          });
          setStats(globalData.stats);
        } else {
          // If edge function fails (e.g. not running locally), fallback to direct queries 
          if (process.env.NODE_ENV !== 'production') console.log('[useAdminData] Edge function failed, falling back to direct queries for Super Admin');

          const companiesData = await fetchCompanies(true);
          setCompanies(companiesData);

          const companyIds = companiesData.map(c => c.id);

          const [usersData, invitationsData, logsData] = await Promise.all([
            fetchUsers(companyIds, true),
            fetchInvitations(companyIds, true),
            fetchAuditLogs(companyIds, true),
          ]);

          setUsers(usersData);
          setInvitations(invitationsData);
          setAuditLogs(logsData);

          const today = new Date().toISOString().split('T')[0];
          const activeToday = usersData.filter(u =>
            u.last_activity_date && u.last_activity_date.startsWith(today)
          ).length;

          setStats({
            totalCompanies: companiesData.length,
            totalUsers: usersData.length,
            pendingInvitations: invitationsData.length,
            activeToday,
          });
        }
      } else {
        // Standard flow with RLS
        if (process.env.NODE_ENV !== 'production') {
          console.log('[useAdminData] Standard mode: admin with companies');
        }
        setIsSuperAdminMode(false);

        const companiesData = await fetchCompanies(false);
        setCompanies(companiesData);

        const companyIds = companiesData.map(c => c.id);

        const [usersData, invitationsData, logsData] = await Promise.all([
          fetchUsers(companyIds, false),
          fetchInvitations(companyIds, false),
          fetchAuditLogs(companyIds, false),
        ]);

        setUsers(usersData);
        setInvitations(invitationsData);
        setAuditLogs(logsData);
        setSubscriptions([]);
        setBillingStats({
          mrr: 0,
          arr: 0,
          totalSubscribers: 0,
          activeTrials: 0,
          churnedThisMonth: 0,
          conversionRate: 0,
          averageRevenuePerUser: 0,
          planDistribution: { Iniciante: 0, Estrategista: 0, Mestre: 0, trial: 0, free: 0 },
        });

        const today = new Date().toISOString().split('T')[0];
        const activeToday = usersData.filter(u =>
          u.last_activity_date && u.last_activity_date.startsWith(today)
        ).length;

        setStats({
          totalCompanies: companiesData.length,
          totalUsers: usersData.length,
          pendingInvitations: invitationsData.length,
          activeToday,
        });
      }
    } catch (error) {
      console.error('Error refreshing admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isSuperAdmin, fetchCompanies, fetchUsers, fetchInvitations, fetchAuditLogs, fetchGlobalData]);

  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, refresh]);

  return {
    companies,
    users,
    invitations,
    auditLogs,
    subscriptions,
    billingStats,
    stats,
    isLoading,
    isSuperAdminMode,
    refresh,
  };
}
