'use client';

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { z } from "zod";

import { Logo } from "@/components/shared";
import { PUBLIC_ROUTES } from "@/lib/routes";

const emailSchema = z.string().email("E-mail inválido");

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setEmailError("");

        const result = emailSchema.safeParse(email);
        if (!result.success) {
            setEmailError(result.error.errors[0].message);
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}${PUBLIC_ROUTES.RESET_PASSWORD}`,
            });

            if (error) {
                toast.error("Erro ao enviar email de recuperação. Tente novamente.");
            } else {
                setIsSent(true);
            }
        } catch {
            toast.error("Erro inesperado. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
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
                            {isSent ? "Email enviado!" : "Recuperar senha"}
                        </CardTitle>
                        <CardDescription className="text-numa-light/60">
                            {isSent
                                ? "Verifique sua caixa de entrada"
                                : "Informe seu e-mail para receber o link de recuperação"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        {isSent ? (
                            <div className="space-y-6 text-center animate-fade-in">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-numa-light/70">
                                        Enviamos um link de recuperação para
                                    </p>
                                    <p className="text-sm font-semibold text-numa-gold">{email}</p>
                                    <p className="text-xs text-numa-light/50 mt-4">
                                        Não recebeu? Verifique a pasta de spam ou tente novamente.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full border-numa-gold/20 text-numa-light hover:bg-numa-gold/10"
                                        onClick={() => setIsSent(false)}
                                    >
                                        Enviar novamente
                                    </Button>
                                    <Link href={PUBLIC_ROUTES.AUTH}>
                                        <Button
                                            variant="ghost"
                                            className="w-full text-numa-light/60 hover:text-numa-light"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Voltar ao login
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="forgot-email" className="text-sm font-medium text-numa-light">
                                        E-mail
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-numa-light/40" />
                                        <Input
                                            id="forgot-email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setEmailError("");
                                            }}
                                            className={`h-11 pl-10 bg-numa-deep/50 border-numa-gold/20 text-numa-light placeholder:text-numa-light/40 focus:ring-2 focus:ring-numa-gold/30 focus:border-numa-gold/40 ${emailError ? "border-destructive" : ""}`}
                                        />
                                    </div>
                                    {emailError && (
                                        <p className="text-sm text-destructive">{emailError}</p>
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
                                            Enviando...
                                        </>
                                    ) : (
                                        "Enviar link de recuperação"
                                    )}
                                </Button>

                                <Link href={PUBLIC_ROUTES.AUTH}>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full text-numa-light/60 hover:text-numa-light mt-2"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Voltar ao login
                                    </Button>
                                </Link>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
