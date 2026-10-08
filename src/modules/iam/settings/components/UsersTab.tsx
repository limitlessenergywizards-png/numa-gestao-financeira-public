'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, UserPlus, MoreHorizontal, Mail, Trash2, Clock, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { UserRoleBadge } from "./UserRoleBadge";
import { InviteUserDialog } from "./InviteUserDialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getErrorMessage } from "@/lib/errorUtils";

interface CompanyUser {
  id: string;
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  email: string;
  role: "admin" | "editor" | "viewer";
}

interface Invitation {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  created_at: string;
  expires_at: string;
  invited_by: string;
}

export function UsersTab() {
  const { user } = useAuth();
  const { currentCompany, isCompanyAdmin } = useCompany();

  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<CompanyUser | null>(null);
  const [invitationToDelete, setInvitationToDelete] = useState<Invitation | null>(null);

  useEffect(() => {
    if (currentCompany) {
      fetchUsers();
      fetchInvitations();
    }
  }, [currentCompany]);

  const fetchUsers = async () => {
    if (!currentCompany) return;

    try {
      // Get users associated with this company (role is per-company in user_companies)
      const { data: userCompanies, error: ucError } = await supabase
        .from("user_companies")
        .select("id, user_id, role")
        .eq("company_id", currentCompany.id);

      if (ucError) throw ucError;

      if (!userCompanies || userCompanies.length === 0) {
        setUsers([]);
        return;
      }

      // Get profiles for these users
      const userIds = userCompanies.map(uc => uc.user_id);

      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (pError) throw pError;

      // Combine the data
      const combinedUsers = userCompanies.map(uc => {
        const profile = profiles?.find(p => p.user_id === uc.user_id);

        return {
          id: uc.id,
          user_id: uc.user_id,
          profile: profile || null,
          email: profile?.full_name || "Usuário",
          name: profile?.full_name || "Usuário",
          role: (uc.role || "viewer") as "admin" | "editor" | "viewer",
        };
      });

      setUsers(combinedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvitations = async () => {
    if (!currentCompany) return;

    try {
      const { data, error } = await supabase
        .from("user_invitations")
        .select("id, company_id, email, role, token, invited_by, expires_at, accepted_at, created_at")
        .eq("company_id", currentCompany.id)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  };

  const handleRemoveUser = async () => {
    if (!userToRemove || !currentCompany) return;

    try {
      // IRON GATE: Scope delete to current company
      const { error } = await supabase
        .from("user_companies")
        .delete()
        .eq("id", userToRemove.id)
        .eq("company_id", currentCompany.id);

      if (error) throw error;

      toast.success("Acesso removido com sucesso");
      setUserToRemove(null);
      fetchUsers();
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteInvitation = async () => {
    if (!invitationToDelete) return;

    try {
      // IRON GATE: Scope delete to current company
      const { error } = await supabase
        .from("user_invitations")
        .delete()
        .eq("id", invitationToDelete.id)
        .eq("company_id", currentCompany!.id);

      if (error) throw error;

      toast.success("Convite cancelado");
      setInvitationToDelete(null);
      fetchInvitations();
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    try {
      // IRON GATE: Scope update to current company
      const { error } = await supabase
        .from("user_invitations")
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          token: crypto.randomUUID(),
        })
        .eq("id", invitation.id)
        .eq("company_id", currentCompany!.id);

      if (error) throw error;

      toast.success("Convite reenviado");
      fetchInvitations();
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error(getErrorMessage(error));
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
      {/* Users List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Usuários com Acesso
            </CardTitle>
            <CardDescription>
              Gerencie os usuários que têm acesso a esta empresa
            </CardDescription>
          </div>
          {isCompanyAdmin && (
            <Button onClick={() => setIsInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Usuário
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((companyUser) => (
                  <TableRow key={companyUser.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <AvatarInitials
                          name={companyUser.profile?.full_name || "U"}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">
                            {companyUser.profile?.full_name || "Usuário"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {companyUser.user_id === user?.id && "(Você)"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <UserRoleBadge role={companyUser.role} />
                    </TableCell>
                    <TableCell className="text-right">
                      {isCompanyAdmin && companyUser.user_id !== user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Opções do usuário">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setUserToRemove(companyUser)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover Acesso
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {isCompanyAdmin && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-warning" />
              Convites Pendentes
            </CardTitle>
            <CardDescription>
              Convites que ainda não foram aceitos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {invitation.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <UserRoleBadge role={invitation.role} size="sm" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatDistanceToNow(new Date(invitation.expires_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResendInvitation(invitation)}
                          title="Reenviar convite"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setInvitationToDelete(invitation)}
                          title="Cancelar convite"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <InviteUserDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onSuccess={fetchInvitations}
      />

      {/* Remove User Confirmation */}
      <AlertDialog open={!!userToRemove} onOpenChange={() => setUserToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              Este usuário perderá o acesso a esta empresa. Esta ação pode ser desfeita
              enviando um novo convite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Invitation Confirmation */}
      <AlertDialog open={!!invitationToDelete} onOpenChange={() => setInvitationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar convite?</AlertDialogTitle>
            <AlertDialogDescription>
              O convite para {invitationToDelete?.email} será cancelado e o link
              não funcionará mais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvitation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Convite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
