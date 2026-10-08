'use client';

/**
 * useDashboardLayout Hook
 * 
 * Manages dashboard widget order with localStorage persistence.
 * Supports multi-tenancy by using company-specific keys.
 */

import { useCallback, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface WidgetConfig {
  id: string;
  colSpan: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
}

// Default widget layout configuration
const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'metric_saldo_inicial', colSpan: 1 },
  { id: 'metric_resultado', colSpan: 1 },
  { id: 'metric_receitas', colSpan: 1 },
  { id: 'metric_despesas', colSpan: 1 },
  { id: 'metric_saldo_conta', colSpan: 1 },
  { id: 'metric_a_receber', colSpan: 1 },
  { id: 'metric_a_pagar', colSpan: 1 },
  { id: 'metric_margem', colSpan: 1 },
  { id: 'chart', colSpan: 2 },
  { id: 'situation', colSpan: 2 },
  { id: 'transactions', colSpan: 4 },
  { id: 'projection', colSpan: 4 },
];

// IDs that must exist in a valid layout
const REQUIRED_IDS = new Set(DEFAULT_LAYOUT.map(w => w.id));

export function useDashboardLayout(companyId?: string) {
  const storageKey = companyId
    ? `dashboard-layout-${companyId}`
    : 'dashboard-layout-default';

  const [storedLayout, setLayout, resetLayout] = useLocalStorage<WidgetConfig[]>(
    storageKey,
    DEFAULT_LAYOUT
  );

  // Auto-migrate: if cached layout is missing required widgets, reset to default
  const layout = useMemo(() => {
    const storedIds = new Set(storedLayout.map(w => w.id));
    const hasAllRequired = [...REQUIRED_IDS].every(id => storedIds.has(id));
    // Also check for legacy 'metrics' widget that needs migration
    const hasLegacyMetrics = storedIds.has('metrics');
    if (!hasAllRequired || hasLegacyMetrics) {
      return DEFAULT_LAYOUT;
    }
    return storedLayout;
  }, [storedLayout]);

  // Get widget order as string array for SortableContext
  const widgetOrder = useMemo(() => layout.map(w => w.id), [layout]);

  // Reorder widgets after drag end
  const reorderWidgets = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;

    setLayout((prev) => {
      const oldIndex = prev.findIndex(w => w.id === activeId);
      const newIndex = prev.findIndex(w => w.id === overId);

      if (oldIndex === -1 || newIndex === -1) return prev;

      return arrayMove(prev, oldIndex, newIndex);
    });
  }, [setLayout]);

  // Get config for a specific widget
  const getWidgetConfig = useCallback((id: string): WidgetConfig | undefined => {
    return layout.find(w => w.id === id);
  }, [layout]);

  // Reset to default layout
  const resetToDefault = useCallback(() => {
    resetLayout();
  }, [resetLayout]);

  // Check if current layout differs from default
  const isCustomLayout = useMemo(() => {
    if (layout.length !== DEFAULT_LAYOUT.length) return true;
    return layout.some((w, i) => w.id !== DEFAULT_LAYOUT[i].id);
  }, [layout]);

  return {
    layout,
    widgetOrder,
    reorderWidgets,
    getWidgetConfig,
    resetToDefault,
    isCustomLayout,
  };
}
