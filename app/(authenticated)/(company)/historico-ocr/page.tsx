'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const OcrHistoryPage = dynamic(() => import('@/modules/finance/ocr/pages/OcrHistoryPage'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <OcrHistoryPage />
  );
}
