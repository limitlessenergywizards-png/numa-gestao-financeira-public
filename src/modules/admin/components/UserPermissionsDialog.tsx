'use client';

import { useState, useEffect } from "react";
import { Shield, Building2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserPermissions } from "@/modules/admin/hooks/useUserPermissions";
import type { AdminUser, AdminCompany } from "@/modules/admin/hooks/useAdminData";

interface UserPermissionsDialogProps {
  user: AdminUser | null;
  companies: AdminCompany[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

interface CompanyPermission {
  company_id: string;
  company_name: string;
  role: "admin" | "editor" | "viewer" | "remove";
}

export function UserPermissionsDialog({
  user,
  companies,
  open,
  onOpenChange,
  onSave,
}: UserPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<CompanyPermission[]>([]);
  const { savePermissions, isSaving } = useUserPermissions();

  useEffect(() => {
    if (user) {
      // Initialize permissions from user's current companies
      const currentPermissions: CompanyPermission[] = companies.map((company) => {
        const userCompany = user.companies.find((c) => c.company_id === company.id);
        return {
          company_id: company.id,
          company_name: company.name,
          role: userCompany?.role || "remove",
        };
      });
      setPermissions(currentPermissions);
    }
  }, [user, companies]);

  function getInitials(name: string | null) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  const handleRoleChange = (companyId: string, role: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.company_id === companyId
          ? { ...p, role: role as CompanyPermission["role"] }
          : p
      )
    );
  };

  const handleSave = async () => {
    if (!user) return;
    const success = await savePermissions(user, permissions);
    if (success) onSave();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Permissões
          </DialogTitle>
          <DialogDescription>
            Configure o acesso do usuário às empresas
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.full_name || "Sem nome"}</p>
            <p className="text-sm text-muted-foreground">{user.job_title || "Usuário"}</p>
          </div>
        </div>

        {/* Permissions per Company */}
        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {permissions.map((permission) => (
            <div key={permission.company_id} className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {permission.company_name}
              </Label>
              <Select
                value={permission.role}
                onValueChange={(value) => handleRoleChange(permission.company_id, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                  <SelectItem value="remove">Sem acesso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
