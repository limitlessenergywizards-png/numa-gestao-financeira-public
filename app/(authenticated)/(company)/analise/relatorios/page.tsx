'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Reports = dynamic(() => import('@/modules/analytics/reports'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Reports />
  );
}
