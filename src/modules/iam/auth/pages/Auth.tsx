'use client';

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Shield, Lock } from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Logo } from "@/components/shared";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PUBLIC_ROUTES, SETTINGS_ROUTES, MAIN_ROUTES } from "@/lib/routes";

const emailSchema = z.string().email("E-mail inválido");
const passwordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres");
const nameSchema = z.string().min(2, "Nome deve ter pelo menos 2 caracteres");

// Chess piece features with strategic metaphors
const features = [
  {
    icon: "♛",
    title: "Visão 360°",
    description: "Dashboard completo com inteligência total"
  },
  {
    icon: "♚",
    title: "Segurança Total",
    description: "Dados protegidos como o Rei no tabuleiro"
  },
  {
    icon: "♜",
    title: "Base Sólida",
    description: "Estrutura financeira forte e consistente"
  },
  {
    icon: "♞",
    title: "Movimentos Ágeis",
    description: "Antecipe cenários e surpreenda"
  }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const formVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2, ease: [0.55, 0.055, 0.675, 0.19] }
  }
};

export default function Auth() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();

  // Deep linking: redirect back to intended route after login (via ?redirect= search param)
  const returnTo = searchParams.get("redirect");

  // Get invite params from URL
  const inviteToken = searchParams.get("invite");
  const inviteEmail = searchParams.get("email");

  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(inviteToken ? "signup" : "login");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  // Signup form - pre-fill email from invite
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState(inviteEmail || "");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Accessibility: respect user's motion preferences
  const prefersReducedMotion = useReducedMotion();

  // Conditional animation variants based on motion preference
  const safeContainerVariants = useMemo(() =>
    prefersReducedMotion ? {} : containerVariants,
    [prefersReducedMotion]
  );

  const safeItemVariants = useMemo(() =>
    prefersReducedMotion ? {} : itemVariants,
    [prefersReducedMotion]
  );

  const safeFormVariants = useMemo(() =>
    prefersReducedMotion ? {} : formVariants,
    [prefersReducedMotion]
  );

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      // If there's an invite token, redirect to accept invitation
      if (inviteToken) {
        router.push(`${PUBLIC_ROUTES.ACCEPT_INVITATION}?token=${inviteToken}`);
      } else {
        router.push(returnTo || MAIN_ROUTES.HOME);
      }
    }
  }, [user, authLoading, router, inviteToken, returnTo]);

  function validateLoginForm() {
    const errors: { email?: string; password?: string } = {};

    const emailResult = emailSchema.safeParse(loginEmail);
    if (!emailResult.success) {
      errors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(loginPassword);
    if (!passwordResult.success) {
      errors.password = passwordResult.error.errors[0].message;
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateSignupForm() {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const nameResult = nameSchema.safeParse(signupName);
    if (!nameResult.success) {
      errors.name = nameResult.error.errors[0].message;
    }

    const emailResult = emailSchema.safeParse(signupEmail);
    if (!emailResult.success) {
      errors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(signupPassword);
    if (!passwordResult.success) {
      errors.password = passwordResult.error.errors[0].message;
    }

    if (signupPassword !== signupConfirmPassword) {
      errors.confirmPassword = "As senhas não coincidem";
    }

    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      let message = "Erro ao fazer login";
      if (error.message.includes("Invalid login credentials")) {
        message = "E-mail ou senha incorretos";
      }
      toast.error("Erro", { description: message });
    } else {
      toast.success("Bem-vindo!", { description: "Login realizado com sucesso" });
      const target = inviteToken
        ? `${PUBLIC_ROUTES.ACCEPT_INVITATION}?token=${inviteToken}`
        : returnTo || MAIN_ROUTES.HOME;
      if (prefersReducedMotion) {
        router.push(target);
      } else {
        setTransitionTarget(target);
        setIsTransitioning(true);
      }
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!validateSignupForm()) return;

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setIsLoading(false);

    if (error) {
      let message = "Erro ao criar conta";
      if (error.message.includes("User already registered")) {
        message = "Este e-mail já está cadastrado";
      } else if (error.message.includes("Password should be")) {
        message = "A senha não atende aos requisitos mínimos";
      }
      toast.error("Erro", { description: message });
    } else {
      toast.success("Conta criada!", { description: "Você já pode acessar o sistema" });
      const target = inviteToken
        ? `${PUBLIC_ROUTES.ACCEPT_INVITATION}?token=${inviteToken}`
        : returnTo || SETTINGS_ROUTES.ONBOARDING;
      if (prefersReducedMotion) {
        router.push(target);
      } else {
        setTransitionTarget(target);
        setIsTransitioning(true);
      }
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1B3B34]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C5A059]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#1B3B34] relative overflow-hidden">
      {/* Transition overlay — branded bridge between auth and app */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="auth-transition-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onAnimationComplete={() => {
              if (transitionTarget) router.push(transitionTarget);
            }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#1B3B34]"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute h-32 w-32 rounded-full bg-[#C5A059]/20 blur-2xl animate-pulse" />
              <Logo size="large" linkTo={null} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content with exit animation */}
      <motion.div
        className="min-h-screen flex flex-1"
        animate={isTransitioning ? { opacity: 0, scale: 0.97, y: -10 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
      {/* Left side - Premium Branding with Chess Theme */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#1B3B34]"
      >
        {/* Chess Pattern Overlay */}
        <div className="absolute inset-0 chess-pattern opacity-[0.03]" />

        {/* Decorative Glows - Gold colors */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#C5A059]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-[#C5A059]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C5A059]/5 rounded-full blur-3xl" />

        {/* Content */}
        <motion.div
          variants={safeContainerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 p-12 flex flex-col justify-between w-full"
        >
          {/* Logo with Full Branding - Clickable to home */}
          <motion.div variants={safeItemVariants}>
            <Logo size="hero" showText variant="full" linkTo={PUBLIC_ROUTES.LANDING} className="drop-shadow-lg" />
          </motion.div>

          {/* Main Headline with Chess Quote */}
          <div className="space-y-8">
            <motion.div variants={safeItemVariants} className="space-y-6">
              <h1 className="text-5xl xl:text-6xl font-montserrat font-bold text-numa-light leading-[1.1] tracking-tight">
                Bem-vindo
                <span className="block mt-2 text-gold-gradient">
                  de volta
                </span>
              </h1>
              <p className="text-xl text-numa-light/70 italic max-w-md leading-relaxed border-l-2 border-numa-gold/50 pl-4">
                "No xadrez das finanças, cada jogada conta.
                Entre e continue sua estratégia vencedora."
              </p>
            </motion.div>

            {/* Features Grid with Chess Pieces */}
            <motion.div
              variants={safeContainerVariants}
              className="grid grid-cols-2 gap-4 pt-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={safeItemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-[#1B3B34]/50 backdrop-blur border border-[#C5A059]/20 rounded-xl p-4 group cursor-default transition-[border-color,box-shadow] duration-300 hover:border-[#C5A059]/40 hover:shadow-lg hover:shadow-[#C5A059]/5"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 bg-gradient-to-br from-[#C5A059] to-[#A98A4A]"
                    >
                      <span className="text-2xl text-white">{feature.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-montserrat font-semibold text-[#E5E5E5] text-sm">{feature.title}</h3>
                      <p className="text-xs text-[#E5E5E5]/60 mt-0.5">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Decorative Floating Chess Pieces */}
          <motion.div
            variants={safeItemVariants}
            className="absolute bottom-20 right-16 flex gap-4 opacity-20"
          >
            <motion.span
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl text-numa-gold"
            >
              ♛
            </motion.span>
            <motion.span
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="text-5xl text-numa-gold/80"
            >
              ♚
            </motion.span>
            <motion.span
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="text-4xl text-numa-gold/60"
            >
              ♜
            </motion.span>
          </motion.div>

          {/* Footer */}
          <motion.p variants={safeItemVariants} className="text-sm text-numa-light/40">
            © 2026 Numa Gestão Financeira. Todos os direitos reservados.
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12 bg-[#17322C]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="border border-[#C5A059]/20 shadow-2xl shadow-[#C5A059]/5 bg-[#17322C]/90 backdrop-blur-xl">
            <CardHeader className="text-center pb-2 pt-8">
              {/* Mobile Logo with Full Branding - Clickable to home */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="lg:hidden flex flex-col items-center mb-8"
              >
                <Logo size="xlarge" showText variant="full" linkTo={PUBLIC_ROUTES.LANDING} />
              </motion.div>

              <CardTitle className="text-2xl font-montserrat font-bold text-numa-light">
                {activeTab === "login" ? "Entrar na sua conta" : "Comece sua estratégia vencedora"}
              </CardTitle>
              <CardDescription className="text-numa-light/60">
                {activeTab === "login"
                  ? "Digite suas credenciais para acessar"
                  : "Preencha os dados e domine suas finanças"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-[#1B3B34]/50 border border-[#C5A059]/10">
                  <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-[#C5A059] data-[state=active]:text-[#1B3B34] data-[state=active]:shadow-sm transition-colors text-[#E5E5E5]/70"
                  >
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="data-[state=active]:bg-[#C5A059] data-[state=active]:text-[#1B3B34] data-[state=active]:shadow-sm transition-colors text-[#E5E5E5]/70"
                  >
                    Cadastrar
                  </TabsTrigger>
                </TabsList>

                  <TabsContent value="login" className="mt-0">
                    <AnimatePresence mode="wait">
                    <motion.form
                      key="login-form"
                      variants={safeFormVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onSubmit={handleLogin}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-sm font-medium text-numa-light">E-mail</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className={`h-11 bg-numa-deep/50 border-numa-gold/20 text-numa-light placeholder:text-numa-light/40 focus:ring-2 focus:ring-numa-gold/30 focus:border-numa-gold/40 transition-[border-color,box-shadow] duration-200 ${loginErrors.email ? "border-destructive focus:ring-destructive/30" : ""}`}
                        />
                        {loginErrors.email && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-destructive"
                          >
                            {loginErrors.email}
                          </motion.p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-sm font-medium text-numa-light">Senha</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className={`h-11 bg-numa-deep/50 border-numa-gold/20 text-numa-light placeholder:text-numa-light/40 focus:ring-2 focus:ring-numa-gold/30 focus:border-numa-gold/40 transition-[border-color,box-shadow] duration-200 ${loginErrors.password ? "border-destructive focus:ring-destructive/30" : ""}`}
                        />
                        {loginErrors.password && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-destructive"
                          >
                            {loginErrors.password}
                          </motion.p>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Link
                          href={PUBLIC_ROUTES.FORGOT_PASSWORD}
                          className="text-xs text-numa-gold/70 hover:text-numa-gold transition-colors"
                        >
                          Esqueceu a senha?
                        </Link>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 text-base font-montserrat font-bold bg-numa-gold text-numa-deep hover:bg-[#D4B87A] shadow-lg hover:shadow-xl hover:shadow-numa-gold/20 transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Entrar
                          </>
                        )}
                      </Button>
                    </motion.form>
                    </AnimatePresence>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-0">
                    <AnimatePresence mode="wait">
                    <motion.form
                      key="signup-form"
                      variants={safeFormVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onSubmit={handleSignup}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-sm font-medium text-numa-light">Nome completo</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Seu nome"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className={`h-11 bg-numa-deep/50 border-numa-gold/20 text-numa-light placeholder:text-numa-light/40 focus:ring-2 focus:ring-numa-gold/30 focus:border-numa-gold/40 transition-[border-color,box-shadow] duration-200 ${signupErrors.name ? "border-destructive focus:ring-destructive/30" : ""}`}
                        />
                        {signupErrors.name && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-destructive"
                          >
                            {signupErrors.name}
                          </motion.p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium text-numa-light">E-mail</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className={`h-11 bg-numa-deep/50 border-numa-gold/20 text-numa-light placeholder:text-numa-light/40 focus:ring-2 focus:ring-numa-gold/30 focus:border-numa-gold/40 transition-[border-color,box-shadow] duration-200 ${signupErrors.email ? "border-destructive focus:ring-destructive/30" : ""}`}
                        />
                        {signupErrors.email && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-destructive"
                          >
                            {signupErrors.email}
                          </motion.p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium text-numa-light">Senha</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className={`h-11 bg-numa-deep/50 border-numa-gold/20 text-numa-light placeholder:text-numa-light/40 focus:ring-2 focus:ring-numa-gold/30 focus:border-numa-gold/40 transition-[border-color,box-shadow] duration-200 ${signupErrors.password ? "border-destructive focus:ring-destructive/30" : ""}`}
                        />
                        {signupErrors.password && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-destructive"
                          >
                            {signupErrors.password}
                          </motion.p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password" className="text-sm font-medium text-numa-light">Confirmar senha</Label>
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          className={`h-11 bg-numa-deep/50 border-numa-gold/20 text-numa-light placeholder:text-numa-light/40 focus:ring-2 focus:ring-numa-gold/30 focus:border-numa-gold/40 transition-[border-color,box-shadow] duration-200 ${signupErrors.confirmPassword ? "border-destructive focus:ring-destructive/30" : ""}`}
                        />
                        {signupErrors.confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-destructive"
                          >
                            {signupErrors.confirmPassword}
                          </motion.p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 text-base font-montserrat font-bold bg-numa-gold text-numa-deep hover:bg-[#D4B87A] shadow-lg hover:shadow-xl hover:shadow-numa-gold/20 transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando conta...
                          </>
                        ) : (
                          "Criar conta"
                        )}
                      </Button>
                    </motion.form>
                    </AnimatePresence>
                  </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-center justify-center gap-6 text-xs text-numa-light/50"
          >
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-numa-gold/60" />
              <span>Dados seguros</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-numa-gold/60" />
              <span>Criptografia SSL</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
      </motion.div>
    </div>
  );
}
