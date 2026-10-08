'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const NotFound = dynamic(() => import('@/modules/core/pages/NotFound'), { ssr: false, loading: () => <PageLoader /> });

export default function NotFoundPage() {
  return (
    <NotFound />
  );
}
