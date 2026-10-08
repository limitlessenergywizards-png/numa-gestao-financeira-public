'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const StrategicLuxuryLanding = dynamic(() => import('@/modules/marketing/pages/StrategicLuxuryLanding'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <StrategicLuxuryLanding />
  );
}
