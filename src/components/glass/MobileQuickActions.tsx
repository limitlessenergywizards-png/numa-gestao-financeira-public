'use client';

import { memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Plus,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_ROUTES, REPORT_ROUTES } from "@/lib/routes";

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  onClick?: () => void;
}

interface MobileQuickActionsProps {
  actions?: QuickAction[];
  className?: string;
}

export const MobileQuickActions = memo(function MobileQuickActions({
  actions: actionsProp,
  className,
}: MobileQuickActionsProps) {
  const router = useRouter();

  const defaultActions: QuickAction[] = useMemo(() => [
    { icon: ArrowUpRight, label: "Pagar", color: "text-rose-400", onClick: () => router.push(`${MAIN_ROUTES.PAYABLES}?openNew=true`) },
    { icon: ArrowDownLeft, label: "Receber", color: "text-emerald-400", onClick: () => router.push(`${MAIN_ROUTES.RECEIVABLES}?openNew=true`) },
    { icon: Receipt, label: "Boleto", color: "text-sky-400", onClick: () => router.push(`${MAIN_ROUTES.PAYABLES}?openNew=true`) },
    { icon: Plus, label: "Lançar", color: "text-violet-400", onClick: () => router.push(`${MAIN_ROUTES.TRANSACTIONS}?openNew=true`) },
    { icon: Camera, label: "Escanear", color: "text-amber-400", onClick: () => router.push(`${REPORT_ROUTES.OCR_HISTORY}?startScan=true`) },
  ], [router]);

  const actions = actionsProp || defaultActions;
  return (
    <div className={cn("overflow-x-auto scrollbar-hide -mx-4 px-4", className)}>
      <div className="flex gap-3 pb-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="flex flex-col items-center gap-2 min-w-[64px]"
          >
            <div
              className={cn(
                "w-14 h-14 rounded-2xl bg-glass-elevated/70 backdrop-blur-sm",
                "flex items-center justify-center",
                "border border-glass-border",
                "transition-[transform,background-color] duration-200",
                "hover:bg-glass-highlight/70 hover:scale-105",
                "active:scale-95"
              )}
            >
              <action.icon className={cn("w-6 h-6", action.color)} />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});
