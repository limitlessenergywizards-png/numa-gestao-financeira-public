'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const ForgotPassword = dynamic(() => import('@/modules/iam/auth/pages/ForgotPassword'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <ForgotPassword />
  );
}
