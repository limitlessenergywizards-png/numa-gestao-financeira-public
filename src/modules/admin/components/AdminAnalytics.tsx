import { TrendingUp, TrendingDown, Users, Building2, Mail, Activity, BarChart3, PieChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import type { AdminStats, AdminCompany, AdminUser, AdminAuditLog } from "@/modules/admin/hooks/useAdminData";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdminAnalyticsProps {
  stats: AdminStats;
  companies: AdminCompany[];
  users: AdminUser[];
  auditLogs: AdminAuditLog[];
}

// Numa Admin Chart Colors - Gold-centric palette
const COLORS = ["#C8AA6E", "#4A9D7C", "#2D8B9A", "#1E5F8A", "#D4B87A"];

export function AdminAnalytics({ stats, companies, users, auditLogs }: AdminAnalyticsProps) {
  // Generate user growth data (last 30 days)
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const userGrowthData = last30Days.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const usersOnDate = users.filter((u) => {
      const createdDate = u.created_at ? format(new Date(u.created_at), "yyyy-MM-dd") : null;
      return createdDate && createdDate <= dateStr;
    }).length;
    
    return {
      date: format(date, "dd/MM", { locale: ptBR }),
      fullDate: dateStr,
      users: usersOnDate,
    };
  });

  // Activity by hour (last 7 days)
  const activityByHour = Array.from({ length: 24 }, (_, hour) => {
    const logsInHour = auditLogs.filter((log) => {
      if (!log.created_at) return false;
      return new Date(log.created_at).getHours() === hour;
    }).length;
    
    return {
      hour: `${hour.toString().padStart(2, "0")}h`,
      activities: logsInHour,
    };
  });

  // Role distribution
  const roleDistribution = [
    { name: "Admin", value: users.filter((u) => u.companies.some((c) => c.role === "admin")).length, fill: COLORS[0] },
    { name: "Editor", value: users.filter((u) => u.companies.some((c) => c.role === "editor")).length, fill: COLORS[1] },
    { name: "Viewer", value: users.filter((u) => u.companies.some((c) => c.role === "viewer")).length, fill: COLORS[2] },
  ].filter((r) => r.value > 0);

  // Companies by user count
  const companiesByUsers = [...companies]
    .sort((a, b) => (b.user_count || 0) - (a.user_count || 0))
    .slice(0, 5)
    .map((c) => ({
      name: c.name.length > 15 ? c.name.slice(0, 15) + "..." : c.name,
      users: c.user_count || 0,
    }));

  // Top active users
  const topActiveUsers = users
    .filter((u) => u.last_activity_date)
    .sort((a, b) => {
      const dateA = new Date(a.last_activity_date || 0).getTime();
      const dateB = new Date(b.last_activity_date || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  // Activity by type
  const activityByType = [
    { name: "Criações", value: auditLogs.filter((l) => l.action === "INSERT").length },
    { name: "Atualizações", value: auditLogs.filter((l) => l.action === "UPDATE").length },
    { name: "Remoções", value: auditLogs.filter((l) => l.action === "DELETE").length },
  ];

  // Calculate growth percentage
  const lastWeekUsers = userGrowthData[userGrowthData.length - 8]?.users || 0;
  const currentUsers = userGrowthData[userGrowthData.length - 1]?.users || 0;
  const growthPercentage = lastWeekUsers > 0 ? ((currentUsers - lastWeekUsers) / lastWeekUsers) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Summary Cards - Admin Premium Style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Card className="bg-card dark:bg-[#0D1233]/80 backdrop-blur border-brand/30 hover:border-brand/50 transition-[border-color,box-shadow]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Empresas
              </CardTitle>
              <div className="p-2 rounded-xl bg-brand/10">
                <Building2 className="h-4 w-4 text-brand" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand">{stats.totalCompanies}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {companies.filter((c) => c.is_headquarters).length} matriz(es)
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-card dark:bg-[#0D1233]/80 backdrop-blur border-emerald-500/30 hover:border-emerald-500/50 transition-[border-color,box-shadow]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Usuários
              </CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">{stats.totalUsers}</div>
              <div className="flex items-center gap-1 mt-1">
                {growthPercentage >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={`text-xs ${growthPercentage >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                  {growthPercentage >= 0 ? "+" : ""}{growthPercentage.toFixed(1)}% esta semana
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-card dark:bg-[#0D1233]/80 backdrop-blur border-cyan-500/30 hover:border-cyan-500/50 transition-[border-color,box-shadow]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Convites Pendentes
              </CardTitle>
              <div className="p-2 rounded-xl bg-cyan-500/10">
                <Mail className="h-4 w-4 text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">{stats.pendingInvitations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando aceitação
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-card dark:bg-[#0D1233]/80 backdrop-blur border-blue-500/30 hover:border-blue-500/50 transition-[border-color,box-shadow]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ativos Hoje
              </CardTitle>
              <div className="p-2 rounded-xl bg-blue-500/10">
                <Activity className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{stats.activeToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalUsers > 0 ? Math.round((stats.activeToday / stats.totalUsers) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Growth Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-card dark:bg-[#0D1233]/60 border-border dark:border-brand/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand" />
                Crescimento de Usuários
              </CardTitle>
              <CardDescription>Evolução nos últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C8AA6E" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#C8AA6E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,170,110,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#EDEDED80' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#EDEDED80' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0D1233",
                        border: "1px solid rgba(200,170,110,0.2)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                      }}
                      labelStyle={{ color: "#EDEDED" }}
                      itemStyle={{ color: "#C8AA6E" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#C8AA6E"
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                      strokeWidth={2}
                      name="Usuários"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution */}
        <div>
          <Card className="h-full bg-card dark:bg-[#0D1233]/60 border-border dark:border-brand/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-brand" />
                Distribuição de Perfis
              </CardTitle>
              <CardDescription>Por tipo de acesso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0D1233",
                        border: "1px solid rgba(200,170,110,0.2)",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#EDEDED' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity by Hour */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                Atividade por Hora
              </CardTitle>
              <CardDescription>Distribuição de ações ao longo do dia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityByHour}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar 
                      dataKey="activities" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name="Atividades"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies by Users */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Top 5 Empresas
              </CardTitle>
              <CardDescription>Por número de usuários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={companiesByUsers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar 
                      dataKey="users" 
                      fill="hsl(var(--chart-2))" 
                      radius={[0, 4, 4, 0]}
                      name="Usuários"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Active Users */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                Usuários Mais Ativos
              </CardTitle>
              <CardDescription>Últimas atividades registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topActiveUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{user.job_title || "Usuário"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user.companies[0]?.role || "viewer"}
                    </Badge>
                  </div>
                ))}
                {topActiveUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma atividade registrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                Resumo de Atividades
              </CardTitle>
              <CardDescription>Total de ações por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityByType.map((activity) => (
                  <div key={activity.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{activity.name}</span>
                      <span className="font-medium">{activity.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${auditLogs.length > 0 ? (activity.value / auditLogs.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>{auditLogs.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
