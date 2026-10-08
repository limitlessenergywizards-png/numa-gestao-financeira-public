'use client';

import { useEffect } from 'react';

/**
 * Global watchdog that detects and fixes stale scroll-lock / pointer-events.
 *
 * Radix's react-remove-scroll-bar uses a counter on data-scroll-locked.
 * DismissableLayer sets body.style.pointerEvents = "none" during modals.
 * Both should self-cleanup, but edge cases (interrupted animations,
 * re-renders during close, error paths) can leave them stuck.
 *
 * This watchdog runs every 2s and ONLY intervenes when:
 * 1. body has data-scroll-locked or pointerEvents=none
 * 2. AND no open dialogs/sheets exist in the DOM
 * 3. AND the state has been stuck for 2+ consecutive checks (4+ seconds)
 */
export function ScrollLockWatchdog() {
  useEffect(() => {
    let stuckCount = 0;

    const interval = setInterval(() => {
      const body = document.body;
      const hasScrollLock = body.hasAttribute('data-scroll-locked');
      const hasPointerBlock = body.style.pointerEvents === 'none';

      if (!hasScrollLock && !hasPointerBlock) {
        stuckCount = 0;
        return;
      }

      // Check if any modal is actually open
      const openDialogs = document.querySelectorAll(
        '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"]'
      );

      if (openDialogs.length > 0) {
        stuckCount = 0;
        return;
      }

      // No open dialogs but lock exists — increment stuck counter
      stuckCount++;

      // Only intervene after 2 consecutive checks (4+ seconds stuck)
      if (stuckCount >= 2) {
        if (hasScrollLock) {
          body.removeAttribute('data-scroll-locked');
          body.style.removeProperty('overflow');
          body.style.removeProperty('padding-right');
          body.style.removeProperty('margin-right');
        }
        if (hasPointerBlock) {
          body.style.removeProperty('pointer-events');
        }
        stuckCount = 0;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
