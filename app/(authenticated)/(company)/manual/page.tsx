'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const HelpHome = dynamic(() => import('@/modules/support/pages/HelpHome'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <HelpHome />
  );
}
