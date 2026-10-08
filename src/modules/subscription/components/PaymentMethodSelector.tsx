'use client';

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    CreditCard,
    Smartphone,
    FileText,
    Globe,
    Check,
    Shield,
    Lock,
    Zap,
    Loader2
} from "lucide-react";
import { PaymentPlan, PaymentMethod } from "@/types/payment";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { callEdgeFunction } from "@/lib/supabase/edge-functions";
import { EDGE_FUNCTIONS } from "@/lib/api-endpoints";
import { PUBLIC_ROUTES } from "@/lib/routes";

const paymentMethods = [
    {
        id: "stripe" as PaymentMethod,
        name: "Cartão Internacional",
        description: "Visa, Mastercard, Amex (via Stripe)",
        icon: Globe,
        colorClass: "bg-indigo-500",
        badge: "Mais rápido",
        badgeColorClass: "bg-indigo-100 text-indigo-700",
    },
    {
        id: "hotmart-card" as PaymentMethod,
        name: "Cartão Nacional",
        description: "Todos os cartões brasileiros",
        icon: CreditCard,
        colorClass: "bg-emerald-500",
    },
    {
        id: "hotmart-pix" as PaymentMethod,
        name: "PIX",
        description: "Aprovação instantânea",
        icon: Smartphone,
        colorClass: "bg-teal-500",
        badge: "Instantâneo",
        badgeColorClass: "bg-teal-100 text-teal-700",
    },
    {
        id: "hotmart-boleto" as PaymentMethod,
        name: "Boleto Bancário",
        description: "Prazo de 1-3 dias úteis",
        icon: FileText,
        colorClass: "bg-amber-500",
    },
];

interface PaymentMethodSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    plan: PaymentPlan;
    userEmail?: string;
    planName: string;
}

export function PaymentMethodSelector({
    isOpen,
    onClose,
    plan,
    userEmail,
    planName,
}: PaymentMethodSelectorProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const formatPrice = (price: number, interval: string) => {
        const intervalMap: Record<string, string> = {
            month: "/mês",
            year: "/ano",
            quarter: "/trimestre",
            semester: "/semestre",
        };

        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(price) + (intervalMap[interval] || `/${interval}`);
    };

    const handleContinue = async () => {
        if (!selectedMethod) return;
        setIsLoading(true);

        try {
            if (selectedMethod === "stripe") {
                // Call Supabase Edge Function to create Stripe checkout session
                const data = await callEdgeFunction<{ url?: string }>(EDGE_FUNCTIONS.CREATE_CHECKOUT_SESSION, {
                    body: {
                        priceId: plan.stripePriceId,
                        email: userEmail,
                        planName: planName,
                        successUrl: `${window.location.origin}${PUBLIC_ROUTES.PAYMENT_SUCCESS}`,
                        cancelUrl: `${window.location.origin}${PUBLIC_ROUTES.LANDING}#pricing`,
                    },
                    fallbackMessage: 'Erro ao processar pagamento',
                });

                if (data?.url) {
                    window.location.href = data.url;
                }
            } else {
                // Redirect to Hotmart with payment method parameter
                if (!plan.hotmartCheckoutUrl) {
                    toast.error("Venda indisponível para este plano no momento.");
                    setIsLoading(false);
                    return;
                }

                const hotmartUrl = new URL(plan.hotmartCheckoutUrl);

                if (userEmail) {
                    hotmartUrl.searchParams.set("email", userEmail);
                }

                // Set preferred payment method
                const methodMap: Record<string, string> = {
                    "hotmart-card": "CREDIT_CARD",
                    "hotmart-pix": "PIX",
                    "hotmart-boleto": "BILLET",
                };

                const methodParam = methodMap[selectedMethod];
                if (methodParam) {
                    hotmartUrl.searchParams.set("paymentMethod", methodParam);
                }

                // Add tracking
                hotmartUrl.searchParams.set("src", "app");
                hotmartUrl.searchParams.set("sck", `${plan.id}_${selectedMethod}`);

                window.location.href = hotmartUrl.toString();
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(error instanceof Error ? error.message : "Erro ao processar pagamento. Tente novamente.");
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-zinc-900 border-none shadow-xl rounded-2xl">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-[#1B3B34] to-[#2D5A4E] p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-5" />

                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-2">Escolha como pagar</h2>
                        <div className="flex items-center gap-2 text-white/90 text-sm">
                            <span className="font-medium bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">
                                {planName}
                            </span>
                            <span>•</span>
                            <span className="font-medium">
                                {formatPrice(plan.price, plan.interval)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="p-6 space-y-3">
                    {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedMethod === method.id;

                        return (
                            <button
                                key={method.id}
                                onClick={() => setSelectedMethod(method.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-[border-color,box-shadow] text-left relative group",
                                    isSelected
                                        ? "border-[#1B3B34] bg-[#1B3B34]/5 dark:border-[#2D5A4E] dark:bg-[#2D5A4E]/20"
                                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 dark:hover:border-zinc-700"
                                )}
                            >
                                {/* Icon */}
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                    method.colorClass,
                                    "text-white"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                            {method.name}
                                        </span>
                                        {method.badge && (
                                            <span className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide",
                                                method.badgeColorClass || "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
                                            )}>
                                                {method.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                        {method.description}
                                    </p>
                                </div>

                                {/* Radio indicator */}
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                    isSelected
                                        ? "border-[#1B3B34] bg-[#1B3B34] dark:border-[#2D5A4E] dark:bg-[#2D5A4E]"
                                        : "border-gray-300 dark:border-zinc-600 group-hover:border-[#1B3B34]/50 dark:group-hover:border-[#2D5A4E]/50"
                                )}>
                                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 bg-gray-50 dark:bg-zinc-800/50">
                    <Button
                        onClick={handleContinue}
                        disabled={!selectedMethod || isLoading}
                        className={cn(
                            "w-full py-6 text-base font-semibold shadow-lg transition-colors",
                            !selectedMethod && "opacity-50 grayscale cursor-not-allowed",
                            isLoading ? "cursor-wait" : ""
                        )}
                        size="lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            "Continuar para pagamento"
                        )}
                    </Button>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-6 mt-4 opacity-70">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Lock className="w-3 h-3" />
                            <span>Pagamento seguro</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Zap className="w-3 h-3" />
                            <span>Acesso imediato</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
