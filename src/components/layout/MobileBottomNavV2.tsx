'use client';

import { memo, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Wallet, BarChart3, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_ROUTES, REPORT_ROUTES } from "@/lib/routes";

interface BottomTab {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  route: string | null;
  action?: "popover" | "drawer";
}

const tabs: BottomTab[] = [
  { id: "home", icon: Home, label: "Início", route: MAIN_ROUTES.HOME },
  { id: "financeiro", icon: Wallet, label: "Financeiro", route: null, action: "popover" },
  // gap for FAB
  { id: "relatorios", icon: BarChart3, label: "Relatórios", route: REPORT_ROUTES.CASH_FLOW },
  { id: "mais", icon: MoreHorizontal, label: "Mais", route: null, action: "drawer" },
];

interface MobileBottomNavV2Props {
  onFinanceiroPress?: () => void;
  onMorePress?: () => void;
  className?: string;
}

export const MobileBottomNavV2 = memo(function MobileBottomNavV2({
  onFinanceiroPress,
  onMorePress,
  className,
}: MobileBottomNavV2Props) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = useMemo(() => {
    const path = pathname;
    if (path === MAIN_ROUTES.HOME || path === MAIN_ROUTES.DASHBOARD) return "home";
    if (
      path === MAIN_ROUTES.RECEIVABLES ||
      path === MAIN_ROUTES.PAYABLES ||
      path === MAIN_ROUTES.TRANSACTIONS
    ) return "financeiro";
    if (path.startsWith("/relatorios") || path === REPORT_ROUTES.RECONCILIATION) return "relatorios";
    return "mais";
  }, [pathname]);

  const handleTabPress = (tab: BottomTab) => {
    if (tab.action === "popover") {
      onFinanceiroPress?.();
      return;
    }
    if (tab.action === "drawer") {
      onMorePress?.();
      return;
    }
    if (tab.route) {
      router.push(tab.route);
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="Navegação principal"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "glass-nav border-t border-glass-border",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;

          return (
            <div key={tab.id} className="flex items-center">
              {/* FAB spacer between position 2 and 3 */}
              {index === 2 && <div className="w-16" />}

              <button
                onClick={() => handleTabPress(tab)}
                className="relative flex flex-col items-center gap-1 px-4 py-1 min-w-[60px]"
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gold-500 shadow-gold-glow-sm" />
                )}

                <div
                  className={cn(
                    "p-1.5 rounded-xl transition-colors",
                    isActive ? "text-gold-400" : "text-muted-foreground"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                </div>

                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-gold-400" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
});
