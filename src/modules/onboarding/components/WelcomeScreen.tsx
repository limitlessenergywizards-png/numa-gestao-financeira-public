'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Sparkles, Building2, BarChart3, Shield, LogOut } from "lucide-react";
import { MAIN_ROUTES } from "@/lib/routes";
import { useAuth } from "@/contexts/AuthContext";

interface WelcomeScreenProps {
  userName: string;
  onStart: () => void;
  hasCompanies?: boolean;
}

export function WelcomeScreen({ userName, onStart, hasCompanies = false }: WelcomeScreenProps) {
  const firstName = userName?.split(" ")[0] || "Usuário";
  const router = useRouter();
  const { signOut } = useAuth();

  const features = [
    {
      icon: Building2,
      title: "Gestão Multi-Empresa",
      description: "Gerencie todas as suas empresas em um só lugar",
    },
    {
      icon: BarChart3,
      title: "Relatórios Inteligentes",
      description: "Visualize DRE, Fluxo de Caixa e muito mais",
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Seus dados protegidos com criptografia",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl w-full animate-fade-in">
        <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Bem-vindo, {firstName}! 🎉
            </h1>
            <p className="text-muted-foreground text-lg">
              {hasCompanies
                ? "Estamos felizes em rever você. Vamos configurar mais uma empresa para continuar gerenciando suas finanças."
                : "Estamos felizes em ter você aqui. Vamos configurar sua primeira empresa para começar a gerenciar suas finanças."}
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4 mb-8 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/30 animate-fade-in"
                style={{ animationDelay: `${500 + index * 100}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '800ms', animationFillMode: 'backwards' }}>
            <Button
              size="lg"
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-[box-shadow]"
            >
              {hasCompanies ? "Cadastrar Nova Empresa" : "Cadastrar Minha Empresa"}
              <Sparkles className="ml-2 w-5 h-5" />
            </Button>

            {hasCompanies ? (
              <Button
                variant="ghost"
                onClick={() => router.push(MAIN_ROUTES.HOME)}
                className="text-muted-foreground hover:text-foreground"
              >
                Voltar para o Início
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={async () => {
                  try {
                    await signOut();
                  } catch (err) {
                    console.error("Erro ao deslogar", err);
                  }
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Voltar e sair
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              Leva menos de 2 minutos para configurar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
