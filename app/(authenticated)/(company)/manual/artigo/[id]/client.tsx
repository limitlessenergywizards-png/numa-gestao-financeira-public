'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const HelpArticlePage = dynamic(() => import('@/modules/support/pages/HelpArticlePage'), { ssr: false, loading: () => <PageLoader /> });

export function HelpArticleClient() {
  return (
    <HelpArticlePage />
  );
}
