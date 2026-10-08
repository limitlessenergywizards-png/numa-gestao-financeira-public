'use client';

import { memo } from "react";
import { Home, BarChart3, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavTab {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface MobileBottomNavProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

const tabs: NavTab[] = [
  { id: "home", icon: Home, label: "Início" },
  { id: "stats", icon: BarChart3, label: "Relatórios" },
  { id: "cards", icon: CreditCard, label: "Cartões" },
  { id: "settings", icon: Settings, label: "Config" },
];

export const MobileBottomNav = memo(function MobileBottomNav({
  activeTab = "home",
  onTabChange,
  className,
}: MobileBottomNavProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "glass-nav border-t border-glass-border",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className="relative flex flex-col items-center gap-1 px-4 py-1 min-w-[60px]"
            >
              {/* Active indicator */}
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
          );
        })}
      </div>
    </nav>
  );
});
