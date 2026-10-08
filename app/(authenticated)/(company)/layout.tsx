'use client';

import { RequireCompany } from '@/modules/iam/auth/components/RequireCompany';
import { RequireActiveSubscription } from '@/modules/iam/auth/components/RequireActiveSubscription';

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireCompany>
      <RequireActiveSubscription>
        {children}
      </RequireActiveSubscription>
    </RequireCompany>
  );
}
