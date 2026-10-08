'use client';

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  FileX,
  TrendingUp,
  TrendingDown,
  Coins,
} from "lucide-react";
import { useXMLImport } from "@/modules/finance/hooks/useXMLImport";
import { getXMLTypeLabel, formatXMLCurrency, XMLEntry, AccountMapping } from "@/lib/xmlParser";
import { cn } from "@/lib/utils";

interface DREXMLImportProps {
  companyId?: string;
  onImportSuccess?: () => void;
}

export function DREXMLImport({ companyId, onImportSuccess }: DREXMLImportProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "mapping" | "importing" | "complete">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    parseXML,
    fetchChartAccounts,
    suggestMappings,
    importToDatabase,
    isProcessing,
    progress,
    parseResult,
    chartAccounts,
    mappings,
    setMappings,
    reset,
  } = useXMLImport();

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.name.endsWith(".xml")) {
        setFile(droppedFile);
        await handleFileSelect(droppedFile);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    const result = await parseXML(selectedFile);

    if (result.success && companyId) {
      const accounts = await fetchChartAccounts(companyId);
      const suggestedMappings = suggestMappings(result.entries, accounts);
      setMappings(suggestedMappings);
      setStep("preview");
    } else if (!result.success) {
      setStep("upload");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await handleFileSelect(selectedFile);
    }
  };

  const handleMappingChange = (xmlCode: string, chartAccountId: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.xmlCode === xmlCode
          ? {
              ...m,
              chartAccountId,
              chartAccountName: chartAccounts.find((a) => a.id === chartAccountId)?.name || "",
            }
          : m
      )
    );
  };

  const handleImport = async () => {
    if (!companyId || !parseResult) return;

    setStep("importing");

    const importData = {
      companyId,
      period: parseResult.period,
      entries: parseResult.entries.map((entry) => ({
        xmlEntry: entry,
        chartAccountId: mappings.find((m) => m.xmlCode === entry.code)?.chartAccountId || "",
      })),
    };

    const success = await importToDatabase(importData);

    if (success) {
      setStep("complete");
      onImportSuccess?.();
    } else {
      setStep("mapping");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep("upload");
    setFile(null);
    reset();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose();
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Importar XML
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Importar XML para DRE
            </DialogTitle>
            <DialogDescription>
              {step === "upload" && "Selecione um arquivo XML (NF-e, SPED ou Balancete)"}
              {step === "preview" && "Revise os dados encontrados no arquivo"}
              {step === "mapping" && "Mapeie as contas do XML para o plano de contas"}
              {step === "importing" && "Importando dados..."}
              {step === "complete" && "Importação concluída com sucesso!"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {/* Step 1: Upload */}
              {step === "upload" && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="py-4"
                >
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-[border-color,box-shadow] cursor-pointer",
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/30 hover:border-primary/50"
                    )}
                    onClick={() => document.getElementById("xml-file-input")?.click()}
                  >
                    <input
                      id="xml-file-input"
                      type="file"
                      accept=".xml"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Upload
                      className={cn(
                        "h-12 w-12 mx-auto mb-4",
                        isDragOver ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <p className="text-lg font-medium mb-2">
                      Arraste um arquivo XML aqui
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      ou clique para selecionar
                    </p>
                    <div className="flex justify-center gap-2 flex-wrap">
                      <Badge variant="secondary">NF-e</Badge>
                      <Badge variant="secondary">SPED</Badge>
                      <Badge variant="secondary">Balancete</Badge>
                    </div>
                  </div>

                  {isProcessing && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-center text-muted-foreground">
                        Processando arquivo...
                      </p>
                      <Progress value={progress} />
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Preview */}
              {step === "preview" && parseResult && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="py-4 space-y-4"
                >
                  {/* File info */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{file?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {getXMLTypeLabel(parseResult.type)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setStep("upload");
                        setFile(null);
                        reset();
                      }}
                      aria-label="Remover arquivo"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-sm text-muted-foreground">Receitas</span>
                      </div>
                      <p className="text-lg font-bold text-success">
                        {formatXMLCurrency(parseResult.totals.revenues)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="h-4 w-4 text-warning" />
                        <span className="text-sm text-muted-foreground">Custos</span>
                      </div>
                      <p className="text-lg font-bold text-warning">
                        {formatXMLCurrency(parseResult.totals.costs)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-muted-foreground">Despesas</span>
                      </div>
                      <p className="text-lg font-bold text-destructive">
                        {formatXMLCurrency(parseResult.totals.expenses)}
                      </p>
                    </div>
                  </div>

                  {/* Period and count */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      Período:{" "}
                      <strong className="text-foreground">
                        {parseResult.period.month}/{parseResult.period.year}
                      </strong>
                    </span>
                    <span>
                      Lançamentos:{" "}
                      <strong className="text-foreground">
                        {parseResult.entries.length}
                      </strong>
                    </span>
                  </div>

                  {/* Errors */}
                  {parseResult.errors && parseResult.errors.length > 0 && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Avisos:</p>
                          {parseResult.errors.map((error, idx) => (
                            <p key={idx} className="text-sm text-destructive/80">
                              {error}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Mapping */}
              {step === "mapping" && parseResult && (
                <motion.div
                  key="mapping"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="py-4"
                >
                  <ScrollArea className="h-[350px] pr-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Código</TableHead>
                          <TableHead>Descrição XML</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Conta DRE</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parseResult.entries.map((entry, idx) => {
                          const mapping = mappings.find((m) => m.xmlCode === entry.code);
                          const filteredAccounts = chartAccounts.filter(
                            (acc) => acc.type === entry.type
                          );

                          return (
                            <TableRow key={`${entry.code}-${idx}`}>
                              <TableCell className="font-mono text-xs">
                                {entry.code}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm font-medium truncate max-w-[200px]">
                                    {entry.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        entry.type === "receita" && "text-success border-success",
                                        entry.type === "custo" && "text-warning border-warning",
                                        entry.type === "despesa" && "text-destructive border-destructive"
                                      )}
                                    >
                                      {entry.type}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatXMLCurrency(entry.value)}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={mapping?.chartAccountId || ""}
                                  onValueChange={(v) => handleMappingChange(entry.code, v)}
                                >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {filteredAccounts.map((acc) => (
                                      <SelectItem key={acc.id} value={acc.id}>
                                        <span className="font-mono text-xs mr-2">
                                          {acc.code}
                                        </span>
                                        {acc.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </motion.div>
              )}

              {/* Step 4: Importing */}
              {step === "importing" && (
                <motion.div
                  key="importing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="py-12 text-center"
                >
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Importando dados...</p>
                  <Progress value={progress} className="max-w-[300px] mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {progress}% concluído
                  </p>
                </motion.div>
              )}

              {/* Step 5: Complete */}
              {step === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                  </motion.div>
                  <p className="text-xl font-semibold mb-2">Importação Concluída!</p>
                  <p className="text-muted-foreground">
                    {parseResult?.entries.length} lançamentos foram importados para o DRE.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DialogFooter>
            {step === "upload" && (
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
            )}

            {step === "preview" && (
              <>
                <Button variant="outline" onClick={() => setStep("upload")}>
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep("mapping")}
                  disabled={!parseResult?.success}
                >
                  Continuar para Mapeamento
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            {step === "mapping" && (
              <>
                <Button variant="outline" onClick={() => setStep("preview")}>
                  Voltar
                </Button>
                <Button onClick={handleImport}>
                  Importar {parseResult?.entries.length} Lançamentos
                </Button>
              </>
            )}

            {step === "complete" && (
              <Button onClick={handleClose}>Fechar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
