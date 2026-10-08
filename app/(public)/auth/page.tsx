'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Auth = dynamic(() => import('@/modules/iam/auth/pages/Auth'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Auth />
  );
}
