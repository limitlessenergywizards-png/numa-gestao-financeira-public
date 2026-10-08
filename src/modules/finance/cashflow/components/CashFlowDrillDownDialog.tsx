'use client';

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileSpreadsheet, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DetailedTransaction } from "./CashFlowTypes";
import { exportToExcel } from "@/lib/exportExcel";
import { toast } from "sonner";

interface DrillDownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  categoryCode: string;
  periodLabel: string;
  transactions: DetailedTransaction[];
  total: number;
  formatCurrency: (value: number) => string;
  type: 'entrada' | 'saida';
}

const SOURCE_LABELS: Record<string, string> = {
  transaction: "Transação",
  receivable_payment: "Recebimento",
  payable_payment: "Pagamento",
  projected_receivable: "Projetado (Rec)",
  projected_payable: "Projetado (Pag)",
};

export function CashFlowDrillDownDialog({
  isOpen,
  onClose,
  categoryName,
  categoryCode,
  periodLabel,
  transactions,
  total,
  formatCurrency,
  type,
}: DrillDownDialogProps) {
  const handleExport = async () => {
    if (transactions.length === 0) return;

    const data = transactions.map((tx) => ({
      data: format(parseISO(tx.date), "dd/MM/yyyy"),
      descricao: tx.description,
      categoria: tx.category || "Sem Categoria",
      origem: SOURCE_LABELS[tx.source] || tx.source,
      projetado: tx.isProjected ? "Sim" : "Não",
      valor: tx.amount,
    }));

    await exportToExcel({
      data,
      columns: [
        { key: "data", header: "Data" },
        { key: "descricao", header: "Descrição" },
        { key: "categoria", header: "Categoria" },
        { key: "origem", header: "Origem" },
        { key: "projetado", header: "Projetado" },
        { key: "valor", header: "Valor" },
      ],
      filename: `transacoes-${categoryCode}-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
      sheetName: "Transações",
    });

    toast.success("Transações exportadas com sucesso!");
  };

  const isEntrada = type === 'entrada';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold",
                isEntrada ? "bg-emerald-500" : "bg-red-500"
              )}
            >
              {isEntrada ? "+" : "-"}
            </span>
            {categoryName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="outline">{categoryCode}</Badge>
            <span>•</span>
            <span>{periodLabel}</span>
            <span>•</span>
            <span className="font-medium">
              {transactions.length} transação{transactions.length !== 1 ? "ões" : ""}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Total:</span>
              <span
                className={cn(
                  "ml-2 text-xl font-bold",
                  isEntrada ? "text-emerald-600" : "text-red-600"
                )}
              >
                {formatCurrency(total)}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={transactions.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        <ScrollArea className="flex-1 max-h-[400px]">
          {transactions.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Nenhuma transação encontrada para este período
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[130px]">Origem</TableHead>
                  <TableHead className="text-right w-[130px]">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions
                  .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
                  .map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {format(parseISO(tx.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {tx.description}
                          {tx.isProjected && (
                            <Badge variant="secondary" className="text-xs">
                              Projetado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {SOURCE_LABELS[tx.source] || tx.source}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium",
                          isEntrada ? "text-emerald-600" : "text-red-600"
                        )}
                      >
                        {formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
