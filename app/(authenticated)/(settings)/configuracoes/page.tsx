'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';
import { RequireRole } from '@/modules/iam/auth/components';

const Settings = dynamic(() => import('@/modules/iam/settings'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <RequireRole roles={['admin']}>
      <Settings />
    </RequireRole>
  );
}
