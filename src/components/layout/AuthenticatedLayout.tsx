'use client';

import { lazy, Suspense, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthState } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppSidebar } from "./AppSidebar";
import { MobileShell } from "./MobileShell";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { ChatWidget } from "@/modules/ai-chat/components/ChatWidget";
import { ErrorBoundary, Logo, ScrollLockWatchdog, UpdatePrompt } from "@/components/shared";
import { scheduleIdleTask } from "@/lib/scheduling";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { motion, AnimatePresence } from "framer-motion";

// ─── Performance: Lazy-load non-critical services ───
const BackgroundServices = lazy(() => import("./BackgroundServices"));

// ─── Performance: Lazy-load NotificationProvider ───
const LazyNotificationProvider = lazy(() =>
  import("@/contexts/NotificationContext").then((m) => ({
    default: m.NotificationProvider,
  }))
);

// ─── Performance: Lazy-load AchievementNotificationProvider ───
const LazyAchievementProvider = lazy(() =>
  import("@/contexts/AchievementNotificationContext").then((m) => ({
    default: m.AchievementNotificationProvider,
  }))
);

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

// ─── Branded transition screen (auth identity unknown) ───
function BrandedTransition({ slowLoad }: { slowLoad: boolean }) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B3B34]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-36 w-36 rounded-full bg-[#C5A059]/15 blur-2xl animate-pulse" />
          <div className="absolute h-24 w-24 rounded-full bg-[#C5A059]/10 blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          <Logo size="large" linkTo={null} />
        </div>

        <AnimatePresence>
          {showHint && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-sm text-[#E5E5E5]/40"
            >
              Preparando seu ambiente...
            </motion.p>
          )}
        </AnimatePresence>

        {slowLoad && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-2"
          >
            <p className="text-xs text-[#E5E5E5]/30">Demorando mais que o esperado...</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-[#C5A059]/70 underline hover:no-underline hover:text-[#C5A059]"
            >
              Recarregar página
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, isLoading, isAuthReady } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [shouldLoadDeferred, setShouldLoadDeferred] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);

  // Show "taking longer" message after 5s of loading
  useEffect(() => {
    if (isLoading) {
      const t = setTimeout(() => setSlowLoad(true), 5000);
      return () => clearTimeout(t);
    }
    setSlowLoad(false);
  }, [isLoading]);

  // Redirect unauthenticated users to auth with redirect param
  useEffect(() => {
    if (!isLoading && !user) {
      try {
        const params = new URLSearchParams({ redirect: pathname });
        router.replace(`${PUBLIC_ROUTES.AUTH}?${params.toString()}`);
      } catch (error) {
        console.error('Failed to redirect to auth:', error);
        router.replace(PUBLIC_ROUTES.AUTH);
      }
    }
  }, [isLoading, user, router, pathname]);

  // ─── Defer non-critical services until after first paint ───
  useEffect(() => {
    if (!user) return;

    const cleanup = scheduleIdleTask(() => setShouldLoadDeferred(true), { timeout: 3000 });
    return cleanup;
  }, [user]);

  // ─── Phase A: Auth identity unknown — branded transition ───
  if (!isAuthReady) {
    return <BrandedTransition slowLoad={slowLoad} />;
  }

  // ─── Unauthenticated — redirect handled by useEffect above ───
  if (!user) {
    return null;
  }

  // Deferred services fragment
  const deferredFragment = shouldLoadDeferred ? (
    <Suspense fallback={null}>
      <BackgroundServices />
    </Suspense>
  ) : null;

  // ─── Phase B: Auth ready, context still loading — skeleton-first shell ───
  // ─── Phase C: Fully loaded — real content ───
  const content = isLoading ? <DashboardSkeleton /> : children;

  // Mobile: render MobileShell with bottom nav, FAB, drawers
  if (isMobile) {
    return (
      <motion.div
        key="authenticated-shell"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <UpdatePrompt />
        <ScrollLockWatchdog />
        <ErrorBoundary level="component" fallback={null}>
          <Suspense fallback={null}>
            <LazyNotificationProvider>
              <LazyAchievementProvider>
                <MobileShell>
                  <ErrorBoundary level="page">{content}</ErrorBoundary>
                </MobileShell>
                {deferredFragment}
                <ChatWidget />
              </LazyAchievementProvider>
            </LazyNotificationProvider>
          </Suspense>
        </ErrorBoundary>
      </motion.div>
    );
  }

  // Desktop: sidebar layout
  return (
    <motion.div
      key="authenticated-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <UpdatePrompt />
      <ScrollLockWatchdog />
      <ErrorBoundary level="component" fallback={null}>
        <Suspense fallback={null}>
          <LazyNotificationProvider>
            <LazyAchievementProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="flex flex-col h-screen overflow-hidden min-w-0">
                  <ErrorBoundary level="page">{content}</ErrorBoundary>
                </SidebarInset>
              </SidebarProvider>
              {deferredFragment}
              <ChatWidget />
            </LazyAchievementProvider>
          </LazyNotificationProvider>
        </Suspense>
      </ErrorBoundary>
    </motion.div>
  );
}
