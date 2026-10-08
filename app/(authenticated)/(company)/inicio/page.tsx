'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const InicioPage = dynamic(() => import('@/modules/home/pages/InicioPage'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <InicioPage />
  );
}
