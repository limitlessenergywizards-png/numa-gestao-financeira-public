'use client';

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlanUsageCard } from "./PlanUsageCard";
import { Crown, Check, Database, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useSubscription, STRIPE_PLANS } from "@/modules/subscription/hooks/useSubscription";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface UsageStats {
  transactions: number;
  companies: number;
  users: number;
}

const planLimits = {
  free: { transactions: 50, companies: 1, users: 1 },
  basico: { transactions: 500, companies: 1, users: 1 },
  profissional: { transactions: 1000, companies: 3, users: 3 },
  empresarial: { transactions: Infinity, companies: Infinity, users: Infinity },
};

const planDisplayNames: Record<string, string> = {
  free: "Gratuito",
  basico: "Básico",
  profissional: "Profissional",
  empresarial: "Empresarial",
};

const planPrices: Record<string, string> = {
  free: "R$ 0",
  basico: "R$ 97",
  profissional: "R$ 197",
  empresarial: "R$ 265",
};

export function PlansTab() {
  const searchParams = useSearchParams();
  const { companies } = useCompany();
  const {
    subscription,
    isLoading: isSubscriptionLoading,
    createCheckout,
    openPortal,
    checkSubscription,
    planName
  } = useSubscription();

  // Check for success/canceled params
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      toast.success("Assinatura realizada com sucesso! Bem-vindo ao plano premium.");
      checkSubscription();
    } else if (canceled === "true") {
      toast.info("Processo de pagamento cancelado.");
    }
  }, [searchParams, checkSubscription]);

  // Fetch usage stats
  const { data: usage = { transactions: 0, companies: companies.length, users: 0 } } = useQuery({
    queryKey: ["usage-stats", companies],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: transactionsCount } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      const { count: usersCount } = await supabase
        .from("user_companies")
        .select("user_id", { count: "exact", head: true });

      return {
        transactions: transactionsCount || 0,
        companies: companies.length,
        users: usersCount || 0,
      };
    },
  });

  const currentLimits = planLimits[planName as keyof typeof planLimits] || planLimits.free;

  const plans = [
    {
      name: "Básico",
      key: "basico" as const,
      price: "R$ 97",
      features: [
        "500 transações/mês",
        "1 empresa",
        "1 usuário",
        "Relatórios básicos",
        "Suporte por email",
      ],
    },
    {
      name: "Profissional",
      key: "profissional" as const,
      price: "R$ 197",
      features: [
        "1.000 transações/mês",
        "3 empresas",
        "3 usuários",
        "Relatórios avançados",
        "DRE e Fluxo de Caixa",
        "Suporte prioritário",
      ],
      popular: true,
    },
    {
      name: "Empresarial",
      key: "empresarial" as const,
      price: "R$ 265",
      features: [
        "Transações ilimitadas",
        "Empresas ilimitadas",
        "Usuários ilimitados",
        "API de integração",
        "Integrações bancárias",
        "Suporte dedicado",
        "SLA garantido",
      ],
    },
  ];

  if (isSubscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Usage */}
      <div className="grid gap-6 md:grid-cols-2">
        <PlanUsageCard
          planName={planDisplayNames[planName] || "Gratuito"}
          planPrice={planPrices[planName] || "R$ 0"}
          billingCycle="mês"
          isPremium={subscription?.subscribed}
          usage={[
            {
              label: "Transações",
              current: usage.transactions,
              max: currentLimits.transactions === Infinity ? 9999 : currentLimits.transactions,
            },
            {
              label: "Empresas",
              current: usage.companies,
              max: currentLimits.companies === Infinity ? 9999 : currentLimits.companies,
            },
            {
              label: "Usuários",
              current: usage.users,
              max: currentLimits.users === Infinity ? 9999 : currentLimits.users,
            },
          ]}
          onUpgrade={subscription?.subscribed ? undefined : () => createCheckout("profissional")}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Status da Assinatura
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={checkSubscription}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plano atual:</span>
              <Badge variant={subscription?.subscribed ? "default" : "secondary"}>
                {planDisplayNames[planName] || "Gratuito"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={subscription?.status === "active" ? "default" : "secondary"}>
                {subscription?.status === "active" ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            {subscription?.current_period_end && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Próxima cobrança:</span>
                <span className="text-sm">
                  {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}

            {subscription?.cancel_at_period_end && (
              <div className="rounded-lg bg-warning/10 p-3 text-sm text-warning">
                Sua assinatura será cancelada no final do período atual.
              </div>
            )}

            {subscription?.subscribed && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={openPortal}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Gerenciar Assinatura
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Planos Disponíveis</CardTitle>
          <CardDescription>
            Compare os planos e escolha o melhor para seu negócio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-auto-fit lg:grid-cols-3">
            {plans.filter((plan) => {
              if (plan.key === "basico") return false;
              if (plan.key === "empresarial" && planName !== "empresarial") return false;
              return true;
            }).map((plan) => {
              const isCurrent = planName === plan.key;

              return (
                <div
                  key={plan.name}
                  className={`rounded-lg border p-6 ${isCurrent
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                    } transition-colors`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    {plan.popular && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Popular
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="secondary">Atual</Badge>
                    )}
                  </div>

                  <p className="text-3xl font-bold mb-4">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plano Atual
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                      onClick={() => createCheckout(plan.key)}
                    >
                      {subscription?.subscribed ? "Mudar Plano" : "Assinar"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
