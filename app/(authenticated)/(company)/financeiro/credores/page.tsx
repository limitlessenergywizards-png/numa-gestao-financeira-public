'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Creditors = dynamic(() => import('@/modules/finance/creditors'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Creditors />
  );
}
