'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Sparkles, LayoutList } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
  reconciled: boolean;
  reconciled_at: string | null;
}

interface Match {
  transactionId: string;
  bankStatementId: string;
  confidence: 'exact' | 'high' | 'medium';
}

interface SystemTransactionsListProps {
  transactions: Transaction[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  suggestedMatches: Match[];
  onReconcilePair: (txId: string, bankId: string) => void;
  onUnreconcile: (txId: string) => void;
  searchQuery?: string;
}

export function SystemTransactionsList({
  transactions,
  selectedIds,
  onSelectionChange,
  suggestedMatches,
  onReconcilePair,
  onUnreconcile,
  searchQuery = '',
}: SystemTransactionsListProps) {
  const format$ = (value: number) => formatCurrency(value);

  const filteredTransactions = transactions.filter(tx =>
    tx.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    const unreconciled = filteredTransactions.filter(t => !t.reconciled);
    if (selectedIds.length === unreconciled.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(unreconciled.map(t => t.id));
    }
  };

  const getMatch = (txId: string) => suggestedMatches.find(m => m.transactionId === txId);

  const unreconciledCount = filteredTransactions.filter(t => !t.reconciled).length;

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden bg-card">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#C5A059] via-[#E8D5A8] to-[#C5A059] rounded-t-xl">
        <div className="flex items-center gap-2">
          <LayoutList className="h-4 w-4 text-[#1a1a1a]/70" />
          <span className="text-sm font-bold text-[#1a1a1a]">Transações do Sistema</span>
        </div>
        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-[#1a1a1a]/10 text-[#1a1a1a] border-0">
          {filteredTransactions.length} {filteredTransactions.length === 1 ? 'item' : 'itens'}
        </Badge>
      </div>

      {/* Column Header */}
      <div className="grid grid-cols-[32px_56px_1fr_110px] items-center gap-x-3 px-3 py-2 border-b bg-[#C5A059]/10">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={selectedIds.length === unreconciledCount && unreconciledCount > 0}
            onCheckedChange={toggleAll}
            disabled={unreconciledCount === 0}
            className="border-muted-foreground/40"
          />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Data</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Descrição</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Valor</span>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border/50">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          ) : (
            filteredTransactions.map(tx => {
              const match = getMatch(tx.id);
              const isEntrada = tx.type === 'entrada';
              return (
                <div
                  key={tx.id}
                  className={cn(
                    "grid grid-cols-[32px_56px_1fr_110px] items-center gap-x-3 px-3 py-2.5 transition-colors hover:bg-muted/30",
                    tx.reconciled && "bg-emerald-500/5 opacity-60",
                    match && !tx.reconciled && "bg-amber-500/5",
                    selectedIds.includes(tx.id) && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  {/* Col 1: Checkbox */}
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={selectedIds.includes(tx.id)}
                      onCheckedChange={() => toggleSelection(tx.id)}
                      disabled={tx.reconciled}
                    />
                  </div>

                  {/* Col 2: Date */}
                  <span className="text-xs text-muted-foreground font-mono tabular-nums text-center">
                    {format(new Date(tx.transaction_date), 'dd/MM', { locale: ptBR })}
                  </span>

                  {/* Col 3: Description — horizontal scroll for long text */}
                  <div className="min-w-0">
                    <div className="overflow-x-auto pb-0.5">
                      <p className="text-sm font-medium whitespace-nowrap">{tx.description}</p>
                    </div>
                    {(tx.reconciled || match) && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {tx.reconciled && (
                          <Badge variant="success" className="text-[10px] gap-1 px-1.5 py-0">
                            <Check className="h-2.5 w-2.5" /> Conciliado
                          </Badge>
                        )}
                        {match && !tx.reconciled && (
                          <Badge variant="warning" className="text-[10px] gap-1 px-1.5 py-0">
                            <Sparkles className="h-2.5 w-2.5" /> Match
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Col 4: Value */}
                  <div className={cn(
                    "text-left font-mono tabular-nums text-sm font-semibold whitespace-nowrap",
                    isEntrada ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {isEntrada ? '+' : '-'}{format$(tx.amount)}
                  </div>

                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
