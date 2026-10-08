'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Settings, Palette, Calendar, Bell, Loader2, Save, Smartphone, BellRing, TestTube } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { getErrorMessage } from "@/lib/errorUtils";

interface UserPreferences {
  theme: "light" | "dark" | "system";
  date_format: string;
  currency_format: string;
  email_notifications: boolean;
  overdue_alerts: boolean;
  weekly_summary: boolean;
  notification_advance_days: number;
  push_enabled: boolean;
}

export function PreferencesTab() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    testNotification,
  } = usePushNotifications();
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: theme as "light" | "dark" | "system",
    date_format: "DD/MM/YYYY",
    currency_format: "pt-BR",
    email_notifications: true,
    overdue_alerts: true,
    weekly_summary: false,
    notification_advance_days: 3,
    push_enabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("id, user_id, theme, date_format, currency_format, email_notifications, overdue_alerts, weekly_summary, notification_advance_days, push_enabled")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPreferences({
          theme: (data.theme as "light" | "dark" | "system") || "system",
          date_format: data.date_format || "DD/MM/YYYY",
          currency_format: data.currency_format || "pt-BR",
          email_notifications: data.email_notifications ?? true,
          overdue_alerts: data.overdue_alerts ?? true,
          weekly_summary: data.weekly_summary ?? false,
          notification_advance_days: data.notification_advance_days ?? 3,
          push_enabled: data.push_enabled ?? false,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);

    // Apply theme immediately
    if (key === "theme") {
      setTheme(value as "light" | "dark" | "system");
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          theme: preferences.theme,
          date_format: preferences.date_format,
          currency_format: preferences.currency_format,
          email_notifications: preferences.email_notifications,
          overdue_alerts: preferences.overdue_alerts,
          weekly_summary: preferences.weekly_summary,
          notification_advance_days: preferences.notification_advance_days,
          push_enabled: preferences.push_enabled,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Preferências salvas com sucesso");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await subscribePush();
      if (success) {
        updatePreference("push_enabled", true);
      }
    } else {
      const success = await unsubscribePush();
      if (success) {
        updatePreference("push_enabled", false);
      }
    }
  };

  const getPermissionBadge = () => {
    if (!pushSupported) {
      return <Badge variant="secondary">Não suportado</Badge>;
    }
    switch (pushPermission) {
      case "granted":
        return <Badge variant="default" className="bg-success">Permitido</Badge>;
      case "denied":
        return <Badge variant="destructive">Bloqueado</Badge>;
      default:
        return <Badge variant="outline">Não solicitado</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Tema</Label>
            <RadioGroup
              value={preferences.theme}
              onValueChange={(v) => updatePreference("theme", v as "light" | "dark" | "system")}
              className="grid grid-cols-3 gap-4"
            >
              <Label
                htmlFor="theme-light"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-[border-color,box-shadow,background-color] [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:shadow-md"
              >
                <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                <div className="h-8 w-8 rounded-full bg-white border shadow-sm mb-2" />
                <span className="text-sm font-medium">Claro</span>
              </Label>
              <Label
                htmlFor="theme-dark"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-[border-color,box-shadow,background-color] [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:shadow-md"
              >
                <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                <div className="h-8 w-8 rounded-full bg-slate-900 border shadow-sm mb-2" />
                <span className="text-sm font-medium">Escuro</span>
              </Label>
              <Label
                htmlFor="theme-system"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-[border-color,box-shadow,background-color] [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:shadow-md"
              >
                <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-white to-slate-900 border shadow-sm mb-2" />
                <span className="text-sm font-medium">Sistema</span>
              </Label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Formatting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Formatação
          </CardTitle>
          <CardDescription>
            Configure como datas e valores são exibidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Formato de Data</Label>
              <Select
                value={preferences.date_format}
                onValueChange={(v) => updatePreference("date_format", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formato de Moeda</Label>
              <Select
                value={preferences.currency_format}
                onValueChange={(v) => updatePreference("currency_format", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">1.234,56 (Brasileiro)</SelectItem>
                  <SelectItem value="en-US">1,234.56 (Americano)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Receba alertas diretamente no seu dispositivo, mesmo com o navegador fechado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label>Status do Navegador</Label>
                {getPermissionBadge()}
              </div>
              <p className="text-sm text-muted-foreground">
                {!pushSupported
                  ? "Seu navegador não suporta notificações push"
                  : pushPermission === "denied"
                  ? "Permissão bloqueada. Altere nas configurações do navegador"
                  : "Ative para receber alertas de vencimento"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receber alertas de contas a vencer no dispositivo
              </p>
            </div>
            <Switch
              checked={pushSubscribed}
              onCheckedChange={handlePushToggle}
              disabled={!pushSupported || pushPermission === "denied" || pushLoading}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dias de Antecedência</Label>
                <p className="text-sm text-muted-foreground">
                  Alertar {preferences.notification_advance_days} {preferences.notification_advance_days === 1 ? "dia" : "dias"} antes do vencimento
                </p>
              </div>
              <span className="text-2xl font-bold text-primary">{preferences.notification_advance_days}</span>
            </div>
            <Slider
              value={[preferences.notification_advance_days]}
              onValueChange={([v]) => updatePreference("notification_advance_days", v)}
              min={1}
              max={30}
              step={1}
              disabled={!pushSubscribed}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 dia</span>
              <span>30 dias</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Testar Notificação</Label>
              <p className="text-sm text-muted-foreground">
                Enviar uma notificação de teste para verificar
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={testNotification}
              disabled={!pushSubscribed || pushPermission !== "granted"}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Testar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notificações por Email
          </CardTitle>
          <CardDescription>
            Configure quais alertas você deseja receber por email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receber alertas importantes por email
              </p>
            </div>
            <Switch
              checked={preferences.email_notifications}
              onCheckedChange={(v) => updatePreference("email_notifications", v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Contas Vencidas</Label>
              <p className="text-sm text-muted-foreground">
                Ser notificado quando contas estiverem vencidas ou próximas do vencimento
              </p>
            </div>
            <Switch
              checked={preferences.overdue_alerts}
              onCheckedChange={(v) => updatePreference("overdue_alerts", v)}
              disabled={!preferences.email_notifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Resumo Semanal</Label>
              <p className="text-sm text-muted-foreground">
                Receber um resumo semanal das movimentações
              </p>
            </div>
            <Switch
              checked={preferences.weekly_summary}
              onCheckedChange={(v) => updatePreference("weekly_summary", v)}
              disabled={!preferences.email_notifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={savePreferences} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Preferências
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
