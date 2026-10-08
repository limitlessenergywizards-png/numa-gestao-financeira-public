/**
 * DraggableWidget Component
 *
 * A wrapper component that makes any widget draggable using @dnd-kit.
 * Provides visual feedback during drag operations with glassmorphism styling.
 */

import { ReactNode, forwardRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableWidgetProps {
  id: string;
  children: ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4;
  disabled?: boolean;
}

// Map colSpan to Tailwind grid classes
const COL_SPAN_CLASS = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
} as const;

export const DraggableWidget = forwardRef<HTMLDivElement, DraggableWidgetProps>(
  ({ id, children, className, colSpan = 1, disabled = false }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
      isOver,
    } = useSortable({
      id,
      disabled,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: transition || 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)',
      zIndex: isDragging ? 50 : undefined,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative group col-span-1',
          COL_SPAN_CLASS[colSpan],
          'transition-opacity duration-200',
          isDragging && 'opacity-30 scale-[0.98]',
          isOver && 'ring-2 ring-brand/40 ring-offset-2 ring-offset-background rounded-xl',
          className
        )}
      >
        {/* Drag Handle Bar */}
        {!disabled && (
          <div
            {...attributes}
            {...listeners}
            className={cn(
              'flex items-center justify-center gap-2',
              'w-full py-1.5 px-3',
              'rounded-t-xl',
              'bg-glass-elevated/30 dark:bg-glass-elevated/20',
              'border-b border-white/10 dark:border-white/5',
              'text-muted-foreground/40 group-hover:text-muted-foreground/70',
              'opacity-50 group-hover:opacity-100',
              'transition-opacity duration-300',
              'cursor-grab active:cursor-grabbing',
              'select-none',
              isDragging && 'opacity-100 cursor-grabbing text-brand/60'
            )}
            role="button"
            tabIndex={0}
            aria-label={`Arrastar widget ${id}`}
          >
            <div className="h-px flex-1 bg-current opacity-20" />
            <GripVertical className="h-3.5 w-3.5 shrink-0" />
            <div className="h-px flex-1 bg-current opacity-20" />
          </div>
        )}

        {/* Widget Content */}
        <div
          ref={ref}
          className="h-full"
        >
          {children}
        </div>
      </div>
    );
  }
);

DraggableWidget.displayName = 'DraggableWidget';

/** Static overlay wrapper used inside DragOverlay to render the active widget */
export function DraggableWidgetOverlay({
  children,
  colSpan = 1,
  className,
}: {
  children: ReactNode;
  colSpan?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'col-span-1',
        COL_SPAN_CLASS[colSpan],
        'rounded-xl overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

DraggableWidgetOverlay.displayName = 'DraggableWidgetOverlay';
