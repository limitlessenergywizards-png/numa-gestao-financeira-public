'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const SegmentedLandingPage = dynamic(() => import('@/modules/marketing/pages/SegmentedLandingPage'), { ssr: false, loading: () => <PageLoader /> });

export function SegmentedLandingClient() {
  return (
    <SegmentedLandingPage />
  );
}
