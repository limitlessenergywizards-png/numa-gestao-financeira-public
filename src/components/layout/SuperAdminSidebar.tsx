'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crown,
  LayoutDashboard,
  CreditCard,
  Settings,
  Building2,
  Users,
  Mail,
  History,
  ChevronLeft,
  ChevronRight,
  Headset,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string;
}

import { ADMIN_ROUTES } from "@/lib/routes";

const mainNavItems: NavItem[] = [
  { icon: Crown, label: "Visão Geral", href: ADMIN_ROUTES.ADMIN },
  { icon: LayoutDashboard, label: "Dashboard", href: ADMIN_ROUTES.DASHBOARD },
  { icon: Building2, label: "Tenants", href: ADMIN_ROUTES.TENANTS },
  { icon: CreditCard, label: "Pagamentos", href: ADMIN_ROUTES.PAYMENTS },
];

const managementNavItems: NavItem[] = [
  { icon: Users, label: "Usuários", href: `${ADMIN_ROUTES.ADMIN}?tab=users`, badge: "⌘U" },
  { icon: Mail, label: "Convites", href: `${ADMIN_ROUTES.ADMIN}?tab=invitations`, badge: "⌘C" },
  { icon: History, label: "Logs", href: `${ADMIN_ROUTES.ADMIN}?tab=logs`, badge: "⌘L" },
];

const settingsNavItems: NavItem[] = [
  { icon: Headset, label: "Suporte", href: ADMIN_ROUTES.SUPPORT },
  { icon: Settings, label: "Configurações", href: ADMIN_ROUTES.SETTINGS },
];

export function SuperAdminSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname === href;
  };

  const NavItemComponent = ({ item, showLabel }: { item: NavItem; showLabel: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    const content = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-[color,background-color,box-shadow] duration-150 group",
          active
            ? "bg-brand text-brand-foreground shadow-lg shadow-brand/20"
            : "text-muted-foreground hover:bg-brand/10 hover:text-foreground"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", active && "text-brand-foreground")} />
        {showLabel && (
          <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-opacity duration-200">
            {item.label}
          </span>
        )}
        {showLabel && item.badge && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (!showLabel) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className="sticky top-16 h-[calc(100vh-4rem)] flex flex-col border-r border-brand/20 bg-card/50 backdrop-blur-sm transition-[width] duration-200 ease-in-out"
      style={{ width: isExpanded ? 240 : 72 }}
    >
      {/* Toggle Button */}
      <div className="absolute -right-3 top-4 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full border-brand/30 bg-card shadow-md hover:bg-brand/10"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Recolher barra lateral" : "Expandir barra lateral"}
        >
          {isExpanded ? (
            <ChevronLeft className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          {isExpanded && (
            <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Principal
            </span>
          )}
          <nav className="space-y-1 mt-2">
            {mainNavItems.map((item) => (
              <NavItemComponent key={item.href + item.label} item={item} showLabel={isExpanded} />
            ))}
          </nav>
        </div>

        {/* Management */}
        <div className="space-y-1">
          {isExpanded && (
            <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gestão
            </span>
          )}
          <nav className="space-y-1 mt-2">
            {managementNavItems.map((item) => (
              <NavItemComponent key={item.href + item.label} item={item} showLabel={isExpanded} />
            ))}
          </nav>
        </div>

        {/* Settings */}
        <div className="space-y-1">
          {isExpanded && (
            <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sistema
            </span>
          )}
          <nav className="space-y-1 mt-2">
            {settingsNavItems.map((item) => (
              <NavItemComponent key={item.href + item.label} item={item} showLabel={isExpanded} />
            ))}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-brand/10">
        {isExpanded ? (
          <div className="px-3 py-2 rounded-lg bg-brand/5 border border-brand/10">
            <p className="text-xs text-muted-foreground">Modo Super Admin</p>
            <p className="text-xs text-brand font-medium">Acesso Total</p>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center p-2 rounded-lg bg-brand/5 border border-brand/10">
                <Crown className="h-4 w-4 text-brand" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">Super Admin</p>
              <p className="text-xs text-muted-foreground">Acesso Total</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}
