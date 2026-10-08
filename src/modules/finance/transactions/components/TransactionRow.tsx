/**
 * TransactionRow Component
 * 
 * Componente memoizado para linha de transação.
 * Evita re-render desnecessário quando outras linhas mudam.
 */

import { memo } from 'react';
import { format } from 'date-fns';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TransactionRowActions } from './TransactionRowActions';
import {
  Pencil, Check, Clock,
  Banknote, Zap, CreditCard, Receipt, Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
import type { Transaction } from '@/modules/finance/transactions/hooks/useTransactionsData';

export type TransactionData = Transaction;

interface TransactionRowProps {
  transaction: TransactionData;
  isSelected: boolean;
  canEdit: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onView: (t: TransactionData) => void;
  onEdit: (t: TransactionData) => void;
  onDelete: (t: TransactionData) => void;
  onReconcile: (t: TransactionData) => void;
  onDuplicate: (t: TransactionData) => void;
  onConvert?: (t: TransactionData) => void;
  onViewAudit: (id: string) => void;
  formatCurrency: (value: number) => string;
  style?: React.CSSProperties;
  columnWidths?: Record<string, number>;
}

const paymentMethodLabels: Record<string, { label: string; icon: typeof Banknote }> = {
  dinheiro: { label: 'Dinheiro', icon: Banknote },
  pix: { label: 'PIX', icon: Zap },
  cartao_debito: { label: 'Débito', icon: CreditCard },
  cartao_credito: { label: 'Crédito', icon: CreditCard },
  boleto: { label: 'Boleto', icon: Receipt },
  transferencia: { label: 'Transf.', icon: Wallet },
};

export const TransactionRow = memo(function TransactionRow({
  transaction,
  isSelected,
  canEdit,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onReconcile,
  onDuplicate,
  onConvert,
  onViewAudit,
  formatCurrency,
  style,
  columnWidths,
}: TransactionRowProps) {
  const PaymentIcon = paymentMethodLabels[transaction.payment_method || 'dinheiro']?.icon || Banknote;
  const isEntrada = transaction.type === 'entrada';
  const isPrevisao = transaction.nature === 'previsao';

  return (
    <TableRow
      className={cn(
        "group border-b transition-colors hover:bg-[#C5A059]/8 dark:hover:bg-[#C5A059]/12",
        transaction.reconciled && "opacity-60",
        isSelected && "bg-primary/5",
        isPrevisao && "bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-l-blue-400"
      )}
    >
      <TableCell className="!pl-6 !pr-3 !overflow-visible">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(transaction.id, !!checked)}
            className="h-3 w-3"
          />
        </div>
      </TableCell>

      <TableCell style={{ width: columnWidths?.date }} className="font-medium text-center">
        <div className="flex items-center justify-center gap-1.5">
          {format(new Date(transaction.transaction_date), 'dd/MM/yy')}
          {transaction.original_transaction_date && (
            <Tooltip>
              <TooltipTrigger>
                <Pencil className="h-3 w-3 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Data alterada de {format(new Date(transaction.original_transaction_date), 'dd/MM/yy')}
                  para {format(new Date(transaction.transaction_date), 'dd/MM/yy')}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>

      {/* Emissão (created_at) */}
      <TableCell style={{ width: columnWidths?.emissao }} className="text-sm text-muted-foreground truncate px-2">
        {format(new Date(transaction.created_at), 'dd/MM/yy')}
      </TableCell>

      <TableCell style={{ width: columnWidths?.descricao }} className="px-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0 max-w-full">
            <span className="font-medium truncate min-w-0" title={transaction.description}>
              {transaction.description}
            </span>
            {transaction.linked_forecast_id && (
              <Badge variant="outline" className="shrink-0 h-4 px-1.5 text-[9px] font-normal bg-indigo-500/15 text-indigo-400 border-indigo-500/30 uppercase tracking-tight">
                Convertido
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="gap-1 font-normal text-xs py-0">
              <PaymentIcon className="h-3 w-3" />
              {paymentMethodLabels[transaction.payment_method || 'dinheiro']?.label}
            </Badge>
          </div>
        </div>
      </TableCell>

      <TableCell style={{ width: columnWidths?.entidade }} className="px-2">
        {(() => {
          const customerName = transaction.customer?.name;
          const supplierName = transaction.supplier?.name;
          const isDebtPayment = transaction.is_debt_payment;

          let entityName: string | null = null;
          let tag: { label: string; className: string } | null = null;

          if (transaction.type === 'entrada' && customerName) {
            entityName = customerName;
            tag = { label: 'Cliente', className: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
          } else if (transaction.type === 'saida') {
            if (isDebtPayment && supplierName) {
              entityName = supplierName;
              tag = { label: 'Credor', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
            } else if (supplierName) {
              entityName = supplierName;
              tag = { label: 'Fornecedor', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
            }
          }

          if (!entityName) return <span className="text-sm text-muted-foreground">—</span>;

          return (
            <div className="flex flex-col min-w-0 gap-0.5 max-w-full">
              <span className="text-sm font-medium truncate block w-full" title={entityName}>
                {entityName}
              </span>
              {tag && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 w-fit font-normal border",
                    tag.className
                  )}
                >
                  {tag.label}
                </Badge>
              )}
            </div>
          );
        })()}
      </TableCell>

      <TableCell style={{ width: columnWidths?.categoria }} className="px-2 truncate">
        {transaction.category ? (
          <span className="text-sm text-muted-foreground">
            {transaction.category.name}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Plano de Contas */}
      <TableCell style={{ width: columnWidths?.plano }} className="px-2">
        {transaction.chart_account ? (
          <div className="flex flex-col min-w-0 max-w-full">
            <span className="text-xs font-mono text-muted-foreground/70">{transaction.chart_account.code}</span>
            <span className="text-sm truncate block w-full" title={transaction.chart_account.name}>
              {transaction.chart_account.name}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell style={{ width: columnWidths?.banco }} className="px-2">
        <span className="text-sm truncate w-full block" title={transaction.bank_account?.name || '-'}>
          {transaction.bank_account?.name || '-'}
        </span>
      </TableCell>

      {/* Nº Documento */}
      <TableCell style={{ width: columnWidths?.doc }} className="px-2">
        {transaction.document_number ? (
          <span className="text-xs font-mono text-muted-foreground block w-full truncate" title={transaction.document_number}>
            {transaction.document_number}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Observações */}
      <TableCell style={{ width: columnWidths?.obs }} className="px-2">
        {transaction.notes ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground truncate block w-full cursor-help">{transaction.notes}</span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[300px]">
              <p className="text-xs whitespace-pre-wrap">{transaction.notes}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell style={{ width: columnWidths?.valor }} className={cn(
        "font-semibold tabular-nums whitespace-nowrap",
        isEntrada ? 'text-success' : 'text-destructive'
      )}>
        {isEntrada ? '+' : '-'} {formatCurrency(Number(transaction.amount))}
      </TableCell>

      <TableCell style={{ width: columnWidths?.saldo }} className={cn(
        "tabular-nums font-medium truncate px-2",
        (transaction.running_balance || 0) >= 0 ? 'text-success' : 'text-destructive'
      )}>
        {formatCurrency(transaction.running_balance || 0)}
      </TableCell>

      <TableCell style={{ width: columnWidths?.status }} className="px-2 overflow-hidden">
        {(() => {
          // 3 states: Conciliado (green) → Realizado (sky) → Pendente (gray)
          if (transaction.reconciled) {
            return (
              <Badge variant="default" className="gap-1 text-xs bg-success">
                <Check className="h-3 w-3" /> Conciliado
              </Badge>
            );
          }

          // Realizado: completed (or converted from forecast) but not yet reconciled
          const isRealizado = !!transaction.linked_forecast_id;
          if (isRealizado) {
            return (
              <Badge variant="default" className="gap-1 text-xs bg-sky-600 hover:bg-sky-700">
                <Check className="h-3 w-3" /> Realizado
              </Badge>
            );
          }

          // Pendente
          return (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Clock className="h-3 w-3" /> Pendente
            </Badge>
          );
        })()}

        {isPrevisao && (
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 h-4 w-fit font-normal border bg-blue-500/15 text-blue-400 border-blue-500/30 uppercase tracking-tight"
            >
              {transaction.forecast_type === 'orcamento' ? 'META' : 'PREVISÃO'}
            </Badge>
            {(() => {
              const confidence = transaction.forecast_confidence ?? 80;
              return (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1.5 py-0 h-4 w-fit font-semibold border uppercase tracking-tight",
                    confidence >= 80
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : confidence >= 50
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : "bg-red-500/15 text-red-400 border-red-500/30"
                  )}
                >
                  {confidence}%
                </Badge>
              );
            })()}
          </div>
        )}
      </TableCell>

      {canEdit && (
        <TableCell style={{ width: columnWidths?.actions }} className="text-right !pr-4">
          <TransactionRowActions
            transaction={transaction}
            onView={() => onView(transaction)}
            onEdit={() => onEdit(transaction)}
            onDelete={() => onDelete(transaction)}
            onReconcile={() => onReconcile(transaction)}
            onDuplicate={() => onDuplicate(transaction)}
            onConvert={onConvert ? () => onConvert(transaction) : undefined}
            onViewAudit={() => onViewAudit(transaction.id)}
          />
        </TableCell>
      )}
    </TableRow>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada para evitar re-renders desnecessários
  return (
    prevProps.transaction.id === nextProps.transaction.id &&
    prevProps.transaction.reconciled === nextProps.transaction.reconciled &&
    prevProps.transaction.amount === nextProps.transaction.amount &&
    prevProps.transaction.description === nextProps.transaction.description &&
    prevProps.transaction.transaction_date === nextProps.transaction.transaction_date &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.canEdit === nextProps.canEdit
  );
});

export default TransactionRow;
