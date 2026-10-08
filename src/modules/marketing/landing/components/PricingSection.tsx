'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Shield, CreditCard, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PUBLIC_ROUTES, MAIN_ROUTES } from "@/lib/routes";
import { SUBSCRIPTION_PLANS, BillingPeriod } from "@/modules/subscription/hooks/useSubscription";
import { PaymentMethodSelector } from "@/modules/subscription/components/PaymentMethodSelector";
import { EnhancedGlassmorphismCard } from "./EnhancedGlassmorphismCard";
import { cn } from "@/lib/utils";
import { PaymentPlan } from "@/types/payment";

const billingPeriods: { key: BillingPeriod; label: string; discount?: number }[] = [
  { key: "monthly", label: "Mensal" },
  { key: "quarterly", label: "Trimestral", discount: 5 },
  { key: "semiannual", label: "Semestral", discount: 10 },
  { key: "yearly", label: "Anual", discount: 20 },
];

const plans = [
  {
    name: "Iniciante",
    subtitle: "Para quem está começando",
    key: "basico" as const,
    features: [
      "1 empresa",
      "1 usuário",
      "Dashboard básico",
      "Contas a pagar/receber",
      "Fluxo de caixa básico",
      "Suporte por email",
    ],
    popular: false,
    badge: null,
    onlyMonthly: true,
    isTrial: true,
  },
  {
    name: "Estrategista",
    subtitle: "Mais escolhido por PMEs",
    key: "profissional" as const,
    features: [
      "3 empresas",
      "3 usuários",
      "Dashboard completo",
      "DRE automático",
      "Conciliação bancária",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
    popular: true,
    badge: "Melhor custo-benefício",
    onlyMonthly: false,
    isTrial: false,
  },
  {
    name: "Mestre",
    subtitle: "Para operações complexas",
    key: "empresarial" as const,
    features: [
      "Empresas ilimitadas",
      "Usuários ilimitados",
      "Tudo do Estrategista",
      "API de integração",
      "White label",
      "Suporte VIP 24/7",
      "Treinamento incluso",
    ],
    popular: false,
    badge: null,
    onlyMonthly: false,
    isTrial: false,
  },
];

export function PricingSection() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>("monthly");
  const [paymentSelector, setPaymentSelector] = useState<{
    isOpen: boolean;
    planKey: keyof typeof SUBSCRIPTION_PLANS;
    period: BillingPeriod;
  }>({
    isOpen: false,
    planKey: "profissional",
    period: "monthly",
  });

  const handlePlanClick = (planKey: keyof typeof SUBSCRIPTION_PLANS, isTrial: boolean) => {
    if (isTrial) {
      if (!user) {
        router.push(`${PUBLIC_ROUTES.AUTH}?tab=signup`);
      } else {
        router.push(MAIN_ROUTES.HOME);
      }
      return;
    }

    setPaymentSelector({
      isOpen: true,
      planKey,
      period: selectedPeriod,
    });
  };

  const getPriceForPlan = (planKey: string) => {
    const plan = SUBSCRIPTION_PLANS[planKey];
    if (!plan) return { price: 0, total: undefined, discount: undefined };

    if (planKey === "basico") {
      const monthlyPrice = plan.prices.monthly;
      return {
        price: monthlyPrice?.price || 0,
        total: undefined,
        discount: undefined,
      };
    }

    const priceOption = plan.prices[selectedPeriod];
    if (!priceOption) {
      const monthlyPrice = plan.prices.monthly;
      return {
        price: monthlyPrice?.price || 0,
        total: undefined,
        discount: undefined,
      };
    }

    return {
      price: priceOption.price,
      total: priceOption.total,
      discount: priceOption.discount,
    };
  };

  const getCTAText = (plan: typeof plans[0]) => {
    if (plan.isTrial) {
      return "Testar Grátis 3 Dias";
    }
    const { price } = getPriceForPlan(plan.key);
    return `Assinar por R$${price}/mês`;
  };

  // Helper to construct PaymentPlan object for the modal
  const getSelectedPlanData = (): { plan: PaymentPlan, name: string } | null => {
    const planConfig = SUBSCRIPTION_PLANS[paymentSelector.planKey];
    if (!planConfig) return null;

    const priceOption = planConfig.prices[paymentSelector.period] || planConfig.prices.monthly;
    if (!priceOption) return null;

    return {
      name: planConfig.name,
      plan: {
        id: paymentSelector.planKey,
        name: planConfig.name, // This is duplicate but needed for interface
        price: priceOption.price,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        interval: paymentSelector.period as any, // Cast to match interface if needed, or update interface
        stripePriceId: priceOption.priceId,
        hotmartCheckoutUrl: priceOption.hotmartUrl || "",
      }
    };
  };

  const selectedPlanData = getSelectedPlanData();

  return (
    <>
      <section id="pricing" className="py-24 lg:py-32 xl:py-40 relative overflow-hidden bg-dark-base">
        {/* Background glass orbs */}
        <div className="absolute top-[20%] left-[15%] w-[400px] h-[400px] bg-metallic-500/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[30%] right-[10%] w-[350px] h-[350px] bg-metallic-400/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 lg:mb-12"
          >
            <span className="text-metallic-300 font-montserrat font-semibold uppercase tracking-wider text-sm">
              Planos
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-montserrat font-bold text-metallic-50 mt-4 mb-4 lg:mb-6">
              Três planos. Um só objetivo:<br className="hidden sm:block" />
              <span className="text-metallic-300">controle total.</span>
            </h2>
            <p className="text-metallic-100/60 text-lg lg:text-xl max-w-2xl lg:max-w-3xl mx-auto">
              Teste grátis por 3 dias. Sem cartão de crédito.
            </p>
          </motion.div>

          {/* Period Selector with glass container */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex justify-center mb-12 lg:mb-16"
          >
            <div className="inline-flex items-center gap-1 p-1.5 bg-dark-surface/80 backdrop-blur-xl rounded-xl border border-metallic-600/20 shadow-lg">
              {billingPeriods.map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key)}
                  className={cn(
                    "relative px-4 py-2.5 rounded-lg font-montserrat font-medium text-sm transition-colors duration-200",
                    selectedPeriod === period.key
                      ? "bg-metallic-shine text-dark-base shadow-metallic-md"
                      : "text-metallic-100/70 hover:text-metallic-100 hover:bg-metallic-600/20"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {period.label}
                    {period.discount && (
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full font-bold",
                          selectedPeriod === period.key
                            ? "bg-dark-base/20 text-dark-base"
                            : "bg-emerald-500/20 text-emerald-400"
                        )}
                      >
                        -{period.discount}%
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-10 max-w-6xl mx-auto mb-12 lg:mb-16">
            {plans.map((plan, index) => {
              const { price, total, discount } = getPriceForPlan(plan.key);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative ${plan.popular ? "md:scale-105 z-10" : ""}`}
                >
                  {/* Extra glass layers for popular plan */}
                  {plan.popular && (
                    <>
                      <div className="absolute -inset-4 bg-metallic-500/10 rounded-[2rem] backdrop-blur-sm border border-metallic-400/10 -z-20" />
                      <div className="absolute -inset-2 bg-metallic-600/10 rounded-[1.5rem] backdrop-blur-md border border-metallic-400/15 -z-10" />
                    </>
                  )}

                  <EnhancedGlassmorphismCard
                    variant={plan.popular ? "deep" : "elevated"}
                    layers={plan.popular ? 1 : 1}
                    specularReflection={true}
                    glowOnHover={true}
                    className={`h-full p-6 md:p-8 lg:p-10 ${plan.popular
                      ? "border-metallic-400/40 shadow-metallic-glow"
                      : ""
                      }`}
                  >
                    {/* Popular Badge with enhanced glass effect */}
                    {plan.badge && (
                      <div className="absolute -top-5 lg:-top-6 left-1/2 -translate-x-1/2 z-20">
                        <div className="relative">
                          {/* Animated glow behind badge */}
                          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/40 via-metallic-400/50 to-emerald-500/40 blur-xl rounded-full animate-pulse" />
                          <div className="absolute -inset-1 bg-metallic-400/30 blur-md rounded-full" />
                          <Badge className="relative bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 text-dark-base px-5 lg:px-7 py-2 lg:py-2.5 font-montserrat font-bold text-xs lg:text-sm whitespace-nowrap shadow-lg shadow-emerald-500/30 border border-emerald-300/50 rounded-full">
                            <Star className="h-3.5 w-3.5 lg:h-4 lg:w-4 mr-2 fill-current drop-shadow-sm" />
                            {plan.badge.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Header */}
                    <div className={`text-center mb-6 lg:mb-8 ${plan.badge ? "pt-6 lg:pt-8" : "pt-2"}`}>
                      <h3 className="text-xl lg:text-2xl font-montserrat font-bold text-metallic-50 mb-1 lg:mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-metallic-100/60 text-sm lg:text-base mb-4 lg:mb-6">
                        {plan.subtitle}
                      </p>

                      {/* Price Display with glass background */}
                      <div className="inline-flex items-baseline justify-center gap-1 px-6 py-3 rounded-xl bg-dark-surface/50 backdrop-blur-lg border border-metallic-600/20">
                        <span className="text-metallic-100/60 text-lg lg:text-xl">R$</span>
                        <span className={`text-5xl lg:text-6xl xl:text-7xl font-montserrat font-bold ${plan.popular ? "text-metallic-300" : "text-metallic-50"}`}>
                          {price}
                        </span>
                        <span className="text-metallic-100/60 lg:text-lg">/mês</span>
                      </div>

                      {/* Period-specific info */}
                      {!plan.onlyMonthly && selectedPeriod !== "monthly" && total ? (
                        <div className="mt-3 space-y-1">
                          <p className="text-sm text-metallic-100/50">
                            R${total.toLocaleString('pt-BR')} cobrado {
                              selectedPeriod === "quarterly" ? "a cada 3 meses" :
                                selectedPeriod === "semiannual" ? "a cada 6 meses" :
                                  "anualmente"
                            }
                          </p>
                          {discount && (
                            <span className="inline-block text-xs bg-emerald-500/20 backdrop-blur-sm text-emerald-400 px-3 py-1 rounded-full font-semibold border border-emerald-500/20">
                              Economize {discount}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-metallic-100/50 mt-3">
                          {plan.isTrial
                            ? "3 dias grátis para testar"
                            : "Cobrado mensalmente"
                          }
                        </p>
                      )}
                    </div>

                    {/* Features with glass checkmarks */}
                    <ul className="space-y-3 lg:space-y-4 mb-8 lg:mb-10">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 lg:gap-3 text-sm lg:text-base">
                          <div className="w-5 h-5 rounded-full bg-metallic-500/20 backdrop-blur-sm flex items-center justify-center mt-0.5 shrink-0">
                            <Check className="h-3 w-3 text-metallic-300" />
                          </div>
                          <span className="text-metallic-100/80">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA with glass effect */}
                    <Button
                      className={`w-full py-3 lg:py-4 font-montserrat font-semibold text-sm lg:text-base relative overflow-hidden group ${plan.popular
                        ? "bg-metallic-shine text-dark-base hover:opacity-90 shadow-metallic-md"
                        : "bg-transparent border border-metallic-400/50 text-metallic-200 hover:bg-metallic-600/20 backdrop-blur-sm"
                        }`}
                      onClick={() => handlePlanClick(plan.key, plan.isTrial)}
                    >
                      {/* Shimmer effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative z-10">{getCTAText(plan)}</span>
                    </Button>
                  </EnhancedGlassmorphismCard>
                </motion.div>
              );
            })}
          </div>

          {/* Trust Badges with glass pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-4 lg:gap-6"
          >
            {[
              { icon: CreditCard, text: "Pagamento seguro" },
              { icon: Shield, text: "7 dias de garantia" },
              { icon: Check, text: "Cancele quando quiser" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 lg:gap-3 px-4 py-2 rounded-lg bg-dark-surface/40 backdrop-blur-lg border border-metallic-600/15 text-metallic-100/60">
                <item.icon className="h-5 w-5 lg:h-6 lg:w-6 text-metallic-400/60" />
                <span className="text-sm lg:text-base">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Payment Selection Modal */}
      {selectedPlanData && (
        <PaymentMethodSelector
          isOpen={paymentSelector.isOpen}
          onClose={() => setPaymentSelector(prev => ({ ...prev, isOpen: false }))}
          plan={selectedPlanData.plan}
          planName={selectedPlanData.name}
          userEmail={user?.email}
        />
      )}
    </>
  );
}


