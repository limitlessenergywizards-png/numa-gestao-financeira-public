'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const SuperAdminPage = dynamic(() => import('@/modules/admin/pages/SuperAdminPage'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <SuperAdminPage />
  );
}
