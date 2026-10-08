'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';
import { RequireRole } from '@/modules/iam/auth/components';

const CostCenters = dynamic(() => import('@/modules/finance/cost-centers'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <RequireRole roles={['admin']}>
      <CostCenters />
    </RequireRole>
  );
}
