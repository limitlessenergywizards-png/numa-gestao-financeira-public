'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Budgets = dynamic(() => import('@/modules/finance/budgets'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return <Budgets />;
}
