/**
 * API Endpoints — Single Source of Truth
 *
 * Centralizes every backend endpoint (Supabase tables, RPCs, and Edge Functions).
 * Import constants from here instead of using magic strings.
 *
 * @example
 * import { TABLES, RPC, EDGE_FUNCTIONS } from '@/lib/api-endpoints';
 * supabase.from(TABLES.TRANSACTIONS).select('*');
 * supabase.rpc(RPC.GET_FINANCIAL_TOTALS, { ... });
 * supabase.functions.invoke(EDGE_FUNCTIONS.CHECK_SUBSCRIPTION);
 */

// ─── Supabase Tables ────────────────────────────────────────────────────────

export const TABLES = {
    // Core
    COMPANIES: 'companies',
    USER_COMPANIES: 'user_companies',

    // Finance — Transactions
    TRANSACTIONS: 'transactions',
    BANK_ACCOUNTS: 'bank_accounts',
    CATEGORIES: 'categories',
    CHART_OF_ACCOUNTS: 'chart_of_accounts',

    // Finance — Receivables & Payables
    RECEIVABLES: 'receivables',
    PAYABLES: 'payables',
    PAYMENT_RECORDS: 'payment_records',
    DEBTS: 'debts',

    // Finance — Recurrence
    RECURRING_TRANSACTIONS: 'recurring_transactions',

    // Finance — Reconciliation
    BANK_STATEMENTS: 'bank_statements',
    BANK_STATEMENT_IMPORTS: 'bank_statement_imports',

    // CRM
    CUSTOMERS: 'customers',
    SUPPLIERS: 'suppliers',

    // IAM
    USER_INVITATIONS: 'user_invitations',

    // Onboarding & Gamification
    ONBOARDING_PROGRESS: 'onboarding_progress',
    USER_ACTIVITY_LOGS: 'user_activity_logs',
    WEEKLY_CHALLENGES: 'weekly_challenges',
    CHALLENGE_PARTICIPANTS: 'challenge_participants',
    USER_ACHIEVEMENTS: 'user_achievements',

    // Templates
    CHART_ACCOUNT_TEMPLATES: 'chart_account_templates',
    CHART_ACCOUNT_TEMPLATE_ITEMS: 'chart_account_template_items',
    CHART_ACCOUNT_TEMPLATE_DRE_MAPPING: 'chart_account_template_dre_mapping',

    // OCR
    OCR_SCANS: 'ocrscans',

    // Audit
    AUDIT_LOG: 'audit_log',
} as const;

// ─── Supabase RPCs ──────────────────────────────────────────────────────────

export const RPC = {
    /** Dashboard financial totals (aggregated server-side) */
    GET_FINANCIAL_TOTALS: 'get_financial_totals',

    /** Convert a forecast transaction into a realized one */
    CONVERT_FORECAST_TO_ACTUAL: 'convert_forecast_to_actual',

    /** Get full user context (roles, companies, subscription) */
    GET_USER_CONTEXT: 'get_user_context',
} as const;

// ─── Supabase Edge Functions ────────────────────────────────────────────────

export const EDGE_FUNCTIONS = {
    // Analytics & AI
    /** AI-powered DRE analysis */
    ANALYZE_DRE: 'analyze-dre',

    /** AI-powered cash flow projection analysis */
    ANALYZE_CASHFLOW_PROJECTION: 'analyze-cashflow-projection',

    /** AI personality-based financial insights */
    ANALYZE_PERSONALITY: 'analyze-personality',

    /** AI-powered conversational chat */
    AI_CHAT: 'ai-chat',

    /** AI OCR document extraction proxy */
    AI_OCR_PROXY: 'ai-ocr-proxy',

    // Reports
    /** Email scheduled DRE reports */
    SEND_DRE_REPORT: 'send-dre-report',

    // Subscription & Billing
    /** Check current subscription status */
    CHECK_SUBSCRIPTION: 'check-subscription',

    /** Create Stripe checkout session */
    CREATE_CHECKOUT_SESSION: 'create-checkout-session',

    /** Create Stripe customer portal session */
    CREATE_PORTAL_SESSION: 'create-portal-session',

    // Admin
    /** Fetch global admin dashboard data */
    ADMIN_GLOBAL_DATA: 'admin-global-data',

    /** Impersonate a user (super admin only) */
    ADMIN_IMPERSONATE: 'admin-impersonate',

    // IAM
    /** Send team invitation email */
    SEND_INVITATION_EMAIL: 'send-invitation-email',
} as const;

// ─── Type Helpers ───────────────────────────────────────────────────────────

export type TableName = (typeof TABLES)[keyof typeof TABLES];
export type RPCName = (typeof RPC)[keyof typeof RPC];
export type EdgeFunctionName = (typeof EDGE_FUNCTIONS)[keyof typeof EDGE_FUNCTIONS];
