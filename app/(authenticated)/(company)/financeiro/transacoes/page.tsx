import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import getQueryClient from '@/lib/getQueryClient';
import { TRANSACTIONS_KEYS, BANK_ACCOUNTS_KEYS } from '@/lib/queryKeys';
import { fetchTransactions } from '@/lib/queries/transactions';
import { getServerPrefetchContext } from '@/lib/queries/server-prefetch';
import TransactionsClient from './_client';

export default async function Page() {
  const ctx = await getServerPrefetchContext();
  if (!ctx) return <TransactionsClient />;

  const { supabase, companyId } = ctx;
  const queryClient = getQueryClient();

  const now = new Date();
  const defaultFilters = {
    startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
  };

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: TRANSACTIONS_KEYS.list(companyId, defaultFilters as any),
      queryFn: () => fetchTransactions(supabase, companyId, defaultFilters),
    }),
    queryClient.prefetchQuery({
      queryKey: BANK_ACCOUNTS_KEYS.list(companyId),
      queryFn: async () => {
        const { data } = await supabase
          .from('bank_accounts')
          .select('id, name, current_balance')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('name');
        return data ?? [];
      },
    }),
  ]);

  return (
    <Suspense fallback={<TransactionsClient />}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TransactionsClient />
      </HydrationBoundary>
    </Suspense>
  );
}
