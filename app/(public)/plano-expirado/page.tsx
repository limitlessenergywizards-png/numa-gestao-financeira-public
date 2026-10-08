'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const TrialExpired = dynamic(() => import('@/modules/subscription/pages/TrialExpired'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <TrialExpired />
  );
}
