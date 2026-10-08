'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog || !pathname) return;
    if (typeof window === 'undefined') return;

    const query = searchParams?.toString();
    const url = query ? `${window.location.origin}${pathname}?${query}` : `${window.location.origin}${pathname}`;

    posthog.capture('$pageview', {
      $current_url: url,
      $pathname: pathname,
    });
  }, [pathname, searchParams, posthog]);

  return null;
}

/**
 * Escuta SPA navigations (App Router pathname + searchParams) e dispara
 * $pageview manualmente em cada mudança.
 *
 * Wrap em Suspense porque useSearchParams precisa de Suspense boundary
 * no Next.js 14+ App Router.
 */
export function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
