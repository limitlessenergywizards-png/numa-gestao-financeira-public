'use client';

import { useState } from "react";
import { Users, Search, MoreHorizontal, Shield, Building2, Mail, Circle, UserX, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPermissionsDialog } from "./UserPermissionsDialog";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AdminUser, AdminCompany, AdminAuditLog } from "@/modules/admin/hooks/useAdminData";
import { UserDetailsDrawer } from "./UserDetailsDrawer";

interface AdminUsersProps {
  users: AdminUser[];
  companies: AdminCompany[];
  auditLogs?: AdminAuditLog[];
  isLoading: boolean;
  onRefresh: () => void;
  isSuperAdminMode?: boolean;
}

type UserStatus = 'online' | 'recent' | 'inactive';

function getUserStatus(lastActivityDate: string | null): UserStatus {
  if (!lastActivityDate) return 'inactive';
  
  const daysSinceActivity = differenceInDays(new Date(), new Date(lastActivityDate));
  
  if (daysSinceActivity === 0) return 'online';
  if (daysSinceActivity <= 7) return 'recent';
  return 'inactive';
}

function getStatusConfig(status: UserStatus) {
  switch (status) {
    case 'online':
      return { 
        color: 'text-emerald-400', 
        bgColor: 'bg-emerald-400',
        label: 'Ativo hoje' 
      };
    case 'recent':
      return { 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-400',
        label: 'Ativo recentemente' 
      };
    case 'inactive':
      return { 
        color: 'text-muted-foreground', 
        bgColor: 'bg-muted-foreground',
        label: 'Inativo' 
      };
  }
}

export function AdminUsers({ 
  users, 
  companies, 
  auditLogs = [], 
  isLoading, 
  onRefresh,
  isSuperAdminMode = false 
}: AdminUsersProps) {
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterOrphan, setFilterOrphan] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detailsUser, setDetailsUser] = useState<AdminUser | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      search === "" ||
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());

    const matchesCompany =
      filterCompany === "all" ||
      user.companies.some((c) => c.company_id === filterCompany);

    const matchesRole =
      filterRole === "all" ||
      user.companies.some((c) => c.role === filterRole);

    const matchesOrphan = !filterOrphan || user.companies.length === 0;

    return matchesSearch && matchesCompany && matchesRole && matchesOrphan;
  });

  // Count orphan users
  const orphanCount = users.filter(u => u.companies.length === 0).length;

  function getInitials(name: string | null) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function getRoleBadgeStyles(role: string) {
    switch (role) {
      case "admin":
        return "bg-brand text-brand-foreground border-brand/50";
      case "editor":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-muted/50 text-muted-foreground border-muted";
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card dark:bg-[#0D1233]/60 border-border dark:border-brand/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand" />
                Usuários
                {isSuperAdminMode && (
                  <Badge variant="outline" className="ml-2 border-brand/50 text-brand text-xs">
                    Modo Global
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isSuperAdminMode 
                  ? `Gerenciando todos os ${users.length} usuários do sistema`
                  : "Gerencie todos os usuários e suas permissões"
                }
              </CardDescription>
            </div>
            {orphanCount > 0 && (
              <Badge 
                variant="outline" 
                className={`cursor-pointer transition-colors ${
                  filterOrphan 
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                    : 'border-amber-500/30 text-amber-400/70 hover:bg-amber-500/10'
                }`}
                onClick={() => setFilterOrphan(!filterOrphan)}
              >
                <UserX className="mr-1 h-3 w-3" />
                {orphanCount} sem empresa
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand/60" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/50 dark:bg-[#0A0F2C]/50 border-border dark:border-brand/20 focus:border-brand/50"
              />
            </div>
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="w-full sm:w-[200px] bg-muted/50 dark:bg-[#0A0F2C]/50 border-border dark:border-brand/20">
                <Building2 className="mr-2 h-4 w-4 text-brand/60" />
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-[150px] bg-muted/50 dark:bg-[#0A0F2C]/50 border-border dark:border-brand/20">
                <Shield className="mr-2 h-4 w-4 text-brand/60" />
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="animate-fade-in">
            <Table className="table-premium">
              <TableHeader>
                <TableRow className="border-brand/20">
                  <TableHead className="text-brand/80">Usuário</TableHead>
                  {isSuperAdminMode && (
                    <TableHead className="text-brand/80">Email</TableHead>
                  )}
                  <TableHead className="text-brand/80">Empresas</TableHead>
                  <TableHead className="text-brand/80">Perfil</TableHead>
                  <TableHead className="text-brand/80">Status</TableHead>
                  <TableHead className="text-brand/80">Último Acesso</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const status = getUserStatus(user.last_activity_date);
                  const statusConfig = getStatusConfig(status);
                  
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-brand/10 transition-colors hover:bg-brand/5"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-9 w-9 ring-2 ring-brand/20">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="bg-brand/10 text-brand">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <Circle 
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 ${statusConfig.bgColor} rounded-full border-2 border-card dark:border-[#0D1233]`}
                              fill="currentColor"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name || "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.job_title || "Usuário"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      {isSuperAdminMode && (
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[180px]">{user.email || '-'}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.companies.length === 0 ? (
                            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                              <UserX className="mr-1 h-3 w-3" />
                              Sem empresa
                            </Badge>
                          ) : (
                            <>
                              {user.companies.slice(0, 2).map((company, index) => (
                                <Badge key={index} variant="outline" className="text-xs border-brand/30 text-brand/80">
                                  {company.company_name}
                                </Badge>
                              ))}
                              {user.companies.length > 2 && (
                                <Badge variant="outline" className="text-xs border-brand/30 text-brand/80">
                                  +{user.companies.length - 2}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.companies.length > 0 ? (
                          <Badge className={getRoleBadgeStyles(user.companies[0].role)}>
                            {user.companies[0].role}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            -
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Circle className={`h-2 w-2 ${statusConfig.bgColor}`} fill="currentColor" />
                          <span className={`text-xs ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.last_activity_date ? (
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(user.last_activity_date), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Opções do usuário">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailsUser(user)}>
                              <Users className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                              <Shield className="mr-2 h-4 w-4" />
                              Permissões
                            </DropdownMenuItem>
                            {user.companies.length === 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-amber-400">
                                  <Link2 className="mr-2 h-4 w-4" />
                                  Vincular a Empresa
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isSuperAdminMode ? 7 : 6} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <UserPermissionsDialog
        user={selectedUser}
        companies={companies}
        open={!!selectedUser}
        onOpenChange={() => setSelectedUser(null)}
        onSave={() => {
          setSelectedUser(null);
          onRefresh();
        }}
      />

      {/* User Details Drawer */}
      <UserDetailsDrawer
        user={detailsUser}
        companies={companies}
        auditLogs={auditLogs}
        open={!!detailsUser}
        onOpenChange={() => setDetailsUser(null)}
        onEditPermissions={() => {
          setSelectedUser(detailsUser);
          setDetailsUser(null);
        }}
      />
    </>
  );
}
