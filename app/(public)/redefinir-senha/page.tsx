'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const ResetPassword = dynamic(() => import('@/modules/iam/auth/pages/ResetPassword'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <ResetPassword />
  );
}
