'use client';

import { memo, useState } from "react";
import { motion } from "framer-motion";
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
import {
  Users,
  Mail,
  Plus,
  X,
  Shield,
  Eye,
  Pencil,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "admin" | "editor" | "viewer";

interface InviteEntry {
  id: string;
  email: string;
  role: Role;
}

interface StepInviteUsersProps {
  invites: InviteEntry[];
  onChange: (invites: InviteEntry[]) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const ROLE_CONFIG: Record<Role, { label: string; description: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  admin: {
    label: "Admin",
    description: "Acesso total",
    icon: Shield,
    color: "text-primary",
  },
  editor: {
    label: "Gerente",
    description: "Cria e edita",
    icon: Pencil,
    color: "text-amber-500",
  },
  viewer: {
    label: "Visualizador",
    description: "Apenas leitura",
    icon: Eye,
    color: "text-muted-foreground",
  },
};

export const StepInviteUsers = memo(function StepInviteUsers({
  invites,
  onChange,
}: StepInviteUsersProps) {
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("viewer");

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isDuplicate = (email: string) =>
    invites.some((i) => i.email.toLowerCase() === email.toLowerCase().trim());

  const addInvite = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !isValidEmail(email) || isDuplicate(email)) return;

    onChange([
      ...invites,
      { id: generateId(), email, role: newRole },
    ]);
    setNewEmail("");
    setNewRole("viewer");
  };

  const removeInvite = (id: string) => {
    onChange(invites.filter((i) => i.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Convide sua Equipe</h2>
        <p className="text-sm text-muted-foreground">
          Adicione pessoas que vao acessar o sistema com voce
        </p>
      </div>

      {/* Invite form */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@exemplo.com"
              type="email"
              className="pl-10 text-sm"
              onKeyDown={(e) => e.key === "Enter" && addInvite()}
            />
          </div>
          <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Gerente</SelectItem>
              <SelectItem value="viewer">Visualizador</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={addInvite}
            disabled={!newEmail.trim() || !isValidEmail(newEmail) || isDuplicate(newEmail)}
            aria-label="Adicionar convite"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {newEmail && !isValidEmail(newEmail) && (
          <p className="text-xs text-destructive">Email invalido</p>
        )}
        {newEmail && isDuplicate(newEmail) && (
          <p className="text-xs text-destructive">Este email ja foi adicionado</p>
        )}
      </div>

      {/* Invite list */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            {invites.length} convite{invites.length > 1 ? "s" : ""} pendente{invites.length > 1 ? "s" : ""}
          </Label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {invites.map((invite) => {
              const roleConfig = ROLE_CONFIG[invite.role];
              const RoleIcon = roleConfig.icon;

              return (
                <div
                  key={invite.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 border border-border"
                >
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm truncate">{invite.email}</span>
                  <div className={cn("flex items-center gap-1 text-xs", roleConfig.color)}>
                    <RoleIcon className="w-3 h-3" />
                    <span>{roleConfig.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeInvite(invite.id)}
                    className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {invites.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhum convite adicionado ainda
          </p>
          <p className="text-xs text-muted-foreground">
            Adicione emails acima ou pule esta etapa
          </p>
        </div>
      )}

      {invites.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm">
          <Check className="w-4 h-4" />
          <span>Convites serao enviados ao finalizar o cadastro</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Os convidados receberao um email com link de acesso
      </p>
    </motion.div>
  );
});

StepInviteUsers.displayName = "StepInviteUsers";
