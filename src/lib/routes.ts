/**
 * Application Routes
 * 
 * ╔══════════════════════════════════════════════╗
 * ║  SINGLE SOURCE OF TRUTH — ALL ROUTE PATHS   ║
 * ║  NEVER hardcode a URL string in components.  ║
 * ║  Import from here or face the 404 abyss.     ║
 * ╚══════════════════════════════════════════════╝
 */

// ============================================
// LEGACY ROUTES (Redirect adapters)
// ============================================

export const LEGACY_ROUTES = {
  TRANSACTIONS: '/movimentacoes',
  RECURRENCE: '/recorrencias',
  RECEIVABLES: '/contas-receber',
  PAYABLES: '/contas-pagar',
  CASH_FLOW: '/relatorios/fluxo-caixa',
  DRE: '/relatorios/dre',
  RECONCILIATION: '/reconciliacao',
  FINANCIAL_HEALTH: '/saude-financeira',
  DEBTS: '/dividas',
  ADVANCED_REPORTS: '/relatorios/avancados',
  CUSTOMERS: '/cadastros/clientes',
  SUPPLIERS: '/cadastros/fornecedores',
  BANK_ACCOUNTS: '/cadastros/contas-bancarias',
  CHART_OF_ACCOUNTS: '/cadastros/plano-contas',
  COST_CENTERS: '/cadastros/centros-custo',
  CATEGORIES: '/cadastros/categorias',
} as const;

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================

export const PUBLIC_ROUTES = {
  LANDING: '/',
  LANDING_TRIAD: '/preco-triade',
  AUTH: '/auth',
  FORGOT_PASSWORD: '/esqueci-senha',
  RESET_PASSWORD: '/redefinir-senha',
  ACCEPT_INVITATION: '/aceitar-convite',
  ACTIVATE_ACCOUNT: '/ativar-conta',
  TRIAL_EXPIRED: '/plano-expirado',
  PAYMENT_SUCCESS: '/pagamento/sucesso',
} as const;

// ============================================
// LEGAL ROUTES
// ============================================

export const LEGAL_ROUTES = {
  TERMS: '/termos',
  PRIVACY: '/privacidade',
  LGPD: '/lgpd',
} as const;

// ============================================
// LANDING PAGE ROUTES (segmented)
// ============================================

export const LP_ROUTES = {
  STRATEGIC_LUXURY: '/lp/strategic-luxury',
  INFOPRODUTOR: '/lp/infoprodutor',
  PROFISSIONAL_LIBERAL: '/lp/profissional-liberal',
  EMPRESAS: '/lp/empresas',
} as const;

// ============================================
// MAIN ROUTES (require company + subscription)
// ============================================

export const MAIN_ROUTES = {
  HOME: '/inicio',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/financeiro/transacoes',
  RECURRENCE: '/financeiro/recorrencias',
  RECEIVABLES: '/financeiro/contas-receber',
  PAYABLES: '/financeiro/contas-pagar',
  CASH_FLOW: '/financeiro/fluxo-caixa',
  DRE: '/financeiro/dre',
  RECONCILIATION: '/financeiro/reconciliacao',
  FINANCIAL_HEALTH: '/financeiro/saude-financeira',
  DEBTS: '/financeiro/dividas',
  CREDITORS: '/financeiro/credores',
  BUDGET: '/orcamento',
  AI_CHAT: '/consultor-ai',
} as const;

// ============================================
// REPORT ROUTES
// ============================================

export const REPORT_ROUTES = {
  // Now pointing to MAIN_ROUTES aliases where appropriate or canonical report paths
  CASH_FLOW: '/financeiro/fluxo-caixa', // Consolidated to Finance
  DRE: '/financeiro/dre',         // Consolidated to Finance
  ADVANCED: '/analise/relatorios',
  RECONCILIATION: '/financeiro/reconciliacao',
  JOURNEY: '/minha-jornada',
  OCR_HISTORY: '/historico-ocr',
} as const;

// ============================================
// SETTINGS/REGISTRATION ROUTES
// ============================================

export const SETTINGS_ROUTES = {
  CUSTOMERS: '/crm/clientes',
  SUPPLIERS: '/crm/fornecedores',
  BANK_ACCOUNTS: '/financeiro/contas-bancarias',
  CHART_OF_ACCOUNTS: '/financeiro/plano-contas',
  COST_CENTERS: '/financeiro/centros-custo',
  CATEGORIES: '/financeiro/categorias',
  SETTINGS: '/configuracoes',
  PROFILE: '/perfil',
  ONBOARDING: '/onboarding',
} as const;

// ============================================
// ADMIN ROUTES (require super admin)
// ============================================

export const ADMIN_ROUTES = {
  ADMIN: '/admin',
  DASHBOARD: '/admin/dashboard',
  TENANTS: '/admin/tenants',
  PAYMENTS: '/admin/payments',
  SUPPORT: '/admin/support',
  SETTINGS: '/admin/settings',
} as const;

// ============================================
// SUPPORT ROUTES
// ============================================

export const SUPPORT_ROUTES = {
  MANUAL: '/manual',
  MANUAL_ARTICLE: '/manual/artigo',
} as const;

// ============================================
// ALL ROUTES (for type checking)
// ============================================

export const ROUTES = {
  ...PUBLIC_ROUTES,
  ...LEGAL_ROUTES,
  ...LP_ROUTES,
  ...MAIN_ROUTES,
  ...REPORT_ROUTES,
  ...SETTINGS_ROUTES,
  ...ADMIN_ROUTES,
  ...SUPPORT_ROUTES,
} as const;

// ============================================
// ROUTE GROUPS (for navigation)
// ============================================

export const ROUTE_GROUPS = {
  MAIN: Object.values(MAIN_ROUTES),
  REPORTS: Object.values(REPORT_ROUTES),
  SETTINGS: Object.values(SETTINGS_ROUTES),
  ADMIN: Object.values(ADMIN_ROUTES),
  SUPPORT: Object.values(SUPPORT_ROUTES),
} as const;

// ============================================
// PROTECTED ROUTES (require subscription)
// ============================================

export const SUBSCRIPTION_PROTECTED_ROUTES = [
  ...Object.values(MAIN_ROUTES),
  ...Object.values(REPORT_ROUTES),
  SETTINGS_ROUTES.CUSTOMERS,
  SETTINGS_ROUTES.SUPPLIERS,
  SETTINGS_ROUTES.BANK_ACCOUNTS,
  SETTINGS_ROUTES.CHART_OF_ACCOUNTS,
  SETTINGS_ROUTES.COST_CENTERS,
  SETTINGS_ROUTES.CATEGORIES,
] as const;

// ============================================
// TYPE EXPORTS
// ============================================

export type PublicRoute = typeof PUBLIC_ROUTES[keyof typeof PUBLIC_ROUTES];
export type LPRoute = typeof LP_ROUTES[keyof typeof LP_ROUTES];
export type MainRoute = typeof MAIN_ROUTES[keyof typeof MAIN_ROUTES];
export type ReportRoute = typeof REPORT_ROUTES[keyof typeof REPORT_ROUTES];
export type SettingsRoute = typeof SETTINGS_ROUTES[keyof typeof SETTINGS_ROUTES];
export type AdminRoute = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES];
export type SupportRoute = typeof SUPPORT_ROUTES[keyof typeof SUPPORT_ROUTES];
export type AppRoute = typeof ROUTES[keyof typeof ROUTES];

// ============================================
// ROUTE BUILDER (type-safe dynamic segments)
// ============================================

/**
 * Build a route with dynamic segments replaced.
 * @example buildRoute('/manual/artigo', '123') => '/manual/artigo/123'
 * @example buildRoute('/users', userId, 'edit') => '/users/{userId}/edit'
 */
export function buildRoute(base: string, ...segments: (string | number)[]): string {
  if (segments.length === 0) return base;
  const suffix = segments.map(s => encodeURIComponent(String(s))).join('/');
  return `${base}/${suffix}`;
}
