'use client';

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, UserPlus, Building2 } from "lucide-react";
import { MAIN_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";

type InvitationStatus = "loading" | "valid" | "expired" | "already_accepted" | "not_found" | "accepting" | "accepted" | "error";

interface Invitation {
  id: string;
  email: string;
  role: string;
  company_id: string;
  expires_at: string;
  accepted_at: string | null;
  company?: {
    name: string;
  };
  inviter?: {
    full_name: string | null;
  };
}

export default function AcceptInvitation() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState<InvitationStatus>("loading");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("not_found");
      return;
    }

    checkInvitation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function checkInvitation() {
    if (!token) return;

    try {
      // Fetch invitation with company details
      const { data, error } = await supabase
        .from("user_invitations")
        .select(`
          id,
          email,
          role,
          company_id,
          expires_at,
          accepted_at,
          companies:company_id (name),
          profiles:invited_by (full_name)
        `)
        .eq("token", token)
        .single();

      if (error || !data) {
        setStatus("not_found");
        return;
      }

      const inv: Invitation = {
        ...data,
        company: data.companies as unknown as Invitation['company'],
        inviter: data.profiles as unknown as Invitation['inviter'],
      };

      setInvitation(inv);

      if (inv.accepted_at) {
        setStatus("already_accepted");
        return;
      }

      if (new Date(inv.expires_at) < new Date()) {
        setStatus("expired");
        return;
      }

      setStatus("valid");
    } catch (error) {
      console.error("Error checking invitation:", error);
      setStatus("error");
      setErrorMessage("Erro ao verificar convite");
    }
  }

  async function handleAcceptInvitation() {
    if (!invitation || !user) return;

    setStatus("accepting");

    try {
      // 1. Check if user is already associated with this company
      const { data: existingAssoc } = await supabase
        .from("user_companies")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", invitation.company_id)
        .maybeSingle();

      if (!existingAssoc) {
        // 2. Create user-company association
        const { error: assocError } = await supabase
          .from("user_companies")
          .insert({
            user_id: user.id,
            company_id: invitation.company_id,
            is_default: false,
          });

        if (assocError) throw assocError;
      }

      // 3. Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingRole) {
        // 4. Create user role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: user.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            role: invitation.role as any,
          });

        if (roleError) throw roleError;
      }

      // 5. Mark invitation as accepted
      const { error: updateError } = await supabase
        .from("user_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      setStatus("accepted");
      toast.success("Convite aceito com sucesso!");

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(MAIN_ROUTES.HOME);
      }, 2000);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      setStatus("error");
      setErrorMessage(getErrorMessage(error) || "Erro ao aceitar convite");
      toast.error("Erro ao aceitar convite");
    }
  }

  function handleLoginRedirect() {
    if (invitation) {
      router.push(`${PUBLIC_ROUTES.AUTH}?invite=${token}&email=${encodeURIComponent(invitation.email)}`);
    } else {
      router.push(PUBLIC_ROUTES.AUTH);
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ROLE_LABELS: Record<string, string> = {
    admin: "Administrador",
    editor: "Gerente",
    viewer: "Visualizador",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Convite de Acesso</CardTitle>
          <CardDescription>
            {status === "loading" && "Verificando convite..."}
            {status === "valid" && "Você foi convidado para uma empresa"}
            {status === "accepting" && "Processando convite..."}
            {status === "accepted" && "Convite aceito com sucesso!"}
            {status === "expired" && "Este convite expirou"}
            {status === "already_accepted" && "Este convite já foi aceito"}
            {status === "not_found" && "Convite não encontrado"}
            {status === "error" && "Ocorreu um erro"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Loading State */}
          {(status === "loading" || status === "accepting") && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Valid Invitation */}
          {status === "valid" && invitation && (
            <>
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium">{invitation.company?.name || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cargo</p>
                    <p className="font-medium">{ROLE_LABELS[invitation.role] || invitation.role}</p>
                  </div>
                </div>
                {invitation.inviter?.full_name && (
                  <p className="text-sm text-muted-foreground">
                    Convidado por <span className="font-medium">{invitation.inviter.full_name}</span>
                  </p>
                )}
              </div>

              {user ? (
                <Button onClick={handleAcceptInvitation} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aceitar Convite
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-center text-muted-foreground">
                    Faça login ou crie uma conta para aceitar o convite
                  </p>
                  <Button onClick={handleLoginRedirect} className="w-full">
                    Continuar
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Accepted State */}
          {status === "accepted" && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Redirecionando para o sistema...</p>
            </div>
          )}

          {/* Error States */}
          {(status === "expired" || status === "already_accepted" || status === "not_found" || status === "error") && (
            <div className="text-center py-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {status === "expired" && "O link de convite expirou. Solicite um novo convite ao administrador."}
                {status === "already_accepted" && "Este convite já foi utilizado."}
                {status === "not_found" && "O link de convite é inválido ou foi removido."}
                {status === "error" && (errorMessage || "Ocorreu um erro inesperado.")}
              </p>
              <Button variant="outline" onClick={() => router.push(PUBLIC_ROUTES.AUTH)}>
                Ir para Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
