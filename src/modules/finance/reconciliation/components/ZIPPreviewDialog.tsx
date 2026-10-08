'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileArchive, 
  Mail, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Calendar,
  Loader2,
  Building2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { ZipParseResult, ParsedEmailTransaction } from '@/lib/zipEmailParser';
import { useFormatters } from '@/hooks/useFormatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ZIPPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parseResult: ZipParseResult | null;
  onConfirm: () => void;
  isImporting: boolean;
  filename?: string;
}

export function ZIPPreviewDialog({
  open,
  onOpenChange,
  parseResult,
  onConfirm,
  isImporting,
  filename,
}: ZIPPreviewDialogProps) {
  const { formatCurrency } = useFormatters();

  if (!parseResult) return null;

  const totalCredits = parseResult.allTransactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = parseResult.allTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const uniqueBanks = [...new Set(parseResult.statements.map(s => s.bankName))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5 text-purple-500" />
            Prévia do Arquivo ZIP
          </DialogTitle>
          <DialogDescription>
            {filename && (
              <span className="font-medium">{filename}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Mail className="h-4 w-4" />
                  Emails
                </div>
                <p className="text-xl font-bold">{parseResult.emailCount}</p>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Building2 className="h-4 w-4" />
                  Bancos
                </div>
                <p className="text-xl font-bold">{uniqueBanks.length}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {uniqueBanks.join(', ')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Entradas
                </div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalCredits)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-red-500/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-1">
                  <TrendingDown className="h-4 w-4" />
                  Saídas
                </div>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalDebits)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transactions List */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Transações Encontradas ({parseResult.allTransactions.length})</span>
                {parseResult.errors.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {parseResult.errors.length} erros
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="divide-y">
                  {parseResult.allTransactions.slice(0, 50).map((tx, idx) => (
                    <TransactionRow key={idx} transaction={tx} formatCurrency={formatCurrency} />
                  ))}
                  {parseResult.allTransactions.length > 50 && (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      ... e mais {parseResult.allTransactions.length - 50} transações
                    </div>
                  )}
                  {parseResult.allTransactions.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma transação encontrada nos emails</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Errors */}
          {parseResult.errors.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <p className="font-medium mb-1">Avisos:</p>
              <ul className="list-disc list-inside space-y-1">
                {parseResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isImporting || parseResult.allTransactions.length === 0}
            className="gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                Importar {parseResult.allTransactions.length} Transações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TransactionRowProps {
  transaction: ParsedEmailTransaction;
  formatCurrency: (value: number) => string;
}

function TransactionRow({ transaction, formatCurrency }: TransactionRowProps) {
  const isCredit = transaction.type === 'credit';
  
  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "p-2 rounded-full",
          isCredit ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
        )}>
          {isCredit ? (
            <ArrowUpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowDownCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{transaction.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })}</span>
            {transaction.category && (
              <Badge variant="outline" className="text-xs py-0">
                {transaction.category}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className={cn(
        "font-medium text-sm whitespace-nowrap",
        isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      )}>
        {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
