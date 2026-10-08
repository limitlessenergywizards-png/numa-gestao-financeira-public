'use client';

import { useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParamsState } from "@/hooks/useSearchParamsState";
import { Building2, Users, Mail, History, Crown, BarChart3, Settings, Network, Map, DollarSign, ContactRound } from "lucide-react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { useAdminData } from "@/modules/admin/hooks/useAdminData";
import { AdminOverview } from "../components/AdminOverview";
import { AdminAnalytics } from "../components/AdminAnalytics";
import { AdminCompanies } from "../components/AdminCompanies";
import { CompanyHierarchy } from "../components/CompanyHierarchy";
import { AdminUsers } from "../components/AdminUsers";
import { AdminInvitations } from "../components/AdminInvitations";
import { AdminAuditLogs } from "../components/AdminAuditLogs";
import { AdminSettings } from "../components/AdminSettings";
const CompanyNetworkMap = lazy(() =>
  import("../components/CompanyNetworkMap").then(m => ({ default: m.CompanyNetworkMap }))
);
import { AdminBilling } from "../components/AdminBilling";
import { AdminCRM } from "../components/AdminCRM";

export default function Admin() {
  const { user, isLoading: authLoading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [searchParams, setSearchParams] = useSearchParamsState();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const adminData = useAdminData();

  // Sync tab from URL query params
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "overview") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };

  // Hotkeys: Ctrl+U = users, Ctrl+C = invitations (convites), Ctrl+L = logs
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'u' || event.key === 'U') {
          event.preventDefault();
          handleTabChange('users');
        } else if (event.key === 'c' || event.key === 'C') {
          event.preventDefault();
          handleTabChange('invitations');
        } else if (event.key === 'l' || event.key === 'L') {
          event.preventDefault();
          handleTabChange('logs');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(PUBLIC_ROUTES.AUTH);
    } else if (!authLoading && !isSuperAdmin) {
      router.replace(PUBLIC_ROUTES.LANDING);
    }
  }, [authLoading, user, isSuperAdmin, router]);

  if (!authLoading && (!user || !isSuperAdmin)) {
    return null;
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6 animate-fade-in">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div>
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11 lg:w-auto lg:inline-grid bg-muted dark:bg-[#132925] border border-border dark:border-brand/20 p-1">
              <TabsTrigger
                value="overview"
                className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              {adminData.isSuperAdminMode && (
                <TabsTrigger
                  value="billing"
                  className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Billing</span>
                </TabsTrigger>
              )}
              <TabsTrigger
                value="crm"
                className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                <ContactRound className="h-4 w-4" />
                <span className="hidden sm:inline">CRM</span>
              </TabsTrigger>
              <TabsTrigger
                value="companies"
                className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Empresas</span>
              </TabsTrigger>
              <TabsTrigger
                value="hierarchy"
                className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                <Network className="h-4 w-4" />
                <span className="hidden sm:inline">Hierarquia</span>
              </TabsTrigger>
              <TabsTrigger
                value="network-map"
                className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Mapa</span>
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger
                value="invitations"
                className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Convites</span>
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Logs</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            <TabsContent value="overview" className="mt-0">
              <AdminOverview
                stats={adminData.stats}
                companies={adminData.companies}
                users={adminData.users}
                invitations={adminData.invitations}
                auditLogs={adminData.auditLogs}
                billingStats={adminData.billingStats}
                subscriptions={adminData.subscriptions}
                isSuperAdminMode={adminData.isSuperAdminMode}
                isLoading={adminData.isLoading}
                onTabChange={handleTabChange}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <AdminAnalytics
                stats={adminData.stats}
                companies={adminData.companies}
                users={adminData.users}
                auditLogs={adminData.auditLogs}
              />
            </TabsContent>

            {adminData.isSuperAdminMode && (
              <TabsContent value="billing" className="mt-0">
                <AdminBilling
                  subscriptions={adminData.subscriptions}
                  users={adminData.users}
                  billingStats={adminData.billingStats}
                  isLoading={adminData.isLoading}
                />
              </TabsContent>
            )}

            <TabsContent value="crm" className="mt-0">
              <AdminCRM />
            </TabsContent>

            <TabsContent value="companies" className="mt-0">
              <AdminCompanies
                companies={adminData.companies}
                isLoading={adminData.isLoading}
                onRefresh={adminData.refresh}
              />
            </TabsContent>

            <TabsContent value="hierarchy" className="mt-0">
              <CompanyHierarchy
                companies={adminData.companies}
                onRefresh={adminData.refresh}
              />
            </TabsContent>

            <TabsContent value="network-map" className="mt-0">
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="loading-skeleton h-2 w-32 rounded" /></div>}>
                <CompanyNetworkMap
                  companies={adminData.companies}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              <AdminUsers
                users={adminData.users}
                companies={adminData.companies}
                auditLogs={adminData.auditLogs}
                isLoading={adminData.isLoading}
                onRefresh={adminData.refresh}
                isSuperAdminMode={adminData.isSuperAdminMode}
              />
            </TabsContent>

            <TabsContent value="invitations" className="mt-0">
              <AdminInvitations
                invitations={adminData.invitations}
                companies={adminData.companies}
                isLoading={adminData.isLoading}
                onRefresh={adminData.refresh}
              />
            </TabsContent>

            <TabsContent value="logs" className="mt-0">
              <AdminAuditLogs
                logs={adminData.auditLogs}
                isLoading={adminData.isLoading}
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <AdminSettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}