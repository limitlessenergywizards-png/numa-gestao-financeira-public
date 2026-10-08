'use client';

import { useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  BarChart3,
  FileText,
  Users,
  Building2,
  Settings,
  TrendingUp,
  TrendingDown,
  Landmark,
  FolderTree,
  Shield,
  GitCompare,
  Tag,
  LucideIcon,
  BookOpen,
  Target,
  Sparkles,
} from "lucide-react";
import { MAIN_ROUTES, REPORT_ROUTES, SETTINGS_ROUTES, SUPPORT_ROUTES } from "@/lib/routes";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// Static nav items defined outside component to prevent re-creation
const mainNavItems: NavItem[] = [
  { title: "Início", href: MAIN_ROUTES.HOME, icon: TrendingUp },
  { title: "Dashboard", href: MAIN_ROUTES.DASHBOARD, icon: LayoutDashboard },
  { title: "Movimentações", href: MAIN_ROUTES.TRANSACTIONS, icon: Wallet },
  { title: "Contas a Receber", href: MAIN_ROUTES.RECEIVABLES, icon: ArrowDownCircle },
  { title: "Contas a Pagar", href: MAIN_ROUTES.PAYABLES, icon: ArrowUpCircle },
  { title: "Orçamentos", href: MAIN_ROUTES.BUDGET, icon: Target },
  { title: "Dívidas", href: MAIN_ROUTES.DEBTS, icon: TrendingDown },
  { title: "Consultor IA", href: MAIN_ROUTES.AI_CHAT, icon: Sparkles },
];

const reportNavItems: NavItem[] = [
  { title: "Fluxo de Caixa", href: REPORT_ROUTES.CASH_FLOW, icon: BarChart3 },
  { title: "DRE", href: REPORT_ROUTES.DRE, icon: FileText },
  { title: "Conciliação Bancária", href: REPORT_ROUTES.RECONCILIATION, icon: GitCompare },
  { title: "Indicadores Financeiros", href: REPORT_ROUTES.ADVANCED, icon: BarChart3 },
  { title: "Minha Jornada", href: REPORT_ROUTES.JOURNEY, icon: TrendingUp },
  { title: "Histórico OCR", href: REPORT_ROUTES.OCR_HISTORY, icon: BarChart3 },
];

const settingsNavItems: NavItem[] = [
  { title: "Clientes", href: SETTINGS_ROUTES.CUSTOMERS, icon: Users },
  { title: "Fornecedores", href: SETTINGS_ROUTES.SUPPLIERS, icon: Building2 },
  { title: "Credores", href: MAIN_ROUTES.CREDITORS, icon: Landmark },
  { title: "Plano de Contas", href: SETTINGS_ROUTES.CHART_OF_ACCOUNTS, icon: FolderTree },
  { title: "Centros de Custo", href: SETTINGS_ROUTES.COST_CENTERS, icon: Landmark },
  { title: "Categorias", href: SETTINGS_ROUTES.CATEGORIES, icon: Tag },
  { title: "Contas Bancárias", href: SETTINGS_ROUTES.BANK_ACCOUNTS, icon: Wallet },
  { title: "Configurações", href: SETTINGS_ROUTES.SETTINGS, icon: Settings },
];

const adminNavItems: NavItem[] = [
  { title: "Administração", href: SETTINGS_ROUTES.SETTINGS, icon: Shield },
];

const supportNavItems: NavItem[] = [
  { title: "Manual do Sistema", href: SUPPORT_ROUTES.MANUAL, icon: BookOpen },
];

// Pure function for extracting initials - no re-creation needed
export function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function useMemoizedNavigation(isAdmin: boolean = false) {
  const pathname = usePathname();

  // Memoize active route check - stable callback
  const isActiveRoute = useCallback(
    (href: string) => pathname === href,
    [pathname]
  );

  // Memoize nav groups based on admin status only
  const navGroups = useMemo((): NavGroup[] => {
    const groups: NavGroup[] = [
      { label: "Principal", items: mainNavItems },
      { label: "Relatórios", items: reportNavItems },
      { label: "Cadastros", items: settingsNavItems },
      { label: "Suporte", items: supportNavItems },
    ];

    if (isAdmin) {
      groups.push({ label: "Administração", items: adminNavItems });
    }

    return groups;
  }, [isAdmin]);

  // Memoize route class names generator
  const getNavItemClasses = useCallback(
    (href: string) => {
      const isActive = pathname === href;
      return {
        isActive,
        buttonClasses: isActive
          ? "bg-brand/20 text-brand hover:bg-brand/25"
          : "",
        iconClasses: isActive ? "text-brand" : "",
        textClasses: isActive ? "font-medium text-brand" : "",
      };
    },
    [pathname]
  );

  return {
    navGroups,
    isActiveRoute,
    getNavItemClasses,
    currentPath: pathname,
  };
}
