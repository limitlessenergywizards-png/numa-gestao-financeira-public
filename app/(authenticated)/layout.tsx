'use client';

import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

/**
 * Centralized auth gate for all (authenticated)/* routes.
 * Any new route group under (authenticated) automatically
 * requires login without needing to import AuthenticatedLayout.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
