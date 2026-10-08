'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Debts = dynamic(() => import('@/modules/finance/debts'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Debts />
  );
}
