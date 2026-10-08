'use client';

import {
  UserPlus,
  Building2,
  Receipt,
  Target,
  CreditCard,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";
import type { AdminUser, AdminCompany, AdminSubscription } from "@/modules/admin/hooks/useAdminData";

interface ActivationFunnelProps {
  users: AdminUser[];
  companies: AdminCompany[];
  subscriptions: AdminSubscription[];
  isLoading?: boolean;
}

interface FunnelStep {
  id: string;
  label: string;
  description: string;
  count: number;
  percentage: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function ActivationFunnel({ users, companies, subscriptions, isLoading }: ActivationFunnelProps) {
  const funnelData = useMemo(() => {
    const totalUsers = users.length;

    // Step 1: Users who created at least one company
    const usersWithCompanies = users.filter(u => u.companies.length > 0);
    const withCompanyCount = usersWithCompanies.length;

    // Step 2: Users whose companies have transactions (estimated by activity)
    const usersWithActivity = users.filter(u => {
      if (!u.last_activity_date) return false;
      // Consider users who have been active in the last 30 days as having transactions
      const activityDate = new Date(u.last_activity_date);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return activityDate >= thirtyDaysAgo && u.companies.length > 0;
    });
    const withTransactionCount = usersWithActivity.length;

    // Step 3: Users with significant activity (estimate 10+ transactions)
    const engagedUsers = users.filter(u => {
      if (!u.last_activity_date) return false;
      // Users who have been active multiple times (estimate by checking if they have job_title set)
      const activityDate = new Date(u.last_activity_date);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      return activityDate >= threeDaysAgo && u.companies.length > 0;
    });
    const engagedCount = engagedUsers.length;

    // Step 4: Users with active subscriptions
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const paidUsersCount = activeSubscriptions.length;

    const steps: FunnelStep[] = [
      {
        id: 'signup',
        label: 'Cadastro',
        description: 'Usuários registrados',
        count: totalUsers,
        percentage: 100,
        icon: UserPlus,
        color: 'text-brand',
      },
      {
        id: 'company',
        label: 'Primeira Empresa',
        description: 'Criaram uma empresa',
        count: withCompanyCount,
        percentage: totalUsers > 0 ? Math.round((withCompanyCount / totalUsers) * 100) : 0,
        icon: Building2,
        color: 'text-cyan-400',
      },
      {
        id: 'transaction',
        label: 'Primeira Transação',
        description: 'Usuários ativos',
        count: withTransactionCount,
        percentage: totalUsers > 0 ? Math.round((withTransactionCount / totalUsers) * 100) : 0,
        icon: Receipt,
        color: 'text-emerald-400',
      },
      {
        id: 'engaged',
        label: 'Engajamento',
        description: 'Uso frequente',
        count: engagedCount,
        percentage: totalUsers > 0 ? Math.round((engagedCount / totalUsers) * 100) : 0,
        icon: Target,
        color: 'text-purple-400',
      },
      {
        id: 'paid',
        label: 'Assinatura',
        description: 'Clientes pagantes',
        count: paidUsersCount,
        percentage: totalUsers > 0 ? Math.round((paidUsersCount / totalUsers) * 100) : 0,
        icon: CreditCard,
        color: 'text-amber-400',
      },
    ];

    return steps;
  }, [users, subscriptions]);

  // Calculate conversion rates between steps
  const conversionRates = useMemo(() => {
    const rates = [];
    for (let i = 1; i < funnelData.length; i++) {
      const prev = funnelData[i - 1];
      const curr = funnelData[i];
      const rate = prev.count > 0 ? Math.round((curr.count / prev.count) * 100) : 0;
      rates.push({
        from: prev.id,
        to: curr.id,
        rate,
      });
    }
    return rates;
  }, [funnelData]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-96" />
      </Card>
    );
  }

  return (
    <div className="animate-fade-in">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-brand" />
            Funil de Ativação
          </CardTitle>
          <CardDescription>
            Jornada do usuário desde o cadastro até a assinatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((step, index) => {
              const Icon = step.icon;
              const conversionRate = conversionRates[index - 1];

              return (
                <div key={step.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}>
                  {/* Conversion rate indicator */}
                  {index > 0 && conversionRate && (
                    <div className="flex items-center justify-center py-1 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3 mr-1" />
                      <span className={conversionRate.rate >= 50 ? 'text-emerald-400' : conversionRate.rate >= 25 ? 'text-amber-400' : 'text-red-400'}>
                        {conversionRate.rate}% conversão
                      </span>
                    </div>
                  )}

                  {/* Funnel step */}
                  <div
                    className="relative p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    style={{
                      marginLeft: `${index * 16}px`,
                      marginRight: `${index * 16}px`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-background/50 ${step.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{step.label}</h4>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${step.color}`}>
                              {step.count}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({step.percentage}%)
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {step.description}
                        </p>

                        <Progress
                          value={step.percentage}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-brand">
                  {funnelData[4]?.percentage || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Taxa Final de Conversão</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">
                  {conversionRates[0]?.rate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Cadastro → Empresa</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">
                  {conversionRates[1]?.rate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Empresa → Transação</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">
                  {conversionRates[3]?.rate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Engajado → Pago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
