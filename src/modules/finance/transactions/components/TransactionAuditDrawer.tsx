'use client';

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Plus, Pencil, Trash2, Check, CalendarDays, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { getActionLabel } from "@/lib/auditActions";
import type { Json } from "@/integrations/supabase/types";

interface AuditLog {
  id: string;
  action: string;
  old_data: Json | null;
  new_data: Json | null;
  created_at: string;
  user_id: string;
}

interface TransactionAuditDrawerProps {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionAuditDrawer({
  transactionId,
  open,
  onOpenChange,
}: TransactionAuditDrawerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (transactionId && open) {
      fetchAuditLogs();
    }
  }, [transactionId, open]);

  const fetchAuditLogs = async () => {
    if (!transactionId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, table_name, record_id, user_id, company_id, old_data, new_data, created_at')
        .eq('table_name', 'transactions')
        .eq('record_id', transactionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);

      // Fetch user names
      const userIds = [...new Set((data || []).map(log => log.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        
        const names: Record<string, string> = {};
        (profiles || []).forEach(p => {
          names[p.user_id] = p.full_name || 'Usuário';
        });
        setUserNames(names);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Detect diff format: new audit stores {"field": {"old": X, "new": Y}} in old_data, new_data = NULL
  const isDiffFormat = (oldData: Json | null, newData: Json | null): boolean => {
    if (newData !== null || !oldData || typeof oldData !== 'object') return false;
    const entries = Object.values(oldData as Record<string, unknown>);
    if (entries.length === 0) return false;
    const first = entries[0];
    return first !== null && typeof first === 'object' && 'old' in (first as Record<string, unknown>) && 'new' in (first as Record<string, unknown>);
  };

  // Extract old/new values for a field from either format
  const getFieldChange = (action: string, oldData: Json | null, newData: Json | null, field: string): { oldVal: unknown; newVal: unknown } | null => {
    if (action !== 'UPDATE' || !oldData) return null;
    const old = oldData as Record<string, unknown>;
    if (isDiffFormat(oldData, newData)) {
      const diff = old[field] as Record<string, unknown> | undefined;
      if (!diff) return null;
      return { oldVal: diff.old, newVal: diff.new };
    }
    const updated = newData as Record<string, unknown> | null;
    if (!updated) return null;
    return { oldVal: old[field], newVal: updated[field] };
  };

  const hasFieldChanged = (action: string, oldData: Json | null, newData: Json | null, field: string): boolean => {
    const change = getFieldChange(action, oldData, newData, field);
    if (!change) return false;
    return JSON.stringify(change.oldVal) !== JSON.stringify(change.newVal);
  };

  const getActionIcon = (action: string, oldData: Json | null, newData: Json | null) => {
    if (action === 'UPDATE' && oldData) {
      const reconciled = getFieldChange(action, oldData, newData, 'reconciled');
      if (reconciled && !reconciled.oldVal && reconciled.newVal) {
        return <Check className="h-4 w-4" />;
      }
      if (hasFieldChanged(action, oldData, newData, 'transaction_date')) {
        return <CalendarDays className="h-4 w-4" />;
      }
      if (hasFieldChanged(action, oldData, newData, 'amount')) {
        return <DollarSign className="h-4 w-4" />;
      }
      return <Pencil className="h-4 w-4" />;
    }

    switch (action) {
      case 'INSERT':
        return <Plus className="h-4 w-4" />;
      case 'UPDATE':
        return <Pencil className="h-4 w-4" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string, oldData: Json | null, newData: Json | null) => {
    if (action === 'UPDATE' && oldData) {
      const reconciled = getFieldChange(action, oldData, newData, 'reconciled');
      if (reconciled && !reconciled.oldVal && reconciled.newVal) {
        return 'bg-success/10 text-success';
      }
      if (hasFieldChanged(action, oldData, newData, 'transaction_date')) {
        return 'bg-purple-500/10 text-purple-500';
      }
    }

    switch (action) {
      case 'INSERT':
        return 'bg-success/10 text-success';
      case 'UPDATE':
        return 'bg-amber-500/10 text-amber-500';
      case 'DELETE':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSemanticActionLabel = (action: string, oldData: Json | null, newData: Json | null) => {
    if (action === 'UPDATE' && oldData) {
      const reconciled = getFieldChange(action, oldData, newData, 'reconciled');
      if (reconciled && !reconciled.oldVal && reconciled.newVal) {
        return 'Marcado como Conciliado';
      }
      if (hasFieldChanged(action, oldData, newData, 'transaction_date')) {
        return 'Data Alterada';
      }
      if (hasFieldChanged(action, oldData, newData, 'amount')) {
        return 'Valor Alterado';
      }
      return 'Atualizado';
    }

    switch (action) {
      case 'INSERT':
        return 'Registro Criado';
      case 'DELETE':
        return 'Registro Excluído';
      case 'BULK_DELETE':
        return 'Exclusão em Lote';
      default:
        return getActionLabel(action);
    }
  };

  const formatChanges = (oldData: Json | null, newData: Json | null) => {
    // INSERT: newData has full row
    if (!oldData && newData) {
      return Object.entries(newData).map(([key, value]) => ({
        field: key,
        from: null,
        to: value,
      }));
    }

    if (!oldData) return [];

    // New diff format: old_data = {"field": {"old": X, "new": Y}}, new_data = NULL
    if (isDiffFormat(oldData, newData)) {
      const diff = oldData as Record<string, Record<string, unknown>>;
      return Object.entries(diff).map(([key, change]) => ({
        field: key,
        from: change.old,
        to: change.new,
      }));
    }

    // Legacy full-row format: old_data and new_data are complete rows
    if (!newData) return [];
    const changes: { field: string; from: any; to: any }[] = [];
    Object.keys(newData).forEach((key) => {
      if (oldData && (oldData as Record<string, unknown>)[key] !== (newData as Record<string, unknown>)[key]) {
        changes.push({
          field: key,
          from: (oldData as Record<string, unknown>)[key],
          to: (newData as Record<string, unknown>)[key],
        });
      }
    });
    return changes;
  };

  // Field labels for audit display - using centralized pattern
  const FIELD_LABELS: Record<string, string> = {
    amount: 'Valor',
    description: 'Descrição',
    transaction_date: 'Data',
    payment_method: 'Forma de Pagamento',
    reconciled: 'Conciliado',
    notes: 'Observações',
    type: 'Tipo',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Alterações
          </SheetTitle>
          <SheetDescription>
            Todas as alterações feitas nesta movimentação
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhum registro de auditoria encontrado
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => {
                const changes = formatChanges(log.old_data, log.new_data);
                
                return (
                  <div 
                    key={log.id} 
                    className={cn(
                      "relative pl-6 pb-4",
                      index !== logs.length - 1 && "border-l border-border ml-2"
                    )}
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      "absolute left-0 top-0 -translate-x-1/2 p-1.5 rounded-full",
                      getActionColor(log.action, log.old_data, log.new_data)
                    )}>
                      {getActionIcon(log.action, log.old_data, log.new_data)}
                    </div>

                    {/* Content */}
                    <div className="ml-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={cn("text-xs", getActionColor(log.action, log.old_data, log.new_data))}>
                          {getSemanticActionLabel(log.action, log.old_data, log.new_data)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {userNames[log.user_id] && (
                          <span className="text-xs text-muted-foreground">
                            por {userNames[log.user_id]}
                          </span>
                        )}
                      </div>

                      {/* Changes */}
                      {changes.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                          {changes.slice(0, 5).map((change, i) => (
                            <div key={i} className="text-sm">
                              <span className="font-medium text-muted-foreground">
                                {FIELD_LABELS[change.field] || change.field}:
                              </span>
                              {change.from !== null && (
                                <span className="text-destructive line-through ml-2">
                                  {String(change.from)}
                                </span>
                              )}
                              <span className="text-success ml-2">
                                {String(change.to)}
                              </span>
                            </div>
                          ))}
                          {changes.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              +{changes.length - 5} outras alterações
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
