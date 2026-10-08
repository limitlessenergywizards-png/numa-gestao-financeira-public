import {
  FileText, Edit, Trash2, Plus, Clock, Building2, 
  Users, DollarSign, Package, FileCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AdminAuditLog } from "@/modules/admin/hooks/useAdminData";

interface UserActivityTimelineProps {
  logs: AdminAuditLog[];
  maxItems?: number;
}

export function UserActivityTimeline({ logs, maxItems = 20 }: UserActivityTimelineProps) {
  const displayLogs = logs.slice(0, maxItems);

  function getActionIcon(action: string) {
    switch (action) {
      case "INSERT":
        return Plus;
      case "UPDATE":
        return Edit;
      case "DELETE":
        return Trash2;
      default:
        return FileText;
    }
  }

  function getActionColor(action: string) {
    switch (action) {
      case "INSERT":
        return "text-emerald-500 bg-emerald-500/10";
      case "UPDATE":
        return "text-amber-500 bg-amber-500/10";
      case "DELETE":
        return "text-destructive bg-destructive/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  }

  function getActionLabel(action: string) {
    const labels: Record<string, string> = {
      INSERT: "Criou",
      UPDATE: "Atualizou",
      DELETE: "Removeu",
    };
    return labels[action] || action;
  }

  function getTableIcon(tableName: string) {
    switch (tableName) {
      case "companies":
        return Building2;
      case "profiles":
      case "user_companies":
      case "user_invitations":
        return Users;
      case "receivables":
      case "payables":
      case "transactions":
        return DollarSign;
      case "customers":
      case "suppliers":
        return Package;
      default:
        return FileCheck;
    }
  }

  function getTableLabel(tableName: string) {
    const labels: Record<string, string> = {
      companies: "empresa",
      profiles: "perfil",
      user_companies: "acesso",
      user_invitations: "convite",
      customers: "cliente",
      suppliers: "fornecedor",
      receivables: "conta a receber",
      payables: "conta a pagar",
      transactions: "transação",
      bank_accounts: "conta bancária",
      chart_of_accounts: "plano de contas",
    };
    return labels[tableName] || tableName;
  }

  if (displayLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Timeline de Atividades
          </CardTitle>
          <CardDescription>Histórico de ações do usuário</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma atividade registrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Timeline de Atividades
        </CardTitle>
        <CardDescription>
          Últimas {displayLogs.length} ações registradas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative animate-fade-in">
          {/* Timeline Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {displayLogs.map((log, index) => {
              const ActionIcon = getActionIcon(log.action);
              const TableIcon = getTableIcon(log.table_name);
              const actionColorClass = getActionColor(log.action);

              return (
                <div
                  key={log.id}
                  className="relative flex gap-4 pl-10 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  {/* Timeline Dot */}
                  <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-background ${actionColorClass} flex items-center justify-center`}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </div>

                  <div className="flex-1 bg-muted/50 rounded-lg p-3 hover:bg-muted transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${actionColorClass}`}>
                          <ActionIcon className="h-3 w-3" />
                        </div>
                        <span className="font-medium text-sm">
                          {getActionLabel(log.action)}
                        </span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TableIcon className="h-3 w-3" />
                          <span className="text-sm">{getTableLabel(log.table_name)}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {log.company_name}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {log.created_at && formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <span>
                        {log.created_at && format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    {/* Show brief data if available */}
                    {(log.new_data || log.old_data) && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {log.action === "INSERT" && log.new_data && (
                          <span>
                            Novo registro criado
                            {(log.new_data as Record<string, unknown>)?.name && 
                              `: "${(log.new_data as Record<string, unknown>).name}"`
                            }
                          </span>
                        )}
                        {log.action === "DELETE" && log.old_data && (
                          <span>
                            Registro removido
                            {(log.old_data as Record<string, unknown>)?.name && 
                              `: "${(log.old_data as Record<string, unknown>).name}"`
                            }
                          </span>
                        )}
                        {log.action === "UPDATE" && (
                          <span>Dados atualizados</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {logs.length > maxItems && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Mostrando {maxItems} de {logs.length} atividades
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
