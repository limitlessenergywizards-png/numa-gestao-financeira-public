'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building2, 
  Users, 
  Calendar,
  Clock,
  MoreVertical,
  ExternalLink,
  Mail,
  Ban,
  RefreshCw,
  Activity
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface TenantData {
  id: string;
  name: string;
  trading_name: string | null;
  document: string | null;
  email: string | null;
  created_at: string;
  status: 'active' | 'trial' | 'inactive' | 'overdue';
  planName: string;
  trialDaysLeft: number;
  usersCount: number;
  lastActivity: string | null;
  ownerUserId: string | undefined;
  ownerEmail: string | undefined;
  ownerName: string | null | undefined;
}

interface TenantCardProps {
  tenant: TenantData;
  onImpersonate: (userId: string) => void;
  onRefresh: () => void;
}

const STATUS_CONFIG = {
  active: {
    label: "Ativo",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: Activity,
  },
  trial: {
    label: "Trial",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Clock,
  },
  inactive: {
    label: "Inativo",
    className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    icon: Ban,
  },
  overdue: {
    label: "Inadimplente",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: Clock,
  },
};

const PLAN_CONFIG: Record<string, string> = {
  'Iniciante': 'bg-brand/10 text-brand border-brand/30',
  'Estrategista': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  'Mestre': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'Trial': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'Gratuito': 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

export function TenantCard({ tenant, onImpersonate, onRefresh }: TenantCardProps) {
  const statusConfig = STATUS_CONFIG[tenant.status];
  const StatusIcon = statusConfig.icon;

  const handleExtendTrial = async () => {
    toast.info("Funcionalidade em desenvolvimento. Em breve disponível.");
  };

  const handleSendNotification = async () => {
    toast.info("Funcionalidade em desenvolvimento. Em breve disponível.");
  };

  return (
    <Card className="border-brand/20 bg-card/50 backdrop-blur-sm hover:border-brand/40 transition-[border-color,box-shadow] group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10">
              <Building2 className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-brand transition-colors line-clamp-1">
                {tenant.name}
              </h3>
              {tenant.trading_name && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {tenant.trading_name}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Opções do tenant">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {tenant.ownerUserId && (
                <DropdownMenuItem onClick={() => onImpersonate(tenant.ownerUserId!)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Impersonar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleSendNotification}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Notificação
              </DropdownMenuItem>
              {tenant.status === 'trial' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExtendTrial}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Estender Trial
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => toast.info("Funcionalidade em desenvolvimento. Em breve disponível.")}>
                <Ban className="h-4 w-4 mr-2" />
                Desativar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status and Plan Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={statusConfig.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
            {tenant.status === 'trial' && tenant.trialDaysLeft > 0 && (
              <span className="ml-1">({tenant.trialDaysLeft}d)</span>
            )}
          </Badge>
          <Badge variant="outline" className={PLAN_CONFIG[tenant.planName] || PLAN_CONFIG['Gratuito']}>
            {tenant.planName}
          </Badge>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {tenant.usersCount} {tenant.usersCount === 1 ? 'usuário' : 'usuários'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {format(new Date(tenant.created_at), "dd/MM/yy")}
            </span>
          </div>
        </div>

        {/* Owner Info */}
        {tenant.ownerEmail && (
          <div className="text-xs text-muted-foreground border-t border-border/50 pt-3">
            <p className="font-medium">{tenant.ownerName || 'Proprietário'}</p>
            <p className="truncate">{tenant.ownerEmail}</p>
          </div>
        )}

        {/* Last Activity */}
        {tenant.lastActivity && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>
              Último acesso: {formatDistanceToNow(new Date(tenant.lastActivity), {
                addSuffix: true,
                locale: ptBR
              })}
            </span>
          </div>
        )}

        {/* Quick Actions */}
        {tenant.ownerUserId && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-brand/30 hover:bg-brand/10"
            onClick={() => onImpersonate(tenant.ownerUserId!)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Acessar como Cliente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
