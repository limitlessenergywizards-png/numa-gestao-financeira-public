import { useMemo } from "react";
import {
  Building2, Users, Mail, Activity, Clock, DollarSign,
  TrendingUp, ArrowRight, CreditCard, UserPlus, BarChart3,
  Zap, Crown, Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  AdminStats, AdminCompany, AdminUser, AdminInvitation,
  AdminAuditLog, BillingStats, AdminSubscription,
} from "@/modules/admin/hooks/useAdminData";

interface AdminOverviewProps {
  stats: AdminStats;
  companies: AdminCompany[];
  users: AdminUser[];
  invitations: AdminInvitation[];
  auditLogs: AdminAuditLog[];
  billingStats: BillingStats;
  subscriptions: AdminSubscription[];
  isSuperAdminMode: boolean;
  isLoading: boolean;
  onTabChange: (tab: string) => void;
}

export function AdminOverview({
  stats,
  companies,
  users,
  invitations,
  auditLogs,
  billingStats,
  isSuperAdminMode,
  isLoading,
  onTabChange,
}: AdminOverviewProps) {

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const topCompanies = useMemo(() =>
    [...companies]
      .sort((a, b) => (b.user_count || 0) - (a.user_count || 0))
      .slice(0, 6),
    [companies]
  );

  const recentUsers = useMemo(() =>
    [...users]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [users]
  );

  const planColors: Record<string, string> = {
    Iniciante: "bg-blue-500",
    Estrategista: "bg-brand",
    Mestre: "bg-amber-500",
    trial: "bg-cyan-500",
    free: "bg-gray-400",
  };

  const planLabels: Record<string, string> = {
    Iniciante: "Iniciante",
    Estrategista: "Estrategista",
    Mestre: "Mestre",
    trial: "Trial",
    free: "Gratuito",
  };

  const totalPlanUsers = useMemo(() =>
    Object.values(billingStats.planDistribution).reduce((a, b) => a + b, 0),
    [billingStats.planDistribution]
  );

  function getInitials(name: string | null) {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  function getActionLabel(action: string) {
    const labels: Record<string, string> = { INSERT: "Criou", UPDATE: "Atualizou", DELETE: "Removeu" };
    return labels[action] || action;
  }

  function getTableLabel(tableName: string) {
    const labels: Record<string, string> = {
      companies: "empresa", profiles: "perfil", user_companies: "acesso",
      user_invitations: "convite", customers: "cliente", suppliers: "fornecedor",
      receivables: "recebível", payables: "pagável", transactions: "transação",
    };
    return labels[tableName] || tableName;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        {isSuperAdminMode && <Skeleton className="h-32 w-full rounded-xl" />}
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total de Empresas",
      value: stats.totalCompanies,
      icon: Building2,
      color: "text-brand",
      bgColor: "bg-brand/10",
      borderColor: "border-brand/30",
    },
    {
      title: "Usuários Ativos",
      value: stats.totalUsers,
      icon: Users,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
    },
    {
      title: "Convites Pendentes",
      value: stats.pendingInvitations,
      icon: Mail,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
    },
    {
      title: "Ativos Hoje",
      value: stats.activeToday,
      icon: Activity,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div key={stat.title} className="animate-fade-in" style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}>
            <Card className={`bg-card dark:bg-[#17322C]/80 backdrop-blur border ${stat.borderColor} hover:border-brand/50 transition-[border-color,box-shadow] hover:shadow-lg hover:shadow-brand/5`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Revenue Banner — Super Admin only */}
      {isSuperAdminMode && billingStats.mrr > 0 && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-brand via-emerald-600 to-teal-700 text-white shadow-xl animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
          </div>
          <CardContent className="relative py-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/15">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70">Receita Mensal (MRR)</p>
                  <p className="text-3xl font-bold">{formatCurrency(billingStats.mrr)}</p>
                </div>
              </div>
              <div className="hidden md:block h-12 w-px bg-white/20" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 flex-1">
                <div>
                  <p className="text-xs text-white/60">ARR</p>
                  <p className="text-lg font-bold">{formatCurrency(billingStats.arr)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Assinantes</p>
                  <p className="text-lg font-bold">{billingStats.totalSubscribers}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">ARPU</p>
                  <p className="text-lg font-bold">{formatCurrency(billingStats.averageRevenuePerUser)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Trials Ativos</p>
                  <p className="text-lg font-bold">{billingStats.activeTrials}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="self-start md:self-center bg-white/15 hover:bg-white/25 text-white border-0"
                onClick={() => onTabChange("billing")}
              >
                Ver Billing <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Empresas", icon: Building2, tab: "companies", color: "text-brand" },
          { label: "Usuários", icon: Users, tab: "users", color: "text-emerald-400" },
          { label: "Convites", icon: UserPlus, tab: "invitations", color: "text-cyan-400" },
          { label: "Analytics", icon: BarChart3, tab: "analytics", color: "text-blue-400" },
        ].map(({ label, icon: Icon, tab, color }) => (
          <Button
            key={tab}
            variant="outline"
            className="h-auto py-3 px-4 justify-start gap-3 border-border dark:border-brand/20 hover:border-brand/40 hover:bg-brand/5 dark:bg-[#17322C]/40"
            onClick={() => onTabChange(tab)}
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <div className="text-left">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">Gerenciar</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </Button>
        ))}
      </div>

      {/* Three Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="bg-card dark:bg-[#17322C]/60 border-border dark:border-brand/20 lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-brand" />
                Atividade Recente
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-brand hover:text-brand" onClick={() => onTabChange("logs")}>
                Ver tudo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-sm">
                  <div className="mt-1.5 shrink-0">
                    <div className="h-2 w-2 rounded-full bg-brand shadow-sm shadow-brand/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground leading-snug">
                      <span className="font-semibold text-brand">{log.user_name}</span>{" "}
                      {getActionLabel(log.action)} {getTableLabel(log.table_name)}
                      {log.company_name && (
                        <span className="text-muted-foreground"> em {log.company_name}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.created_at && formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registrada</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Companies */}
        <Card className="bg-card dark:bg-[#17322C]/60 border-border dark:border-brand/20 lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-brand" />
                Top Empresas
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-brand hover:text-brand" onClick={() => onTabChange("companies")}>
                Ver todas
              </Button>
            </div>
            <CardDescription>{companies.length} empresa{companies.length !== 1 ? 's' : ''} cadastrada{companies.length !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {topCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand/5 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                    <span className="text-brand font-bold text-sm">{company.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{company.name}</p>
                      {company.is_headquarters && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-brand/10 text-brand border-brand/20">Matriz</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {company.user_count} usuário{company.user_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
              {companies.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma empresa cadastrada</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right column: Invitations + Plan Distribution */}
        <div className="space-y-6">
          {/* Pending Invitations */}
          <Card className="bg-card dark:bg-[#17322C]/60 border-border dark:border-brand/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  Convites Pendentes
                </CardTitle>
                <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                  {invitations.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {invitations.slice(0, 4).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-brand/5 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 ring-1 ring-brand/20">
                        <AvatarFallback className="text-[10px] bg-brand/10 text-brand">
                          {inv.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[150px]">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">{inv.company_name}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-brand/30 text-brand">{inv.role}</Badge>
                  </div>
                ))}
                {invitations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">Nenhum convite pendente</p>
                )}
                {invitations.length > 4 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs text-brand" onClick={() => onTabChange("invitations")}>
                    +{invitations.length - 4} mais
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plan Distribution — Super Admin only */}
          {isSuperAdminMode && totalPlanUsers > 0 && (
            <Card className="bg-card dark:bg-[#17322C]/60 border-border dark:border-brand/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-amber-400" />
                  Distribuição de Planos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(billingStats.planDistribution)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([plan, count]) => {
                      const pct = totalPlanUsers > 0 ? (count / totalPlanUsers) * 100 : 0;
                      return (
                        <div key={plan} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`h-2.5 w-2.5 rounded-full ${planColors[plan] || "bg-gray-400"}`} />
                              <span className="font-medium">{planLabels[plan] || plan}</span>
                            </div>
                            <span className="text-muted-foreground">{count} ({pct.toFixed(0)}%)</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Users */}
          {recentUsers.length > 0 && (
            <Card className="bg-card dark:bg-[#17322C]/60 border-border dark:border-brand/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4 text-amber-400" />
                  Novos Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {recentUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 ring-1 ring-brand/20">
                        <AvatarFallback className="text-[10px] bg-brand/10 text-brand">
                          {getInitials(u.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.full_name || u.email || "Usuário"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(u.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Super Admin Mode Indicator */}
      {isSuperAdminMode && (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-brand" />
          <span>Modo Super Admin ativo — acesso global a todas as empresas e dados</span>
        </div>
      )}
    </div>
  );
}
