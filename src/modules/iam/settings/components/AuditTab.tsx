'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  History,
  ChevronDown,
  FileText,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getActionLabel, getActionIcon, getActionColor } from "@/lib/auditActions";
import { LogsDiffViewer } from "@/modules/admin/components/LogsDiffViewer";

import type { Json } from "@/integrations/supabase/types";

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  created_at: string;
  user_id: string;
}

const TABLE_LABELS: Record<string, string> = {
  transactions: 'Movimentações',
  receivables: 'Contas a Receber',
  payables: 'Contas a Pagar',
  customers: 'Clientes',
  suppliers: 'Fornecedores',
  bank_accounts: 'Contas Bancárias',
  chart_of_accounts: 'Plano de Contas',
  companies: 'Empresas',
};

export function AuditTab() {
  const { currentCompany } = useCompany();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchAuditLogs();
    }
  }, [currentCompany?.id]);

  // Real-time subscription for new audit logs
  useEffect(() => {
    if (!currentCompany?.id) return;

    const channel = supabase
      .channel(`audit_logs_${currentCompany.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: `company_id=eq.${currentCompany.id}`,
        },
        (payload) => {
          const newLog = payload.new as AuditLog;
          setLogs((prev) => [newLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentCompany?.id]);

  const fetchAuditLogs = async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, table_name, record_id, user_id, company_id, old_data, new_data, created_at')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.table_name.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      (log.new_data && JSON.stringify(log.new_data).toLowerCase().includes(search)) ||
      (log.old_data && JSON.stringify(log.old_data).toLowerCase().includes(search))
    );
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTableLabel = (tableName: string) => TABLE_LABELS[tableName] || tableName;

  const handleExportCSV = () => {
    const csvData = filteredLogs.map(log => ({
      data: format(new Date(log.created_at), "dd/MM/yyyy HH:mm"),
      acao: getActionLabel(log.action),
      entidade: getTableLabel(log.table_name),
      detalhes: log.new_data ? JSON.stringify(log.new_data) : ''
    }));

    const headers = ['Data', 'Ação', 'Entidade', 'Detalhes'];
    const rows = csvData.map(row => [row.data, row.acao, row.entidade, row.detalhes]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Auditoria
            </CardTitle>
            <CardDescription>
              Acompanhe todas as alterações feitas no sistema
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por entidade, ação ou conteúdo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Nenhum registro encontrado' : 'Nenhum registro de auditoria'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead className="w-[100px]">Ação</TableHead>
                    <TableHead className="w-[150px]">Entidade</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log, index) => (
                    <Collapsible
                      key={log.id}
                      open={expandedLog === log.id}
                      onOpenChange={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <tr className="group">
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getActionBadgeVariant(log.action)}
                            className={cn("text-xs", getActionColor(log.action))}
                          >
                            {getActionIcon(log.action)} {getActionLabel(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {getTableLabel(log.table_name)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1"
                            >
                              Ver alterações
                              <ChevronDown className={cn(
                                "h-3 w-3 transition-transform",
                                expandedLog === log.id && "rotate-180"
                              )} />
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                      </tr>
                      <CollapsibleContent asChild>
                        <tr>
                          <td colSpan={4} className="bg-muted/30 p-4">
                            <LogsDiffViewer
                              oldData={log.old_data as Record<string, unknown> | null}
                              newData={log.new_data as Record<string, unknown> | null}
                              action={log.action}
                            />
                          </td>
                        </tr>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          <div className="text-xs text-muted-foreground text-center pt-2">
            Mostrando {filteredLogs.length} de {logs.length} registros
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
