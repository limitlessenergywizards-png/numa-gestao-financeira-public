import { Badge } from "@/components/ui/badge";
import { Shield, Users, Eye } from "lucide-react";

type Role = "admin" | "editor" | "viewer";

interface UserRoleBadgeProps {
  role: Role;
  showIcon?: boolean;
  size?: "sm" | "default";
}

const roleConfig: Record<Role, { label: string; variant: "default" | "secondary" | "outline"; icon: typeof Shield }> = {
  admin: {
    label: "Admin",
    variant: "default",
    icon: Shield,
  },
  editor: {
    label: "Gerente",
    variant: "secondary",
    icon: Users,
  },
  viewer: {
    label: "Visualizador",
    variant: "outline",
    icon: Eye,
  },
};

export function UserRoleBadge({ role, showIcon = true, size = "default" }: UserRoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.viewer;
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={size === "sm" ? "text-xs px-2 py-0.5" : ""}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
