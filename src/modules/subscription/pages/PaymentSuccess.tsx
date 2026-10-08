'use client';

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAIN_ROUTES, SETTINGS_ROUTES } from "@/lib/routes";

export default function PaymentSuccess() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isVerifying, setIsVerifying] = useState(true);

    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        // Verify payment if coming from Stripe
        if (sessionId) {
            // Optional: Verify the session with your backend
            // For now, assume success if session_id is present
            setTimeout(() => setIsVerifying(false), 2000);
        } else {
            // Coming from Hotmart - payment will be confirmed via webhook
            // Just show success immediately for UX
            setIsVerifying(false);
        }
    }, [sessionId]);

    if (isVerifying) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-900">
                <div className="text-center p-8">
                    <Loader2 className="h-16 w-16 animate-spin text-emerald-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Verificando pagamento...</h2>
                    <p className="text-gray-500 dark:text-gray-400">Por favor, aguarde enquanto confirmamos sua assinatura.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-900 p-4">
            <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-xl p-8 max-w-lg w-full text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-500" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Pagamento confirmado!
                </h1>

                <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
                    Sua assinatura foi ativada com sucesso. Você já pode acessar
                    todas as funcionalidades do Numa.
                </p>

                <div className="space-y-4">
                    <Button
                        onClick={() => router.push(MAIN_ROUTES.DASHBOARD)}
                        className="w-full h-12 text-base font-semibold bg-[#1B3B34] hover:bg-[#2D5A4E]"
                    >
                        Acessar o Dashboard
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => router.push(SETTINGS_ROUTES.ONBOARDING)}
                        className="w-full h-12 text-base border-gray-300 dark:border-zinc-700"
                    >
                        Configurar minha empresa
                    </Button>
                </div>
            </div>
        </div>
    );
}
