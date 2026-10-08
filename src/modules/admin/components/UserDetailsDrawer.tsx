'use client';

import { useState } from "react";
import {
  User, Building2, Activity, Shield, Calendar, Mail, Briefcase, 
  Phone, MapPin, Clock, ChevronRight
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserActivityTimeline } from "./UserActivityTimeline";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AdminUser, AdminCompany, AdminAuditLog } from "@/modules/admin/hooks/useAdminData";

interface UserDetailsDrawerProps {
  user: AdminUser | null;
  companies: AdminCompany[];
  auditLogs: AdminAuditLog[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditPermissions?: () => void;
}

export function UserDetailsDrawer({
  user,
  companies,
  auditLogs,
  open,
  onOpenChange,
  onEditPermissions,
}: UserDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState("profile");

  if (!user) return null;

  function getInitials(name: string | null) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function getRoleBadgeVariant(role: string) {
    switch (role) {
      case "admin":
        return "default";
      case "editor":
        return "secondary";
      default:
        return "outline";
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case "admin":
        return "Administrador";
      case "editor":
        return "Editor";
      default:
        return "Visualizador";
    }
  }

  // Filter audit logs for this user
  const userLogs = auditLogs.filter((log) => log.user_id === user.user_id);

  // Get status based on last activity
  const getStatus = () => {
    if (!user.last_activity_date) return "inactive";
    const lastActivity = new Date(user.last_activity_date);
    const now = new Date();
    const diffHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    if (diffHours < 1) return "online";
    if (diffHours < 24) return "recent";
    return "inactive";
  };

  const status = getStatus();
  const statusConfig = {
    online: { label: "Online", color: "bg-emerald-500" },
    recent: { label: "Ativo recentemente", color: "bg-amber-500" },
    inactive: { label: "Inativo", color: "bg-muted-foreground" },
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <SheetHeader className="text-left">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background ${statusConfig[status].color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-xl">
                    {user.full_name || "Sem nome"}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 mt-1">
                    <span>{user.job_title || "Usuário"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${statusConfig[status].color}`} />
                      {statusConfig[status].label}
                    </span>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile" className="gap-1 text-xs sm:text-sm">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Perfil</span>
                </TabsTrigger>
                <TabsTrigger value="companies" className="gap-1 text-xs sm:text-sm">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Empresas</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-1 text-xs sm:text-sm">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Atividade</span>
                </TabsTrigger>
                <TabsTrigger value="permissions" className="gap-1 text-xs sm:text-sm">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Permissões</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informações Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email || "Não informado"}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cargo</p>
                        <p className="font-medium">{user.job_title || "Não informado"}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cadastrado em</p>
                        <p className="font-medium">
                          {user.created_at 
                            ? format(new Date(user.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            : "Não informado"
                          }
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Última atividade</p>
                        <p className="font-medium">
                          {user.last_activity_date 
                            ? formatDistanceToNow(new Date(user.last_activity_date), { addSuffix: true, locale: ptBR })
                            : "Nunca"
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Companies Tab */}
              <TabsContent value="companies" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Empresas Vinculadas</CardTitle>
                    <CardDescription>
                      {user.companies.length} empresa{user.companies.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {user.companies.map((company, index) => (
                      <div
                        key={company.company_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{company.company_name}</span>
                        </div>
                        <Badge variant={getRoleBadgeVariant(company.role)}>
                          {getRoleLabel(company.role)}
                        </Badge>
                      </div>
                    ))}
                    {user.companies.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhuma empresa vinculada
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="mt-4">
                <UserActivityTimeline logs={userLogs} />
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Configurar Permissões</CardTitle>
                    <CardDescription>
                      Gerencie o acesso do usuário às empresas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {user.companies.map((company) => (
                      <div key={company.company_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{company.company_name}</span>
                        </div>
                        <Badge variant={getRoleBadgeVariant(company.role)}>
                          {getRoleLabel(company.role)}
                        </Badge>
                      </div>
                    ))}
                    
                    <Separator className="my-4" />
                    
                    <Button 
                      className="w-full gap-2"
                      onClick={onEditPermissions}
                    >
                      <Shield className="h-4 w-4" />
                      Editar Permissões
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
