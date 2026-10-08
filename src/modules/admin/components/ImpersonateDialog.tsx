'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ExternalLink, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { callEdgeFunction } from "@/lib/supabase/edge-functions";
import { EDGE_FUNCTIONS } from "@/lib/api-endpoints";
import { getErrorMessage } from "@/lib/errorUtils";
import type { AdminUser } from "@/modules/admin/hooks/useAdminData";

interface ImpersonateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string | null;
  users: AdminUser[];
}

export function ImpersonateDialog({ 
  open, 
  onOpenChange, 
  targetUserId,
  users 
}: ImpersonateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");

  const targetUser = users.find(u => u.user_id === targetUserId);

  const handleImpersonate = async () => {
    if (!targetUserId || !targetUser) {
      toast.error("Usuário não encontrado");
      return;
    }

    if (!reason.trim()) {
      toast.error("Por favor, informe o motivo do acesso");
      return;
    }

    setIsLoading(true);

    try {
      // Call edge function to initiate impersonation
      const data = await callEdgeFunction<{ url?: string }>(EDGE_FUNCTIONS.ADMIN_IMPERSONATE, {
        body: {
          targetUserId,
          reason: reason.trim(),
        },
        fallbackMessage: 'Erro ao iniciar impersonação',
      });

      if (data?.url) {
        // Open impersonation session in new tab
        window.open(data.url, '_blank');
        toast.success("Sessão de impersonação iniciada", {
          description: "Uma nova aba foi aberta. A sessão expira em 30 minutos.",
        });
        onOpenChange(false);
        setReason("");
      } else {
        toast.info("Funcionalidade em desenvolvimento", {
          description: "A impersonação será implementada em breve.",
        });
      }
    } catch (error) {
      console.error("Error impersonating user:", error);
      toast.error("Erro ao iniciar impersonação", {
        description: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!targetUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand" />
            Impersonar Usuário
          </DialogTitle>
          <DialogDescription>
            Você está prestes a fazer login como outro usuário. Esta ação será registrada no log de auditoria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-400">Atenção</p>
              <p className="text-muted-foreground">
                Use esta funcionalidade apenas para fins de suporte. Todas as ações 
                realizadas serão atribuídas à sua conta de administrador.
              </p>
            </div>
          </div>

          {/* Target User Info */}
          <div className="p-4 rounded-lg border border-brand/20 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Usuário alvo:</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={targetUser.avatar_url || undefined} />
                <AvatarFallback className="bg-brand/10 text-brand text-lg">
                  {targetUser.full_name?.charAt(0) || targetUser.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{targetUser.full_name || 'Sem nome'}</p>
                <p className="text-sm text-muted-foreground">{targetUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {targetUser.companies.map(c => (
                    <Badge key={c.company_id} variant="outline" className="text-xs">
                      {c.company_name} • {c.role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do acesso *</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Verificação de bug reportado pelo cliente, configuração de integração..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Este motivo será registrado no log de auditoria
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImpersonate} 
            disabled={isLoading || !reason.trim()}
            className="bg-brand hover:bg-brand/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Iniciar Impersonação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
