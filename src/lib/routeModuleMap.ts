/**
 * Route Module Map - Enterprise Prefetching System
 *
 * Centralized mapping of URL paths to their dynamic imports.
 * Uses the canonical route paths from routes.ts (inline to avoid import dep).
 */

export interface RouteModule {
  path: string;
  loader: () => Promise<unknown>;
  priority: number;
}

// Dynamic import functions for each route
// NOTE: Path strings MUST match MAIN_ROUTES / SETTINGS_ROUTES / etc. in routes.ts
const routeLoaders: Record<string, () => Promise<unknown>> = {
  // Core navigation
  '/inicio': () => import('@/modules/home/pages/InicioPage'),
  '/dashboard': () => import('@/modules/analytics/dashboard'),

  // Finance (MAIN_ROUTES)
  '/financeiro/transacoes': () => import('@/modules/finance/transactions'),
  '/financeiro/contas-receber': () => import('@/modules/finance/receivables'),
  '/financeiro/contas-pagar': () => import('@/modules/finance/payables'),
  '/financeiro/fluxo-caixa': () => import('@/modules/finance/cashflow'),
  '/financeiro/dre': () => import('@/modules/finance/dre'),
  '/financeiro/reconciliacao': () => import('@/modules/finance/reconciliation'),
  '/financeiro/recorrencias': () => import('@/modules/finance/recurrence'),
  '/financeiro/dividas': () => import('@/modules/finance/debts'),
  '/financeiro/saude-financeira': () => import('@/modules/finance/financial-health'),

  // Reports
  '/analise/relatorios': () => import('@/modules/analytics/reports'),
  '/minha-jornada': () => import('@/modules/onboarding/journey/pages/MyJourneyPage'),
  '/historico-ocr': () => import('@/modules/finance/ocr/pages/OcrHistoryPage'),

  // CRM / Settings (SETTINGS_ROUTES)
  '/crm/clientes': () => import('@/modules/crm/customers'),
  '/crm/fornecedores': () => import('@/modules/crm/suppliers'),
  '/financeiro/plano-contas': () => import('@/modules/finance/ledger'),
  '/financeiro/centros-custo': () => import('@/modules/finance/cost-centers'),
  '/financeiro/contas-bancarias': () => import('@/modules/finance/treasury'),
  '/financeiro/categorias': () => import('@/modules/finance/categories'),
  '/configuracoes': () => import('@/modules/iam/settings'),

  // Admin & User
  '/admin': () => import('@/modules/admin/pages/SuperAdminPage'),
  '/perfil': () => import('@/modules/iam/users/pages/Profile'),
};

export type RoutePath = string;

/**
 * Get the dynamic import loader for a route
 */
export function getRouteLoader(path: string): (() => Promise<unknown>) | null {
  return routeLoaders[path] || null;
}

/**
 * Check if a route has a prefetch loader
 */
export function hasRouteLoader(path: string): boolean {
  return path in routeLoaders;
}

/**
 * Get all available route paths
 */
export function getAllRoutePaths(): string[] {
  return Object.keys(routeLoaders);
}

/**
 * Adjacent routes mapping - routes that should be prefetched
 * when user navigates to a specific route.
 * Paths MUST match MAIN_ROUTES / SETTINGS_ROUTES in routes.ts.
 */
export const adjacentRoutesMap: Record<string, string[]> = {
  '/inicio': ['/dashboard', '/financeiro/transacoes', '/financeiro/contas-receber'],
  '/dashboard': ['/inicio', '/financeiro/transacoes', '/financeiro/contas-receber', '/financeiro/contas-pagar'],
  '/financeiro/transacoes': ['/financeiro/contas-receber', '/financeiro/contas-pagar', '/financeiro/fluxo-caixa'],
  '/financeiro/contas-receber': ['/financeiro/contas-pagar', '/financeiro/transacoes', '/financeiro/fluxo-caixa'],
  '/financeiro/contas-pagar': ['/financeiro/contas-receber', '/financeiro/transacoes', '/financeiro/fluxo-caixa'],
  '/financeiro/fluxo-caixa': ['/financeiro/dre', '/financeiro/transacoes', '/financeiro/reconciliacao'],
  '/financeiro/dre': ['/financeiro/fluxo-caixa', '/analise/relatorios'],
  '/financeiro/reconciliacao': ['/financeiro/fluxo-caixa', '/financeiro/transacoes'],
  '/financeiro/dividas': ['/financeiro/contas-pagar', '/financeiro/fluxo-caixa'],
  '/financeiro/saude-financeira': ['/analise/relatorios', '/financeiro/dividas'],
  '/crm/clientes': ['/crm/fornecedores', '/financeiro/contas-receber'],
  '/crm/fornecedores': ['/crm/clientes', '/financeiro/contas-pagar'],
  '/configuracoes': ['/perfil', '/financeiro/plano-contas'],
};

/**
 * Get adjacent routes for contextual prefetching
 */
export function getAdjacentRoutes(currentPath: string): string[] {
  return adjacentRoutesMap[currentPath] || [];
}
