'use client';

import type { JSX } from 'react';
import { memo, useRef, useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Plus, Receipt, MoreHorizontal, Pencil, Trash2, Wallet, Eye, Copy, Check, FileText } from "lucide-react";
import type { PayableStatus, ReceivableStatus } from "@/types";
import { getOverdueDays, type AccountType } from "../../types";
import { cn } from "@/lib/utils";

// Generic account interface for the table
export interface TableAccount {
  id: string;
  description: string;
  document_number: string | null;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: PayableStatus | ReceivableStatus;
  chart_account?: { code: string; name: string } | null;
  supplier?: { name: string } | null;
  customer?: { name: string } | null;
  is_debt_payment?: boolean | null;
  category?: { name: string } | null;
}

interface AccountsTableProps<T extends TableAccount> {
  accounts: T[];
  accountType: AccountType;
  entityLabel: string;
  paymentActionLabel: string;
  canEdit: boolean;
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onPayment: (account: T) => void;
  onEdit: (account: T) => void;
  onDelete: (account: T) => void;
  onDuplicate?: (account: T) => void;
  onNew: () => void;
  formatCurrency: (value: number) => string;
  onBulkDelete?: () => void;
  onBulkPayment?: () => void;
}

// Default column widths in pixels
const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  checkbox: 40,
  date: 110,
  entity: 160,
  desc: 220,
  category: 150,
  value: 110,
  paid: 110,
  remaining: 110,
  status: 110,
  actions: 80,
};

// Virtual Row Component
const VirtualRow = memo(<T extends TableAccount>({
  account,
  accountType,
  canEdit,
  isSelected,
  onToggleSelection,
  onPayment,
  onEdit,
  onDelete,
  onDuplicate,
  formatCurrency,
  paymentActionLabel,
  style,
  columnWidths,
}: {
  account: T;
  accountType: AccountType;
  canEdit: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onPayment: (account: T) => void;
  onEdit: (account: T) => void;
  onDelete: (account: T) => void;
  onDuplicate?: (account: T) => void;
  formatCurrency: (value: number) => string;
  paymentActionLabel: string;
  style: React.CSSProperties;
  columnWidths: Record<string, number>;
}) => {
  const overdueDays = getOverdueDays(account.due_date, account.status);
  const effPaidAmount = account.status === 'pago'
    ? Math.max(Number(account.paid_amount || 0), Number(account.total_amount || 0))
    : Number(account.paid_amount || 0);
  const remaining = account.status === 'pago' ? 0 : Number(account.total_amount || 0) - effPaidAmount;
  const entityName = accountType === 'payable'
    ? account.supplier?.name
    : account.customer?.name;

  return (
    <div
      style={style}
      className={cn(
        "flex items-center py-3 px-4 border-b border-border/30 hover:bg-muted/5 transition-colors absolute top-0 left-0 group",
        isSelected && "bg-muted/10"
      )}
    >
      {canEdit && (
        <div style={{ width: columnWidths.checkbox, flexShrink: 0 }} className="flex items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(account.id)}
            className="h-3 w-3"
          />
        </div>
      )}

      <div style={{ width: columnWidths.date, flexShrink: 0 }} className="text-center truncate px-2">
        <div className="flex flex-col items-center">
          <span className="font-medium text-sm truncate w-full">
            {format(new Date(account.due_date), 'dd/MM/yyyy')}
          </span>
          {overdueDays > 0 && (
            <span className="text-[10px] text-red-500 font-medium truncate w-full">
              +{overdueDays} dias
            </span>
          )}
        </div>
      </div>

      <div style={{ width: columnWidths.entity, flexShrink: 0 }} className="truncate px-2">
        {entityName ? (
          <div className="flex flex-row items-center gap-1.5 min-w-0 max-w-full flex-wrap">
            <span className="font-medium text-sm text-foreground/90 truncate" title={entityName}>
              {entityName}
            </span>
            {accountType === 'payable' && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 w-fit font-normal border",
                  account.is_debt_payment
                    ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                )}
              >
                {account.is_debt_payment ? 'Credor' : 'Fornecedor'}
              </Badge>
            )}
            {accountType === 'receivable' && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 w-fit font-normal border bg-sky-500/15 text-sky-400 border-sky-500/30"
              >
                Cliente
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>

      <div style={{ width: columnWidths.desc, flexShrink: 0 }} className="truncate px-2">
        <div className="text-sm truncate w-full">{account.description}</div>
      </div>

      <div style={{ width: columnWidths.category, flexShrink: 0 }} className="truncate px-2">
        {account.category ? (
          <span className="text-xs text-muted-foreground truncate w-full block" title={account.category.name}>
            {account.category.name}
          </span>
        ) : account.chart_account ? (
          <span className="text-xs text-muted-foreground truncate w-full block" title={`${account.chart_account.code} - ${account.chart_account.name}`}>
            {account.chart_account.name}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      <div style={{ width: columnWidths.value, flexShrink: 0 }} className="text-center truncate px-2">
        <span className="text-sm font-medium truncate w-full block">{formatCurrency(account.total_amount)}</span>
      </div>

      <div style={{ width: columnWidths.paid, flexShrink: 0 }} className="text-center truncate px-2">
        <span className="text-sm text-emerald-500/80 truncate w-full block">{formatCurrency(effPaidAmount)}</span>
      </div>

      <div style={{ width: columnWidths.remaining, flexShrink: 0 }} className="text-center font-medium truncate px-2">
        <span className="text-sm truncate w-full block">{formatCurrency(remaining)}</span>
      </div>

      <div style={{ width: columnWidths.status, flexShrink: 0 }} className="flex justify-center">
        <StatusBadge status={account.status} />
      </div>

      <div style={{ width: columnWidths.actions, flexShrink: 0 }} className="flex justify-center items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground opacity-50 group-hover:opacity-100 transition-colors hover:bg-[#C5A059]/15 hover:text-foreground data-[state=open]:opacity-100 data-[state=open]:bg-[#C5A059]/15"
              aria-label="Ações"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent align="end" className="w-48 z-50">
              <DropdownMenuItem onClick={() => onEdit(account)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </DropdownMenuItem>

              {(account.status === 'pendente' || account.status === 'parcial') && canEdit && (
                <DropdownMenuItem onClick={() => onPayment(account)}>
                  <Wallet className="mr-2 h-4 w-4" />
                  {paymentActionLabel}
                </DropdownMenuItem>
              )}

              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(account)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}

              {(account.status === 'pendente' || account.status === 'parcial') && canEdit && (
                <DropdownMenuItem
                  onClick={() => onPayment(account)}
                  className="text-emerald-500 focus:text-emerald-500"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Marcar como Pago
                </DropdownMenuItem>
              )}

              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(account)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {canEdit && (
                <DropdownMenuItem
                  onClick={() => onDelete(account)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => onEdit(account)}>
                <FileText className="mr-2 h-4 w-4" />
                Ver Auditoria
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>

      {/* Spacer to absorb remaining width if any */}
      <div className="flex-1" />
    </div>
  );
});

VirtualRow.displayName = 'VirtualRow';

// Resizable Header Column
const ResizableHeaderCol = memo(({
  label,
  width,
  colKey,
  onStartResize,
  align,
}: {
  label: string;
  width: number;
  colKey: string;
  onStartResize: (e: React.MouseEvent, key: string) => void;
  align?: 'left' | 'right' | 'center';
}) => (
  <div
    style={{ width, flexShrink: 0 }}
    className={cn(
      "text-[#1a1a1a] font-bold text-[12px] tracking-wider uppercase whitespace-nowrap relative group/col text-center"
    )}
  >
    <div className="w-full truncate px-2">
      {label}
    </div>
    <div
      onMouseDown={(e) => onStartResize(e, colKey)}
      className="absolute right-0 top-0 bottom-0 w-3 translate-x-1.5 cursor-col-resize flex flex-col items-center justify-center z-10"
    >
      <div className="w-px h-full bg-emerald-600/60" />
    </div>
  </div>
));

ResizableHeaderCol.displayName = 'ResizableHeaderCol';

// Empty state
const EmptyState = memo(({ canEdit, onNew }: { canEdit: boolean; onNew: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
    <Receipt className="h-10 w-10 opacity-50" />
    <p>Nenhuma conta encontrada</p>
    {canEdit && (
      <Button variant="outline" size="sm" onClick={onNew}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar
      </Button>
    )}
  </div>
));

EmptyState.displayName = 'EmptyState';

export const AccountsTable = memo(<T extends TableAccount>({
  accounts,
  accountType,
  entityLabel,
  paymentActionLabel,
  canEdit,
  selectedIds,
  onToggleSelection,
  onToggleSelectAll,
  onPayment,
  onEdit,
  onDelete,
  onDuplicate,
  onNew,
  formatCurrency,
  onBulkDelete,
  onBulkPayment,
}: AccountsTableProps<T>) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const isAllSelected = useMemo(
    () => selectedIds.length === accounts.length && accounts.length > 0,
    [selectedIds.length, accounts.length]
  );

  // Column Resizing State (Persisted)
  const [columnWidths, setColumnWidths] = useLocalStorage<Record<string, number>>(
    'numa_payables_column_widths',
    { ...DEFAULT_COLUMN_WIDTHS }
  );
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const startResize = useCallback((e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(colKey);
    setStartX(e.clientX);
    setStartWidth(columnWidths[colKey]);
  }, [columnWidths]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingCol) return;
      const diffX = e.clientX - startX;
      const minWidth = 50;
      const newWidth = Math.max(minWidth, startWidth + diffX);
      setColumnWidths(prev => ({ ...prev, [resizingCol]: newWidth }));
    };

    const handleMouseUp = () => {
      if (resizingCol) setResizingCol(null);
    };

    if (resizingCol) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizingCol, startX, startWidth]);

  // Total table width
  const totalTableWidth = useMemo(() => {
    return Object.values(columnWidths).reduce((sum, w) => sum + w, 0);
  }, [columnWidths]);

  // Virtualizer attached to the main scroll container
  const rowVirtualizer = useVirtualizer({
    count: accounts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 3,
  });

  const handleSelectAll = useCallback(() => {
    onToggleSelectAll();
  }, [onToggleSelectAll]);

  // Column definitions for header
  const headerColumns = useMemo(() => [
    { key: 'date', label: 'Vencimento' },
    { key: 'entity', label: entityLabel },
    { key: 'desc', label: 'Descrição' },
    { key: 'category', label: 'Categoria' },
    { key: 'value', label: 'Valor', align: 'center' as const },
    { key: 'paid', label: 'Pago', align: 'center' as const },
    { key: 'remaining', label: 'Saldo', align: 'center' as const },
    { key: 'status', label: 'Status', align: 'center' as const },
  ], [entityLabel]);

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-background dark:border-emerald-900/40">
        {/* Header bar */}
        <div
          className="dark flex items-center justify-between px-5 py-3.5 border-b border-emerald-800/30"
          style={{
            background: 'linear-gradient(135deg, #0a1a12 0%, #0d2818 15%, #0a1f14 35%, #071710 55%, #0c2517 75%, #0a1a12 100%)',
            boxShadow: '0 0 40px -10px rgba(16, 185, 129, 0.08), inset 0 1px 0 0 rgba(255,255,255,0.03)',
          }}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium text-emerald-100/90">
              Contas a Pagar
            </h3>
            <Badge
              variant="outline"
              className="font-normal text-xs border-emerald-700/40 text-emerald-300/80 bg-emerald-900/20"
            >
              0 registros
            </Badge>
          </div>
        </div>

        {/* Static header for empty state */}
        <div
          className="flex items-center px-4 py-3 bg-gradient-to-r from-[#C5A059] via-[#E8D5A8] to-[#C5A059] rounded-t-xl border-b border-white/10"
          style={{ width: '100%', minWidth: totalTableWidth }}
        >
          {canEdit && (
            <div style={{ width: columnWidths.checkbox, flexShrink: 0 }} className="flex items-center justify-center">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className="h-3 w-3 border-black/20 data-[state=checked]:bg-black data-[state=checked]:text-white"
              />
            </div>
          )}
          {headerColumns.map(col => (
            <ResizableHeaderCol
              key={col.key}
              label={col.label}
              width={columnWidths[col.key]}
              colKey={col.key}
              onStartResize={startResize}
              align={col.align}
            />
          ))}
          <div style={{ width: columnWidths.actions, flexShrink: 0 }} />
          <div className="flex-1" />
        </div>
        <EmptyState canEdit={canEdit} onNew={onNew} />
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="rounded-xl border border-border/50 shadow-sm overflow-hidden min-h-[480px] bg-background dark:border-emerald-900/40"
    >
      {/* Header bar */}
      <div
        className="dark flex items-center justify-between px-5 py-3.5 border-b border-emerald-800/30"
        style={{
          background: 'linear-gradient(135deg, #0a1a12 0%, #0d2818 15%, #0a1f14 35%, #071710 55%, #0c2517 75%, #0a1a12 100%)',
          boxShadow: '0 0 40px -10px rgba(16, 185, 129, 0.08), inset 0 1px 0 0 rgba(255,255,255,0.03)',
        }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium text-emerald-100/90">
            Contas a Pagar
          </h3>
          <Badge
            variant="outline"
            className="font-normal text-xs border-emerald-700/40 text-emerald-300/80 bg-emerald-900/20"
          >
            {accounts.length} {accounts.length === 1 ? 'registro' : 'registros'}
          </Badge>
        </div>
        {selectedIds.length > 0 && (
          <span className="text-sm text-emerald-400/70">
            {selectedIds.length} selecionado(s)
          </span>
        )}
      </div>

      <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-emerald-800/50 scrollbar-track-transparent">
        <div style={{ minWidth: "100%", width: "max-content" }}>
          {/* Resizable Header */}
          <div
            className="flex items-center px-4 py-3 bg-gradient-to-r from-[#C5A059] via-[#E8D5A8] to-[#C5A059] rounded-t-xl border-b border-white/10"
            style={{ width: '100%', minWidth: totalTableWidth }}
          >
            {canEdit && (
              <div style={{ width: columnWidths.checkbox, flexShrink: 0 }} className="flex items-center justify-center">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="h-3 w-3 border-black/20 data-[state=checked]:bg-black data-[state=checked]:text-white"
                />
              </div>
            )}
            {headerColumns.map(col => (
              <ResizableHeaderCol
                key={col.key}
                label={col.label}
                width={columnWidths[col.key]}
                colKey={col.key}
                onStartResize={startResize}
                align={col.align}
              />
            ))}
            <div style={{ width: columnWidths.actions, flexShrink: 0 }} />
            <div className="flex-1" />
          </div>

          {/* Virtual List Container */}
          <div
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const account = accounts[virtualRow.index];
              return (
                <VirtualRow
                  key={account.id}
                  account={account}
                  accountType={accountType}
                  canEdit={canEdit}
                  isSelected={selectedIds.includes(account.id)}
                  onToggleSelection={onToggleSelection}
                  onPayment={onPayment}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  formatCurrency={formatCurrency}
                  paymentActionLabel={paymentActionLabel}
                  columnWidths={columnWidths}
                  style={{
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    height: `${virtualRow.size}px`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}) as <T extends TableAccount>(props: AccountsTableProps<T>) => JSX.Element;
