'use client';

/**
 * VirtualList - High-performance virtualized list component
 * 
 * Only renders visible items plus a small buffer (overscan),
 * dramatically improving performance for large lists.
 */

import type { JSX } from 'react';
import { useRef, forwardRef, useImperativeHandle, memo, ReactNode } from 'react';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Maximum height of the container */
  containerHeight?: number;
  /** Number of items to render outside visible area */
  overscan?: number;
  /** Custom className for container */
  className?: string;
  /** Custom className for items */
  itemClassName?: string;
  /** Render function for each item */
  renderItem: (item: T, index: number, virtualItem: VirtualItem) => ReactNode;
  /** Empty state component */
  emptyState?: ReactNode;
  /** Enable smooth scrolling */
  smoothScroll?: boolean;
}

export interface VirtualListRef {
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' }) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

function VirtualListInner<T>(
  props: VirtualListProps<T>,
  ref: React.Ref<VirtualListRef>
) {
  const {
    items,
    itemHeight,
    containerHeight = 400,
    overscan = 5,
    className,
    itemClassName,
    renderItem,
    emptyState,
    smoothScroll = true,
  } = props;

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  // Expose scroll methods
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, options) => {
      virtualizer.scrollToIndex(index, {
        align: options?.align ?? 'start',
        behavior: smoothScroll ? 'smooth' : 'auto',
      });
    },
    scrollToTop: () => {
      parentRef.current?.scrollTo({
        top: 0,
        behavior: smoothScroll ? 'smooth' : 'auto',
      });
    },
    scrollToBottom: () => {
      virtualizer.scrollToIndex(items.length - 1, {
        align: 'end',
        behavior: smoothScroll ? 'smooth' : 'auto',
      });
    },
  }), [virtualizer, items.length, smoothScroll]);

  // Empty state
  if (items.length === 0) {
    return emptyState || null;
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={cn(
        'virtual-list-container overflow-auto overscroll-contain',
        className
      )}
      style={{ height: containerHeight }}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              className={cn('absolute left-0 w-full list-item', itemClassName)}
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index, virtualItem)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Forward ref with generic type support
export const VirtualList = memo(forwardRef(VirtualListInner)) as <T>(
  props: VirtualListProps<T> & { ref?: React.Ref<VirtualListRef> }
) => JSX.Element;

/**
 * Threshold helper - decides whether to use virtualization
 */
export const VIRTUALIZATION_THRESHOLD = 50;

// eslint-disable-next-line react-refresh/only-export-components
export const shouldVirtualize = (itemCount: number, threshold = VIRTUALIZATION_THRESHOLD): boolean => {
  return itemCount > threshold;
};
