'use client';

import { memo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_ROUTES } from "@/lib/routes";

interface MobilePageHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

const HOME_ROUTES = [MAIN_ROUTES.HOME, MAIN_ROUTES.DASHBOARD];

export const MobilePageHeader = memo(function MobilePageHeader({
  title,
  description,
  actions,
  className,
}: MobilePageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const showBack = !HOME_ROUTES.includes(pathname as typeof HOME_ROUTES[number]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 glass-nav border-b border-glass-border",
        "px-4 py-3",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-xl hover:bg-glass-highlight/50 transition-colors"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          {title && (
            <h1 className="text-base font-semibold text-foreground truncate">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-xs text-muted-foreground truncate">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-1.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
});
