'use client';

import { ReactNode, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { PUBLIC_ROUTES, MAIN_ROUTES } from "@/lib/routes";
import { toast } from "sonner";

interface RequireRoleProps {
  children: ReactNode;
  roles: Array<'admin' | 'editor' | 'viewer'>;
  fallbackTo?: string;
}

export function RequireRole({ children, roles, fallbackTo = MAIN_ROUTES.HOME }: RequireRoleProps) {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasNotified = useRef(false);

  const hasRequiredRole = !isLoading && user ? roles.some((role) => hasRole(role)) : true;

  useEffect(() => {
    if (!isLoading && user && !hasRequiredRole && !hasNotified.current) {
      hasNotified.current = true;
      toast.error("Você não tem permissão para acessar esta página.");
    }
  }, [isLoading, user, hasRequiredRole]);

  // Redirect unauthenticated users to auth with redirect param
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(PUBLIC_ROUTES.AUTH + '?redirect=' + encodeURIComponent(pathname));
    }
  }, [isLoading, user, router, pathname]);

  // Redirect unauthorized users to fallback
  useEffect(() => {
    if (!isLoading && user && !hasRequiredRole) {
      router.replace(fallbackTo);
    }
  }, [isLoading, user, hasRequiredRole, fallbackTo, router]);

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

  if (!user || !hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
}
