'use client';

import { ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PUBLIC_ROUTES, SETTINGS_ROUTES } from "@/lib/routes";
import { AUTH_LOADING_TIMEOUT_MS } from "@/lib/constants";

interface RequireCompanyProps {
  children: ReactNode;
}

export function RequireCompany({ children }: RequireCompanyProps) {
  const { user, isLoading: authLoading, isSuperAdmin, signOut } = useAuth();
  const { companies, isLoading: companyLoading } = useCompany();
  const router = useRouter();
  const pathname = usePathname();
  const [isTimedOut, setIsTimedOut] = useState(false);

  const isLoading = authLoading || companyLoading;

  // Timeout safety net for infinite loading
  useEffect(() => {
    if (!isLoading) {
      setIsTimedOut(false);
      return;
    }

    const timeout = setTimeout(() => setIsTimedOut(true), AUTH_LOADING_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Redirect to auth if not logged in (preserve intended route)
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(PUBLIC_ROUTES.AUTH + '?redirect=' + encodeURIComponent(pathname));
    }
  }, [isLoading, user, router, pathname]);

  // Redirect to onboarding if no companies (non-admin)
  useEffect(() => {
    if (!isLoading && user && !isSuperAdmin && companies.length === 0) {
      router.replace(SETTINGS_ROUTES.ONBOARDING);
    }
  }, [isLoading, user, isSuperAdmin, companies.length, router]);

  // Timeout fallback UI
  if (isTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm px-4">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-foreground font-medium">
            Não foi possível carregar os dados da empresa.
          </p>
          <p className="text-muted-foreground text-sm">
            Verifique sua conexão e tente novamente.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => signOut()}>Sair</Button>
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking auth and companies
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in — redirecting
  if (!user) {
    return null;
  }

  // Super Admins can bypass company requirement
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // No companies — redirecting to onboarding
  if (companies.length === 0) {
    return null;
  }

  return <>{children}</>;
}
