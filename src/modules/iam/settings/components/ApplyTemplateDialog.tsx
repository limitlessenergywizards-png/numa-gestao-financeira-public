'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Loader2,
  AlertTriangle,
  Briefcase,
  MonitorSmartphone,
  Sparkles,
  Building2,
  Check,
} from "lucide-react";
import { TEMPLATES, TEMPLATE_KEYS } from "@/data/templates";
import { seedChartOfAccounts } from "@/modules/finance/ledger/services/chartOfAccountsService";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";
import { cn } from "@/lib/utils";

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  hasExistingAccounts: boolean;
  onSuccess: () => void;
}

const SEGMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  geral: Building2,
  servicos: Briefcase,
  infoprodutor: Sparkles,
  saas: MonitorSmartphone,
};

export function ApplyTemplateDialog({
  open,
  onOpenChange,
  companyId,
  hasExistingAccounts,
  onSuccess,
}: ApplyTemplateDialogProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>("padrao");

  const selectedTemplate = TEMPLATES[selectedKey];

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await seedChartOfAccounts(companyId, selectedKey);
      toast.success(
        `${selectedTemplate.accounts.length} contas criadas com sucesso!`,
        { description: selectedTemplate.name }
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error applying template:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Escolha um Modelo
          </DialogTitle>
          <DialogDescription>
            Selecione o template mais adequado ao seu segmento. Inclui balanço
            patrimonial completo + DRE.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {TEMPLATE_KEYS.map((key) => {
            const tmpl = TEMPLATES[key];
            const Icon = SEGMENT_ICONS[tmpl.segment] ?? FileText;
            const isSelected = key === selectedKey;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedKey(key)}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/30",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border"
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    isSelected ? "bg-primary/10" : "bg-muted"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    {tmpl.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                    {tmpl.description}
                  </p>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {tmpl.accounts.length} contas
                </span>
              </button>
            );
          })}
        </div>

        {hasExistingAccounts && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-warning">
              Você já possui contas cadastradas. O modelo será adicionado às
              contas existentes.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={isApplying}>
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aplicando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Aplicar {selectedTemplate.name}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
