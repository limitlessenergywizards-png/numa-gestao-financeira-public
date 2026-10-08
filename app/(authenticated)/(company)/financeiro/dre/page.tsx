'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Dre = dynamic(() => import('@/modules/finance/dre'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Dre />
  );
}
