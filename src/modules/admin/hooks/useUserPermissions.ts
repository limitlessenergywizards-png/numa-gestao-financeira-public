'use client';

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AdminUser } from "./useAdminData";

interface CompanyPermission {
  company_id: string;
  company_name: string;
  role: "admin" | "editor" | "viewer" | "remove";
}

export function useUserPermissions() {
  const [isSaving, setIsSaving] = useState(false);

  const savePermissions = async (user: AdminUser, permissions: CompanyPermission[]) => {
    setIsSaving(true);
    try {
      // IRON GATE: Verify admin belongs to each target company
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      for (const permission of permissions) {
        // Verify admin has authority over this company
        const { data: adminMembership } = await supabase
          .from("user_companies")
          .select("id")
          .eq("user_id", authUser.id)
          .eq("company_id", permission.company_id)
          .maybeSingle();

        if (!adminMembership) continue; // Skip companies admin doesn't belong to

        const hasAccess = user.companies.some((c) => c.company_id === permission.company_id);

        if (permission.role === "remove") {
          if (hasAccess) {
            await supabase
              .from("user_companies")
              .delete()
              .eq("user_id", user.user_id)
              .eq("company_id", permission.company_id);
          }
        } else {
          if (!hasAccess) {
            await supabase.from("user_companies").insert({
              user_id: user.user_id,
              company_id: permission.company_id,
            });
          }

          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", user.user_id)
            .single();

          if (existingRole) {
            await supabase
              .from("user_roles")
              .update({ role: permission.role })
              .eq("id", existingRole.id)
              .eq("user_id", user.user_id);
          } else {
            await supabase.from("user_roles").insert({
              user_id: user.user_id,
              role: permission.role,
            });
          }
        }
      }

      toast.success("Permissões atualizadas com sucesso");
      return true;
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Erro ao salvar permissões");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { savePermissions, isSaving };
}
