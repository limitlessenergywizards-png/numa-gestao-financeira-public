import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAuthClient, createAdminClient } from "../_shared/supabase.ts";
import { requireAuth, extractUser } from "../_shared/auth.ts";
import { successResponse, errorResponse } from "../_shared/responses.ts";

const log = createLogger("ADMIN-GLOBAL-DATA");

// Price mapping for MRR calculation (monthly equivalent values in BRL)
const PRICE_TO_MRR: Record<string, number> = {
  'price_1SunF5RwPhcHPfzqxLqMGMnt': 97,   // Iniciante mensal
  'price_1SunF7RwPhcHPfzqSdC5VE7o': 197,  // Estrategista mensal
  'price_1SunJaRwPhcHPfzqzYQvhPGy': 187,  // Estrategista trimestral
  'price_1SunJbRwPhcHPfzqDJL2nLuv': 177,  // Estrategista semestral
  'price_1SunJcRwPhcHPfzqvKlKNLHu': 157,  // Estrategista anual
  'price_1SunF8RwPhcHPfzqzlHzfQDR': 265,  // Mestre mensal
  'price_1SunJdRwPhcHPfzqKGo6YvGr': 252,  // Mestre trimestral
  'price_1SunJeRwPhcHPfzqLMT8xNuJ': 238,  // Mestre semestral
  'price_1SunJfRwPhcHPfzqWJL3Yt7k': 212,  // Mestre anual
};

// Map price ID to plan name
const PRICE_TO_PLAN: Record<string, string> = {
  'price_1SunF5RwPhcHPfzqxLqMGMnt': 'Iniciante',
  'price_1SunF7RwPhcHPfzqSdC5VE7o': 'Estrategista',
  'price_1SunJaRwPhcHPfzqzYQvhPGy': 'Estrategista',
  'price_1SunJbRwPhcHPfzqDJL2nLuv': 'Estrategista',
  'price_1SunJcRwPhcHPfzqvKlKNLHu': 'Estrategista',
  'price_1SunF8RwPhcHPfzqzlHzfQDR': 'Mestre',
  'price_1SunJdRwPhcHPfzqKGo6YvGr': 'Mestre',
  'price_1SunJeRwPhcHPfzqLMT8xNuJ': 'Mestre',
  'price_1SunJfRwPhcHPfzqWJL3Yt7k': 'Mestre',
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate authorization header
    const authResult = requireAuth(req, corsHeaders);
    if (authResult instanceof Response) {
      log('Missing or invalid authorization header');
      return authResult;
    }
    const authHeader = authResult;

    // Create client with user's token for auth validation
    const supabaseAuth = createAuthClient(authHeader);

    // Validate JWT and get user claims
    const userResult = await extractUser(authHeader, supabaseAuth, corsHeaders);
    if (userResult instanceof Response) {
      log('Invalid JWT');
      return userResult;
    }

    const { userId } = userResult;
    log('User authenticated', { userId });

    // Create service role client to bypass RLS
    const supabaseAdmin = createAdminClient();

    // Verify user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      log('User is not admin', { error: roleError?.message });
      return errorResponse('Forbidden - Admin access required', 403, corsHeaders);
    }

    log('Admin verified, fetching global data...');

    // Fetch all data in parallel
    const [
      companiesResult,
      profilesResult,
      userCompaniesResult,
      userRolesResult,
      invitationsResult,
      auditLogsResult,
      authUsersResult,
      subscriptionsResult
    ] = await Promise.all([
      // All companies
      supabaseAdmin.from('companies').select('*').order('name'),
      // All profiles
      supabaseAdmin.from('profiles').select('*'),
      // All user-company associations
      supabaseAdmin.from('user_companies').select('user_id, company_id'),
      // All user roles
      supabaseAdmin.from('user_roles').select('user_id, role'),
      // All pending invitations
      supabaseAdmin
        .from('user_invitations')
        .select('*')
        .is('accepted_at', null)
        .order('created_at', { ascending: false }),
      // Latest 100 audit logs
      supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      // Get auth users for emails
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      // All subscriptions
      supabaseAdmin
        .from('subscriptions')
        .select('*')
        .order('updated_at', { ascending: false })
    ]);

    // Check for errors
    if (companiesResult.error) {
      log('Companies error', companiesResult.error);
    }
    if (profilesResult.error) {
      log('Profiles error', profilesResult.error);
    }
    if (authUsersResult.error) {
      log('Auth users error', authUsersResult.error);
    }
    if (subscriptionsResult.error) {
      log('Subscriptions error', subscriptionsResult.error);
    }

    const companies = companiesResult.data || [];
    const profiles = profilesResult.data || [];
    const userCompanies = userCompaniesResult.data || [];
    const userRoles = userRolesResult.data || [];
    const invitations = invitationsResult.data || [];
    const auditLogs = auditLogsResult.data || [];
    const authUsers = authUsersResult.data?.users || [];
    const subscriptions = subscriptionsResult.data || [];

    // Create lookup maps
    const companiesMap = new Map(companies.map(c => [c.id, c.name]));
    const rolesMap = new Map(userRoles.map(r => [r.user_id, r.role]));
    const emailsMap = new Map(authUsers.map(u => [u.id, u.email]));
    const profilesMap = new Map(profiles.map(p => [p.user_id, p]));

    // Build enriched users list
    const users = profiles.map(profile => {
      const userCompaniesList = userCompanies
        .filter(uc => uc.user_id === profile.user_id)
        .map(uc => ({
          company_id: uc.company_id,
          company_name: companiesMap.get(uc.company_id) || 'Empresa',
          role: rolesMap.get(profile.user_id) || 'viewer',
        }));

      return {
        id: profile.id,
        user_id: profile.user_id,
        email: emailsMap.get(profile.user_id) || '',
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        job_title: profile.job_title,
        companies: userCompaniesList,
        last_activity_date: profile.last_activity_date,
        created_at: profile.created_at,
        trial_started_at: profile.trial_started_at,
      };
    });

    // Add user count to companies
    const companiesWithCounts = companies.map(company => ({
      ...company,
      user_count: userCompanies.filter(uc => uc.company_id === company.id).length,
    }));

    // Enrich invitations with company names
    const enrichedInvitations = invitations.map(inv => ({
      ...inv,
      company_name: companiesMap.get(inv.company_id) || 'Empresa',
    }));

    // Enrich audit logs with names
    const enrichedAuditLogs = auditLogs.map(logEntry => ({
      ...logEntry,
      company_name: companiesMap.get(logEntry.company_id) || 'Empresa',
      user_name: profilesMap.get(logEntry.user_id)?.full_name || 'Usuário',
    }));

    // Enrich subscriptions with user info
    const enrichedSubscriptions = subscriptions.map(sub => {
      const profile = profilesMap.get(sub.user_id);
      return {
        ...sub,
        user_email: emailsMap.get(sub.user_id) || '',
        user_name: profile?.full_name || 'Usuário',
      };
    });

    // Calculate billing stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let mrr = 0;
    const planDistribution: Record<string, number> = {
      Iniciante: 0,
      Estrategista: 0,
      Mestre: 0,
      trial: 0,
      free: 0,
    };

    // Count active subscriptions for MRR
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    activeSubscriptions.forEach(sub => {
      const priceId = sub.stripe_price_id || '';
      const monthlyValue = PRICE_TO_MRR[priceId] || 0;
      mrr += monthlyValue;

      const planName = sub.plan_name || PRICE_TO_PLAN[priceId] || 'free';
      if (planName === 'Iniciante' || planName === 'iniciante') {
        planDistribution.Iniciante++;
      } else if (planName === 'Estrategista' || planName === 'estrategista') {
        planDistribution.Estrategista++;
      } else if (planName === 'Mestre' || planName === 'mestre') {
        planDistribution.Mestre++;
      } else {
        planDistribution.free++;
      }
    });

    // Count active trials (users in trial period without active subscription)
    const usersWithActiveSubscription = new Set(activeSubscriptions.map(s => s.user_id));
    let activeTrials = 0;
    profiles.forEach(profile => {
      if (profile.trial_started_at && !usersWithActiveSubscription.has(profile.user_id)) {
        const trialStart = new Date(profile.trial_started_at);
        const trialEnd = new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000);
        if (trialEnd > now) {
          activeTrials++;
          planDistribution.trial++;
        }
      }
    });

    // Count churned this month (subscriptions that became inactive this month)
    const churnedThisMonth = subscriptions.filter(sub => {
      if (sub.status !== 'canceled' && sub.status !== 'inactive') return false;
      const updatedAt = new Date(sub.updated_at || sub.created_at);
      return updatedAt >= startOfMonth;
    }).length;

    // Calculate conversion rate (simplified: active / (active + trial))
    const totalTrialsAndActive = activeSubscriptions.length + activeTrials;
    const conversionRate = totalTrialsAndActive > 0
      ? (activeSubscriptions.length / totalTrialsAndActive) * 100
      : 0;

    // Calculate ARPU
    const averageRevenuePerUser = activeSubscriptions.length > 0
      ? mrr / activeSubscriptions.length
      : 0;

    const billingStats = {
      mrr,
      arr: mrr * 12,
      totalSubscribers: activeSubscriptions.length,
      activeTrials,
      churnedThisMonth,
      conversionRate: Math.round(conversionRate * 10) / 10,
      averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
      planDistribution,
    };

    // Calculate general stats
    const today = new Date().toISOString().split('T')[0];
    const activeToday = users.filter(u =>
      u.last_activity_date && u.last_activity_date.startsWith(today)
    ).length;

    const stats = {
      totalCompanies: companies.length,
      totalUsers: users.length,
      pendingInvitations: invitations.length,
      activeToday,
    };

    log('Data fetched successfully', {
      companies: companies.length,
      users: users.length,
      invitations: invitations.length,
      auditLogs: auditLogs.length,
      subscriptions: subscriptions.length,
      billingStats,
    });

    return successResponse({
      companies: companiesWithCounts,
      users,
      invitations: enrichedInvitations,
      auditLogs: enrichedAuditLogs,
      subscriptions: enrichedSubscriptions,
      billingStats,
      stats,
    }, corsHeaders);

  } catch (error) {
    log('Unexpected error', error);
    return errorResponse('Internal server error', 500, corsHeaders);
  }
});
