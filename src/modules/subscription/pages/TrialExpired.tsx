'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Check, Shield, MessageCircle, Sparkles, Crown, Zap, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared";
import { cn } from "@/lib/utils";
import { useSubscription, STRIPE_PLANS, type BillingPeriod } from "../hooks/useSubscription";
import { CheckoutModal } from "@/modules/marketing/landing/components/CheckoutModal";
import { useTrialStatus } from "@/modules/subscription/hooks/useTrialStatus";
import { MAIN_ROUTES } from "@/lib/routes";

const plans = [
  {
    key: "basico" as const,
    name: "Iniciante",
    price: 97,
    description: "Para quem está começando",
    icon: Zap,
    features: [
      "1 empresa",
      "1 usuário",
      "Fluxo de caixa básico",
      "Relatórios essenciais",
      "Suporte por email",
    ],
  },
  {
    key: "profissional" as const,
    name: "Estrategista",
    price: 197,
    description: "O mais escolhido",
    icon: Crown,
    popular: true,
    features: [
      "3 empresas",
      "3 usuários",
      "DRE automático",
      "Conciliação bancária",
      "Análise por IA",
      "Suporte prioritário",
    ],
  },
  {
    key: "empresarial" as const,
    name: "Mestre",
    price: 265,
    description: "Controle total",
    icon: Shield,
    features: [
      "Empresas ilimitadas",
      "Usuários ilimitados",
      "Relatórios avançados",
      "API de integração",
      "Treinamento exclusivo",
      "Gerente de conta",
    ],
  },
];

const guarantees = [
  { icon: Shield, text: "Garantia de 7 dias" },
  { icon: Check, text: "Cancele quando quiser" },
  { icon: Sparkles, text: "Suporte prioritário" },
];

export default function TrialExpired() {
  const { signOut } = useAuth();
  const { createGuestCheckout, isLoading } = useSubscription();
  const { isTrialExpired, daysRemaining, isLoading: trialLoading, hasActiveSubscription, isOnTrial } = useTrialStatus();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<{
    key: keyof typeof STRIPE_PLANS;
    period: BillingPeriod;
  } | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const shouldRedirect = !trialLoading && (hasActiveSubscription || (isOnTrial && !isTrialExpired));

  // Redirect users with active subscription or active trial back to the app
  useEffect(() => {
    if (shouldRedirect) {
      router.replace(MAIN_ROUTES.HOME);
    }
  }, [shouldRedirect, router]);

  // Loading state while checking trial status
  if (trialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando status...</p>
        </div>
      </div>
    );
  }

  // Redirecting — render nothing
  if (shouldRedirect) {
    return null;
  }

  const handlePlanClick = (planKey: keyof typeof STRIPE_PLANS) => {
    setSelectedPlan({ key: planKey, period: "monthly" });
    setCheckoutModalOpen(true);
  };
  const handleCloseModal = () => {
    setCheckoutModalOpen(false);
  };
  const openWhatsApp = () => {
    window.open(
      "https://wa.me/5511999999999?text=Olá! Preciso de ajuda com minha assinatura do Numa.",
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      {/* Logout Option - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          onClick={() => signOut()}
          className="gap-2 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair da conta
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <Logo size="large" showText variant="full" className="justify-center mb-6" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/15 border border-warning/30 mb-4">
          <Clock className="h-5 w-5 text-warning" />
          <span className="text-warning font-semibold">
            Seu período de teste terminou
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Continue dominando suas finanças
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Você aproveitou 3 dias do Numa. Para continuar acessando seus dados e ferramentas,
          escolha o plano ideal para seu negócio.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-8">
        {plans.map((plan) => {
          const PlanIcon = plan.icon;
          return (
            <div
              key={plan.key}
              className={cn(
                "relative overflow-hidden rounded-xl transition-[transform,box-shadow] duration-300 hover:scale-[1.02]",
                "bg-card border border-border/60 shadow-sm",
                plan.popular && "border-brand/50 ring-2 ring-brand/30 shadow-md"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-brand text-brand-foreground font-semibold">
                    ★ Popular
                  </Badge>
                </div>
              )}

              {/* Card Header */}
              <div className="text-center pt-6 pb-4 px-6">
                <div className={cn(
                  "mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                  plan.popular ? "bg-brand/15" : "bg-muted"
                )}>
                  <PlanIcon className={cn(
                    "h-6 w-6",
                    plan.popular ? "text-brand" : "text-muted-foreground"
                  )} />
                </div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-foreground">
                    R${plan.price}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </div>

              {/* Features + CTA */}
              <div className="px-6 pb-6 space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className={cn(
                        "h-4 w-4 shrink-0",
                        plan.popular ? "text-brand" : "text-success"
                      )} />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePlanClick(plan.key)}
                  disabled={isLoading}
                  className={cn(
                    "w-full font-semibold",
                    plan.popular
                      ? "bg-brand hover:bg-brand/90 text-brand-foreground"
                      : "bg-foreground/10 hover:bg-foreground/15 text-foreground border border-border"
                  )}
                >
                  {isLoading ? "Carregando..." : `Assinar por R$${plan.price}/mês`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guarantees */}
      <div className="flex flex-wrap justify-center gap-6 mb-8">
        {guarantees.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-muted-foreground">
            <item.icon className="h-4 w-4 text-brand" />
            <span className="text-sm">{item.text}</span>
          </div>
        ))}
      </div>

      {/* WhatsApp Support */}
      <Button
        variant="outline"
        onClick={openWhatsApp}
        className="gap-2 border-border hover:bg-brand/10 hover:border-brand/40"
      >
        <MessageCircle className="h-4 w-4" />
        Falar com Suporte via WhatsApp
      </Button>

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          isOpen={checkoutModalOpen}
          onClose={handleCloseModal}
          planKey={selectedPlan.key}
          billingPeriod={selectedPlan.period}
        />
      )}

    </div>
  );
}
