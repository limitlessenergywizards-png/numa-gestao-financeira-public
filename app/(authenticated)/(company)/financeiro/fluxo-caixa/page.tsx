'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Cashflow = dynamic(() => import('@/modules/finance/cashflow'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Cashflow />
  );
}
