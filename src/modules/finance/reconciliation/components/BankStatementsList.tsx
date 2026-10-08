'use client';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Sparkles, Landmark, Wand2, Plus } from 'lucide-react';
import { TransactionRule } from "@/modules/finance/reconciliation/services/transactionRules";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { useCompany } from '@/contexts/CompanyContext';
import { CreateRuleDialog } from './CreateRuleDialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface BankStatement {
  id: string;
  fitid: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reconciled: boolean;
}

interface Match {
  transactionId: string;
  bankStatementId: string;
  confidence: 'exact' | 'high' | 'medium';
}

interface BankStatementsListProps {
  statements: BankStatement[];
  suggestedMatches: Match[];
  ruleMatches?: Map<string, TransactionRule>;
  searchQuery?: string;
}

export function BankStatementsList({
  statements,
  suggestedMatches,
  ruleMatches,
  searchQuery = '',
}: BankStatementsListProps) {
  const { currentCompany } = useCompany();
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState('');

  const format$ = (value: number) => formatCurrency(value);

  const handleCreateRule = (description: string) => {
    setSelectedKeyword(description);
    setCreateRuleOpen(true);
  };


  const filteredStatements = statements.filter(s =>
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMatch = (stmtId: string) => suggestedMatches.find(m => m.bankStatementId === stmtId);

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden bg-card">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#C5A059] via-[#E8D5A8] to-[#C5A059] rounded-t-xl">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-[#1a1a1a]/70" />
          <span className="text-sm font-bold text-[#1a1a1a]">Extrato Bancário</span>
        </div>
        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-[#1a1a1a]/10 text-[#1a1a1a] border-0">
          {filteredStatements.length} {filteredStatements.length === 1 ? 'item' : 'itens'}
        </Badge>
      </div>

      {/* Column Header */}
      <div className="grid grid-cols-[56px_1fr_110px] items-center gap-x-3 px-3 py-2 border-b bg-[#C5A059]/10">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Data</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Descrição</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Valor</span>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border/50">
          {filteredStatements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Nenhum extrato importado</p>
              <p className="text-sm mt-1">Importe um arquivo OFX</p>
            </div>
          ) : (
            filteredStatements.map(stmt => {
              const match = getMatch(stmt.id);
              const ruleMatch = ruleMatches?.get(stmt.id);
              const isCredit = stmt.type === 'credit';
              return (
                <div
                  key={stmt.id}
                  className={cn(
                    "grid grid-cols-[56px_1fr_110px] items-center gap-x-3 px-3 py-2.5 transition-colors hover:bg-muted/30 group",
                    stmt.reconciled && "bg-emerald-500/5 opacity-60",
                    match && !stmt.reconciled && "bg-amber-500/5",
                    ruleMatch && !match && !stmt.reconciled && "bg-blue-500/5"
                  )}
                >
                  {/* Col 1: Date */}
                  <span className="text-xs text-muted-foreground font-mono tabular-nums">
                    {format(new Date(stmt.transaction_date), 'dd/MM', { locale: ptBR })}
                  </span>

                  {/* Col 2: Description — horizontal scroll for long text */}
                  <div className="min-w-0">
                    <div className="overflow-x-auto pb-0.5 flex items-center">
                      <p className="text-sm font-medium whitespace-nowrap">{stmt.description}</p>
                      {!stmt.reconciled && !ruleMatch && !match && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCreateRule(stmt.description)}
                          title="Criar regra de categorização"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {(stmt.reconciled || match || ruleMatch) && (
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {stmt.reconciled && (
                          <Badge variant="success" className="text-[10px] gap-1 px-1.5 py-0">
                            <Check className="h-2.5 w-2.5" /> Conciliado
                          </Badge>
                        )}
                        {match && !stmt.reconciled && (
                          <Badge variant="warning" className="text-[10px] gap-1 px-1.5 py-0">
                            <Sparkles className="h-2.5 w-2.5" /> Match
                          </Badge>
                        )}
                        {ruleMatch && !stmt.reconciled && (
                          <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 border-blue-500/30 bg-blue-500/10 text-blue-600">
                            <Wand2 className="h-2.5 w-2.5" />
                            Regra: {ruleMatch.keyword}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Col 3: Value */}
                  <div className={cn(
                    "text-right font-mono tabular-nums text-sm font-semibold whitespace-nowrap",
                    isCredit ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {isCredit ? '+' : '-'}{format$(stmt.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <CreateRuleDialog
        open={createRuleOpen}
        onOpenChange={setCreateRuleOpen}
        defaultKeyword={selectedKeyword}
        companyId={currentCompany?.id || ''}
      />
    </div >
  );
}
