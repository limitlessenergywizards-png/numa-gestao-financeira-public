'use client';

import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ArrowDownCircle, ArrowUpCircle, Repeat, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_ROUTES, REPORT_ROUTES } from "@/lib/routes";

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  route: string;
  state?: Record<string, unknown>;
}

const quickActions: QuickAction[] = [
  {
    icon: ArrowDownCircle,
    label: "Nova Receita",
    description: "Registrar conta a receber",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    route: MAIN_ROUTES.RECEIVABLES,
    state: { openNew: true },
  },
  {
    icon: ArrowUpCircle,
    label: "Nova Despesa",
    description: "Registrar conta a pagar",
    color: "text-rose-400",
    bgColor: "bg-rose-500/15",
    route: MAIN_ROUTES.PAYABLES,
    state: { openNew: true },
  },
  {
    icon: Repeat,
    label: "Nova Movimentação",
    description: "Lançar movimentação",
    color: "text-violet-400",
    bgColor: "bg-violet-500/15",
    route: MAIN_ROUTES.TRANSACTIONS,
    state: { openNew: true },
  },
  {
    icon: Camera,
    label: "Escanear Documento",
    description: "Importar via OCR",
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
    route: REPORT_ROUTES.OCR_HISTORY,
    state: { startScan: true },
  },
];

interface MobileFABDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileFABDrawer = memo(function MobileFABDrawer({
  open,
  onOpenChange,
}: MobileFABDrawerProps) {
  const router = useRouter();

  const handleAction = useCallback(
    (action: QuickAction) => {
      const params = action.state ? '?' + new URLSearchParams(action.state as Record<string, string>).toString() : '';
      router.push(`${action.route}${params}`);
      onOpenChange(false);
    },
    [router, onOpenChange]
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-premium border-glass-border">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-base">Ação Rápida</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleAction(action)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl",
                "border border-glass-border",
                "bg-glass-elevated/50 backdrop-blur-sm",
                "active:scale-[0.97] transition-transform",
                "hover:bg-glass-highlight/50"
              )}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", action.bgColor)}>
                <action.icon className={cn("w-6 h-6", action.color)} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
});
