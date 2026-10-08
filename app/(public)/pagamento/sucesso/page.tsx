'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/shared/PageLoader';

const PaymentSuccess = dynamic(() => import('@/modules/subscription/pages/PaymentSuccess'), { ssr: false, loading: () => <PageLoader /> });

export default function Page() {
  return (
    <PaymentSuccess />
  );
}
