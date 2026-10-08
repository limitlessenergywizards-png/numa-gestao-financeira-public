'use client';

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { WelcomeScreen } from "../components/WelcomeScreen";
import { OnboardingWizard } from "../components/OnboardingWizard";
import { Loader2 } from "lucide-react";
import { PUBLIC_ROUTES, ADMIN_ROUTES, MAIN_ROUTES } from "@/lib/routes";

export default function Onboarding() {
  const { user, profile, isLoading: authLoading, isSuperAdmin } = useAuth();
  const { companies, isLoading: companyLoading } = useCompany();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAddingNewCompany = searchParams.get("newCompany") === "true";
  const [showWizard, setShowWizard] = useState(isAddingNewCompany);

  useEffect(() => {
    // Redirect to auth if not logged in
    if (!authLoading && !user) {
      router.push(PUBLIC_ROUTES.AUTH);
      return;
    }

    // Redirect if user already has companies and is not adding a new one
    if (!companyLoading && companies.length > 0 && !isAddingNewCompany) {
      router.push(MAIN_ROUTES.HOME);
      return;
    }

    // Super Admins without companies go to admin dashboard
    if (!authLoading && !companyLoading && isSuperAdmin && companies.length === 0) {
      router.push(ADMIN_ROUTES.ADMIN);
      return;
    }
  }, [authLoading, user, companyLoading, companies, router, isSuperAdmin, isAddingNewCompany]);

  // Show loading while checking auth/companies
  if (authLoading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // User not logged in, will redirect
  if (!user) {
    return null;
  }

  // User already has companies and is not adding a new one
  if (companies.length > 0 && !isAddingNewCompany) {
    return null;
  }

  // Super Admin without companies, will redirect
  if (isSuperAdmin && companies.length === 0) {
    return null;
  }

  return showWizard ? (
    <OnboardingWizard />
  ) : (
    <WelcomeScreen
      userName={profile?.full_name || user.email || ""}
      hasCompanies={companies.length > 0}
      onStart={() => setShowWizard(true)}
    />
  );
}
