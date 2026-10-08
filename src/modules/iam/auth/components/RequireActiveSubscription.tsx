'use client';

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrialStatus } from "@/modules/subscription/hooks/useTrialStatus";
import { PUBLIC_ROUTES } from "@/lib/routes";

interface RequireActiveSubscriptionProps {
  children: ReactNode;
}

export function RequireActiveSubscription({ children }: RequireActiveSubscriptionProps) {
  const { isTrialExpired, hasActiveSubscription, isLoading } = useTrialStatus();
  const router = useRouter();

  const shouldRedirect = !isLoading && isTrialExpired && !hasActiveSubscription;

  // Redirect to trial-expired page
  useEffect(() => {
    if (shouldRedirect) {
      router.replace(PUBLIC_ROUTES.TRIAL_EXPIRED);
    }
  }, [shouldRedirect, router]);

  // Show loading state while checking
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

  if (shouldRedirect) {
    return null;
  }

  return <>{children}</>;
}
