'use client';

import {
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity
} from "lucide-react";
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
} from "recharts";
import { useMemo } from "react";
import type { AdminUser } from "@/modules/admin/hooks/useAdminData";

interface EngagementMetricsProps {
  users: AdminUser[];
  isLoading?: boolean;
}

export function EngagementMetrics({ users, isLoading }: EngagementMetricsProps) {
  // Calculate DAU/WAU/MAU
  const metrics = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dau = users.filter(u => {
      if (!u.last_activity_date) return false;
      return u.last_activity_date.startsWith(today);
    }).length;

    const wau = users.filter(u => {
      if (!u.last_activity_date) return false;
      const activityDate = new Date(u.last_activity_date);
      return activityDate >= oneWeekAgo;
    }).length;

    const mau = users.filter(u => {
      if (!u.last_activity_date) return false;
      const activityDate = new Date(u.last_activity_date);
      return activityDate >= oneMonthAgo;
    }).length;

    // Calculate previous period for comparison
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const prevDau = users.filter(u => {
      if (!u.last_activity_date) return false;
      const activityDate = new Date(u.last_activity_date);
      return activityDate >= twoDaysAgo && activityDate < oneDayAgo;
    }).length;

    const prevWau = users.filter(u => {
      if (!u.last_activity_date) return false;
      const activityDate = new Date(u.last_activity_date);
      return activityDate >= threeDaysAgo && activityDate < oneWeekAgo;
    }).length;

    const prevMau = users.filter(u => {
      if (!u.last_activity_date) return false;
      const activityDate = new Date(u.last_activity_date);
      return activityDate >= twoMonthsAgo && activityDate < oneMonthAgo;
    }).length;

    const dauChange = prevDau > 0 ? ((dau - prevDau) / prevDau) * 100 : 0;
    const wauChange = prevWau > 0 ? ((wau - prevWau) / prevWau) * 100 : 0;
    const mauChange = prevMau > 0 ? ((mau - prevMau) / prevMau) * 100 : 0;

    // Stickiness ratio
    const stickiness = mau > 0 ? Math.round((dau / mau) * 100) : 0;

    return {
      dau,
      wau,
      mau,
      dauChange,
      wauChange,
      mauChange,
      stickiness,
    };
  }, [users]);

  // Generate trend data for the last 30 days
  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const activeUsers = users.filter(u => {
        if (!u.last_activity_date) return false;
        return u.last_activity_date.startsWith(dateStr);
      }).length;

      data.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        usuarios: activeUsers,
      });
    }

    return data;
  }, [users]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <Card className="bg-card border-brand/30 hover:border-brand/50 transition-[border-color,box-shadow]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                DAU
              </CardTitle>
              <div className="p-2 rounded-xl bg-brand/10">
                <Activity className="h-4 w-4 text-brand" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand">{metrics.dau}</div>
              <div className="flex items-center gap-1 mt-1">
                {metrics.dauChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-xs ${metrics.dauChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {metrics.dauChange >= 0 ? '+' : ''}{metrics.dauChange.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">vs ontem</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-card border-cyan-500/30 hover:border-cyan-500/50 transition-[border-color,box-shadow]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                WAU
              </CardTitle>
              <div className="p-2 rounded-xl bg-cyan-500/10">
                <Calendar className="h-4 w-4 text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">{metrics.wau}</div>
              <div className="flex items-center gap-1 mt-1">
                {metrics.wauChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-xs ${metrics.wauChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {metrics.wauChange >= 0 ? '+' : ''}{metrics.wauChange.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">vs semana anterior</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-card border-emerald-500/30 hover:border-emerald-500/50 transition-[border-color,box-shadow]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                MAU
              </CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">{metrics.mau}</div>
              <div className="flex items-center gap-1 mt-1">
                {metrics.mauChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-xs ${metrics.mauChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {metrics.mauChange >= 0 ? '+' : ''}{metrics.mauChange.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-card border-purple-500/30 hover:border-purple-500/50 transition-[border-color,box-shadow]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stickiness
              </CardTitle>
              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                DAU/MAU
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{metrics.stickiness}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Taxa de engajamento diário
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trend Chart */}
      <div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand" />
              Usuários Ativos por Dia
            </CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8AA6E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C8AA6E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
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
                  <Area
                    type="monotone"
                    dataKey="usuarios"
                    stroke="#C8AA6E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsuarios)"
                    name="Usuários Ativos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
