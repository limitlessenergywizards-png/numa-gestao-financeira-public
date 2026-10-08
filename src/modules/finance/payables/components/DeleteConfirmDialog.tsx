'use client';

import { memo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { AccountType } from "../../types";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
  accountType: AccountType;
  accountDescription: string;
  accountAmount: number;
  formatCurrency: (value: number) => string;
}

export const DeleteConfirmDialog = memo(({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  accountType,
  accountDescription,
  accountAmount,
  formatCurrency,
}: DeleteConfirmDialogProps) => {
  const isPayer = accountType === 'payable';
  const typeLabel = isPayer ? 'conta a pagar' : 'conta a receber';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir esta {typeLabel}?
            <span className="block mt-2 font-medium text-foreground">
              {accountDescription} - {formatCurrency(accountAmount)}
            </span>
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600"
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

DeleteConfirmDialog.displayName = 'DeleteConfirmDialog';
