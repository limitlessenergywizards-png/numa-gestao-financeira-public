'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const LandingPage = dynamic(() => import('@/modules/marketing/pages/LandingPage'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <LandingPage />
  );
}
