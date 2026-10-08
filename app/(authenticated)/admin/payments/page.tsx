'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Payments = dynamic(() => import('@/modules/admin/pages/Payments'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Payments />
  );
}
