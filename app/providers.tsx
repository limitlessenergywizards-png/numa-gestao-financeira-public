'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? lazy(() =>
        import('@tanstack/react-query-devtools').then((m) => ({
          default: m.ReactQueryDevtools,
        }))
      )
    : () => null;
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FluidToastProvider, FluidToastRegistrar } from '@/components/overlays';
import { ErrorBoundary, DashboardPrefetchProvider, FilterStoreInitializer } from '@/components/shared';
import { AuthProvider } from '@/contexts/AuthContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AnimationProvider } from '@/contexts/AnimationContext';
import { LazyMotion, domAnimation } from 'framer-motion';
import { createQueryPersister, shouldDehydrateQuery } from '@/lib/queryPersistence';
import { CACHE } from '@/lib/config';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';

const MAX_AGE = 1000 * 60 * 5; // 5 minutes

interface ProvidersProps {
  children: React.ReactNode;
  initialSession?: Session | null;
}

function ProviderInner({ children, initialSession }: ProvidersProps) {
  useEffect(() => {
    import('@/lib/performanceMonitor').then(({ initPerformanceMonitoring }) => {
      initPerformanceMonitoring();
    });
  }, []);

  return (
    <LazyMotion features={domAnimation}>
    <AnimationProvider>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <FluidToastProvider>
              <FluidToastRegistrar />
              <Sonner />
              <AuthProvider initialSession={initialSession}>
                <CompanyProvider>
                  <FilterStoreInitializer />
                  <DashboardPrefetchProvider>
                    {children}
                  </DashboardPrefetchProvider>
                </CompanyProvider>
              </AuthProvider>
            </FluidToastProvider>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AnimationProvider>
    </LazyMotion>
  );
}

export function Providers({ children, initialSession }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: CACHE.DEFAULT_STALE_TIME,
            gcTime: CACHE.DEFAULT_GC_TIME,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: true,
            networkMode: 'online',
            retry: (failureCount, error: Error & { status?: number }) => {
              if (error?.status === 401 || error?.status === 403) return false;
              if (error?.status && error.status >= 400 && error.status < 500 && error.status !== 408) return false;
              return failureCount < 2;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
          mutations: {
            retry: 0,
            networkMode: 'online',
            onError: (error: Error & { message?: string }) => {
              toast.error(error?.message || 'Ocorreu um erro. Tente novamente.');
            },
          },
        },
      })
  );

  const [persister] = useState(() => createQueryPersister());

  // If persister initialization fails, fall back to standard QueryClientProvider
  if (!persister) {
    return (
      <ErrorBoundary level="page">
        <QueryClientProvider client={queryClient}>
          <ProviderInner initialSession={initialSession}>
            {children}
          </ProviderInner>
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          </Suspense>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page">
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: MAX_AGE,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) =>
              shouldDehydrateQuery({
                queryKey: [...query.queryKey],
                state: { data: query.state.data },
              }),
          },
        }}
      >
        <ProviderInner initialSession={initialSession}>
          {children}
        </ProviderInner>
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </Suspense>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}
