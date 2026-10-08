'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const FinancialHealth = dynamic(() => import('@/modules/finance/financial-health'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <FinancialHealth />
  );
}
