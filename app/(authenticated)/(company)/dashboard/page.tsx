import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import getQueryClient from '@/lib/getQueryClient';
import { DASHBOARD_KEYS } from '@/lib/queryKeys';
import {
  fetchDashboardReceivables,
  fetchDashboardPayables,
  fetchDashboardBankAccounts,
  fetchDashboardChartAccounts,
  fetchDashboardRecentTransactions,
} from '@/lib/queries/dashboard';
import { getServerPrefetchContext } from '@/lib/queries/server-prefetch';
import DashboardClient from './_client';

export default async function Page() {
  const ctx = await getServerPrefetchContext();
  if (!ctx) return <DashboardClient />;

  const { supabase, companyId } = ctx;
  const queryClient = getQueryClient();

  // Default period is 'month' — must match client's getDateRange('month')
  const now = new Date();
  const dateRange = {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  };

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: DASHBOARD_KEYS.receivables(companyId, dateRange),
      queryFn: () => fetchDashboardReceivables(supabase, companyId, dateRange),
    }),
    queryClient.prefetchQuery({
      queryKey: DASHBOARD_KEYS.payables(companyId, dateRange),
      queryFn: () => fetchDashboardPayables(supabase, companyId, dateRange),
    }),
    queryClient.prefetchQuery({
      queryKey: DASHBOARD_KEYS.bankAccounts(companyId),
      queryFn: () => fetchDashboardBankAccounts(supabase, companyId),
    }),
    queryClient.prefetchQuery({
      queryKey: DASHBOARD_KEYS.chartAccountsIncome(companyId),
      queryFn: () => fetchDashboardChartAccounts(supabase, companyId, 'income'),
    }),
    queryClient.prefetchQuery({
      queryKey: DASHBOARD_KEYS.chartAccountsExpense(companyId),
      queryFn: () => fetchDashboardChartAccounts(supabase, companyId, 'expense'),
    }),
    queryClient.prefetchQuery({
      queryKey: DASHBOARD_KEYS.transactionsRecent(companyId, dateRange),
      queryFn: () => fetchDashboardRecentTransactions(supabase, companyId, dateRange),
    }),
  ]);

  return (
    <Suspense fallback={<DashboardClient />}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DashboardClient />
      </HydrationBoundary>
    </Suspense>
  );
}
