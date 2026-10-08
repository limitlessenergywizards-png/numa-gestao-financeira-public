'use client';

/**
 * DashboardGrid Component
 *
 * Container component that manages drag and drop context for dashboard widgets.
 * Uses @dnd-kit for accessible, performant drag and drop functionality.
 */

import { ReactNode, useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  children: ReactNode;
  widgetOrder: string[];
  onReorder: (activeId: string, overId: string) => void;
  onReset?: () => void;
  isCustomLayout?: boolean;
  className?: string;
  renderOverlay?: (activeId: string) => ReactNode;
}

export function DashboardGrid({
  children,
  widgetOrder,
  onReorder,
  onReset,
  className,
  renderOverlay,
}: DashboardGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors with activation constraints to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }

    setActiveId(null);
  }, [onReorder]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
        {/* Reset Button */}
        {onReset && (
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="h-3 w-3" />
              Resetar layout
            </Button>
          </div>
        )}

        {/* Grid Container */}
        <div
          className={cn(
            'grid grid-cols-1 lg:grid-cols-4 gap-6',
            activeId && 'select-none',
            className
          )}
        >
          {children}
        </div>
      </SortableContext>

      {/* Drag Overlay for visual feedback */}
      <DragOverlay
        adjustScale={false}
        dropAnimation={{
          duration: 300,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: '0.3' } },
          }),
        }}
      >
        {activeId ? (
          renderOverlay ? (
            <div className="pointer-events-none rounded-xl shadow-2xl shadow-brand/25 ring-2 ring-brand/30 scale-[1.02] opacity-95">
              {renderOverlay(activeId)}
            </div>
          ) : (
            <div className="opacity-80 pointer-events-none">
              <div className="h-32 w-full rounded-xl bg-glass-elevated/50 border border-brand/30 backdrop-blur-sm shadow-xl" />
            </div>
          )
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
