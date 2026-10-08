'use client';

import { Button } from "@/components/ui/button";
import { X, Check, Trash2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useContext } from "react";
import { SidebarContext } from "@/components/ui/sidebar";

interface SelectionSummaryBarProps {
  selectedCount: number;
  totalValue: number;
  totalPaid?: number;
  totalPending?: number;
  paidLabel?: string;
  pendingLabel?: string;
  formatCurrency: (value: number) => string;
  onClear: () => void;
  onBulkAction?: () => void;
  onBulkDelete?: () => void;
  onBulkPayment?: () => void;
  bulkActionLabel?: string;
  bulkActionIcon?: React.ComponentType<{ className?: string }>;
  isProcessing?: boolean;
  className?: string;
}

export function SelectionSummaryBar({
  selectedCount,
  totalValue,
  totalPaid,
  totalPending,
  paidLabel,
  pendingLabel,
  formatCurrency,
  onClear,
  onBulkAction,
  onBulkDelete,
  onBulkPayment,
  bulkActionLabel = "Ação em Lote",
  bulkActionIcon: BulkActionIcon,
  isProcessing = false,
  className,
}: SelectionSummaryBarProps) {
  // Safe consumption of SidebarContext (won't throw if not inside SidebarProvider)
  const sidebar = useContext(SidebarContext);
  const isMobile = sidebar?.isMobile ?? true;
  const isCollapsed = sidebar?.state === "collapsed";

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <div className={cn(
          "fixed bottom-6 right-0 z-50 flex justify-center pointer-events-none transition-[left] duration-300 ease-in-out px-4",
          isMobile
            ? "left-0"
            : isCollapsed
              ? "left-[3rem]"
              : "left-[16rem]"
        )}>
          <m.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "pointer-events-auto flex items-center gap-4 px-5 py-3 bg-card/95 backdrop-blur-lg border-2 border-primary/20 rounded-xl shadow-2xl max-w-full overflow-x-auto custom-scrollbar",
              className
            )}
          >
            {/* Selection count */}
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                {selectedCount}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
            </div>

            <div className="h-8 w-px bg-border/60" />

            {/* Values Display */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Total:</span>
                <span className="text-lg font-bold text-foreground tracking-tight">
                  {formatCurrency(totalValue)}
                </span>
              </div>

              {(totalPaid !== undefined || totalPending !== undefined) && (
                <div className="flex items-center gap-3 px-3.5 py-1.5 bg-background/60 shadow-inner rounded-lg border border-border/50">
                  {totalPaid !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{paidLabel ?? 'Pago'}:</span>
                      <span className="text-sm font-semibold text-emerald-500">
                        {formatCurrency(totalPaid)}
                      </span>
                    </div>
                  )}
                  {totalPaid !== undefined && totalPending !== undefined && (
                    <div className="h-4 w-px bg-border/80" />
                  )}
                  {totalPending !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{pendingLabel ?? 'Pendente'}:</span>
                      <span className="text-sm font-semibold text-amber-500">
                        {formatCurrency(totalPending)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-border/60" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Generic single bulk action */}
              {onBulkAction && !onBulkDelete && !onBulkPayment ? (
                <Button
                  size="sm"
                  onClick={onBulkAction}
                  disabled={isProcessing}
                  className="gap-2 shadow-sm font-medium"
                >
                  {BulkActionIcon && <BulkActionIcon className="h-4 w-4" />}
                  {bulkActionLabel}
                </Button>
              ) : null}

              {/* Specific Bulk Actions Dropdown */}
              {(onBulkDelete || onBulkPayment) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      disabled={isProcessing}
                      className="gap-2 shadow-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                      variant="outline"
                    >
                      {BulkActionIcon ? <BulkActionIcon className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      Ações em Lote
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 z-[100]">
                    {onBulkPayment && (
                      <DropdownMenuItem onClick={onBulkPayment} className="text-emerald-500 focus:text-emerald-500 font-medium">
                        <Check className="mr-2 h-4 w-4" />
                        Marcar como Pago
                      </DropdownMenuItem>
                    )}
                    {onBulkDelete && onBulkPayment && <DropdownMenuSeparator />}
                    {onBulkDelete && (
                      <DropdownMenuItem onClick={onBulkDelete} className="text-destructive focus:text-destructive font-medium">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={onClear}
                disabled={isProcessing}
                className="hover:bg-destructive/10 hover:text-destructive font-medium"
              >
                <X className="h-4 w-4 mr-1.5" />
                Limpar
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
