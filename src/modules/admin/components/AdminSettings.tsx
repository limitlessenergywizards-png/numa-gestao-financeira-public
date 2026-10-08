'use client';

import { useState } from "react";
import { Settings, Shield, Mail, Clock, Database, Bell, Save, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AdminSettingsProps {
  onSave?: (settings: AdminSettingsValues) => void;
}

interface AdminSettingsValues {
  // Security
  sessionTimeout: number;
  requireStrongPassword: boolean;
  maxLoginAttempts: number;

  // Invitations
  invitationExpireDays: number;
  maxPendingInvitations: number;
  allowSelfRegistration: boolean;

  // Audit
  auditLogRetentionDays: number;
  enableDetailedLogging: boolean;

  // Notifications
  emailNotifications: boolean;
  securityAlerts: boolean;
  weeklyReports: boolean;
}

const defaultSettings: AdminSettingsValues = {
  sessionTimeout: 60,
  requireStrongPassword: true,
  maxLoginAttempts: 5,
  invitationExpireDays: 7,
  maxPendingInvitations: 10,
  allowSelfRegistration: false,
  auditLogRetentionDays: 90,
  enableDetailedLogging: true,
  emailNotifications: true,
  securityAlerts: true,
  weeklyReports: false,
};

export function AdminSettings({ onSave }: AdminSettingsProps) {
  const [settings, setSettings] = useState<AdminSettingsValues>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = <K extends keyof AdminSettingsValues>(
    key: K,
    value: AdminSettingsValues[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSave?.(settings);
      toast.success("Configurações salvas com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast.info("Configurações restauradas para o padrão");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Security Settings */}
      <div>
        <Card className="bg-card dark:bg-[#0D1233]/60 border-border dark:border-brand/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configure políticas de segurança e acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
                <Select
                  value={settings.sessionTimeout.toString()}
                  onValueChange={(value) => handleChange("sessionTimeout", parseInt(value))}
                >
                  <SelectTrigger id="sessionTimeout" className="bg-muted/50 dark:bg-[#0A0F2C]/50 border-border dark:border-brand/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                    <SelectItem value="480">8 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Máximo de Tentativas de Login</Label>
                <Select
                  value={settings.maxLoginAttempts.toString()}
                  onValueChange={(value) => handleChange("maxLoginAttempts", parseInt(value))}
                >
                  <SelectTrigger id="maxLoginAttempts" className="bg-muted/50 dark:bg-[#0A0F2C]/50 border-border dark:border-brand/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 tentativas</SelectItem>
                    <SelectItem value="5">5 tentativas</SelectItem>
                    <SelectItem value="10">10 tentativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-brand/10" />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exigir Senha Forte</Label>
                <p className="text-sm text-muted-foreground">
                  Mínimo 8 caracteres, maiúsculas, minúsculas e números
                </p>
              </div>
              <Switch
                checked={settings.requireStrongPassword}
                onCheckedChange={(checked) => handleChange("requireStrongPassword", checked)}
                className="data-[state=checked]:bg-brand"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitation Settings */}
      <div>
        <Card className="bg-card dark:bg-[#0D1233]/60 border-border dark:border-brand/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand" />
              Convites
            </CardTitle>
            <CardDescription>
              Configure políticas de convites de usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invitationExpireDays">Validade do Convite (dias)</Label>
                <Select
                  value={settings.invitationExpireDays.toString()}
                  onValueChange={(value) => handleChange("invitationExpireDays", parseInt(value))}
                >
                  <SelectTrigger id="invitationExpireDays" className="bg-muted/50 dark:bg-[#0A0F2C]/50 border-border dark:border-brand/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPendingInvitations">Máximo de Convites Pendentes</Label>
                <Input
                  id="maxPendingInvitations"
                  type="number"
                  min={1}
                  max={100}
                  value={settings.maxPendingInvitations}
                  onChange={(e) => handleChange("maxPendingInvitations", parseInt(e.target.value) || 10)}
                  className="bg-muted/50 dark:bg-[#0A0F2C]/50 border-border dark:border-brand/20"
                />
              </div>
            </div>

            <Separator className="bg-brand/10" />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir Auto-Registro</Label>
                <p className="text-sm text-muted-foreground">
                  Usuários podem se cadastrar sem convite
                </p>
              </div>
              <Switch
                checked={settings.allowSelfRegistration}
                onCheckedChange={(checked) => handleChange("allowSelfRegistration", checked)}
                className="data-[state=checked]:bg-brand"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Settings */}
      <div>
        <Card className="bg-card dark:bg-[#0D1233]/60 border-border dark:border-brand/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-brand" />
              Auditoria
            </CardTitle>
            <CardDescription>
              Configure retenção e detalhamento dos logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="auditLogRetentionDays">Retenção de Logs (dias)</Label>
              <Select
                value={settings.auditLogRetentionDays.toString()}
                onValueChange={(value) => handleChange("auditLogRetentionDays", parseInt(value))}
              >
                <SelectTrigger id="auditLogRetentionDays" className="w-full sm:w-[200px] bg-muted/50 dark:bg-[#0A0F2C]/50 border-border dark:border-brand/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="180">180 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-brand/10" />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Logging Detalhado</Label>
                <p className="text-sm text-muted-foreground">
                  Registrar dados antigos e novos nas alterações
                </p>
              </div>
              <Switch
                checked={settings.enableDetailedLogging}
                onCheckedChange={(checked) => handleChange("enableDetailedLogging", checked)}
                className="data-[state=checked]:bg-brand"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Settings */}
      <div>
        <Card className="bg-card dark:bg-[#0D1233]/60 border-border dark:border-brand/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure alertas e notificações por email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações importantes por email
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleChange("emailNotifications", checked)}
                className="data-[state=checked]:bg-brand"
              />
            </div>

            <Separator className="bg-brand/10" />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Segurança</Label>
                <p className="text-sm text-muted-foreground">
                  Alertas sobre logins suspeitos e alterações críticas
                </p>
              </div>
              <Switch
                checked={settings.securityAlerts}
                onCheckedChange={(checked) => handleChange("securityAlerts", checked)}
                className="data-[state=checked]:bg-brand"
              />
            </div>

            <Separator className="bg-brand/10" />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Relatórios Semanais</Label>
                <p className="text-sm text-muted-foreground">
                  Resumo semanal de atividades e métricas
                </p>
              </div>
              <Switch
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => handleChange("weeklyReports", checked)}
                className="data-[state=checked]:bg-brand"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleReset} className="gap-2 border-brand/30 hover:bg-brand/10">
          <RotateCcw className="h-4 w-4" />
          Restaurar Padrão
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-brand hover:bg-brand/90 text-brand-foreground">
          <Save className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
