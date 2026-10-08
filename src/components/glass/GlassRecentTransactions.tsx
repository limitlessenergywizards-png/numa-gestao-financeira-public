'use client';

import { memo } from "react";
import { GlassCard } from "./GlassCard";
import { ArrowUpRight, ArrowDownLeft, ChevronRight, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  name: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  time: string;
}

interface GlassRecentTransactionsProps {
  transactions?: Transaction[];
  currencySymbol?: string;
  onViewAll?: () => void;
  className?: string;
}

export const GlassRecentTransactions = memo(function GlassRecentTransactions({
  transactions = [],
  currencySymbol = "R$",
  onViewAll,
  className,
}: GlassRecentTransactionsProps) {
  const formatCurrency = (value: number) =>
    `${currencySymbol} ${Math.abs(value).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;

  return (
    <GlassCard variant="default" padding="none" className={className}>
      <div className="p-4 border-b border-border dark:border-glass-border flex items-center justify-between">
        <h4 className="font-semibold text-foreground text-sm">
          Últimas Transações
        </h4>
        <button
          onClick={onViewAll}
          className="text-xs text-gold-500 hover:text-gold-600 dark:text-gold-400 dark:hover:text-gold-300 flex items-center gap-1"
        >
          Ver todas
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <Receipt className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma transação recente
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border dark:divide-glass-border">
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 p-4">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  tx.type === "income"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400"
                )}
              >
                {tx.type === "income" ? (
                  <ArrowDownLeft className="w-5 h-5" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {tx.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {tx.description}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </p>
                <p className="text-[10px] text-muted-foreground">{tx.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
});
