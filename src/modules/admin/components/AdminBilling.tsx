'use client';

import { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertTriangle,
  CreditCard,
  Calendar,
  Search,
  Filter,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AdminSubscription, BillingStats, AdminUser } from "@/modules/admin/hooks/useAdminData";
import { formatCurrency as format$ } from "@/lib/formatters";

interface AdminBillingProps {
  subscriptions: AdminSubscription[];
  users: AdminUser[];
  billingStats: BillingStats;
  isLoading: boolean;
}

// Chart colors - Gold-centric palette
const PLAN_COLORS: Record<string, string> = {
  Iniciante: "#4A9D7C",
  Estrategista: "#C8AA6E",
  Mestre: "#2D8B9A",
  trial: "#6B7280",
  free: "#374151",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  trialing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  canceled: "bg-red-500/20 text-red-400 border-red-500/30",
  past_due: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  trialing: "Trial",
  canceled: "Cancelado",
  past_due: "Atrasado",
  inactive: "Inativo",
};

export function AdminBilling({ subscriptions, users, billingStats, isLoading }: AdminBillingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const matchesSearch =
        sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.user_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
      const matchesPlan = planFilter === "all" || sub.plan_name?.toLowerCase() === planFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [subscriptions, searchTerm, statusFilter, planFilter]);

  // Prepare chart data
  const planDistributionData = useMemo(() => {
    return Object.entries(billingStats.planDistribution)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        fill: PLAN_COLORS[name] || "#6B7280",
      }));
  }, [billingStats.planDistribution]);

  // MRR trend data - only available with historical billing records
  const mrrTrendData = useMemo(() => {
    // Note: Historical MRR data would require billing records from previous months
    // For now, return empty array to show empty state
    return [];
  }, []);

  // Users in trial from users list
  const usersInTrial = useMemo(() => {
    const now = new Date();
    return users.filter(u => {
      if (!u.trial_started_at) return false;
      const trialStart = new Date(u.trial_started_at);
      const trialEnd = new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000);
      const hasActiveSubscription = subscriptions.some(
        s => s.user_id === u.user_id && s.status === 'active'
      );
      return trialEnd > now && !hasActiveSubscription;
    }).map(u => {
      const trialStart = new Date(u.trial_started_at!);
      const trialEnd = new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000);
      const daysLeft = Math.max(0, differenceInDays(trialEnd, now));
      return { ...u, daysLeft };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [users, subscriptions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Revenue Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Card className="bg-card dark:bg-gradient-to-br dark:from-[#0D1233] dark:to-[#0D1233]/80 backdrop-blur border-brand/30 hover:border-brand/50 transition-[border-color,box-shadow]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                MRR
              </CardTitle>
              <div className="p-2 rounded-xl bg-brand/10">
                <DollarSign className="h-4 w-4 text-brand" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand">
                {format$(billingStats.mrr)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-emerald-400">
                  Receita Mensal Recorrente
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-card dark:bg-gradient-to-br dark:from-[#0D1233] dark:to-[#0D1233]/80 backdrop-blur border-emerald-500/30 hover:border-emerald-500/50 transition-[border-color,box-shadow]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ARR
              </CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Calendar className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">
                {format$(billingStats.arr)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Receita Anual Recorrente
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-card dark:bg-gradient-to-br dark:from-[#0D1233] dark:to-[#0D1233]/80 backdrop-blur border-cyan-500/30 hover:border-cyan-500/50 transition-[border-color,box-shadow]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assinantes
              </CardTitle>
              <div className="p-2 rounded-xl bg-cyan-500/10">
                <Users className="h-4 w-4 text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">
                {billingStats.totalSubscribers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ARPU: {format$(billingStats.averageRevenuePerUser)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-card dark:bg-gradient-to-br dark:from-[#0D1233] dark:to-[#0D1233]/80 backdrop-blur border-blue-500/30 hover:border-blue-500/50 transition-[border-color,box-shadow]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trials Ativos
              </CardTitle>
              <div className="p-2 rounded-xl bg-blue-500/10">
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {billingStats.activeTrials}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Conversão: {billingStats.conversionRate}%
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Churn Alert */}
      {billingStats.churnedThisMonth > 0 && (
        <div>
          <Card className="bg-card dark:bg-red-950/20 border-red-500/30">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="font-medium text-red-400">
                  {billingStats.churnedThisMonth} cancelamento(s) este mês
                </p>
                <p className="text-sm text-muted-foreground">
                  Monitore os motivos de churn para melhorar a retenção
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan Distribution */}
        <div>
          <Card className="bg-card dark:bg-[#0D1233]/60 border-border dark:border-brand/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand" />
                Distribuição por Plano
              </CardTitle>
              <CardDescription>Assinantes por tipo de plano</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {planDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {planDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MRR Trend */}
        <div>
          <Card className="bg-card dark:bg-[#0D1233]/60 border-border dark:border-brand/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand" />
                Tendência de MRR
              </CardTitle>
              <CardDescription>Evolução da receita recorrente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] flex items-center justify-center text-center">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    Dados históricos insuficientes
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Disponível após o primeiro mês completo de dados de cobrança
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trials at Risk */}
      {usersInTrial.length > 0 && (
        <div>
          <Card className="bg-card dark:bg-[#0D1233]/60 border-border dark:border-brand/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-400" />
                Trials Próximos de Expirar
              </CardTitle>
              <CardDescription>
                Usuários que precisam de atenção para conversão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usersInTrial.slice(0, 5).map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 dark:bg-[#0A0F2C]/50 border border-border dark:border-brand/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || 'Usuário'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        user.daysLeft <= 3
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : user.daysLeft <= 7
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }
                    >
                      {user.daysLeft} dias restantes
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscriptions Table */}
      <div>
        <Card className="bg-card dark:bg-[#0D1233]/60 border-border dark:border-brand/20">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand" />
                  Assinaturas
                </CardTitle>
                <CardDescription>
                  {filteredSubscriptions.length} de {subscriptions.length} assinaturas
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-[180px] bg-muted/50 dark:bg-[#0A0F2C]/50 border-border dark:border-brand/20"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] bg-muted/50 dark:bg-[#0A0F2C]/50 border-border dark:border-brand/20">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="trialing">Trial</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                    <SelectItem value="past_due">Atrasado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-[140px] bg-muted/50 dark:bg-[#0A0F2C]/50 border-border dark:border-brand/20">
                    <SelectValue placeholder="Plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Planos</SelectItem>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="estrategista">Estrategista</SelectItem>
                    <SelectItem value="mestre">Mestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border dark:border-brand/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 dark:bg-[#0A0F2C]/50 hover:bg-muted/50">
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Renovação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length > 0 ? (
                    filteredSubscriptions.map((sub) => (
                      <TableRow
                        key={sub.id}
                        className="hover:bg-muted/30 dark:hover:bg-brand/5"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.user_name || 'Usuário'}</p>
                            <p className="text-sm text-muted-foreground">{sub.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor: `${PLAN_COLORS[sub.plan_name] || '#6B7280'}20`,
                              borderColor: `${PLAN_COLORS[sub.plan_name] || '#6B7280'}50`,
                              color: PLAN_COLORS[sub.plan_name] || '#6B7280',
                            }}
                          >
                            {sub.plan_name || 'Free'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={STATUS_COLORS[sub.status] || STATUS_COLORS.inactive}
                          >
                            {STATUS_LABELS[sub.status] || sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {sub.current_period_start && sub.current_period_end ? (
                            <span className="text-sm">
                              {format(new Date(sub.current_period_start), 'dd/MM', { locale: ptBR })}
                              {' - '}
                              {format(new Date(sub.current_period_end), 'dd/MM/yy', { locale: ptBR })}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {sub.cancel_at_period_end ? (
                            <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              Não renova
                            </Badge>
                          ) : sub.status === 'active' ? (
                            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              Auto
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {sub.stripe_subscription_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => window.open(`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma assinatura encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
