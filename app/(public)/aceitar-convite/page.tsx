'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const AcceptInvitation = dynamic(() => import('@/modules/iam/auth/pages/AcceptInvitation'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <AcceptInvitation />
  );
}
