'use client';

/**
 * Transaction column definitions for VirtualTable
 * Memoized cell renderers for optimal performance
 */

import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal, Pencil, Eye, Check, Copy, Trash2, FileText, Clock,
  Banknote, Zap, CreditCard, Receipt, Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@/components/ui/virtual-table';

// ============================================
// Types - Generic to work with any Transaction shape
// ============================================

export interface TransactionRow {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  transaction_date: string;
  payment_method: string | null;
  reconciled: boolean;
  original_transaction_date: string | null;
  bank_account?: { name: string };
  chart_account?: { name: string; code: string } | null;
  customer?: { name: string } | null;
  supplier?: { name: string } | null;
  is_debt_payment?: boolean;
}

export interface TransactionColumnProps<T extends TransactionRow> {
  formatCurrency: (value: number) => string;
  canEdit: boolean;
  onView: (t: T) => void;
  onEdit: (t: T) => void;
  onReconcile: (t: T) => void;
  onDuplicate: (t: T) => void;
  onDelete: (t: T) => void;
  onViewAudit: (id: string) => void;
}

// ============================================
// Payment Method Labels (with icons for this context)
// ============================================

const PAYMENT_METHOD_ICONS: Record<string, { label: string; icon: typeof Banknote }> = {
  dinheiro: { label: 'Dinheiro', icon: Banknote },
  pix: { label: 'PIX', icon: Zap },
  cartao_debito: { label: 'Débito', icon: CreditCard },
  cartao_credito: { label: 'Crédito', icon: CreditCard },
  boleto: { label: 'Boleto', icon: Receipt },
  transferencia: { label: 'Transf.', icon: Wallet },
};

// ============================================
// Memoized Cell Components
// ============================================

/** Date cell with edit indicator */
const DateCell = memo(({ row }: { row: TransactionRow }) => {
  const hasChange = row.original_transaction_date;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        <span className="font-medium tabular-nums">
          {format(new Date(row.transaction_date), 'dd/MM/yy')}
        </span>
        {hasChange && (
          <Tooltip>
            <TooltipTrigger>
              <Pencil className="h-3 w-3 text-warning" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Data alterada de {format(new Date(row.original_transaction_date!), 'dd/MM/yy')}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
});
DateCell.displayName = 'DateCell';

/** Description + payment method cell */
const DescriptionCell = memo(({ row }: { row: TransactionRow }) => {
  const method = row.payment_method || 'dinheiro';
  const PaymentIcon = PAYMENT_METHOD_ICONS[method]?.icon || Banknote;
  const label = PAYMENT_METHOD_ICONS[method]?.label || method;

  return (
    <div className="flex flex-col min-w-0">
      <span className="font-medium truncate" title={row.description}>
        {row.description}
      </span>
      <Badge variant="outline" className="gap-1 font-normal text-xs py-0 w-fit mt-0.5">
        <PaymentIcon className="h-3 w-3" />
        {label}
      </Badge>
    </div>
  );
});
DescriptionCell.displayName = 'DescriptionCell';

/** Category cell */
const CategoryCell = memo(({ row }: { row: TransactionRow }) => (
  <span className="text-sm text-muted-foreground truncate">
    {row.chart_account?.name || '-'}
  </span>
));
CategoryCell.displayName = 'CategoryCell';

/** Bank account cell */
const BankCell = memo(({ row }: { row: TransactionRow }) => (
  <span className="text-sm truncate">{row.bank_account?.name || '-'}</span>
));
BankCell.displayName = 'BankCell';

/** Entity (Fornecedor / Cliente / Credor) cell */
const EntityCell = memo(({ row }: { row: TransactionRow }) => {
  const customerName = row.customer?.name;
  const supplierName = row.supplier?.name;
  const isDebtPayment = row.is_debt_payment;

  // Determine entity name and type
  let entityName: string | null = null;
  let entityType: 'fornecedor' | 'cliente' | 'credor' | null = null;

  if (row.type === 'entrada' && customerName) {
    entityName = customerName;
    entityType = 'cliente';
  } else if (row.type === 'saida') {
    if (isDebtPayment && supplierName) {
      entityName = supplierName;
      entityType = 'credor';
    } else if (supplierName) {
      entityName = supplierName;
      entityType = 'fornecedor';
    }
  }

  if (!entityName) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const tagConfig = {
    fornecedor: { label: 'Fornecedor', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    cliente: { label: 'Cliente', className: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
    credor: { label: 'Credor', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  };

  const tag = entityType ? tagConfig[entityType] : null;

  return (
    <div className="flex flex-col min-w-0 gap-0.5">
      <span className="text-sm font-medium truncate" title={entityName}>
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
});
EntityCell.displayName = 'EntityCell';

/** Amount cell with color based on type */
const AmountCell = memo(({
  row,
  formatCurrency
}: {
  row: TransactionRow;
  formatCurrency: (v: number) => string;
}) => {
  const isEntrada = row.type === 'entrada';

  return (
    <span className={cn(
      "font-semibold tabular-nums whitespace-nowrap",
      isEntrada ? 'text-success' : 'text-destructive'
    )}>
      {isEntrada ? '+' : '-'} {formatCurrency(Number(row.amount))}
    </span>
  );
});
AmountCell.displayName = 'AmountCell';

/** Status badge cell */
const StatusCell = memo(({ row }: { row: TransactionRow }) => (
  <Badge
    variant={row.reconciled ? "default" : "secondary"}
    className={cn(
      "gap-1 text-xs",
      row.reconciled && "bg-success"
    )}
  >
    {row.reconciled ? (
      <><Check className="h-3 w-3" /> Conc</>
    ) : (
      <><Clock className="h-3 w-3" /> Pend</>
    )}
  </Badge>
));
StatusCell.displayName = 'StatusCell';

/** Actions dropdown cell */
interface ActionsCellProps<T> {
  row: T;
  onView: (t: T) => void;
  onEdit: (t: T) => void;
  onReconcile: (t: T) => void;
  onDuplicate: (t: T) => void;
  onDelete: (t: T) => void;
  onViewAudit: (id: string) => void;
}

function ActionsCellInner<T extends TransactionRow>({
  row,
  onView,
  onEdit,
  onReconcile,
  onDuplicate,
  onDelete,
  onViewAudit
}: ActionsCellProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Ações da transação"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onView(row)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(row)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        {!row.reconciled && (
          <DropdownMenuItem
            onClick={() => onReconcile(row)}
            className="text-success focus:text-success"
          >
            <Check className="mr-2 h-4 w-4" />
            Marcar Conciliado
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onDuplicate(row)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(row)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onViewAudit(row.id)}>
          <FileText className="mr-2 h-4 w-4" />
          Ver Auditoria
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const ActionsCell = memo(ActionsCellInner) as typeof ActionsCellInner;

// ============================================
// Column Definitions Factory
// ============================================

export function useTransactionColumns<T extends TransactionRow>(
  props: TransactionColumnProps<T>
): ColumnDef<T>[] {
  const { formatCurrency, canEdit, onView, onEdit, onReconcile, onDuplicate, onDelete, onViewAudit } = props;

  return useMemo(() => {
    const columns: ColumnDef<T>[] = [
      {
        id: 'date',
        header: 'Data',
        width: 100,
        cell: (row) => <DateCell row={row} />,
      },
      {
        id: 'description',
        header: 'Descrição',
        minWidth: 180,
        cell: (row) => <DescriptionCell row={row} />,
      },
      {
        id: 'entity',
        header: 'Entidade',
        width: 150,
        hideOnMobile: true,
        cell: (row) => <EntityCell row={row} />,
      },
      {
        id: 'category',
        header: 'Plano de Contas',
        width: 150,
        hideOnMobile: true,
        cell: (row) => <CategoryCell row={row} />,
      },
      {
        id: 'bank',
        header: 'Banco',
        width: 120,
        hideOnMobile: true,
        cell: (row) => <BankCell row={row} />,
      },
      {
        id: 'amount',
        header: 'Valor',
        width: 130,
        align: 'right',
        cell: (row) => <AmountCell row={row} formatCurrency={formatCurrency} />,
      },
      {
        id: 'status',
        header: 'Status',
        width: 90,
        align: 'center',
        cell: (row) => <StatusCell row={row} />,
      },
    ];

    if (canEdit) {
      columns.push({
        id: 'actions',
        header: '',
        width: 50,
        align: 'right',
        cell: (row) => (
          <ActionsCell
            row={row}
            onView={onView}
            onEdit={onEdit}
            onReconcile={onReconcile}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onViewAudit={onViewAudit}
          />
        ),
      });
    }

    return columns;
  }, [formatCurrency, canEdit, onView, onEdit, onReconcile, onDuplicate, onDelete, onViewAudit]);
}

// ============================================
// Row className helper
// ============================================

export function getTransactionRowClassName<T extends TransactionRow>(row: T): string {
  return cn(
    'group',
    row.reconciled && 'opacity-60'
  );
}
