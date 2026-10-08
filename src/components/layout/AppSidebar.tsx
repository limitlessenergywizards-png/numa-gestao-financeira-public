'use client';

import { memo, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Plus,
  Check,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Logo, LanguageSelector } from "@/components/shared";
import { cn } from "@/lib/utils";
import { useAuthState, useAuthActions } from "@/contexts/AuthContext";
import { useCompany, type Company } from "@/contexts/CompanyContext";
import { ThemeToggle, NotificationBell } from "@/components/layout";
import { SETTINGS_ROUTES, MAIN_ROUTES } from "@/lib/routes";
import { TrialBanner } from "@/components/trial";
import { OnboardingProgressBanner } from "@/components/layout/OnboardingProgressBanner";
import { useTrialStatus } from "@/modules/subscription/hooks/useTrialStatus";
import { prefetchCriticalRoutes } from "@/hooks/useAdjacentPrefetch";
import { useFinancialDataPrefetch } from "@/modules/finance/hooks/useFinancialDataPrefetch";
import { useMemoizedNavigation } from "@/hooks/useMemoizedNavigation";
import { NavGroup } from "@/components/layout/NavGroup";
import { UserFooter } from "@/components/layout/UserFooter";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CompanyForm } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Memoized Company Selector to prevent re-renders
const CompanySelector = memo(function CompanySelector({
  companies,
  currentCompany,
  setCurrentCompany,
  isLoading,
  isAdmin,
  onAddCompany,
  trialStatus,
  onDeleteCompany,
}: {
  companies: Company[];
  currentCompany: Company | null;
  setCurrentCompany: (company: Company) => void;
  isLoading: boolean;
  isAdmin: boolean;
  onAddCompany: () => void;
  trialStatus?: { isOnTrial: boolean; hasActiveSubscription: boolean };
  onDeleteCompany: (company: Company) => void;
}) {
  if (companies.length === 0) return null;

  const isTrial = trialStatus?.isOnTrial && !trialStatus?.hasActiveSubscription;
  const companyLimit = 3;
  const canAddCompany = !isTrial || companies.length < companyLimit;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="mt-3 w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent/70 hover:border-brand/40 transition-[color,background-color,border-color] duration-150 text-left border border-brand/20 group" aria-label="Selecionar empresa">
          {isLoading ? (
            <Skeleton className="h-4 w-24 bg-sidebar-border" />
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                {currentCompany?.logo_url ? (
                  <img
                    src={currentCompany.logo_url}
                    alt={currentCompany.name}
                    className="h-7 w-7 rounded-lg object-cover shrink-0 ring-1 ring-brand/30"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-lg bg-brand/20 flex items-center justify-center shrink-0 ring-1 ring-brand/30">
                    <span className="text-xs font-bold text-brand">
                      {currentCompany?.name?.slice(0, 2).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-sidebar-foreground truncate">
                    {currentCompany?.trading_name || currentCompany?.name || "Selecionar empresa"}
                  </span>
                  {currentCompany?.document && (
                    <span className="text-xs text-emerald-500/70 truncate font-mono">
                      {currentCompany.document.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-brand/70 shrink-0 group-hover:text-brand transition-colors" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 bg-popover/70 backdrop-blur-2xl border border-white/10 shadow-2xl z-50">
        {isTrial && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground bg-muted/30 mb-1 rounded-sm flex justify-between">
            <span>Empresas (Trial)</span>
            <span className={companies.length >= companyLimit ? "text-destructive font-medium" : ""}>
              {companies.length}/{companyLimit}
            </span>
          </div>
        )}
        {companies.map((company) => (
          <div key={company.id} className="group/item flex items-center">
            <DropdownMenuItem
              onClick={() => setCurrentCompany(company)}
              className={cn(
                "cursor-pointer flex-1 min-w-0",
                currentCompany?.id === company.id && "bg-accent"
              )}
            >
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-5 w-5 rounded object-cover shrink-0 mr-2"
                />
              ) : (
                <div className="h-5 w-5 rounded bg-muted flex items-center justify-center shrink-0 mr-2">
                  <span className="text-xs">{company.name.slice(0, 2).toUpperCase()}</span>
                </div>
              )}
              <span className="flex-1 break-words leading-snug">{company.trading_name || company.name}</span>
              {currentCompany?.id === company.id && (
                <Check className="h-4 w-4 shrink-0 ml-2 text-brand" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                // Allow menu to close naturally to prevent z-index/focus issues with the dialog
                onDeleteCompany(company);
              }}
              className="shrink-0 w-8 h-8 mr-1 p-0 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 transition-colors outline-none cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </DropdownMenuItem>
          </div>
        ))}
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={canAddCompany ? onAddCompany : undefined}
            disabled={!canAddCompany}
            className={cn(
              "cursor-pointer",
              !canAddCompany && "opacity-50 cursor-not-allowed"
            )}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Empresa
            {!canAddCompany && <span className="ml-auto text-xs text-destructive">(Limite)</span>}
          </DropdownMenuItem>
        </>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// Memoized Quick Actions Bar
const QuickActionsBar = memo(function QuickActionsBar() {
  return (
    <div className="mt-3 flex items-center gap-1 p-1.5 rounded-xl bg-sidebar-accent/40 backdrop-blur-sm border border-brand/20 shadow-inner">
      <ThemeToggle variant="sidebar" />
      <LanguageSelector variant="sidebar" />
      <NotificationBell variant="sidebar" />
    </div>
  );
});

export const AppSidebar = memo(function AppSidebar() {
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user, profile, isLoading: authLoading, isAdmin, isSuperAdmin } = useAuthState();
  const { signOut } = useAuthActions();
  const { companies, currentCompany, setCurrentCompany, isLoading: companyLoading, refreshCompanies } = useCompany();
  const trialStatus = useTrialStatus();

  // Use memoized navigation hook
  const { navGroups } = useMemoizedNavigation(isAdmin);

  // Prefetch critical routes on mount
  useEffect(() => {
    prefetchCriticalRoutes();
  }, []);

  // Warm React Query cache for financial reference data (banks, customers, etc.)
  useFinancialDataPrefetch();

  const router = useRouter();

  // Memoized handlers
  const handleAddCompany = useCallback(() => {
    router.push(`${SETTINGS_ROUTES.ONBOARDING}?newCompany=true`);
  }, [router]);

  const handleCompanyFormSuccess = useCallback(() => {
    setIsNewCompanyDialogOpen(false);
    setTimeout(() => refreshCompanies(), 300);
  }, [refreshCompanies]);

  const handleCompanyFormCancel = useCallback(() => {
    setIsNewCompanyDialogOpen(false);
  }, []);

  const handleDeleteCompany = useCallback(async () => {
    if (!companyToDelete) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyToDelete.id)
        .select();

      if (error) throw error;

      // Check if any row was actually deleted
      if (!data || data.length === 0) {
        throw new Error("Permissão negada ou empresa não encontrada. Verifique se você é o proprietário.");
      }

      toast.success("Empresa excluída com sucesso.");

      // If deleted company was current, it will be handled by refreshCompanies or logic below
      await refreshCompanies();

      // If we deleted the current company, switch to another one or empty
      if (currentCompany?.id === companyToDelete.id) {
        const remaining = companies.filter(c => c.id !== companyToDelete.id);
        if (remaining.length > 0) {
          setCurrentCompany(remaining[0]);
        } else {
          setCurrentCompany(null);
        }
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Erro ao excluir empresa. Tente novamente.");
    } finally {
      setIsDeleting(false);
      setCompanyToDelete(null);
    }
  }, [companyToDelete, refreshCompanies, currentCompany, companies, setCurrentCompany]);

  // Memoize trial banner visibility
  const showTrialBanner = useMemo(() =>
    !trialStatus.hasActiveSubscription && !trialStatus.isLoading && trialStatus.isOnTrial,
    [trialStatus.hasActiveSubscription, trialStatus.isLoading, trialStatus.isOnTrial]
  );

  return (
    <Sidebar className="border-r border-sidebar-border/50 glass-sidebar">
      <SidebarHeader className="border-b border-sidebar-border/50 p-4">
        {/* Logo */}
        <div className="flex items-center gap-3 py-1">
          <Logo size="default" showText variant="full" linkTo={MAIN_ROUTES.HOME} />
        </div>

        {/* Quick Actions Bar */}
        <QuickActionsBar />

        {/* Company Selector */}
        <CompanySelector
          companies={companies}
          currentCompany={currentCompany}
          setCurrentCompany={setCurrentCompany}
          isLoading={companyLoading}
          isAdmin={isAdmin}
          onAddCompany={handleAddCompany}
          trialStatus={trialStatus}
          onDeleteCompany={setCompanyToDelete}
        />

        {/* Trial Banner */}
        {showTrialBanner && (
          <TrialBanner
            daysRemaining={trialStatus.daysRemaining}
            urgencyLevel={trialStatus.urgencyLevel}
          />
        )}

        {/* Onboarding Progress Banner */}
        <OnboardingProgressBanner className="mt-3" />

        {/* New Company Dialog */}
        <Dialog open={isNewCompanyDialogOpen} onOpenChange={setIsNewCompanyDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Empresa</DialogTitle>
              <DialogDescription>
                Cadastre uma nova empresa ou filial. Digite o CNPJ para preencher automaticamente.
              </DialogDescription>
            </DialogHeader>
            <CompanyForm
              onSuccess={handleCompanyFormSuccess}
              onCancel={handleCompanyFormCancel}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Excluir Empresa?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a empresa <strong>{companyToDelete?.trading_name || companyToDelete?.name}</strong>?
                <br /><br />
                Esta ação <strong>não pode ser desfeita</strong>. Todos os dados associados (transações, contas bancárias, etc.) serão permanentemente removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteCompany();
                }}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground focus:ring-destructive"
              >
                {isDeleting ? "Excluindo..." : "Sim, excluir empresa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarHeader>

      <SidebarContent>
        {/* Render memoized nav groups */}
        {navGroups.map((group) => (
          <NavGroup key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>

      {/* Memoized User Footer */}
      <UserFooter
        isLoading={authLoading}
        avatarUrl={profile?.avatar_url}
        fullName={profile?.full_name}
        email={user?.email}
        onSignOut={signOut}
      />
    </Sidebar>
  );
});

// Default export for backward compatibility
export default AppSidebar;
