'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const AiChatPage = dynamic(() => import('@/modules/ai-chat/AiChatPage'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <AiChatPage />
  );
}
