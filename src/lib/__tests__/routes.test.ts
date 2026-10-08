import { describe, it, expect } from 'vitest';
import {
  PUBLIC_ROUTES,
  LEGAL_ROUTES,
  LP_ROUTES,
  MAIN_ROUTES,
  REPORT_ROUTES,
  SETTINGS_ROUTES,
  ADMIN_ROUTES,
  SUPPORT_ROUTES,
  LEGACY_ROUTES,
  ROUTES,
  ROUTE_GROUPS,
  SUBSCRIPTION_PROTECTED_ROUTES,
  buildRoute,
} from '../routes';

// ================================================================
// Route constants structure
// ================================================================
describe('Route constants', () => {
  it('PUBLIC_ROUTES starts with /', () => {
    Object.values(PUBLIC_ROUTES).forEach(r => {
      expect(r).toMatch(/^\//);
    });
  });

  it('MAIN_ROUTES all start with /', () => {
    Object.values(MAIN_ROUTES).forEach(r => {
      expect(r).toMatch(/^\//);
    });
  });

  it('ADMIN_ROUTES all start with /admin', () => {
    Object.values(ADMIN_ROUTES).forEach(r => {
      expect(r).toMatch(/^\/admin/);
    });
  });

  it('LEGAL_ROUTES has termos, privacidade, lgpd', () => {
    expect(LEGAL_ROUTES.TERMS).toBe('/termos');
    expect(LEGAL_ROUTES.PRIVACY).toBe('/privacidade');
    expect(LEGAL_ROUTES.LGPD).toBe('/lgpd');
  });

  it('LP_ROUTES are segmented landing pages', () => {
    Object.values(LP_ROUTES).forEach(r => {
      expect(r).toMatch(/^\/lp\//);
    });
  });

  it('SUPPORT_ROUTES has manual paths', () => {
    expect(SUPPORT_ROUTES.MANUAL).toBe('/manual');
    expect(SUPPORT_ROUTES.MANUAL_ARTICLE).toBe('/manual/artigo');
  });

  it('no duplicate values across route groups', () => {
    const allRoutes = [
      ...Object.values(PUBLIC_ROUTES),
      ...Object.values(LEGAL_ROUTES),
      ...Object.values(LP_ROUTES),
      ...Object.values(ADMIN_ROUTES),
      ...Object.values(SUPPORT_ROUTES),
    ];
    const set = new Set(allRoutes);
    expect(set.size).toBe(allRoutes.length);
  });
});

// ================================================================
// ROUTES (merged)
// ================================================================
describe('ROUTES', () => {
  it('contains all PUBLIC_ROUTES', () => {
    for (const route of Object.values(PUBLIC_ROUTES)) {
      expect(Object.values(ROUTES)).toContain(route);
    }
  });

  it('MAIN_ROUTES values are present in ROUTES values (except overlapping keys)', () => {
    // ADMIN_ROUTES.DASHBOARD overwrites MAIN_ROUTES.DASHBOARD in the spread
    const routeValues = Object.values(ROUTES);
    const mainValues = Object.values(MAIN_ROUTES);
    // Most main routes should be present
    const present = mainValues.filter(v => routeValues.includes(v));
    expect(present.length).toBeGreaterThan(mainValues.length - 3);
  });

  it('contains all ADMIN_ROUTES values', () => {
    const routeValues = Object.values(ROUTES);
    for (const route of Object.values(ADMIN_ROUTES)) {
      expect(routeValues).toContain(route);
    }
  });
});

// ================================================================
// ROUTE_GROUPS
// ================================================================
describe('ROUTE_GROUPS', () => {
  it('MAIN group contains all MAIN_ROUTES values', () => {
    expect(ROUTE_GROUPS.MAIN).toEqual(Object.values(MAIN_ROUTES));
  });

  it('ADMIN group contains all ADMIN_ROUTES values', () => {
    expect(ROUTE_GROUPS.ADMIN).toEqual(Object.values(ADMIN_ROUTES));
  });

  it('each group is a non-empty array', () => {
    Object.values(ROUTE_GROUPS).forEach(group => {
      expect(group.length).toBeGreaterThan(0);
    });
  });
});

// ================================================================
// SUBSCRIPTION_PROTECTED_ROUTES
// ================================================================
describe('SUBSCRIPTION_PROTECTED_ROUTES', () => {
  it('includes all MAIN_ROUTES', () => {
    for (const route of Object.values(MAIN_ROUTES)) {
      expect(SUBSCRIPTION_PROTECTED_ROUTES).toContain(route);
    }
  });

  it('does not include public routes', () => {
    for (const route of Object.values(PUBLIC_ROUTES)) {
      expect(SUBSCRIPTION_PROTECTED_ROUTES).not.toContain(route);
    }
  });

  it('does not include admin routes', () => {
    expect(SUBSCRIPTION_PROTECTED_ROUTES).not.toContain(ADMIN_ROUTES.ADMIN);
    expect(SUBSCRIPTION_PROTECTED_ROUTES).not.toContain(ADMIN_ROUTES.DASHBOARD);
  });
});

// ================================================================
// LEGACY_ROUTES
// ================================================================
describe('LEGACY_ROUTES', () => {
  it('has redirect paths for old URLs', () => {
    expect(LEGACY_ROUTES.TRANSACTIONS).toBe('/movimentacoes');
    expect(LEGACY_ROUTES.RECEIVABLES).toBe('/contas-receber');
    expect(LEGACY_ROUTES.PAYABLES).toBe('/contas-pagar');
  });

  it('all legacy paths start with /', () => {
    Object.values(LEGACY_ROUTES).forEach(r => {
      expect(r).toMatch(/^\//);
    });
  });
});

// ================================================================
// buildRoute()
// ================================================================
describe('buildRoute()', () => {
  it('no segments → returns base', () => {
    expect(buildRoute('/manual')).toBe('/manual');
  });

  it('single string segment', () => {
    expect(buildRoute('/manual/artigo', '123')).toBe('/manual/artigo/123');
  });

  it('single numeric segment', () => {
    expect(buildRoute('/users', 42)).toBe('/users/42');
  });

  it('multiple segments', () => {
    expect(buildRoute('/users', 'abc', 'edit')).toBe('/users/abc/edit');
  });

  it('encodes special characters', () => {
    const result = buildRoute('/search', 'hello world');
    expect(result).toBe('/search/hello%20world');
  });

  it('encodes slashes in segments', () => {
    const result = buildRoute('/files', 'path/to/file');
    expect(result).toBe('/files/path%2Fto%2Ffile');
  });

  it('number 0 is preserved', () => {
    expect(buildRoute('/items', 0)).toBe('/items/0');
  });
});
