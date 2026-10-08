'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { MAIN_ROUTES } from "@/lib/routes";
import {
  LandingHeader,
  HeroSection,
  SocialProofSection,
  PainPointsSection,
  FeaturesSection,
  TestimonialsSection,
  ComparisonTable,
  PricingSection,
  FAQSection,
  CTASection,
  LandingFooter,
  WhatsAppButton,
  QuickTestimonial,
} from "../landing/components";
import { PersonaSection } from "../landing/components/PersonaSection";
import { FloatingCTA } from "../landing/components/FloatingCTA";
import { LazySection } from "../landing/components/LazySection";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.push(MAIN_ROUTES.HOME);
    }
  }, [user, isLoading, router]);

  // Show nothing while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        {/* Above the fold - load immediately */}
        <HeroSection />
        <QuickTestimonial />

        {/* Below the fold - lazy load */}
        <LazySection minHeight="500px">
          <PainPointsSection />
        </LazySection>

        <LazySection minHeight="200px">
          <SocialProofSection />
        </LazySection>

        <LazySection minHeight="600px">
          <FeaturesSection />
        </LazySection>

        <LazySection minHeight="500px">
          <PersonaSection />
        </LazySection>


        <LazySection minHeight="500px">
          <TestimonialsSection />
        </LazySection>

        <LazySection minHeight="600px">
          <PricingSection />
        </LazySection>

        <LazySection minHeight="400px">
          <ComparisonTable />
        </LazySection>

        <LazySection minHeight="500px">
          <FAQSection />
        </LazySection>

        <LazySection minHeight="300px">
          <CTASection />
        </LazySection>
      </main>
      <LandingFooter />
      <WhatsAppButton />
      <FloatingCTA />
    </div>
  );
}
