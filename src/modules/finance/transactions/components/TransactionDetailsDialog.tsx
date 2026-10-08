'use client';

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Wallet, 
  Tag, 
  CreditCard, 
  FileText, 
  Check, 
  Clock,
  User,
  Building2,
  History,
  ChevronRight
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getActionIcon, getActionColor } from "@/lib/auditActions";
import type { Json } from "@/integrations/supabase/types";

interface Transaction {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  transaction_date: string;
  payment_method: string | null;
  document_number: string | null;
  notes: string | null;
  reconciled?: boolean;
  reconciled_at?: string | null;
  created_at: string;
  bank_account?: { name: string };
  chart_account?: { name: string; code: string } | null;
  customer?: { name: string } | null;
  supplier?: { name: string } | null;
}

interface AuditLogEntry {
  id: string;
  action: string;
  created_at: string;
  old_data: Json | null;
  new_data: Json | null;
}

interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onViewFullAudit?: () => void;
  onOpenChange: (open: boolean) => void;
  formatCurrency: (value: number) => string;
}

// Payment method labels for display
const PAYMENT_METHOD_DISPLAY_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_debito: 'Cartão Débito',
  cartao_credito: 'Cartão Crédito',
  boleto: 'Boleto',
  transferencia: 'Transferência',
};

export function TransactionDetailsDialog({
  transaction,
  open,
  onOpenChange,
  onViewFullAudit,
  formatCurrency,
}: TransactionDetailsDialogProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    if (transaction?.id && open) {
      fetchRecentAuditLogs();
    }
  }, [transaction?.id, open]);

  const fetchRecentAuditLogs = async () => {
    if (!transaction?.id) return;
    
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, created_at, old_data, new_data')
        .eq('table_name', 'transactions')
        .eq('record_id', transaction.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  if (!transaction) return null;

  const isEntrada = transaction.type === 'entrada';

  const getChangeDescription = (log: AuditLogEntry): string => {
    if (log.action === 'INSERT') return 'criou este registro';
    if (log.action === 'DELETE') return 'excluiu este registro';
    
    // For updates, try to find what changed
    if (log.old_data && log.new_data) {
      const oldData = log.old_data as Record<string, unknown>;
      const newData = log.new_data as Record<string, unknown>;
      
      if (oldData.reconciled !== newData.reconciled && newData.reconciled) {
        return 'marcou como conciliado';
      }
      if (oldData.transaction_date !== newData.transaction_date) {
        return `alterou data: ${oldData.transaction_date} → ${newData.transaction_date}`;
      }
      if (oldData.amount !== newData.amount) {
        return `alterou valor`;
      }
    }
    return 'alterou este registro';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isEntrada ? "bg-success/10" : "bg-destructive/10"
            )}>
              {isEntrada ? (
                <Wallet className="h-5 w-5 text-success" />
              ) : (
                <Wallet className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <DialogTitle>{transaction.description}</DialogTitle>
              <DialogDescription>
                Detalhes da movimentação
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount and Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className={cn(
                "text-2xl font-bold tabular-nums",
                isEntrada ? "text-success" : "text-destructive"
              )}>
                {isEntrada ? '+' : '-'} {formatCurrency(Number(transaction.amount))}
              </p>
            </div>
            <Badge 
              variant={transaction.reconciled ? "default" : "secondary"}
              className={cn(
                "gap-1",
                transaction.reconciled && "bg-success"
              )}
            >
              {transaction.reconciled ? (
                <><Check className="h-3 w-3" /> Conciliado</>
              ) : (
                <><Clock className="h-3 w-3" /> Pendente</>
              )}
            </Badge>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              icon={Calendar}
              label="Data"
              value={format(new Date(transaction.transaction_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            />
            <DetailItem
              icon={CreditCard}
              label="Forma de Pagamento"
              value={PAYMENT_METHOD_DISPLAY_LABELS[transaction.payment_method || 'dinheiro'] || '-'}
            />
            <DetailItem
              icon={Building2}
              label="Conta Bancária"
              value={transaction.bank_account?.name || '-'}
            />
            <DetailItem
              icon={Tag}
              label="Plano de Contas"
              value={transaction.chart_account 
                ? `${transaction.chart_account.code} - ${transaction.chart_account.name}` 
                : '-'
              }
            />
            {transaction.customer && (
              <DetailItem
                icon={User}
                label="Cliente"
                value={transaction.customer.name}
              />
            )}
            {transaction.supplier && (
              <DetailItem
                icon={User}
                label="Fornecedor"
                value={transaction.supplier.name}
              />
            )}
            {transaction.document_number && (
              <DetailItem
                icon={FileText}
                label="Nº Documento"
                value={transaction.document_number}
              />
            )}
          </div>

          {/* Notes */}
          {transaction.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{transaction.notes}</p>
              </div>
            </>
          )}

          {/* Inline Audit History */}
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                Histórico de Alterações
              </p>
              {onViewFullAudit && auditLogs.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={onViewFullAudit}
                >
                  Ver completo
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
            
            {isLoadingLogs ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                Nenhum histórico disponível
              </p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className={cn(
                      "flex-shrink-0 mt-0.5",
                      getActionColor(log.action)
                    )}>
                      {getActionIcon(log.action)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                      <span className="mx-1">•</span>
                      <span>{getChangeDescription(log)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Criado em: {format(new Date(transaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            {transaction.reconciled_at && (
              <p>Conciliado em: {format(new Date(transaction.reconciled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: typeof Calendar; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
