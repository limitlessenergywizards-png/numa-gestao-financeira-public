'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { Loader2, Lock, Mail, Shield, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import numaLogoImport from "@/assets/numa-logo.png";
const numaLogo = typeof numaLogoImport === 'string' ? numaLogoImport : numaLogoImport.src;
import { SETTINGS_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";

export default function ActivateAccount() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(SETTINGS_ROUTES.ONBOARDING);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Informe seu email");
      return;
    }

    if (!password) {
      toast.error("Informe a senha recebida por email");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos. Confira a senha enviada por email.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Login realizado com sucesso! Bem-vindo ao Numa!");
      router.replace(SETTINGS_ROUTES.ONBOARDING);
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B3B34] flex items-center justify-center px-4 py-12">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-numa-gold/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={numaLogo} alt="Numa" className="h-12 mx-auto mb-4" />
        </div>

        {/* Card */}
        <div className="bg-[#17322C] rounded-2xl p-8 border border-numa-gold/20 shadow-2xl shadow-black/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-montserrat font-bold text-numa-light mb-2">
              Compra Confirmada! 🎉
            </h1>
            <p className="text-numa-light/60 text-sm leading-relaxed">
              Enviamos uma <span className="text-numa-gold font-medium">senha temporária</span> para seu email.
              <br />
              Use-a abaixo para ativar sua conta.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-numa-light/80 flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-numa-gold/60" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!emailFromUrl}
                placeholder="seu@email.com"
                className={`bg-[#1B3B34] border-numa-gold/20 text-numa-light focus:border-numa-gold focus:ring-numa-gold/20 ${emailFromUrl ? "opacity-70" : ""
                  }`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-numa-light/80 flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-numa-gold/60" />
                Senha (recebida por email)
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Cole a senha do email"
                  required
                  autoFocus
                  className="bg-[#1B3B34] border-numa-gold/20 text-numa-light focus:border-numa-gold focus:ring-numa-gold/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-numa-light/40 hover:text-numa-light/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 bg-numa-gold text-numa-deep hover:bg-numa-gold/90 font-montserrat font-semibold text-base transition-[background-color,box-shadow] duration-200 hover:shadow-lg hover:shadow-numa-gold/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                "Ativar minha conta →"
              )}
            </Button>
          </form>

          {/* SPAM Warning */}
          <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertCircle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-amber-300">
                  Não encontrou o email?
                </p>
                <p className="text-xs text-numa-light/50 leading-relaxed">
                  Por ser o primeiro envio, o email pode estar na sua <span className="text-numa-light/80 font-medium">caixa de SPAM</span> ou na aba <span className="text-numa-light/80 font-medium">Promoções</span>.
                </p>
                <div className="flex flex-col gap-1.5 text-xs text-numa-light/40">
                  <span>1️⃣ Abra seu app de email (Gmail, Outlook, etc.)</span>
                  <span>2️⃣ Procure na pasta <span className="text-numa-light/60">Spam</span> ou <span className="text-numa-light/60">Lixo Eletrônico</span></span>
                  <span>3️⃣ Busque por <span className="text-numa-gold/70 font-medium">ativarconta@numagestaofinanceira.com</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-5 pt-5 border-t border-numa-gold/10 flex items-center justify-center gap-4 text-xs text-numa-light/40">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Acesso seguro</span>
            </div>
            <span>•</span>
            <span>Dados criptografados</span>
            <span>•</span>
            <span>7 dias de garantia</span>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-numa-light/40 text-sm">
            Já tem uma conta?{" "}
            <button
              onClick={() => router.push(PUBLIC_ROUTES.AUTH)}
              className="text-numa-gold hover:underline font-medium"
            >
              Fazer login
            </button>
          </p>
          <p className="text-numa-light/30 text-xs">
            <button
              onClick={() => router.push(PUBLIC_ROUTES.LANDING)}
              className="hover:text-numa-light/50 transition-colors"
            >
              ← Voltar para a página inicial
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
