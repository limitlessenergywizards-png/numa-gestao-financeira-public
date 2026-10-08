'use client';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Check,
  Copy,
  Trash2,
  FileText,
  Target
} from "lucide-react";

interface Transaction {
  id: string;
  reconciled?: boolean;
  nature?: string;
}

interface TransactionRowActionsProps {
  transaction: Transaction;
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onReconcile: (transaction: Transaction) => void;
  onDuplicate: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onViewAudit: (transaction: Transaction) => void;
  onConvert?: (transaction: Transaction) => void;
}

export function TransactionRowActions({
  transaction,
  onView,
  onEdit,
  onReconcile,
  onDuplicate,
  onDelete,
  onViewAudit,
  onConvert,
}: TransactionRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground opacity-50 group-hover:opacity-100 transition-colors hover:bg-[#C5A059]/15 hover:text-foreground data-[state=open]:opacity-100 data-[state=open]:bg-[#C5A059]/15"
          aria-label="Ações da transação"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" className="w-48 z-50">
          <DropdownMenuItem onClick={() => onView(transaction)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </DropdownMenuItem>

          {(transaction.nature === 'previsao' && onConvert) && (
            <DropdownMenuItem onClick={() => onConvert(transaction)}>
              <Target className="mr-2 h-4 w-4" />
              Converter em Realizado
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => onEdit(transaction)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>

          {!transaction.reconciled && (
            <DropdownMenuItem
              onClick={() => onReconcile(transaction)}
              className="text-success focus:text-success"
            >
              <Check className="mr-2 h-4 w-4" />
              Marcar como Conciliado
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => onDuplicate(transaction)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => onDelete(transaction)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => onViewAudit(transaction)}>
            <FileText className="mr-2 h-4 w-4" />
            Ver Auditoria
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
