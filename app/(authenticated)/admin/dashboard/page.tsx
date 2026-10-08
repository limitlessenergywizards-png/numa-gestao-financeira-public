'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Dashboard = dynamic(() => import('@/modules/admin/pages/Dashboard'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Dashboard />
  );
}
