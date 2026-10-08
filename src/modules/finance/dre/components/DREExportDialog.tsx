'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Image,
  BarChart3,
  MessageSquare,
  Sparkles,
  Building2,
  Loader2,
} from "lucide-react";

export interface ExportOptions {
  format: "pdf" | "excel";
  includeLogo: boolean;
  includeCharts: boolean;
  includeNotes: boolean;
  includeAIInsights: boolean;
  orientation: "portrait" | "landscape";
  detailLevel: "summary" | "detailed" | "complete";
}

interface DREExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => Promise<void>;
  lineCount: number;
  notesCount: number;
  hasAIInsights: boolean;
  hasLogo: boolean;
}

export function DREExportDialog({
  open,
  onOpenChange,
  onExport,
  lineCount,
  notesCount,
  hasAIInsights,
  hasLogo,
}: DREExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: "pdf",
    includeLogo: hasLogo,
    includeCharts: true,
    includeNotes: true,
    includeAIInsights: hasAIInsights,
    orientation: "portrait",
    detailLevel: "detailed",
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(options);
      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  };

  const updateOption = <K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exportar DRE
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação do seu DRE
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(v) => updateOption("format", v as "pdf" | "excel")}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="pdf"
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-[border-color,box-shadow]
                  ${options.format === "pdf"
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                  }
                `}
              >
                <RadioGroupItem value="pdf" id="pdf" className="sr-only" />
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">PDF</p>
                  <p className="text-xs text-muted-foreground">
                    Documento profissional
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="excel"
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-[border-color,box-shadow]
                  ${options.format === "excel"
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                  }
                `}
              >
                <RadioGroupItem value="excel" id="excel" className="sr-only" />
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Excel</p>
                  <p className="text-xs text-muted-foreground">
                    Planilha editável
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          <Separator />

          {/* PDF Options */}
          {options.format === "pdf" && (
            <div className="space-y-4 animate-fade-in">

              <Label className="text-sm font-medium">Incluir no PDF</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <Checkbox
                    id="logo"
                    checked={options.includeLogo}
                    onCheckedChange={(v) => updateOption("includeLogo", !!v)}
                    disabled={!hasLogo}
                  />
                  <Label 
                    htmlFor="logo" 
                    className={`flex items-center gap-2 cursor-pointer ${!hasLogo ? "opacity-50" : ""}`}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Logo da empresa
                  </Label>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <Checkbox
                    id="charts"
                    checked={options.includeCharts}
                    onCheckedChange={(v) => updateOption("includeCharts", !!v)}
                  />
                  <Label htmlFor="charts" className="flex items-center gap-2 cursor-pointer">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Gráficos
                  </Label>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <Checkbox
                    id="notes"
                    checked={options.includeNotes}
                    onCheckedChange={(v) => updateOption("includeNotes", !!v)}
                    disabled={notesCount === 0}
                  />
                  <Label 
                    htmlFor="notes" 
                    className={`flex items-center gap-2 cursor-pointer ${notesCount === 0 ? "opacity-50" : ""}`}
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Notas ({notesCount})
                  </Label>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <Checkbox
                    id="ai"
                    checked={options.includeAIInsights}
                    onCheckedChange={(v) => updateOption("includeAIInsights", !!v)}
                    disabled={!hasAIInsights}
                  />
                  <Label 
                    htmlFor="ai" 
                    className={`flex items-center gap-2 cursor-pointer ${!hasAIInsights ? "opacity-50" : ""}`}
                  >
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    Insights IA
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Orientação</Label>
                  <Select
                    value={options.orientation}
                    onValueChange={(v) => updateOption("orientation", v as "portrait" | "landscape")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Retrato</SelectItem>
                      <SelectItem value="landscape">Paisagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Nível de detalhe</Label>
                  <Select
                    value={options.detailLevel}
                    onValueChange={(v) => updateOption("detailLevel", v as "summary" | "detailed" | "complete")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Resumido</SelectItem>
                      <SelectItem value="detailed">Detalhado</SelectItem>
                      <SelectItem value="complete">Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Preview Info */}
          <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
            <p className="text-sm text-muted-foreground">
              <strong>Preview:</strong> DRE com {lineCount} linhas
              {options.format === "pdf" && options.includeNotes && notesCount > 0 && (
                <>, {notesCount} notas explicativas</>
              )}
              {options.format === "pdf" && options.includeCharts && (
                <>, gráficos incluídos</>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar {options.format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
