'use client';

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, UserPlus, Building2, Download, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BulkActionsBarProps {
  selectedCount: number;
  entityType: "users" | "companies" | "invitations";
  onClearSelection: () => void;
  onDelete?: () => void;
  onAddToCompany?: () => void;
  onExport?: () => void;
  onResendInvitations?: () => void;
}

export function BulkActionsBar({
  selectedCount,
  entityType,
  onClearSelection,
  onDelete,
  onAddToCompany,
  onExport,
  onResendInvitations,
}: BulkActionsBarProps) {
  const getEntityLabel = () => {
    switch (entityType) {
      case "users":
        return selectedCount === 1 ? "usuário" : "usuários";
      case "companies":
        return selectedCount === 1 ? "empresa" : "empresas";
      case "invitations":
        return selectedCount === 1 ? "convite" : "convites";
      default:
        return selectedCount === 1 ? "item" : "itens";
    }
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              <Badge variant="secondary" className="text-sm">
                {selectedCount}
              </Badge>
              <span className="text-sm font-medium">
                {getEntityLabel()} selecionado{selectedCount > 1 ? "s" : ""}
              </span>
            </div>

            <div className="h-6 w-px bg-primary-foreground/20 mx-2" />

            <div className="flex items-center gap-2">
              {entityType === "users" && onAddToCompany && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onAddToCompany}
                  className="gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Adicionar a Empresa
                </Button>
              )}

              {entityType === "invitations" && onResendInvitations && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onResendInvitations}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Reenviar
                </Button>
              )}

              {onExport && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onExport}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              )}

              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={onClearSelection}
                className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
