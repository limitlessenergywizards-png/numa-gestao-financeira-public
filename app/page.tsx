'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const SinglePricePage = dynamic(() => import('@/modules/subscription/pages/SinglePricePage'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <SinglePricePage />
  );
}
