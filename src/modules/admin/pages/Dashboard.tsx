import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { AdminAnalytics } from "../components/AdminAnalytics";
import { EngagementMetrics } from "../components/EngagementMetrics";
import { ActivationFunnel } from "../components/ActivationFunnel";
import { CohortAnalysis } from "../components/CohortAnalysis";
import { useAdminData } from "@/modules/admin/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Users,
  Building2,
  Activity,
  BarChart3,
  Target,
  PieChart
} from "lucide-react";

export default function AdminDashboard() {
  const adminData = useAdminData();

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <ScrollReveal>
          <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Métricas, analytics e engajamento em tempo real</p>
        </ScrollReveal>

        {/* Quick Stats - Staggered */}
        <ScrollReveal
          direction="up"
          staggerChildren={0.1}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminData.stats?.totalUsers || 0}</div>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +12% este mês
              </p>
            </CardContent>
          </Card>

          <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Empresas
              </CardTitle>
              <Building2 className="h-4 w-4 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminData.stats?.totalCompanies || 0}</div>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +8% este mês
              </p>
            </CardContent>
          </Card>

          <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Usuários Ativos
              </CardTitle>
              <Activity className="h-4 w-4 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminData.stats?.activeToday || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Ativos hoje</p>
            </CardContent>
          </Card>

          <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Convites Pendentes
              </CardTitle>
              <Activity className="h-4 w-4 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminData.stats?.pendingInvitations || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando aceite</p>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Tabs for Analytics */}
        <ScrollReveal delay={0.2} direction="up">
          <Tabs defaultValue="engagement" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="engagement" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Engajamento
              </TabsTrigger>
              <TabsTrigger value="funnel" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Funil
              </TabsTrigger>
              <TabsTrigger value="cohort" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Cohort
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="engagement">
              <EngagementMetrics
                users={adminData.users}
                isLoading={adminData.isLoading}
              />
            </TabsContent>

            <TabsContent value="funnel">
              <ActivationFunnel
                users={adminData.users}
                companies={adminData.companies}
                subscriptions={adminData.subscriptions}
                isLoading={adminData.isLoading}
              />
            </TabsContent>

            <TabsContent value="cohort">
              <CohortAnalysis
                users={adminData.users}
                isLoading={adminData.isLoading}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <AdminAnalytics
                stats={adminData.stats}
                companies={adminData.companies}
                users={adminData.users}
                auditLogs={adminData.auditLogs}
              />
            </TabsContent>
          </Tabs>
        </ScrollReveal>
      </div>
    </SuperAdminLayout>
  );
}
