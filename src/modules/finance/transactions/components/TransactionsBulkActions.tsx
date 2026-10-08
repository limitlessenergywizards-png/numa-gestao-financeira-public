'use client';

import { createPortal } from "react-dom";
import { useContext } from "react";
import { SidebarContext } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Check, Trash2, X, TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TransactionsBulkActionsProps {
  selectedCount: number;
  selectedEntradas?: number;
  selectedSaidas?: number;
  selectedSaldo?: number;
  formatCurrency?: (value: number) => string;
  onReconcile: () => void;
  onDelete: () => void;
  onClear: () => void;
  isProcessing?: boolean;
}

export function TransactionsBulkActions({
  selectedCount,
  selectedEntradas = 0,
  selectedSaidas = 0,
  selectedSaldo = 0,
  formatCurrency = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  onReconcile,
  onDelete,
  onClear,
  isProcessing = false,
}: TransactionsBulkActionsProps) {
  const showTotals = selectedEntradas > 0 || selectedSaidas > 0;

  // Safe consumption of SidebarContext (won't throw if not inside SidebarProvider)
  const sidebar = useContext(SidebarContext);
  const isMobile = sidebar?.isMobile ?? true;
  const isCollapsed = sidebar?.state === "collapsed";

  return createPortal(
    <AnimatePresence>
      {selectedCount > 0 && (
        <div className={cn(
          "fixed bottom-6 right-0 z-50 flex justify-center pointer-events-none transition-opacity duration-300 ease-in-out px-4",
          isMobile
            ? "left-0"
            : isCollapsed
              ? "left-[3rem]"
              : "left-[16rem]"
        )}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="pointer-events-auto flex items-center gap-4 px-5 py-3 bg-card/95 backdrop-blur-lg border-2 border-primary/20 rounded-xl shadow-2xl max-w-full overflow-x-auto custom-scrollbar"
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

            {showTotals && (
              <>
                <div className="h-8 w-px bg-border/60" />

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 px-3.5 py-1.5 bg-background/60 shadow-inner rounded-lg border border-border/50">
                    {selectedEntradas > 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-success" />
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Entradas:</span>
                        <span className="text-sm font-semibold text-success">
                          {formatCurrency(selectedEntradas)}
                        </span>
                      </div>
                    )}

                    {selectedEntradas > 0 && selectedSaidas > 0 && (
                      <div className="h-4 w-px bg-border/80" />
                    )}

                    {selectedSaidas > 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Saídas:</span>
                        <span className="text-sm font-semibold text-destructive">
                          {formatCurrency(selectedSaidas)}
                        </span>
                      </div>
                    )}

                    {(selectedEntradas > 0 || selectedSaidas > 0) && (
                      <>
                        <div className="h-4 w-px bg-border/80" />
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Saldo:</span>
                          <span className={cn(
                            "text-sm font-semibold",
                            selectedSaldo >= 0 ? "text-success" : "text-destructive"
                          )}>
                            {formatCurrency(selectedSaldo)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="h-8 w-px bg-border/60" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-1.5 shadow-sm font-medium bg-success/10 text-success hover:bg-success/20 border-0"
                onClick={onReconcile}
                disabled={isProcessing}
              >
                <Check className="h-4 w-4" />
                Conciliar
              </Button>

              <Button
                size="sm"
                className="gap-1.5 shadow-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
                onClick={onDelete}
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="hover:bg-destructive/10 hover:text-destructive font-medium"
                onClick={onClear}
                disabled={isProcessing}
              >
                <X className="h-4 w-4 mr-1.5" />
                Limpar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
