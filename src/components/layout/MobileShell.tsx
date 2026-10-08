'use client';

import { memo, useState, useCallback, ReactNode } from "react";
import { MobileBottomNavV2 } from "./MobileBottomNavV2";
import { MobileNavigationDrawer } from "./MobileNavigationDrawer";
import { MobileFAB } from "./MobileFAB";
import { MobileFABDrawer } from "./MobileFABDrawer";
import { FinanceiroPopover } from "./FinanceiroPopover";

interface MobileShellProps {
  children: ReactNode;
}

export const MobileShell = memo(function MobileShell({ children }: MobileShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fabDrawerOpen, setFabDrawerOpen] = useState(false);
  const [financeiroOpen, setFinanceiroOpen] = useState(false);

  const handleMorePress = useCallback(() => setDrawerOpen(true), []);
  const handleFabPress = useCallback(() => setFabDrawerOpen(true), []);
  const handleFinanceiroPress = useCallback(() => setFinanceiroOpen(true), []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Page content - scrollable area with bottom padding for nav */}
      <main className="flex-1 min-w-0 pb-[calc(env(safe-area-inset-bottom)+72px)]">
        {children}
      </main>

      {/* FAB - floating above bottom nav center */}
      <MobileFAB onPress={handleFabPress} />

      {/* Bottom Navigation */}
      <MobileBottomNavV2
        onFinanceiroPress={handleFinanceiroPress}
        onMorePress={handleMorePress}
      />

      {/* Navigation Drawer (Mais) */}
      <MobileNavigationDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      {/* FAB Quick Actions Drawer */}
      <MobileFABDrawer
        open={fabDrawerOpen}
        onOpenChange={setFabDrawerOpen}
      />

      {/* Financeiro Popover/Drawer */}
      <FinanceiroPopover
        open={financeiroOpen}
        onOpenChange={setFinanceiroOpen}
      />
    </div>
  );
});
