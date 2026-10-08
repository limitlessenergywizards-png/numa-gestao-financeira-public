'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Settings = dynamic(() => import('@/modules/admin/pages/Settings'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Settings />
  );
}
