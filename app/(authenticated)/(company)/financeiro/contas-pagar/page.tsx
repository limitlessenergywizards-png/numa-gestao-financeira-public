import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import getQueryClient from '@/lib/getQueryClient';
import { PAYABLES_KEYS, SUPPLIERS_KEYS } from '@/lib/queryKeys';
import { fetchPayables, fetchPayablesSuppliers } from '@/lib/queries/payables';
import { getServerPrefetchContext } from '@/lib/queries/server-prefetch';
import PayablesClient from './_client';

export default async function Page() {
  const ctx = await getServerPrefetchContext();
  if (!ctx) return <PayablesClient />;

  const { supabase, companyId } = ctx;
  const queryClient = getQueryClient();

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: PAYABLES_KEYS.list(companyId),
      queryFn: () => fetchPayables(supabase, companyId),
    }),
    queryClient.prefetchQuery({
      queryKey: SUPPLIERS_KEYS.list(companyId),
      queryFn: () => fetchPayablesSuppliers(supabase, companyId),
    }),
  ]);

  return (
    <Suspense fallback={<PayablesClient />}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PayablesClient />
      </HydrationBoundary>
    </Suspense>
  );
}
