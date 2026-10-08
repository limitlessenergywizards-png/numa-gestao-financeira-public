'use client';

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  testNotification: () => void;
}

// VAPID public key would normally come from environment
// For demo purposes, we'll use a placeholder
const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Register service worker and check subscription status
  useEffect(() => {
    const initServiceWorker = async () => {
      if (!isSupported) {
        setIsLoading(false);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        if (process.env.NODE_ENV !== 'production') console.log("[Push] Service Worker registered:", registration);

        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error("[Push] Error registering service worker:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initServiceWorker();
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      toast.error("Notificações push não são suportadas neste navegador");
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        toast.error("Permissão para notificações foi negada");
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // Save subscription to database
      const subscriptionJson = subscription.toJSON();
      const { error } = await supabase
        .from("user_preferences")
        .update({
          push_enabled: true,
          push_subscription: JSON.parse(JSON.stringify(subscriptionJson)) as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Notificações push ativadas com sucesso!");
      return true;
    } catch (error: any) {
      console.error("[Push] Error subscribing:", error);
      toast.error(error.message || "Erro ao ativar notificações push");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Update database
      const { error } = await supabase
        .from("user_preferences")
        .update({
          push_enabled: false,
          push_subscription: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setIsSubscribed(false);
      toast.success("Notificações push desativadas");
      return true;
    } catch (error: any) {
      console.error("[Push] Error unsubscribing:", error);
      toast.error(error.message || "Erro ao desativar notificações push");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const testNotification = useCallback(() => {
    if (!isSupported || permission !== "granted") {
      toast.error("Ative as notificações primeiro");
      return;
    }

    const notification = new Notification("Numa Gestão Financeira", {
      body: "Esta é uma notificação de teste! 🎉",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "numa-test-notification",
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    toast.success("Notificação de teste enviada!");
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    testNotification,
  };
}
