'use client';

import { useState } from "react";
import { Mail, Plus, Send, Trash2, MoreHorizontal, Clock, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteUserDialog } from "@/modules/iam/settings/components/InviteUserDialog";
import { BulkInviteDialog } from "./BulkInviteDialog";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AdminInvitation, AdminCompany } from "@/modules/admin/hooks/useAdminData";

interface AdminInvitationsProps {
  invitations: AdminInvitation[];
  companies: AdminCompany[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AdminInvitations({
  invitations,
  companies,
  isLoading,
  onRefresh,
}: AdminInvitationsProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isBulkInviteOpen, setIsBulkInviteOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const handleCancelInvitation = async (invitation: AdminInvitation) => {
    if (!confirm(`Cancelar convite para ${invitation.email}?`)) return;

    try {
      // IRON GATE: Verify user belongs to invitation's company
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      const { data: membership } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('company_id', invitation.company_id)
        .maybeSingle();

      if (!membership) {
        toast.error('Convite não encontrado');
        return;
      }

      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitation.id)
        .eq('company_id', invitation.company_id);

      if (error) throw error;

      toast.success('Convite cancelado');
      onRefresh();
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast.error('Erro ao cancelar convite');
    }
  };

  const handleResendInvitation = async (invitation: AdminInvitation) => {
    // In a real implementation, this would resend the invitation email
    toast.success('Convite reenviado');
  };

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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand" />
              Convites
            </CardTitle>
            <CardDescription>
              Gerencie convites pendentes para novos usuários
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 border-brand/30 hover:bg-brand/10" onClick={() => setIsBulkInviteOpen(true)}>
              <Upload className="h-4 w-4" />
              Importar CSV
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 bg-brand hover:bg-brand/90 text-brand-foreground">
                  <Plus className="h-4 w-4" />
                  Convidar Usuário
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {companies.map((company) => (
                  <DropdownMenuItem
                    key={company.id}
                    onClick={() => {
                      setSelectedCompanyId(company.id);
                      setIsInviteDialogOpen(true);
                    }}
                  >
                    {company.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-fade-in">
            <Table className="table-premium">
              <TableHeader>
                <TableRow className="border-brand/20 hover:bg-transparent">
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const isExpired = isPast(new Date(invitation.expires_at));
                  const roleStyles = invitation.role === 'admin'
                    ? "bg-brand/10 text-brand border-brand/30"
                    : invitation.role === 'editor'
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-muted/50 text-muted-foreground border-muted";

                  return (
                    <tr
                      key={invitation.id}
                      className="border-b border-brand/10 transition-colors hover:bg-brand/5"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 ring-2 ring-brand/20">
                            <AvatarFallback className="text-xs bg-brand/10 text-brand">
                              {invitation.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{invitation.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{invitation.company_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleStyles}>{invitation.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge variant="destructive">Expirado</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(invitation.expires_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Opções do convite">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleResendInvitation(invitation)}>
                              <Send className="mr-2 h-4 w-4" />
                              Reenviar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCancelInvitation(invitation)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </tr>
                  );
                })}
                {invitations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum convite pendente
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <InviteUserDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onSuccess={() => {
          setIsInviteDialogOpen(false);
          onRefresh();
        }}
      />

      {/* Bulk Invite Dialog */}
      <BulkInviteDialog
        open={isBulkInviteOpen}
        onOpenChange={setIsBulkInviteOpen}
        companies={companies}
        onSuccess={() => {
          setIsBulkInviteOpen(false);
          onRefresh();
        }}
      />
    </>
  );
}
