'use client';

import { useState, useMemo } from "react";
import { History, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AdminAuditLog } from "@/modules/admin/hooks/useAdminData";
import { AuditLogFiltersComponent, type AuditLogFilters } from "./AuditLogFilters";
import { AuditLogExport } from "./AuditLogExport";
import { AuditLogDiffViewer } from "./AuditLogDiffViewer";

interface AdminAuditLogsProps {
  logs: AdminAuditLog[];
  isLoading: boolean;
}

export function AdminAuditLogs({ logs, isLoading }: AdminAuditLogsProps) {
  const [search, setSearch] = useState("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({
    dateFrom: undefined,
    dateTo: undefined,
    userId: undefined,
    entities: [],
    actions: [],
  });

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Text search
      if (search !== "") {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          log.user_name?.toLowerCase().includes(searchLower) ||
          log.company_name?.toLowerCase().includes(searchLower) ||
          log.table_name.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Date filter
      if (filters.dateFrom || filters.dateTo) {
        const logDate = log.created_at ? new Date(log.created_at) : null;
        if (!logDate) return false;
        
        if (filters.dateFrom && logDate < startOfDay(filters.dateFrom)) return false;
        if (filters.dateTo && logDate > endOfDay(filters.dateTo)) return false;
      }

      // User filter
      if (filters.userId && log.user_id !== filters.userId) return false;

      // Entity filter
      if (filters.entities.length > 0 && !filters.entities.includes(log.table_name)) return false;

      // Action filter
      if (filters.actions.length > 0 && !filters.actions.includes(log.action)) return false;

      return true;
    });
  }, [logs, search, filters]);

  function getActionLabel(action: string) {
    const labels: Record<string, string> = {
      INSERT: "Criação",
      UPDATE: "Atualização",
      DELETE: "Remoção",
    };
    return labels[action] || action;
  }

  function getTableLabel(tableName: string) {
    const labels: Record<string, string> = {
      companies: "Empresa",
      profiles: "Perfil",
      user_companies: "Acesso",
      user_invitations: "Convite",
      customers: "Cliente",
      suppliers: "Fornecedor",
      receivables: "Conta a Receber",
      payables: "Conta a Pagar",
      transactions: "Transação",
      bank_accounts: "Conta Bancária",
      chart_of_accounts: "Plano de Contas",
    };
    return labels[tableName] || tableName;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActionBadgeStyles = (action: string) => {
    switch (action) {
      case "INSERT":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "UPDATE":
        return "bg-brand/10 text-brand border-brand/30";
      case "DELETE":
        return "bg-destructive/10 text-destructive border-destructive/30";
      default:
        return "bg-muted/50 text-muted-foreground";
    }
  };

  return (
    <Card className="bg-card dark:bg-[#17322C]/60 border-border dark:border-brand/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-brand" />
          Logs de Auditoria
        </CardTitle>
        <CardDescription>
          Histórico de todas as ações realizadas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuário, empresa ou ação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50 dark:bg-[#1B3B34]/50 border-border dark:border-brand/20 focus:border-brand/50"
            />
          </div>
          <AuditLogFiltersComponent logs={logs} filters={filters} onFiltersChange={setFilters} />
          <AuditLogExport logs={filteredLogs} filters={filters} />
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {filteredLogs.length} de {logs.length} registros
        </div>

        {/* Logs Table */}
        <div className="animate-fade-in">
          <Table className="table-premium">
            <TableHeader>
              <TableRow className="border-brand/20 hover:bg-transparent">
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <Collapsible
                  key={log.id}
                  open={expandedLog === log.id}
                  onOpenChange={(open) => setExpandedLog(open ? log.id : null)}
                >
                  <tr
                    className="border-b border-brand/10 transition-colors hover:bg-brand/5"
                  >
                    <TableCell className="font-mono text-xs">
                      {log.created_at && format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.user_name || "Sistema"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionBadgeStyles(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getTableLabel(log.table_name)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.company_name}
                    </TableCell>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Opções do log">
                          {expandedLog === log.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                  </tr>
                  <CollapsibleContent asChild>
                    <tr className="border-b border-border dark:border-brand/10 bg-muted/30 dark:bg-[#1B3B34]/30">
                      <td colSpan={6} className="p-4">
                        <AuditLogDiffViewer
                          oldData={log.old_data}
                          newData={log.new_data}
                        />
                      </td>
                    </tr>
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
