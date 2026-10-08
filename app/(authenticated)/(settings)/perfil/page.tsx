'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const Profile = dynamic(() => import('@/modules/iam/users/pages/Profile'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <Profile />
  );
}
