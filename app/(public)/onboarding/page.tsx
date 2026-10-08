'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const OnboardingPage = dynamic(() => import('@/modules/onboarding/pages/OnboardingPage'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <OnboardingPage />
  );
}
