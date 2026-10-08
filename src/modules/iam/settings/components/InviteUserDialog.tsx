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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/supabase/edge-functions";
import { EDGE_FUNCTIONS } from "@/lib/api-endpoints";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import { Mail, UserPlus, Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/errorUtils";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Role = "admin" | "editor" | "viewer";

export function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const { user } = useAuth();
  const { companies, currentCompany } = useCompany();
  
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(
    currentCompany ? [currentCompany.id] : []
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleCompanyToggle = (companyId: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSubmit = async () => {
    if (!email || !role || selectedCompanies.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsLoading(true);

    try {
      // Get inviter name from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      const inviterName = profile?.full_name || user.email || "Um administrador";

      // Create invitations for each selected company
      for (const companyId of selectedCompanies) {
        const token = crypto.randomUUID();
        
        // Get company name
        const company = companies.find(c => c.id === companyId);
        const companyName = company?.name || "Empresa";

        // Insert invitation
        const { error: insertError } = await supabase
          .from("user_invitations")
          .insert({
            company_id: companyId,
            email: email.toLowerCase().trim(),
            role: role,
            invited_by: user.id,
            token: token,
          });

        if (insertError) {
          if (insertError.code === "23505") {
            toast.error(`Usuário já convidado para ${companyName}`);
            continue;
          }
          throw insertError;
        }

        // Send invitation email via edge function
        try {
          await callEdgeFunction(EDGE_FUNCTIONS.SEND_INVITATION_EMAIL, {
            body: {
              email: email.toLowerCase().trim(),
              inviterName,
              companyName,
              role,
              token,
            },
            fallbackMessage: 'Erro ao enviar email de convite',
          });
        } catch (emailErr) {
          console.error("Failed to send invitation email:", emailErr);
          // Don't fail the whole process if email fails — the invite DB record already exists
          toast.warning(`Convite criado para ${companyName}, mas houve erro ao enviar email: ${emailErr instanceof Error ? emailErr.message : 'Erro desconhecido'}`);
        }
      }

      toast.success("Convite(s) enviado(s) com sucesso!");
      setEmail("");
      setRole("viewer");
      setSelectedCompanies(currentCompany ? [currentCompany.id] : []);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Convidar Usuário
          </DialogTitle>
          <DialogDescription>
            Envie um convite para um novo usuário ter acesso ao sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do convidado *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Cargo *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex flex-col">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">
                      Acesso total, pode gerenciar usuários
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div className="flex flex-col">
                    <span className="font-medium">Gerente</span>
                    <span className="text-xs text-muted-foreground">
                      Pode criar, editar e excluir transações
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div className="flex flex-col">
                    <span className="font-medium">Visualizador</span>
                    <span className="text-xs text-muted-foreground">
                      Apenas leitura de dashboards e relatórios
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {companies.length > 1 && (
            <div className="space-y-2">
              <Label>Acesso às empresas *</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {companies.map((company) => (
                  <div key={company.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={company.id}
                      checked={selectedCompanies.includes(company.id)}
                      onCheckedChange={() => handleCompanyToggle(company.id)}
                    />
                    <label
                      htmlFor={company.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {company.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Convite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
