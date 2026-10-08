'use client';

import * as React from "react";

export const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Initialize synchronously to avoid race conditions.
  // AuthenticatedLayout and AppLayout depend on having the correct value
  // on the very first render to decide between SidebarProvider vs MobileShell.
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== "undefined"
      ? window.innerWidth < MOBILE_BREAKPOINT
      : false
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const onChange = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      }, 300);
    };

    mql.addEventListener("change", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return isMobile;
}
