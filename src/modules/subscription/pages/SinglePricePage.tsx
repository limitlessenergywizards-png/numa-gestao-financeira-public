'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, CreditCard, Shield, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { MAIN_ROUTES } from "@/lib/routes";
import { STRIPE_PLANS, BillingPeriod } from "../hooks/useSubscription";
import { CheckoutModal } from "@/modules/marketing/landing/components/CheckoutModal";
import { EnhancedGlassmorphismCard } from "@/modules/marketing/landing/components/EnhancedGlassmorphismCard";
import {
  LandingHeader,
  HeroSection,
  SocialProofSection,
  PainPointsSection,
  FeaturesSection,
  TestimonialsSection,
  ComparisonTable,
  FAQSection,
  LandingFooter,
  WhatsAppButton,
  QuickTestimonial,
} from "@/modules/marketing/landing/components";
import { PersonaSection } from "@/modules/marketing/landing/components/PersonaSection";
import { FloatingCTA } from "@/modules/marketing/landing/components/FloatingCTA";
import { LazySection } from "@/modules/marketing/landing/components/LazySection";
import { cn } from "@/lib/utils";

const billingPeriods: { key: BillingPeriod; label: string; discount?: number }[] = [
  { key: "monthly", label: "Mensal" },
  { key: "quarterly", label: "Trimestral", discount: 5 },
  { key: "semiannual", label: "Semestral", discount: 10 },
  { key: "yearly", label: "Anual", discount: 20 },
];

const estrategistaFeatures = [
  "3 empresas",
  "3 usuários",
  "Dashboard completo",
  "DRE automático",
  "Conciliação bancária",
  "Relatórios avançados",
  "Suporte prioritário",
];

export default function SinglePricePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>("monthly");
  const [checkoutModal, setCheckoutModal] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.push(MAIN_ROUTES.HOME);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const plan = STRIPE_PLANS.profissional;
  const priceOption = plan.prices[selectedPeriod] || plan.prices.monthly;
  const price = priceOption.price;
  const total = priceOption.total;
  const discount = priceOption.discount;

  const handleCTA = () => {
    setCheckoutModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <main>
        {/* Above the fold - load immediately */}
        <HeroSection />
        <QuickTestimonial />

        {/* Below the fold - lazy load */}
        <LazySection minHeight="500px">
          <PainPointsSection />
        </LazySection>

        <LazySection minHeight="200px">
          <SocialProofSection />
        </LazySection>

        <div id="features">
          <LazySection minHeight="600px">
            <FeaturesSection />
          </LazySection>
        </div>

        <LazySection minHeight="500px">
          <PersonaSection />
        </LazySection>

        <LazySection minHeight="500px">
          <TestimonialsSection />
        </LazySection>

        {/* Single Pricing Section — only Estrategista plan */}
        <div id="pricing">
          <LazySection minHeight="600px">
            <section className="py-24 lg:py-32 xl:py-40 relative overflow-hidden bg-dark-base">
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
                    Plano Estrategista
                  </span>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-montserrat font-bold text-metallic-50 mt-4 mb-4 lg:mb-6">
                    Um plano. Um objetivo:<br className="hidden sm:block" />
                    <span className="text-metallic-300">controle total.</span>
                  </h2>
                  <p className="text-metallic-100/60 text-lg lg:text-xl max-w-2xl lg:max-w-3xl mx-auto">
                    Tudo que você precisa para gerenciar suas finanças com clareza e eficiência.
                  </p>
                </motion.div>

                {/* Period Selector */}
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

                {/* Single Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="max-w-md mx-auto relative mb-12 lg:mb-16"
                >
                  <div className="absolute -inset-4 bg-metallic-500/10 rounded-[2rem] backdrop-blur-sm border border-metallic-400/10 -z-20" />
                  <div className="absolute -inset-2 bg-metallic-600/10 rounded-[1.5rem] backdrop-blur-md border border-metallic-400/15 -z-10" />

                  <EnhancedGlassmorphismCard
                    variant="deep"
                    layers={1}
                    specularReflection={true}
                    glowOnHover={true}
                    className="h-full p-6 md:p-8 lg:p-10 border-metallic-400/40 shadow-metallic-glow"
                  >
                    {/* Badge */}
                    <div className="absolute -top-5 lg:-top-6 left-1/2 -translate-x-1/2 z-20">
                      <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/40 via-metallic-400/50 to-emerald-500/40 blur-xl rounded-full animate-pulse" />
                        <div className="absolute -inset-1 bg-metallic-400/30 blur-md rounded-full" />
                        <Badge className="relative bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 text-dark-base px-5 lg:px-7 py-2 lg:py-2.5 font-montserrat font-bold text-xs lg:text-sm whitespace-nowrap shadow-lg shadow-emerald-500/30 border border-emerald-300/50 rounded-full">
                          <Star className="h-3.5 w-3.5 lg:h-4 lg:w-4 mr-2 fill-current drop-shadow-sm" />
                          MELHOR CUSTO-BENEFÍCIO
                        </Badge>
                      </div>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-6 lg:mb-8 pt-6 lg:pt-8">
                      <h3 className="text-xl lg:text-2xl font-montserrat font-bold text-metallic-50 mb-1 lg:mb-2">
                        Estrategista
                      </h3>
                      <p className="text-metallic-100/60 text-sm lg:text-base mb-4 lg:mb-6">
                        Mais escolhido por PMEs
                      </p>

                      {/* Price */}
                      <div className="inline-flex items-baseline justify-center gap-1 px-6 py-3 rounded-xl bg-dark-surface/50 backdrop-blur-lg border border-metallic-600/20">
                        <span className="text-metallic-100/60 text-lg lg:text-xl">R$</span>
                        <span className="text-5xl lg:text-6xl xl:text-7xl font-montserrat font-bold text-metallic-300">
                          {price}
                        </span>
                        <span className="text-metallic-100/60 lg:text-lg">/mês</span>
                      </div>

                      {/* Period info */}
                      {selectedPeriod !== "monthly" && total ? (
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
                          Cobrado mensalmente
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 lg:space-y-4 mb-8 lg:mb-10">
                      {estrategistaFeatures.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 lg:gap-3 text-sm lg:text-base">
                          <div className="w-5 h-5 rounded-full bg-metallic-500/20 backdrop-blur-sm flex items-center justify-center mt-0.5 shrink-0">
                            <Check className="h-3 w-3 text-metallic-300" />
                          </div>
                          <span className="text-metallic-100/80">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      className="w-full py-3 lg:py-4 font-montserrat font-semibold text-sm lg:text-base relative overflow-hidden group bg-metallic-shine text-dark-base hover:opacity-90 shadow-metallic-md"
                      onClick={handleCTA}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative z-10 flex items-center justify-center">
                        Assinar por R${price}/mês
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </EnhancedGlassmorphismCard>
                </motion.div>

                {/* Trust Badges */}
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
          </LazySection>
        </div>

        <LazySection minHeight="400px">
          <ComparisonTable />
        </LazySection>

        <div id="faq">
          <LazySection minHeight="500px">
            <FAQSection />
          </LazySection>
        </div>

        {/* CTA Section adapted for single plan */}
        <LazySection minHeight="300px">
          <section className="py-24 md:py-32 relative overflow-hidden bg-dark-base">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-metallic-500/15 rounded-full blur-[180px] pointer-events-none animate-breathe" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
              >
                <EnhancedGlassmorphismCard
                  variant="deep"
                  layers={3}
                  specularReflection={true}
                  glowOnHover={false}
                  className="p-8 md:p-12 text-center"
                >
                  <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-metallic-300/40 to-transparent" />

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-4xl lg:text-5xl font-montserrat font-bold mb-4 text-metallic-50"
                  >
                    Pronto para ter{" "}
                    <span className="text-metallic-300">controle total?</span>
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="text-lg md:text-xl text-metallic-100/70 mb-8 max-w-2xl mx-auto"
                  >
                    Assine o plano Estrategista e veja resultados em 7 dias.
                    <br className="hidden md:block" />
                    <span className="text-metallic-300 font-semibold">R${price}/mês — {selectedPeriod !== "monthly" && discount ? `${discount}% de desconto` : "cancele quando quiser"}.</span>
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      size="lg"
                      className="relative text-lg md:text-xl px-10 md:px-14 py-7 md:py-8 bg-metallic-shine text-dark-base hover:opacity-90 transition-opacity shadow-metallic-glow-intense group font-montserrat font-bold border border-metallic-300/30 overflow-hidden"
                      onClick={handleCTA}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative z-10 flex items-center">
                        Assinar Plano Estrategista
                        <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-8"
                  >
                    <div className="inline-flex flex-wrap justify-center gap-x-4 gap-y-2 px-6 py-3 rounded-full bg-dark-surface/40 backdrop-blur-lg border border-metallic-600/15 text-sm text-metallic-100/50">
                      <span>✓ Setup em 5 minutos</span>
                      <span>✓ Importação automática</span>
                      <span>✓ Alertas funcionando no dia 1</span>
                    </div>
                  </motion.div>

                  <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-metallic-300/30 to-transparent" />
                </EnhancedGlassmorphismCard>
              </motion.div>
            </div>
          </section>
        </LazySection>
      </main>

      <LandingFooter />
      <WhatsAppButton />
      <FloatingCTA />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModal}
        onClose={() => setCheckoutModal(false)}
        planKey="profissional"
        billingPeriod={selectedPeriod}
      />
    </div>
  );
}
