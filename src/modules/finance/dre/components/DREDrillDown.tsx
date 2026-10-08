'use client';

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  date: string;
  description: string;
  entity: string;
  amount: number;
  type: "receivable" | "payable";
}

interface DREDrillDownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  categoryName: string;
  categoryType: "receita" | "despesa" | "custo";
  companyId: string;
  startDate: string;
  endDate: string;
  formatCurrency: (value: number) => string;
}

export function DREDrillDown({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  categoryType,
  companyId,
  startDate,
  endDate,
  formatCurrency,
}: DREDrillDownProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && categoryId) {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoryId, startDate, endDate]);

  async function fetchTransactions() {
    setIsLoading(true);
    const results: Transaction[] = [];

    try {
      // Verifica se é categoria "Outros (Não Categorizado)"
      const isUncategorized = categoryId === 'uncategorized';

      if (categoryType === "receita") {
        // Fetch receivables
        let receivablesQuery = supabase
          .from("receivables")
          .select("id, due_date, description, total_amount, customer:customers(name)")
          .eq("company_id", companyId)
          .eq("is_deleted", false)
          .eq("status", "pago")
          .gte("due_date", startDate)
          .lte("due_date", endDate);

        if (isUncategorized) {
          receivablesQuery = receivablesQuery.is("chart_account_id", null);
        } else {
          receivablesQuery = receivablesQuery.eq("chart_account_id", categoryId);
        }

        const { data: receivables } = await receivablesQuery;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (receivables || []).forEach((r: any) => {
          results.push({
            id: r.id,
            date: r.due_date,
            description: r.description,
            entity: r.customer?.name || "Cliente",
            amount: r.total_amount,
            type: "receivable",
          });
        });

        // CORREÇÃO: Buscar transactions de entrada também
        let txEntradaQuery = supabase
          .from("transactions")
          .select("id, transaction_date, description, amount")
          .eq("company_id", companyId)
          .eq("type", "entrada")
          .eq("is_deleted", false)
          .eq("nature", "realizado")
          .is("forecast_basis", null)
          .gte("transaction_date", startDate)
          .lte("transaction_date", endDate);

        if (isUncategorized) {
          txEntradaQuery = txEntradaQuery.is("chart_account_id", null);
        } else {
          txEntradaQuery = txEntradaQuery.eq("chart_account_id", categoryId);
        }

        const { data: txEntrada } = await txEntradaQuery;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (txEntrada || []).forEach((t: any) => {
          results.push({
            id: t.id,
            date: t.transaction_date,
            description: t.description,
            entity: "Transação Direta",
            amount: t.amount,
            type: "receivable",
          });
        });
      } else {
        // Fetch payables for expenses and costs
        let payablesQuery = supabase
          .from("payables")
          .select("id, due_date, description, total_amount, supplier:suppliers(name)")
          .eq("company_id", companyId)
          .eq("is_deleted", false)
          .eq("status", "pago")
          .gte("due_date", startDate)
          .lte("due_date", endDate);

        if (isUncategorized) {
          payablesQuery = payablesQuery.is("chart_account_id", null);
        } else {
          payablesQuery = payablesQuery.eq("chart_account_id", categoryId);
        }

        const { data: payables } = await payablesQuery;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payables || []).forEach((p: any) => {
          results.push({
            id: p.id,
            date: p.due_date,
            description: p.description,
            entity: p.supplier?.name || "Fornecedor",
            amount: p.total_amount,
            type: "payable",
          });
        });

        // CORREÇÃO: Buscar transactions de saída também
        let txSaidaQuery = supabase
          .from("transactions")
          .select("id, transaction_date, description, amount")
          .eq("company_id", companyId)
          .eq("type", "saida")
          .eq("is_deleted", false)
          .eq("nature", "realizado")
          .is("forecast_basis", null)
          .gte("transaction_date", startDate)
          .lte("transaction_date", endDate);

        if (isUncategorized) {
          txSaidaQuery = txSaidaQuery.is("chart_account_id", null);
        } else {
          txSaidaQuery = txSaidaQuery.eq("chart_account_id", categoryId);
        }

        const { data: txSaida } = await txSaidaQuery;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (txSaida || []).forEach((t: any) => {
          results.push({
            id: t.id,
            date: t.transaction_date,
            description: t.description,
            entity: "Transação Direta",
            amount: t.amount,
            type: "payable",
          });
        });
      }

      results.sort((a, b) => a.date.localeCompare(b.date));
      setTransactions(results);
    } catch (error) {
      console.error("Error fetching drill-down data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                categoryType === "receita"
                  ? "bg-success/10 text-success border-success/20"
                  : categoryType === "custo"
                    ? "bg-warning/10 text-warning border-warning/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
              }
            >
              {categoryType === "receita" ? "Receita" : categoryType === "custo" ? "Custo" : "Despesa"}
            </Badge>
            {categoryName}
          </SheetTitle>
          <SheetDescription>
            Detalhamento das transações do período
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                Nenhuma transação encontrada neste período.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>
                        {categoryType === "receita" ? "Cliente" : "Fornecedor"}
                      </TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-sm">
                          {format(parseISO(tx.date), "dd/MM/yy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {tx.description}
                        </TableCell>
                        <TableCell className="max-w-[100px] truncate">
                          {tx.entity}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold">
                  {formatCurrency(total)}
                </span>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
