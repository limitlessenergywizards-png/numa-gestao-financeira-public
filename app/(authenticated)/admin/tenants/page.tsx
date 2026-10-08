'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Tenants = dynamic(() => import('@/modules/admin/pages/Tenants'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Tenants />
  );
}
