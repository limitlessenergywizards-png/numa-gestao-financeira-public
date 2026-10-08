'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, ExternalLink } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status: "connected" | "available" | "coming_soon";
  lastSync?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

const statusConfig = {
  connected: {
    label: "Conectado",
    icon: CheckCircle2,
    variant: "default" as const,
    className: "bg-success/10 text-success border-success/20",
  },
  available: {
    label: "Disponível",
    icon: Clock,
    variant: "secondary" as const,
    className: "bg-info/10 text-info border-info/20",
  },
  coming_soon: {
    label: "Em breve",
    icon: Clock,
    variant: "outline" as const,
    className: "bg-muted text-muted-foreground",
  },
};

export function IntegrationCard({
  title,
  description,
  icon: Icon,
  status,
  lastSync,
  onConnect,
  onDisconnect,
  onAction,
  actionLabel,
}: IntegrationCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          <Badge variant={config.variant} className={config.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {lastSync && status === "connected" && (
          <p className="text-xs text-muted-foreground mb-3">
            Última sincronização: {lastSync}
          </p>
        )}
        <div className="flex gap-2">
          {status === "connected" && onDisconnect && (
            <Button variant="outline" size="sm" onClick={onDisconnect}>
              <XCircle className="h-4 w-4 mr-1" />
              Desconectar
            </Button>
          )}
          {status === "available" && onConnect && (
            <Button size="sm" onClick={onConnect}>
              Conectar
            </Button>
          )}
          {status === "available" && onAction && (
            <Button variant="outline" size="sm" onClick={onAction}>
              {actionLabel || "Ação"}
            </Button>
          )}
          {status === "coming_soon" && (
            <Button variant="ghost" size="sm" disabled>
              <ExternalLink className="h-4 w-4 mr-1" />
              Saiba Mais
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
