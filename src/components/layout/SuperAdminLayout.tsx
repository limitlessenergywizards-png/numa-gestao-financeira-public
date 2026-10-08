'use client';

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/shared";
import { PUBLIC_ROUTES, ADMIN_ROUTES } from "@/lib/routes";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import {
  Crown,
  LogOut,
  Loader2,
  Shield,
  User,
  Menu,
  LayoutDashboard,
  CreditCard,
  Settings,
  Building2,
  Users,
  History,
} from "lucide-react";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const { user, profile, isLoading, isSuperAdmin, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(PUBLIC_ROUTES.AUTH);
    } else if (!isLoading && user && !isSuperAdmin) {
      router.replace(PUBLIC_ROUTES.LANDING);
    }
  }, [user, isLoading, isSuperAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    router.push(PUBLIC_ROUTES.AUTH);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "SA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActivePath = (path: string) => pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header Premium do Super Admin */}
      <header className="sticky top-0 z-50 h-16 border-b border-brand/20 bg-card/95 backdrop-blur-md">
        <div className="h-full flex items-center justify-between px-6">
          {/* Esquerda: Logo + Badge Super Admin */}
          <div className="flex items-center gap-4">
            <Logo size="small" showText={false} linkTo={ADMIN_ROUTES.ADMIN} />

            {/* Divisor */}
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-brand/40 to-transparent" />

            {/* Badge Super Admin */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand/10 border border-brand/20">
              <Crown className="h-4 w-4 text-brand" />
              <span className="text-sm font-semibold text-brand tracking-wide uppercase">
                Super Admin
              </span>
              {/* Indicador pulsante */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand/60 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
              </span>
            </div>

            {/* Divisor */}
            <div className="hidden md:block h-8 w-px bg-gradient-to-b from-transparent via-brand/40 to-transparent" />

            {/* Dropdown Menu de Navegação */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden md:flex items-center gap-2 px-3 hover:bg-brand/10"
                >
                  <Menu className="h-4 w-4" />
                  <span className="text-sm font-medium">Navegação</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Páginas Principais</DropdownMenuLabel>
                <DropdownMenuItem
                  className={`gap-2 cursor-pointer ${isActivePath(ADMIN_ROUTES.ADMIN) ? 'bg-brand/10 text-brand' : ''}`}
                  onClick={() => handleNavigate(ADMIN_ROUTES.ADMIN)}
                >
                  <Crown className="h-4 w-4" />
                  Visão Geral
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`gap-2 cursor-pointer ${isActivePath(ADMIN_ROUTES.DASHBOARD) ? 'bg-brand/10 text-brand' : ''}`}
                  onClick={() => handleNavigate(ADMIN_ROUTES.DASHBOARD)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`gap-2 cursor-pointer ${isActivePath(ADMIN_ROUTES.PAYMENTS) ? 'bg-brand/10 text-brand' : ''}`}
                  onClick={() => handleNavigate(ADMIN_ROUTES.PAYMENTS)}
                >
                  <CreditCard className="h-4 w-4" />
                  Pagamentos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Gestão</DropdownMenuLabel>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => handleNavigate(`${ADMIN_ROUTES.ADMIN}?tab=companies`)}
                >
                  <Building2 className="h-4 w-4" />
                  Empresas
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => handleNavigate(`${ADMIN_ROUTES.ADMIN}?tab=users`)}
                >
                  <Users className="h-4 w-4" />
                  Usuários
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => handleNavigate(`${ADMIN_ROUTES.ADMIN}?tab=logs`)}
                >
                  <History className="h-4 w-4" />
                  Logs de Auditoria
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={`gap-2 cursor-pointer ${isActivePath(ADMIN_ROUTES.SETTINGS) ? 'bg-brand/10 text-brand' : ''}`}
                  onClick={() => handleNavigate(ADMIN_ROUTES.SETTINGS)}
                >
                  <Settings className="h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Centro: Título */}
          <div className="hidden lg:flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-heading font-semibold text-foreground">
              Painel de Administração
            </h1>
          </div>

          {/* Direita: Controles */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-brand/10"
                >
                  <Avatar className="h-8 w-8 border border-brand/30">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-brand/20 text-brand text-xs font-semibold">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-foreground">
                    {profile?.full_name || user.email?.split("@")[0] || "Admin"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile?.full_name || "Administrador"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer" disabled>
                  <User className="h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Linha decorativa dourada no bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
      </header>

      {/* Layout com Sidebar + Conteúdo */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <SuperAdminSidebar />

        {/* Conteúdo Principal */}
        <main className="flex-1 p-6 overflow-auto gradient-bg">
          <div className="animate-fade-in max-w-[1800px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Footer minimalista */}
      <footer className="border-t border-brand/10 py-4 px-6 bg-card/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Numa Gestão Financeira</span>
          <span className="flex items-center gap-1">
            <Crown className="h-3 w-3 text-brand" />
            Acesso Super Admin
          </span>
        </div>
      </footer>
    </div>
  );
}
