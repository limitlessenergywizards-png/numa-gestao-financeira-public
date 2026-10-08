'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, Shield, CreditCard, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { STRIPE_PLANS, BillingPeriod } from "@/modules/subscription/hooks/useSubscription";
import { z } from "zod";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planKey: keyof typeof STRIPE_PLANS;
  billingPeriod: BillingPeriod;
}

const emailSchema = z.string().email("Email inválido").max(255);

const planFeatures: Record<string, string[]> = {
  basico: [
    "1 empresa",
    "1 usuário",
    "Dashboard básico",
    "Contas a pagar/receber",
    "Fluxo de caixa básico",
  ],
  profissional: [
    "3 empresas",
    "3 usuários",
    "Dashboard completo",
    "DRE automático",
    "Conciliação bancária",
    "Relatórios avançados",
  ],
  empresarial: [
    "Empresas ilimitadas",
    "Usuários ilimitados",
    "Tudo do Estrategista",
    "API de integração",
    "White label",
    "Suporte VIP 24/7",
  ],
};

export function CheckoutModal({ isOpen, onClose, planKey, billingPeriod }: CheckoutModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const plan = STRIPE_PLANS[planKey];
  const priceOption = plan.prices[billingPeriod] || plan.prices.monthly;
  const features = planFeatures[planKey] || [];

  const getPeriodLabel = () => {
    switch (billingPeriod) {
      case "quarterly":
        return "trimestral";
      case "semiannual":
        return "semestral";
      case "yearly":
        return "anual";
      default:
        return "mensal";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    // Validate email
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setEmailError(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      // Build the Hotmart checkout URL with email pre-filled
      const hotmartUrl = priceOption?.hotmartUrl;
      if (!hotmartUrl) {
        toast.error("Checkout indisponível para este plano. Entre em contato com o suporte.");
        setIsLoading(false);
        return;
      }
      const separator = hotmartUrl.includes("?") ? "&" : "?";
      const checkoutUrl = `${hotmartUrl}${separator}email=${encodeURIComponent(email)}`;

      // Redirect to Hotmart checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao processar pagamento");
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-[#17322C] rounded-2xl border border-numa-gold/30 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-numa-gold/20 to-transparent p-6 pb-4">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-numa-light/60 hover:text-numa-light transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-numa-gold/20 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-numa-gold" />
                  </div>
                  <div>
                    <h2 className="text-xl font-montserrat font-bold text-numa-light">
                      Plano {plan.name}
                    </h2>
                    <p className="text-numa-light/60 text-sm">
                      Cobrança {getPeriodLabel()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="px-6 py-4 border-b border-numa-gold/10">
                <div className="flex items-baseline gap-1">
                  <span className="text-numa-light/60">R$</span>
                  <span className="text-4xl font-montserrat font-bold text-numa-gold">
                    {priceOption?.price}
                  </span>
                  <span className="text-numa-light/60">/mês</span>
                </div>
                {priceOption?.total && priceOption.discount && (
                  <p className="text-sm text-emerald-400 mt-1">
                    R${priceOption.total.toLocaleString("pt-BR")} no período • Economia de {priceOption.discount}%
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="px-6 py-4 border-b border-numa-gold/10">
                <p className="text-sm text-numa-light/60 mb-3">Incluso no plano:</p>
                <ul className="space-y-2">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-numa-light/80">
                      <Check className="h-4 w-4 text-numa-gold shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="checkout-email" className="text-numa-light/80 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Seu email
                  </Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    placeholder="seu@email.com"
                    required
                    disabled={isLoading}
                    className={`bg-[#1B3B34] border-numa-gold/20 text-numa-light focus:border-numa-gold focus:ring-numa-gold/20 ${emailError ? "border-red-500" : ""
                      }`}
                  />
                  {emailError && (
                    <p className="text-red-400 text-xs">{emailError}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full py-6 bg-numa-gold text-numa-deep hover:bg-numa-gold/90 font-montserrat font-semibold text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Redirecionando...
                    </>
                  ) : (
                    <>
                      Continuar para pagamento seguro
                      <span className="ml-2">→</span>
                    </>
                  )}
                </Button>
              </form>

              {/* Trust Badges */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-center gap-4 text-xs text-numa-light/50">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>7 dias de garantia</span>
                  </div>
                  <span>•</span>
                  <span>Cancele quando quiser</span>
                  <span>•</span>
                  <span>Hotmart seguro</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
