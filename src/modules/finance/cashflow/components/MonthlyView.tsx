'use client';

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MonthlyData, MonthlyCategory } from "./CashFlowTypes";

interface MonthlyViewProps {
  monthlyData: MonthlyData;
  formatCurrency: (value: number) => string;
  periodLabel: string;
}

function CategorySection({
  categories,
  formatCurrency,
  type,
}: {
  categories: MonthlyCategory[];
  formatCurrency: (value: number) => string;
  type: 'entrada' | 'saida';
}) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (code: string) => {
    setExpandedCategories((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  if (categories.length === 0) {
    return (
      <div className="text-xs sm:text-sm text-muted-foreground pl-4 sm:pl-8 py-2">
        Nenhuma movimentação
      </div>
    );
  }

  return (
    <div className="space-y-1 pl-2 sm:pl-4">
      {categories.map((category) => (
        <Collapsible
          key={category.code}
          open={expandedCategories.includes(category.code)}
          onOpenChange={() => toggleCategory(category.code)}
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-1.5 sm:p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {expandedCategories.includes(category.code) ? (
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-medium truncate">
                  {category.code} - {category.name}
                </span>
              </div>
              <span className={`font-medium text-xs sm:text-sm shrink-0 font-mono ${type === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(category.total)}
              </span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 sm:pl-8 space-y-1">
            {category.transactions.map((tx) => (
              <div
                key={tx.id}
                className={`flex items-start sm:items-center justify-between py-1 text-xs sm:text-sm border-l-2 pl-2 sm:pl-3 ${
                  tx.isProjected ? 'italic opacity-80 border-muted' : 'border-transparent'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                  <span className="text-muted-foreground shrink-0">
                    {format(parseISO(tx.date), "dd/MM")}
                  </span>
                  <span className="truncate">{tx.description}</span>
                  {tx.isProjected && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs w-fit">Projetado</Badge>
                  )}
                </div>
                <span className={`shrink-0 font-mono ${type === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}

export function MonthlyView({ monthlyData, formatCurrency, periodLabel }: MonthlyViewProps) {
  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Fluxo de Caixa - {periodLabel}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Estrutura DRE com categorias expansíveis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        {/* Saldo Inicial */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2 sm:gap-3">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            <span className="font-semibold text-sm sm:text-base">SALDO INICIAL</span>
          </div>
          <span className={`text-lg sm:text-xl font-bold font-mono ${monthlyData.saldoInicial >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(monthlyData.saldoInicial)}
          </span>
        </div>

        {/* Entradas */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success shrink-0" />
              <span className="font-semibold text-sm sm:text-base">(+) ENTRADAS</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-success font-mono">
              {formatCurrency(monthlyData.entradas)}
            </span>
          </div>
          <div className="p-1.5 sm:p-2">
            <CategorySection
              categories={monthlyData.entradasByCategory}
              formatCurrency={formatCurrency}
              type="entrada"
            />
          </div>
        </div>

        {/* Saídas */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0" />
              <span className="font-semibold text-sm sm:text-base">(-) SAÍDAS</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-destructive font-mono">
              {formatCurrency(monthlyData.saidas)}
            </span>
          </div>
          <div className="p-1.5 sm:p-2">
            <CategorySection
              categories={monthlyData.saidasByCategory}
              formatCurrency={formatCurrency}
              type="saida"
            />
          </div>
        </div>

        {/* Saldo Operacional */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 border-dashed">
          <span className="font-semibold text-sm sm:text-base">(=) SALDO OPERACIONAL</span>
          <span className={`text-lg sm:text-xl font-bold font-mono ${monthlyData.saldoOperacional >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(monthlyData.saldoOperacional)}
          </span>
        </div>

        {/* Saldo Final */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 ${
          monthlyData.saldoFinal >= 0 ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'
        }`}>
          <span className="font-bold text-sm sm:text-lg">(=) SALDO FINAL</span>
          <span className={`text-xl sm:text-2xl font-bold font-mono ${monthlyData.saldoFinal >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(monthlyData.saldoFinal)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
