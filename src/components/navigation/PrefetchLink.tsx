'use client';

/**
 * PrefetchLink - Intelligent Navigation Link with Prefetching
 *
 * Wrapper around next/link that automatically prefetches:
 * 1. Route CODE module (via useRoutePrefetch)
 * 2. Route DATA queries (via usePrefetchRoute)
 * when user hovers or focuses on the link.
 *
 * Next.js <Link> already handles route code prefetching, so
 * we focus on data prefetching here.
 */

import { forwardRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrefetchRoute } from '@/hooks/usePrefetchRoute';
import { cn } from '@/lib/utils';

export interface PrefetchLinkProps
  extends React.ComponentProps<typeof Link> {
  /** Disable prefetching for this link */
  noPrefetch?: boolean;
  /** Class applied when route is active */
  activeClassName?: string;
}

export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  ({ href, noPrefetch = false, className, activeClassName, children, ...props }, ref) => {
    const pathname = usePathname();
    const path = typeof href === 'string' ? href : href?.pathname || '';
    const isActive = pathname === path;

    // Data prefetch (React Query)
    const { prefetchHandlers } = usePrefetchRoute();
    const dataHandlers = prefetchHandlers(path);

    // Defensive: if href is somehow undefined, render as span to avoid React warning
    if (!href) {
      return <span className={className}>{children}</span>;
    }

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!noPrefetch) {
        dataHandlers.onMouseEnter();
      }
      props.onMouseEnter?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
      if (!noPrefetch) {
        dataHandlers.onFocus();
      }
      props.onFocus?.(e);
    };

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        prefetch={!noPrefetch}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

PrefetchLink.displayName = 'PrefetchLink';
