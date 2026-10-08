import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import getQueryClient from '@/lib/getQueryClient';
import { RECEIVABLES_KEYS, CUSTOMERS_KEYS } from '@/lib/queryKeys';
import { fetchReceivables, fetchReceivablesCustomers } from '@/lib/queries/receivables';
import { getServerPrefetchContext } from '@/lib/queries/server-prefetch';
import ReceivablesClient from './_client';

export default async function Page() {
  const ctx = await getServerPrefetchContext();
  if (!ctx) return <ReceivablesClient />;

  const { supabase, companyId } = ctx;
  const queryClient = getQueryClient();

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: RECEIVABLES_KEYS.list(companyId),
      queryFn: () => fetchReceivables(supabase, companyId),
    }),
    queryClient.prefetchQuery({
      queryKey: CUSTOMERS_KEYS.list(companyId),
      queryFn: () => fetchReceivablesCustomers(supabase, companyId),
    }),
  ]);

  return (
    <Suspense fallback={<ReceivablesClient />}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ReceivablesClient />
      </HydrationBoundary>
    </Suspense>
  );
}
