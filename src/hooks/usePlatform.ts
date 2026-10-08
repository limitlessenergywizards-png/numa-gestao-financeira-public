'use client';

import { useState, useEffect } from 'react';

export type Platform = 'web' | 'ios' | 'android';

/**
 * Detects the current platform (web, ios, or android).
 * Uses Capacitor's getPlatform() when available, falls back to 'web'.
 */
export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>('web');

  useEffect(() => {
    async function detect() {
      try {
        const { Capacitor } = await import('@capacitor/core');
        const p = Capacitor.getPlatform();
        if (p === 'ios' || p === 'android') {
          setPlatform(p);
        }
      } catch {
        // Capacitor not available — we're on web
      }
    }
    detect();
  }, []);

  return platform;
}

/**
 * Check if running inside a native Capacitor app.
 */
export function useIsNative(): boolean {
  return usePlatform() !== 'web';
}
