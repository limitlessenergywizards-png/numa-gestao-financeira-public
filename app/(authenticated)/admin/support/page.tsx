'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Support = dynamic(() => import('@/modules/admin/pages/Support'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Support />
  );
}
