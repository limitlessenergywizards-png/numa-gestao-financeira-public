'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const MyJourneyPage = dynamic(() => import('@/modules/onboarding/journey/pages/MyJourneyPage'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <MyJourneyPage />
  );
}
