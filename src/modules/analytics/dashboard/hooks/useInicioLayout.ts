'use client';

/**
 * useInicioLayout Hook
 *
 * Manages Inicio page widget order with localStorage persistence.
 * Same pattern as useDashboardLayout but with Inicio-specific widgets.
 */

import { useCallback, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { WidgetConfig } from './useDashboardLayout';

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'heroMetrics', colSpan: 4 },
  { id: 'kpiCards', colSpan: 4 },
  { id: 'dreSummary', colSpan: 4 },

  { id: 'cashFlow', colSpan: 4 },
  { id: 'distributions', colSpan: 4 },
];

const REQUIRED_IDS = new Set(DEFAULT_LAYOUT.map(w => w.id));

export function useInicioLayout(companyId?: string) {
  const storageKey = companyId
    ? `inicio-layout-${companyId}`
    : 'inicio-layout-default';

  const [storedLayout, setLayout, resetLayout] = useLocalStorage<WidgetConfig[]>(
    storageKey,
    DEFAULT_LAYOUT
  );

  const layout = useMemo(() => {
    const storedIds = new Set(storedLayout.map(w => w.id));
    const hasAllRequired = [...REQUIRED_IDS].every(id => storedIds.has(id));
    if (!hasAllRequired || storedLayout.length !== DEFAULT_LAYOUT.length) {
      return DEFAULT_LAYOUT;
    }
    return storedLayout;
  }, [storedLayout]);

  const widgetOrder = useMemo(() => layout.map(w => w.id), [layout]);

  const reorderWidgets = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;

    setLayout((prev) => {
      const oldIndex = prev.findIndex(w => w.id === activeId);
      const newIndex = prev.findIndex(w => w.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, [setLayout]);

  const getWidgetConfig = useCallback((id: string): WidgetConfig | undefined => {
    return layout.find(w => w.id === id);
  }, [layout]);

  const resetToDefault = useCallback(() => {
    resetLayout();
  }, [resetLayout]);

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
