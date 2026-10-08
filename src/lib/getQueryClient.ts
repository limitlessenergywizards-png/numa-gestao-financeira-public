/**
 * Server-side QueryClient factory for Next.js App Router.
 *
 * Uses React's cache() to ensure one QueryClient per server request.
 * Must match the defaultOptions from app/providers.tsx so that
 * server-prefetched data behaves identically to client-fetched data.
 */

import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';
import { CACHE } from '@/lib/config';

const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: CACHE.DEFAULT_STALE_TIME,
          gcTime: CACHE.DEFAULT_GC_TIME,
        },
      },
    })
);

export default getQueryClient;
