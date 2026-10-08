'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const ActivateAccount = dynamic(() => import('@/modules/iam/auth/pages/ActivateAccount'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <ActivateAccount />
  );
}
