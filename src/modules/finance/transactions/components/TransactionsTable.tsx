'use client';

/**
 * TransactionsTable Component
 * 
 * Componente de tabela otimizado para transações.
 * Usa @tanstack/react-virtual para virtualização — apenas linhas visíveis no DOM.
 * Usa TransactionRow memoizado para evitar re-renders.
 */

import { memo, useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet } from 'lucide-react';
import { TransactionRow } from './TransactionRow';
import { TransactionsPagination } from './TransactionsPagination';
import type { Transaction } from '../hooks/useTransactionsData';
import { useState, useEffect } from 'react';

interface TransactionsTableProps {
  transactions: Transaction[];
  totalFiltered: number;
  isLoading: boolean;
  hasActiveFilters: boolean;
  canEdit: boolean;

  // Selection
  selectedIds: string[];
  isAllSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;

  // Actions
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onReconcile: (transaction: Transaction) => void;
  onDuplicate: (transaction: Transaction) => void;
  onConvert?: (transaction: Transaction) => void;
  onViewAudit: (transactionId: string) => void;

  // Formatting
  formatCurrency: (value: number) => string;

  // Pagination
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

// Estimated row height for virtualizer (matches actual rendered row height)
const ESTIMATED_ROW_HEIGHT = 56;

// Skeleton loader component
const TableSkeleton = memo(function TableSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-48 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
});

// Empty state component — fills container with diamond gradient
const EmptyState = memo(function EmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Wallet className="h-14 w-14 text-emerald-500/40 mb-4" />
      <p className="text-lg font-medium text-emerald-100/70">Nenhuma movimentação encontrada</p>
      <p className="text-sm text-emerald-100/40 mt-1">
        {hasActiveFilters
          ? 'Tente ajustar os filtros de busca'
          : 'Adicione uma nova entrada ou saída'
        }
      </p>
    </div>
  );
});

export const TransactionsTable = memo(function TransactionsTable({
  transactions,
  totalFiltered,
  isLoading,
  hasActiveFilters,
  canEdit,
  selectedIds,
  isAllSelected,
  onSelectAll,
  onSelectOne,
  onView,
  onEdit,
  onDelete,
  onReconcile,
  onDuplicate,
  onConvert,
  onViewAudit,
  formatCurrency,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
}: TransactionsTableProps) {

  // O(1) lookup instead of O(n) per row with .includes()
  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Column Resizing State (Persisted)
  const [columnWidths, setColumnWidths] = useLocalStorage<Record<string, number>>(
    'numa_transactions_column_widths',
    {
      checkbox: 64,
      date: 90,
      emissao: 90,
      descricao: 180,
      entidade: 140,
      categoria: 130,
      plano: 160,
      banco: 110,
      doc: 100,
      obs: 150,
      valor: 120,
      saldo: 120,
      status: 110,
      actions: 80,
    });

  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const startResize = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(colKey);
    setStartX(e.clientX);
    setStartWidth(columnWidths[colKey]);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingCol) return;

      const diffX = e.clientX - startX;
      // Enforce per-column minimum widths
      const minWidths: Record<string, number> = {
        checkbox: 48, date: 80, emissao: 80, descricao: 120,
        entidade: 100, categoria: 90, plano: 120, banco: 80,
        doc: 70, obs: 80, valor: 90, saldo: 90, status: 90, actions: 60,
      };
      const minWidth = minWidths[resizingCol] ?? 60;
      const newWidth = Math.max(minWidth, startWidth + diffX);

      setColumnWidths(prev => ({
        ...prev,
        [resizingCol]: newWidth
      }));
    };

    const handleMouseUp = () => {
      if (resizingCol) {
        setResizingCol(null);
      }
    };

    if (resizingCol) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [resizingCol, startX, startWidth]);

  // Memoized handlers for each row
  const handleSelectAll = useCallback((checked: boolean | 'indeterminate') => {
    onSelectAll(checked === true);
  }, [onSelectAll]);

  // Total table width ensures dragging exactly matches mouse movement without the table auto-scaling.
  const totalTableWidth = useMemo(() => {
    return Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
  }, [columnWidths]);

  // Ref for the table container
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Virtualizer — renders only visible rows
  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => document.getElementById("main-scroll-container"),
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 8,
  });

  return (
    <div className="rounded-xl border border-border/50 shadow-sm overflow-hidden min-h-[480px] bg-background dark:border-emerald-900/40">
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
            Movimentações
          </h3>
          <Badge
            variant="outline"
            className="font-normal text-xs border-emerald-700/40 text-emerald-300/80 bg-emerald-900/20"
          >
            {totalFiltered} {totalFiltered === 1 ? 'registro' : 'registros'}
          </Badge>
        </div>
        {selectedIds.length > 0 && (
          <span className="text-sm text-emerald-400/70">
            {selectedIds.length} selecionado(s)
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton />
      ) : transactions.length === 0 ? (
        <EmptyState hasActiveFilters={hasActiveFilters} />
      ) : (
        <>
          {/* Scrollable table container */}
          <div
            className="overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-800/50 scrollbar-track-transparent"
            ref={tableContainerRef}
          >
            <Table style={{ width: totalTableWidth, minWidth: totalTableWidth }} className="table-fixed [&_th]:overflow-hidden [&_th]:text-ellipsis [&_td]:overflow-hidden [&_td]:text-ellipsis">
              <colgroup>
                <col style={{ width: columnWidths.checkbox }} />
                <col style={{ width: columnWidths.date }} />
                <col style={{ width: columnWidths.emissao }} />
                <col style={{ width: columnWidths.descricao }} />
                <col style={{ width: columnWidths.entidade }} />
                <col style={{ width: columnWidths.categoria }} />
                <col style={{ width: columnWidths.plano }} />
                <col style={{ width: columnWidths.banco }} />
                <col style={{ width: columnWidths.doc }} />
                <col style={{ width: columnWidths.obs }} />
                <col style={{ width: columnWidths.valor }} />
                <col style={{ width: columnWidths.saldo }} />
                <col style={{ width: columnWidths.status }} />
                {canEdit && <col style={{ width: columnWidths.actions }} />}
              </colgroup>
              <TableHeader
                className="sticky top-0 z-10 bg-gradient-to-r from-[#C5A059] via-[#E8D5A8] to-[#C5A059]"
              >
                <TableRow className="!bg-transparent border-b border-white/10">
                  <TableHead className="!pl-6 !pr-3 !py-3.5 !bg-transparent !text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider relative group !overflow-visible">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        className="h-3 w-3 border-black/20 data-[state=checked]:bg-black data-[state=checked]:text-white"
                      />
                    </div>
                  </TableHead>

                  {/* Resizable Headers */}
                  {[
                    { key: 'date', label: 'Vencimento', minW: 90 },
                    { key: 'emissao', label: 'Emissão', minW: 90 },
                    { key: 'descricao', label: 'Descrição', minW: 180 },
                    { key: 'entidade', label: 'Entidade', minW: 140 },
                    { key: 'categoria', label: 'Categoria', minW: 130 },
                    { key: 'plano', label: 'Plano de Contas', minW: 160 },
                    { key: 'banco', label: 'Banco', minW: 110 },
                    { key: 'doc', label: 'Número Doc.', minW: 100 },
                    { key: 'obs', label: 'Observações', minW: 150 },
                  ].map((col) => (
                    <TableHead
                      key={col.key}
                      className="!bg-transparent !text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap relative group text-center"
                    >
                      <div className="w-full truncate px-2">
                        {col.label}
                      </div>
                      <div
                        onMouseDown={(e) => startResize(e, col.key)}
                        className="absolute right-0 top-0 bottom-0 w-3 translate-x-1.5 cursor-col-resize flex flex-col items-center justify-center z-10"
                      >
                        <div className="w-px h-3/5 bg-emerald-600/60" />
                      </div>
                    </TableHead>
                  ))}

                  <TableHead className="text-center !bg-transparent !text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap relative group">
                    <div className="w-full truncate px-2">
                      Valor
                    </div>
                    <div onMouseDown={(e) => startResize(e, 'valor')} className="absolute right-0 top-0 bottom-0 w-3 translate-x-1.5 cursor-col-resize flex flex-col items-center justify-center z-10">
                      <div className="w-px h-3/5 bg-emerald-600/60" />
                    </div>
                  </TableHead>
                  <TableHead className="text-center !bg-transparent !text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap relative group">
                    <div className="w-full truncate px-2">
                      Saldo
                    </div>
                    <div onMouseDown={(e) => startResize(e, 'saldo')} className="absolute right-0 top-0 bottom-0 w-3 translate-x-1.5 cursor-col-resize flex flex-col items-center justify-center z-10">
                      <div className="w-px h-3/5 bg-emerald-600/60" />
                    </div>
                  </TableHead>
                  <TableHead className="text-center !bg-transparent !text-[#1a1a1a] !font-bold !text-[12px] !tracking-wider uppercase whitespace-nowrap relative group">
                    <div className="w-full truncate px-2">
                      Status
                    </div>
                    <div onMouseDown={(e) => startResize(e, 'status')} className="absolute right-0 top-0 bottom-0 w-3 translate-x-1.5 cursor-col-resize flex flex-col items-center justify-center z-10">
                      <div className="w-px h-3/5 bg-emerald-600/60" />
                    </div>
                  </TableHead>
                  {canEdit && (
                    <TableHead className="!bg-transparent !text-[#1a1a1a] text-right !pr-4"></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <TableRow style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start || 0}px` }} className="hover:bg-transparent border-0" />
                )}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const transaction = transactions[virtualRow.index];
                  return (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      isSelected={selectedIdsSet.has(transaction.id)}
                      canEdit={canEdit}
                      formatCurrency={formatCurrency}
                      onSelect={onSelectOne}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onReconcile={onReconcile}
                      onDuplicate={onDuplicate}
                      onConvert={onConvert}
                      onViewAudit={onViewAudit}
                      columnWidths={columnWidths}
                    />
                  );
                })}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <TableRow
                    style={{
                      height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end || 0)}px`
                    }}
                    className="hover:bg-transparent border-0"
                  />
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="border-t border-emerald-800/30">
              <TransactionsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalFiltered}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default TransactionsTable;
