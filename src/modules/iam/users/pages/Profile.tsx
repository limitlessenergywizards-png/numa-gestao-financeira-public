'use client';

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Mail, Phone, Briefcase, Shield, Loader2, MessageCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function formatWhatsAppNumber(val: string): string | null {
  if (!val) return null;
  const numeric = val.replace(/\D/g, "");
  if (!numeric) return null;

  if (numeric.length === 13 && numeric.startsWith("55")) {
    return numeric.substring(0, 4) + numeric.substring(5);
  }
  if (numeric.length === 12 && numeric.startsWith("55")) {
    return numeric;
  }
  if (numeric.length === 11) {
    return "55" + numeric.substring(0, 2) + numeric.substring(3);
  }
  if (numeric.length === 10) {
    return "55" + numeric;
  }
  return numeric;
}

export default function Profile() {
  const { user, profile, roles, updateProfile, isLoading: authLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    whatsapp_number: profile?.whatsapp_number || "",
    job_title: profile?.job_title || "",
  });

  function getInitials(name: string | null | undefined) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case "admin":
        return "Administrador";
      case "editor":
        return "Editor";
      case "viewer":
        return "Visualizador";
      default:
        return role;
    }
  }

  function getRoleColor(role: string) {
    switch (role) {
      case "admin":
        return "bg-primary text-primary-foreground";
      case "editor":
        return "bg-warning text-warning-foreground";
      case "viewer":
        return "bg-muted text-muted-foreground";
      default:
        return "";
    }
  }

  async function handleSave() {
    setIsLoading(true);

    const rawWhatsapp = formData.whatsapp_number.trim();
    const formattedWhatsapp = rawWhatsapp ? formatWhatsAppNumber(rawWhatsapp) : null;

    const { error } = await updateProfile({
      full_name: formData.full_name.trim() || null,
      phone: formData.phone.trim() || null,
      whatsapp_number: formattedWhatsapp,
      job_title: formData.job_title.trim() || null,
    });
    setIsLoading(false);

    if (error) {
      toast.error("Erro", { description: "Não foi possível atualizar o perfil" });
    } else {
      toast.success("Sucesso", { description: "Perfil atualizado com sucesso" });
      setIsEditing(false);
    }
  }

  function handleCancel() {
    setFormData({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      whatsapp_number: profile?.whatsapp_number || "",
      job_title: profile?.job_title || "",
    });
    setIsEditing(false);
  }

  if (authLoading) {
    return (
      <AppLayout title="Meu Perfil">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Meu Perfil" description="Gerencie suas informações pessoais">
      <div className="max-w-2xl space-y-6 animate-fade-in">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{profile?.full_name || "Usuário"}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  {roles.map((r) => (
                    <Badge key={r.role} className={getRoleColor(r.role)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {getRoleLabel(r.role)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Informações Pessoais</CardTitle>
              <CardDescription>Atualize seus dados pessoais</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nome Completo
              </Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Seu nome completo"
                />
              ) : (
                <p className="text-sm py-2">{profile?.full_name || "-"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Telefone
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="(00) 00000-0000"
                />
              ) : (
                <p className="text-sm py-2">{profile?.phone || "-"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                WhatsApp (Agente Numa)
              </Label>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, whatsapp_number: e.target.value }))
                    }
                    placeholder="5511999990000 (DDI+DDD+Número)"
                  />
                  <Alert className="bg-muted border-none p-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs text-muted-foreground ml-2">
                      Para usar o Agente Financeiro via WhatsApp, digite o número no formato DDI+DDD+Número (ex: 5511999990000).
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <p className="text-sm font-medium">{profile?.whatsapp_number || "-"}</p>
                  {!profile?.whatsapp_number && (
                    <Alert className="bg-muted border-none py-2 px-3 h-auto">
                      <AlertCircle className="h-4 w-4 mt-0.5 text-warning" />
                      <AlertDescription className="text-xs text-muted-foreground ml-2">
                        Cadastre seu número para usar o Agente Numa no WhatsApp. Formato: DDI+DDD+Número.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Cargo
              </Label>
              {isEditing ? (
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, job_title: e.target.value }))
                  }
                  placeholder="Seu cargo na empresa"
                />
              ) : (
                <p className="text-sm py-2">{profile?.job_title || "-"}</p>
              )}
            </div>

            {isEditing && (
              <div className="flex items-center gap-2 pt-4">
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações da Conta</CardTitle>
            <CardDescription>Detalhes da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">E-mail</span>
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Criado em</span>
              <span className="text-sm font-medium">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("pt-BR")
                  : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Último acesso</span>
              <span className="text-sm font-medium">
                {user?.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
