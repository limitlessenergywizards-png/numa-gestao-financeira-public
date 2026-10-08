import { describe, it, expect } from 'vitest';
import {
  getRouteLoader,
  hasRouteLoader,
  getAllRoutePaths,
  getAdjacentRoutes,
  adjacentRoutesMap,
} from '../routeModuleMap';

// ================================================================
// getRouteLoader()
// ================================================================
describe('getRouteLoader()', () => {
  it('known route → returns function', () => {
    const loader = getRouteLoader('/inicio');
    expect(typeof loader).toBe('function');
  });

  it('another known route → function', () => {
    expect(typeof getRouteLoader('/dashboard')).toBe('function');
  });

  it('unknown route → null', () => {
    expect(getRouteLoader('/nonexistent')).toBeNull();
  });

  it('empty string → null', () => {
    expect(getRouteLoader('')).toBeNull();
  });
});

// ================================================================
// hasRouteLoader()
// ================================================================
describe('hasRouteLoader()', () => {
  it('/inicio → true', () => {
    expect(hasRouteLoader('/inicio')).toBe(true);
  });

  it('/dashboard → true', () => {
    expect(hasRouteLoader('/dashboard')).toBe(true);
  });

  it('/financeiro/transacoes → true', () => {
    expect(hasRouteLoader('/financeiro/transacoes')).toBe(true);
  });

  it('/nonexistent → false', () => {
    expect(hasRouteLoader('/nonexistent')).toBe(false);
  });

  it('admin route → true', () => {
    expect(hasRouteLoader('/admin')).toBe(true);
  });
});

// ================================================================
// getAllRoutePaths()
// ================================================================
describe('getAllRoutePaths()', () => {
  it('returns non-empty array', () => {
    const paths = getAllRoutePaths();
    expect(paths.length).toBeGreaterThan(0);
  });

  it('includes core routes', () => {
    const paths = getAllRoutePaths();
    expect(paths).toContain('/inicio');
    expect(paths).toContain('/dashboard');
    expect(paths).toContain('/financeiro/transacoes');
  });

  it('all paths start with /', () => {
    getAllRoutePaths().forEach(p => {
      expect(p).toMatch(/^\//);
    });
  });

  it('no duplicates', () => {
    const paths = getAllRoutePaths();
    expect(new Set(paths).size).toBe(paths.length);
  });
});

// ================================================================
// getAdjacentRoutes()
// ================================================================
describe('getAdjacentRoutes()', () => {
  it('/inicio → includes /dashboard', () => {
    expect(getAdjacentRoutes('/inicio')).toContain('/dashboard');
  });

  it('/dashboard → includes /financeiro/transacoes', () => {
    expect(getAdjacentRoutes('/dashboard')).toContain('/financeiro/transacoes');
  });

  it('/financeiro/transacoes → includes related finance routes', () => {
    const adjacent = getAdjacentRoutes('/financeiro/transacoes');
    expect(adjacent).toContain('/financeiro/contas-receber');
    expect(adjacent).toContain('/financeiro/contas-pagar');
  });

  it('unknown route → empty array', () => {
    expect(getAdjacentRoutes('/nonexistent')).toEqual([]);
  });

  it('all adjacent routes are valid route paths', () => {
    const allPaths = getAllRoutePaths();
    Object.values(adjacentRoutesMap).forEach(adjacentRoutes => {
      adjacentRoutes.forEach(route => {
        expect(allPaths).toContain(route);
      });
    });
  });

  it('adjacentRoutesMap keys are valid route paths', () => {
    const allPaths = getAllRoutePaths();
    Object.keys(adjacentRoutesMap).forEach(key => {
      expect(allPaths).toContain(key);
    });
  });
});
