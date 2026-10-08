'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Suppliers = dynamic(() => import('@/modules/crm/suppliers'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Suppliers />
  );
}
