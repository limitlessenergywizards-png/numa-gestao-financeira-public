'use client';

import { Button } from "@/components/ui/button";
import { UserPlus, Building2, FolderPlus } from "lucide-react";

interface QuickAddButtonsProps {
  transactionType: 'entrada' | 'saida';
  onAddClient: () => void;
  onAddSupplier: () => void;
  onAddCategory: () => void;
}

export function QuickAddButtons({
  transactionType,
  onAddClient,
  onAddSupplier,
  onAddCategory,
}: QuickAddButtonsProps) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-border/50">
      <span className="text-xs text-muted-foreground mr-1">Cadastro Rápido:</span>
      
      {transactionType === 'entrada' ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddClient}
            className="h-7 text-xs gap-1.5 bg-success/5 border-success/20 hover:bg-success/10 hover:border-success/30"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Novo Cliente
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddCategory}
            className="h-7 text-xs gap-1.5"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Nova Categoria
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddSupplier}
            className="h-7 text-xs gap-1.5 bg-destructive/5 border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30"
          >
            <Building2 className="h-3.5 w-3.5" />
            Novo Fornecedor
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddCategory}
            className="h-7 text-xs gap-1.5"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Nova Categoria
          </Button>
        </>
      )}
    </div>
  );
}
