'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { z } from "zod";

import { Logo } from "@/components/shared";
import { PUBLIC_ROUTES } from "@/lib/routes";

const passwordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres");

export default function ResetPassword() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    // Check if user has a valid recovery session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsValidSession(!!session);
            setIsCheckingSession(false);
        };

        // Listen for auth events (recovery link opens a session)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setIsValidSession(true);
                setIsCheckingSession(false);
            }
        });

        checkSession();
        return () => subscription.unsubscribe();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const newErrors: { password?: string; confirmPassword?: string } = {};

        const result = passwordSchema.safeParse(password);
        if (!result.success) {
            newErrors.password = result.error.errors[0].message;
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = "As senhas não coincidem";
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                toast.error("Erro ao redefinir senha. Tente novamente.");
            } else {
                setIsSuccess(true);
                toast.success("Senha redefinida com sucesso!");
                setTimeout(() => router.push(PUBLIC_ROUTES.AUTH), 3000);
            }
        } catch {
            toast.error("Erro inesperado. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    }

    if (isCheckingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1B3B34]">
                <Loader2 className="h-8 w-8 animate-spin text-[#C5A059]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1B3B34] p-6">
            <div className="w-full max-w-md animate-fade-in">
                <div className="flex justify-center mb-8">
                    <Logo size="xlarge" showText variant="full" linkTo={PUBLIC_ROUTES.LANDING} />
                </div>

                <Card className="border border-[#C5A059]/20 shadow-2xl shadow-[#C5A059]/5 bg-[#17322C]/90 backdrop-blur-xl">
                    <CardHeader className="text-center pb-2 pt-8">
                        <CardTitle className="text-2xl font-montserrat font-bold text-numa-light">
                            {isSuccess ? "Senha redefinida!" : "Nova senha"}
                        </CardTitle>
                        <CardDescription className="text-numa-light/60">
                            {isSuccess
                                ? "Você será redirecionado ao login"
                                : "Escolha sua nova senha"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        {isSuccess ? (
                            <div className="space-y-6 text-center animate-fade-in">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                    </div>
                                </div>
                                <p className="text-sm text-numa-light/70">
                                    Sua senha foi alterada com sucesso. Redirecionando...
                                </p>
                            </div>
                        ) : !isValidSession ? (
                            <div className="space-y-4 text-center">
                                <p className="text-sm text-numa-light/70">
                                    Link de recuperação inválido ou expirado.
                                </p>
                                <Button
                                    onClick={() => router.push(PUBLIC_ROUTES.FORGOT_PASSWORD)}
                                    className="bg-numa-gold text-numa-deep hover:bg-[#D4B87A]"
                                >
                                    Solicitar novo link
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="text-sm font-medium text-numa-light">
                                        Nova senha
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-numa-light/40" />
                                        <Input
                                            id="new-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`h-11 pl-10 bg-numa-deep/50 border-numa-gold/20 text-numa-light placeholder:text-numa-light/40 focus:ring-2 focus:ring-numa-gold/30 focus:border-numa-gold/40 ${errors.password ? "border-destructive" : ""}`}
                                        />
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-destructive">{errors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-new-password" className="text-sm font-medium text-numa-light">
                                        Confirmar nova senha
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-numa-light/40" />
                                        <Input
                                            id="confirm-new-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`h-11 pl-10 bg-numa-deep/50 border-numa-gold/20 text-numa-light placeholder:text-numa-light/40 focus:ring-2 focus:ring-numa-gold/30 focus:border-numa-gold/40 ${errors.confirmPassword ? "border-destructive" : ""}`}
                                        />
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 text-base font-montserrat font-bold bg-numa-gold text-numa-deep hover:bg-[#D4B87A] shadow-lg hover:shadow-xl hover:shadow-numa-gold/20 transition-[background-color,box-shadow] duration-300"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Redefinindo...
                                        </>
                                    ) : (
                                        "Redefinir senha"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
