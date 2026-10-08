'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Customers = dynamic(() => import('@/modules/crm/customers'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Customers />
  );
}
