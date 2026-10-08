'use client';

import { memo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { ArrowDownCircle, ArrowUpCircle, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_ROUTES } from "@/lib/routes";

interface FinanceiroOption {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  route: string;
  color: string;
  activeColor: string;
}

const options: FinanceiroOption[] = [
  {
    icon: ArrowDownCircle,
    label: "Contas a Receber",
    route: MAIN_ROUTES.RECEIVABLES,
    color: "text-emerald-400",
    activeColor: "bg-emerald-500/15",
  },
  {
    icon: ArrowUpCircle,
    label: "Contas a Pagar",
    route: MAIN_ROUTES.PAYABLES,
    color: "text-rose-400",
    activeColor: "bg-rose-500/15",
  },
  {
    icon: Repeat,
    label: "Movimentações",
    route: MAIN_ROUTES.TRANSACTIONS,
    color: "text-violet-400",
    activeColor: "bg-violet-500/15",
  },
];

interface FinanceiroPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FinanceiroPopover = memo(function FinanceiroPopover({
  open,
  onOpenChange,
}: FinanceiroPopoverProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = useCallback(
    (route: string) => {
      router.push(route);
      onOpenChange(false);
    },
    [router, onOpenChange]
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-premium border-glass-border !min-h-0">
        <div className="px-4 py-4 space-y-1.5">
          {options.map((option) => {
            const isActive = pathname === option.route;
            return (
              <button
                key={option.route}
                onClick={() => handleNavigate(option.route)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-[background-color,transform] duration-150",
                  "active:scale-[0.98]",
                  isActive ? option.activeColor : "hover:bg-glass-highlight/50"
                )}
              >
                <option.icon className={cn("w-5 h-5", option.color)} />
                <span className={cn(
                  "text-sm font-medium",
                  isActive ? "text-foreground" : "text-foreground/80"
                )}>
                  {option.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-500" />
                )}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
});
