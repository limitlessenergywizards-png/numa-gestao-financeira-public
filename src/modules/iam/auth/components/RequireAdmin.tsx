'use client';

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { PUBLIC_ROUTES, MAIN_ROUTES } from "@/lib/routes";

interface RequireAdminProps {
  children: ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users to auth
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(PUBLIC_ROUTES.AUTH);
    }
  }, [isLoading, user, router]);

  // Redirect non-admin users to home
  useEffect(() => {
    if (!isLoading && user && !hasRole("admin")) {
      router.replace(MAIN_ROUTES.HOME);
    }
  }, [isLoading, user, hasRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user || !hasRole("admin")) {
    return null;
  }

  return <>{children}</>;
}
