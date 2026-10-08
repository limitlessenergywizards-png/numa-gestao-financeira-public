'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { invokeEdgeFunction, callEdgeFunction } from "@/lib/supabase/edge-functions";
import { EDGE_FUNCTIONS } from "@/lib/api-endpoints";
import { toast } from "sonner";
import { getEdgeFunctionErrorMessage } from "@/lib/errorUtils";

export interface SubscriptionData {
  subscribed: boolean;
  plan_name: string;
  status: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

export type BillingPeriod = "monthly" | "quarterly" | "semiannual" | "yearly";

export interface PriceOption {
  priceId: string;
  price: number;
  total?: number;
  period: string;
  discount?: number;
  intervalCount?: number;
  hotmartUrl?: string; // URL for Hotmart checkout
}

export interface PlanConfig {
  productId: string;
  name: string;
  prices: Partial<Record<BillingPeriod, PriceOption>>;
}

// Subscription Plans Configuration with Stripe and Hotmart
export const SUBSCRIPTION_PLANS: Record<string, PlanConfig> = {
  basico: {
    productId: "prod_TsYLqp0HObmGVg",
    name: "Iniciante",
    prices: {
      monthly: {
        priceId: "price_1SunF5JmzYB7IIyoSxzDn6bA",
        price: 97,
        period: "mês",
      },
    },
  },
  profissional: {
    productId: "prod_TsYL9OCW6yMYj5",
    name: "Estrategista",
    prices: {
      monthly: {
        priceId: "price_1SunF7JmzYB7IIyo2YhUB8pQ",
        price: 197,
        period: "mês",
        hotmartUrl: "https://pay.hotmart.com/P104301287I?off=454lnt9i",
      },
      quarterly: {
        priceId: "price_1SunJaJmzYB7IIyoYkWRo500",
        price: 187,
        total: 561,
        period: "trimestre",
        discount: 5,
        intervalCount: 3,
        hotmartUrl: "https://pay.hotmart.com/P104301287I?off=dlftyn3w",
      },
      semiannual: {
        priceId: "price_1SunJbJmzYB7IIyoKPSMszCQ",
        price: 177,
        total: 1062,
        period: "semestre",
        discount: 10,
        intervalCount: 6,
        hotmartUrl: "https://pay.hotmart.com/P104301287I?off=6bq4ymjj",
      },
      yearly: {
        priceId: "price_1SunJcJmzYB7IIyo7QWZf7Ut",
        price: 157,
        total: 1884,
        period: "ano",
        discount: 20,
        intervalCount: 12,
        hotmartUrl: "https://pay.hotmart.com/P104301287I?off=wlys3ebf",
      },
    },
  },
  empresarial: {
    productId: "prod_Tv0sTOhtsXVSqh",
    name: "Mestre",
    prices: {
      monthly: {
        priceId: "price_1SxArAJmzYB7IIyodzTRDiU6",
        price: 297,
        period: "mês",
      },
      quarterly: {
        priceId: "price_1SxArBJmzYB7IIyoZBYoowd1",
        price: 282,
        total: 846,
        period: "trimestre",
        discount: 5,
        intervalCount: 3,
      },
      semiannual: {
        priceId: "price_1SxArCJmzYB7IIyoHmnaW8AW",
        price: 267,
        total: 1602,
        period: "semestre",
        discount: 10,
        intervalCount: 6,
      },
      yearly: {
        priceId: "price_1SxArDJmzYB7IIyoOX13puCC",
        price: 238,
        total: 2856,
        period: "ano",
        discount: 20,
        intervalCount: 12,
      },
    },
  },
};

export const STRIPE_PLANS = SUBSCRIPTION_PLANS; // Alias for backward compatibility

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    // Only show loading on initial check, not background refreshes
    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }

    try {
      const { data, error } = await invokeEdgeFunction(EDGE_FUNCTIONS.CHECK_SUBSCRIPTION);

      if (error) {
        const msg = await getEdgeFunctionErrorMessage(error);
        // New users without Stripe customer - expected, not an error
        const isExpectedNoCustomer =
          typeof msg === 'string' &&
          (msg.includes('No customer') || msg.includes('not found') || msg.includes('no customer'));
        if (!isExpectedNoCustomer) {
          console.error("Error checking subscription:", msg);
        }
        setSubscription({ subscribed: false, plan_name: "free", status: "inactive" });
      } else {
        setSubscription(data as SubscriptionData);
      }
    } catch (error: unknown) {
      // New users without Stripe customer - expected, not an error
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isExpectedNoCustomer =
        errorMsg.includes('No customer') || errorMsg.includes('not found') || errorMsg.includes('no customer');
      if (!isExpectedNoCustomer) {
        console.error("Error checking subscription:", error);
      }
      setSubscription({ subscribed: false, plan_name: "free", status: "inactive" });
    } finally {
      hasLoadedRef.current = true;
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Use stable string ID instead of user object reference

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkSubscription, 300000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, checkSubscription]);

  const createCheckout = async (
    planKey: keyof typeof STRIPE_PLANS,
    billingPeriod: BillingPeriod = "monthly"
  ) => {
    if (!user) {
      toast.error("Você precisa estar logado para assinar um plano");
      return;
    }

    try {
      setIsLoading(true);
      const plan = STRIPE_PLANS[planKey];
      const priceOption = plan.prices[billingPeriod];

      if (!priceOption) {
        toast.error("Período de cobrança não disponível para este plano");
        return;
      }

      const data = await callEdgeFunction<{ url?: string }>(EDGE_FUNCTIONS.CREATE_CHECKOUT_SESSION, {
        body: {
          priceId: priceOption.priceId,
          planName: plan.name,
        },
        fallbackMessage: 'Erro ao criar sessão de pagamento',
      });

      if (data?.url) {
        // Redirect in same tab for better UX
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar sessão de pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const createGuestCheckout = async (
    email: string,
    planKey: keyof typeof STRIPE_PLANS,
    billingPeriod: BillingPeriod = "monthly"
  ) => {
    try {
      setIsLoading(true);
      const plan = STRIPE_PLANS[planKey];
      const priceOption = plan.prices[billingPeriod];

      if (!priceOption) {
        toast.error("Período de cobrança não disponível para este plano");
        return;
      }

      const data = await callEdgeFunction<{ url?: string }>(EDGE_FUNCTIONS.CREATE_CHECKOUT_SESSION, {
        body: {
          priceId: priceOption.priceId,
          email,
          planName: plan.name,
        },
        fallbackMessage: 'Erro ao criar sessão de pagamento',
      });

      if (data?.url) {
        // Redirect in same tab for better UX
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating guest checkout:", error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar sessão de pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const openPortal = async () => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    try {
      const data = await callEdgeFunction<{ url?: string }>(EDGE_FUNCTIONS.CREATE_PORTAL_SESSION, {
        fallbackMessage: 'Erro ao abrir portal de gerenciamento',
      });

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
      toast.error(error instanceof Error ? error.message : 'Erro ao abrir portal de gerenciamento');
    }
  };

  return {
    subscription,
    isLoading,
    checkSubscription,
    createCheckout,
    createGuestCheckout,
    openPortal,
    isSubscribed: subscription?.subscribed ?? false,
    planName: subscription?.plan_name ?? "free",
  };
}
