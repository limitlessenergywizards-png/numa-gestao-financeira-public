'use client';

import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { AlertTriangle, ArrowRight } from "lucide-react";

interface DateChangeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalDate: Date;
  newDate: Date;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DateChangeConfirmDialog({
  open,
  onOpenChange,
  originalDate,
  newDate,
  onConfirm,
  onCancel,
}: DateChangeConfirmDialogProps) {
  const daysDiff = Math.abs(differenceInDays(newDate, originalDate));

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirmar Alteração de Data
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>Você está alterando a data de:</p>
              
              <div className="flex items-center justify-center gap-3 py-3 px-4 bg-muted rounded-lg">
                <span className="font-medium text-foreground">
                  {format(originalDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {format(newDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              
              <p className="text-center text-sm text-muted-foreground">
                ({daysDiff} dias de diferença)
              </p>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">
                  Isso pode afetar seus relatórios de:
                </p>
                <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1 ml-4">
                  <li>• Fluxo de Caixa</li>
                  <li>• DRE (Demonstração de Resultado)</li>
                  <li>• Conciliação Bancária</li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Confirmar Alteração
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
