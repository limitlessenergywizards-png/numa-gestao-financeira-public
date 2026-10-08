'use client';

import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { TIMING } from "@/lib/config";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useAdminData } from "@/modules/admin/hooks/useAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImpersonateDialog } from "../components/ImpersonateDialog";
import { OnlineUsersWidget } from "../components/OnlineUsersWidget";
import {
  Search,
  UserCog,
  Users,
  Activity,
  Clock,
  Shield,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminSupport() {
  const { users, companies, auditLogs, isLoading } = useAdminData();
  const [searchInput, setSearchInput] = useState("");
  const searchTerm = useDebounce(searchInput, TIMING.DEBOUNCE_DELAY);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.companies.some(c => c.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  // Recent support-related logs
  const supportLogs = useMemo(() => {
    return auditLogs
      .filter(log =>
        log.action === 'UPDATE' ||
        log.table_name === 'profiles' ||
        log.table_name === 'subscriptions'
      )
      .slice(0, 10);
  }, [auditLogs]);

  const handleImpersonate = (userId: string) => {
    setSelectedUserId(userId);
    setImpersonateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton className="h-[500px]" />
            </div>
            <Skeleton className="h-[500px]" />
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Suporte
          </h1>
          <p className="text-muted-foreground">
            Ferramentas de suporte e impersonação de usuários
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ativos Hoje
              </CardTitle>
              <Activity className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {users.filter(u => {
                  if (!u.last_activity_date) return false;
                  const today = new Date().toISOString().split('T')[0];
                  return u.last_activity_date.startsWith(today);
                }).length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Empresas
              </CardTitle>
              <Shield className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{companies.length}</div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ações Recentes
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">{auditLogs.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Users List with Search */}
          <div className="lg:col-span-2">
            <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-brand" />
                  Impersonar Usuário
                </CardTitle>
                <CardDescription>
                  Selecione um usuário para fazer login como ele (para suporte)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email ou empresa..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.user_id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-brand/20"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="bg-brand/10 text-brand">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.full_name || 'Sem nome'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {user.companies.map(c => (
                                  <Badge
                                    key={c.company_id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {c.company_name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-brand/30 hover:bg-brand/10"
                            onClick={() => handleImpersonate(user.user_id)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Impersonar
                          </Button>
                        </div>
                      ))}

                      {filteredUsers.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhum usuário encontrado
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Online Users Widget */}
            <OnlineUsersWidget />

            {/* Recent Support Activity */}
            <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-brand" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {supportLogs.map((log) => (
                      <div
                        key={log.id}
                        className="text-sm border-l-2 border-brand/30 pl-3 py-1"
                      >
                        <p className="font-medium">{log.user_name || 'Usuário'}</p>
                        <p className="text-muted-foreground text-xs">
                          {log.action} em {log.table_name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {log.created_at && formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    ))}

                    {supportLogs.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        Sem atividades recentes
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Impersonate Dialog */}
        <ImpersonateDialog
          open={impersonateDialogOpen}
          onOpenChange={setImpersonateDialogOpen}
          targetUserId={selectedUserId}
          users={users}
        />
      </div>
    </SuperAdminLayout>
  );
}
