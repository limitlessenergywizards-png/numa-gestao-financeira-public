'use client';

import { memo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useAuthState } from "@/contexts/AuthContext";
import { type NavItem, type NavGroup } from "@/hooks/useMemoizedNavigation";
import {
  BarChart3,
  FileText,
  GitCompare,
  TrendingUp,
  Users,
  Building2,
  FolderTree,
  Landmark,
  Tag,
  Wallet,
  Settings,
  User,
  Shield,
} from "lucide-react";
import { MAIN_ROUTES, REPORT_ROUTES, SETTINGS_ROUTES } from "@/lib/routes";

// Static nav groups for the drawer (excludes main items already in bottom nav)
const drawerNavGroups: NavGroup[] = [
  {
    label: "Relatórios",
    items: [
      { title: "Fluxo de Caixa", href: REPORT_ROUTES.CASH_FLOW, icon: BarChart3 },
      { title: "DRE", href: REPORT_ROUTES.DRE, icon: FileText },
      { title: "Conciliação Bancária", href: REPORT_ROUTES.RECONCILIATION, icon: GitCompare },
      { title: "Indicadores Financeiros", href: REPORT_ROUTES.ADVANCED, icon: BarChart3 },
      { title: "Minha Jornada", href: REPORT_ROUTES.JOURNEY, icon: TrendingUp },
      { title: "Histórico OCR", href: REPORT_ROUTES.OCR_HISTORY, icon: BarChart3 },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { title: "Clientes", href: SETTINGS_ROUTES.CUSTOMERS, icon: Users },
      { title: "Fornecedores", href: SETTINGS_ROUTES.SUPPLIERS, icon: Building2 },
      { title: "Credores", href: MAIN_ROUTES.CREDITORS, icon: Landmark },
      { title: "Contas Bancárias", href: SETTINGS_ROUTES.BANK_ACCOUNTS, icon: Wallet },
      { title: "Categorias", href: SETTINGS_ROUTES.CATEGORIES, icon: Tag },
      { title: "Plano de Contas", href: SETTINGS_ROUTES.CHART_OF_ACCOUNTS, icon: FolderTree },
      { title: "Centros de Custo", href: SETTINGS_ROUTES.COST_CENTERS, icon: Landmark },
    ],
  },
  {
    label: "Conta",
    items: [
      { title: "Configurações", href: SETTINGS_ROUTES.SETTINGS, icon: Settings },
      { title: "Perfil", href: SETTINGS_ROUTES.PROFILE, icon: User },
    ],
  },
];

const adminGroup: NavGroup = {
  label: "Administração",
  items: [
    { title: "Administração", href: SETTINGS_ROUTES.SETTINGS, icon: Shield },
  ],
};

interface MobileNavigationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DrawerNavItem = memo(function DrawerNavItem({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate: (href: string) => void;
}) {
  return (
    <button
      onClick={() => onNavigate(item.href)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200",
        "active:scale-[0.98]",
        isActive
          ? "bg-gold-500/15 text-gold-400"
          : "text-foreground hover:bg-glass-highlight/50"
      )}
      aria-label={item.title}
      aria-current={isActive ? "page" : undefined}
    >
      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-gold-400" : "text-muted-foreground")} />
      <span className={cn("text-sm", isActive && "font-medium")}>{item.title}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-500" />
      )}
    </button>
  );
});

export const MobileNavigationDrawer = memo(function MobileNavigationDrawer({
  open,
  onOpenChange,
}: MobileNavigationDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin } = useAuthState();

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      onOpenChange(false);
    },
    [router, onOpenChange]
  );

  const groups = isAdmin
    ? [...drawerNavGroups, adminGroup]
    : drawerNavGroups;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] glass-premium border-glass-border">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-base">Navegação</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-8 space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-4 mb-1">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <DrawerNavItem
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
});
