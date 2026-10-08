/**
 * TransactionsTotalsFooter Component
 * 
 * Footer sticky com totais das transações.
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TransactionsTotalsFooterProps {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  transactionCount: number;
  formatCurrency: (value: number) => string;
}

export const TransactionsTotalsFooter = memo(function TransactionsTotalsFooter({
  totalEntradas,
  totalSaidas,
  saldo,
  transactionCount,
  formatCurrency,
}: TransactionsTotalsFooterProps) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
      <Card className="sticky bottom-4 bg-card/95 backdrop-blur border-2">
        <CardContent className="py-4">
          <p className="text-xs text-center text-muted-foreground mb-2">
            Total Filtrado ({transactionCount} movimentações)
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Entradas</p>
              <p className="text-xl font-bold text-success tabular-nums">
                {formatCurrency(totalEntradas)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saídas</p>
              <p className="text-xl font-bold text-destructive tabular-nums">
                {formatCurrency(totalSaidas)}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-lg",
              saldo >= 0 ? "bg-success/10" : "bg-destructive/10"
            )}>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className={cn(
                "text-xl font-bold tabular-nums",
                saldo >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default TransactionsTotalsFooter;
