'use client';

import { useState, useEffect, useCallback } from "react";

interface UseServiceWorkerReturn {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
  update: () => Promise<void>;
  skipWaiting: () => void;
  clearApiCache: () => void;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Check for support
  useEffect(() => {
    setIsSupported("serviceWorker" in navigator);
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Register and monitor service worker
  useEffect(() => {
    if (!isSupported) return;

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        if (process.env.NODE_ENV !== 'production') console.log("[useServiceWorker] SW registered:", reg);
        setRegistration(reg);
        setIsRegistered(true);

        // Check if there's a waiting worker on initial load
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setIsUpdateAvailable(true);
        }

        // Listen for new service worker installing
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (process.env.NODE_ENV !== 'production') console.log("[useServiceWorker] New SW installing...");

          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content is available
                if (process.env.NODE_ENV !== 'production') console.log("[useServiceWorker] New content available!");
                setWaitingWorker(newWorker);
                setIsUpdateAvailable(true);
              }
            });
          }
        });

        // Listen for controller change (when new SW takes over)
        // NOTE: Auto-reload disabled to prevent infinite loops on chunk errors
        // The UpdatePrompt component handles SW updates with user confirmation
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (process.env.NODE_ENV !== 'production') {
            console.log("[useServiceWorker] Controller changed. UpdatePrompt will handle the update.");
          }
          // Removed automatic reload - UpdatePrompt manages this
        });

      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error("[useServiceWorker] Registration failed:", error);
      }
    };

    registerSW();

    // Check for updates periodically (every 60 minutes)
    const updateInterval = setInterval(() => {
      if (registration) {
        registration.update().catch(console.error);
      }
    }, 60 * 60 * 1000);

    return () => {
      clearInterval(updateInterval);
    };
  }, [isSupported, registration]);

  // Force check for updates
  const update = useCallback(async () => {
    if (registration) {
      if (process.env.NODE_ENV !== 'production') console.log("[useServiceWorker] Checking for updates...");
      await registration.update();
    }
  }, [registration]);

  // Skip waiting and activate new SW
  const skipWaiting = useCallback(() => {
    if (waitingWorker) {
      if (process.env.NODE_ENV !== 'production') console.log("[useServiceWorker] Sending SKIP_WAITING message...");
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  }, [waitingWorker]);

  // Clear API cache (useful on logout)
  const clearApiCache = useCallback(() => {
    if (navigator.serviceWorker.controller) {
      if (process.env.NODE_ENV !== 'production') console.log("[useServiceWorker] Clearing API cache...");
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_API_CACHE" });
    }
  }, []);

  return {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    isOffline,
    registration,
    update,
    skipWaiting,
    clearApiCache,
  };
}
