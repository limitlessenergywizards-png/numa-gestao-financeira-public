'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';
import { RequireRole } from '@/modules/iam/auth/components';

const Treasury = dynamic(() => import('@/modules/finance/treasury'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <RequireRole roles={['admin', 'editor']}>
      <Treasury />
    </RequireRole>
  );
}
