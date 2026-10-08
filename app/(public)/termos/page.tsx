'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const LegalPage = dynamic(() => import('@/modules/support/pages/LegalPage'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <LegalPage />
  );
}
