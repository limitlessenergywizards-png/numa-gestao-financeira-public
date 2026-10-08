'use client';

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, FileText, Check, X, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { parseCSV, validateEmail, normalizeRole, generateCSVTemplate } from "@/lib/adminCsvParser";
import { checkExistingInvitations, sendInvitation } from "@/modules/admin/hooks/useBulkInvite";
import type { AdminCompany } from "@/modules/admin/hooks/useAdminData";

interface BulkInviteEntry {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  status: "valid" | "invalid" | "duplicate" | "existing" | "sent" | "error";
  error?: string;
}

interface BulkInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: AdminCompany[];
  onSuccess: () => void;
}

export function BulkInviteDialog({ open, onOpenChange, companies, onSuccess }: BulkInviteDialogProps) {
  const { user } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [entries, setEntries] = useState<BulkInviteEntry[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const stats = useMemo(() => {
    const valid = entries.filter((e) => e.status === "valid").length;
    const invalid = entries.filter((e) => e.status === "invalid").length;
    const duplicate = entries.filter((e) => e.status === "duplicate").length;
    const existing = entries.filter((e) => e.status === "existing").length;
    const sent = entries.filter((e) => e.status === "sent").length;
    const error = entries.filter((e) => e.status === "error").length;
    return { valid, invalid, duplicate, existing, sent, error, total: entries.length };
  }, [entries]);

  const handleFileUpload = useCallback(async (file: File) => {
    const content = await file.text();
    const result = parseCSV(content);

    if (result.errors.length > 0) {
      toast.error(result.errors[0].message);
      return;
    }

    // Check for existing invitations and duplicates
    const emailsSeen = new Set<string>();
    const newEntries: BulkInviteEntry[] = [];

    for (const row of result.data) {
      const email = row.email.toLowerCase().trim();
      const role = normalizeRole(row.role);

      let status: BulkInviteEntry["status"] = "valid";
      let error: string | undefined;

      if (!validateEmail(email)) {
        status = "invalid";
        error = "Email inválido";
      } else if (emailsSeen.has(email)) {
        status = "duplicate";
        error = "Email duplicado no arquivo";
      }

      emailsSeen.add(email);

      newEntries.push({
        id: crypto.randomUUID(),
        email,
        role,
        status,
        error,
      });
    }

    // Check for existing invitations in database
    if (selectedCompanyId && newEntries.filter((e) => e.status === "valid").length > 0) {
      const validEmails = newEntries.filter((e) => e.status === "valid").map((e) => e.email);
      const existingEmails = await checkExistingInvitations(selectedCompanyId, validEmails);

      newEntries.forEach((entry) => {
        if (entry.status === "valid" && existingEmails.has(entry.email)) {
          entry.status = "existing";
          entry.error = "Já possui convite pendente";
        }
      });
    }

    setEntries(newEntries);
    toast.success(`${newEntries.length} registros carregados`);
  }, [selectedCompanyId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      handleFileUpload(file);
    } else {
      toast.error("Por favor, envie um arquivo CSV");
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo_convites.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRemoveEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleRoleChange = (id: string, role: "admin" | "editor" | "viewer") => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, role } : e))
    );
  };

  const handleSendInvitations = async () => {
    if (!selectedCompanyId || !user) return;

    const validEntries = entries.filter((e) => e.status === "valid");
    if (validEntries.length === 0) {
      toast.error("Nenhum convite válido para enviar");
      return;
    }

    setIsSending(true);
    setProgress(0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validEntries.length; i++) {
      const entry = validEntries[i];

      try {
        await sendInvitation(entry, selectedCompanyId, user.id);

        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, status: "sent" } : e
          )
        );
        successCount++;
      } catch (err) {
        console.error("Error sending invitation:", err);
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, status: "error", error: "Erro ao enviar" } : e
          )
        );
        errorCount++;
      }

      setProgress(((i + 1) / validEntries.length) * 100);
    }

    setIsSending(false);

    if (successCount > 0) {
      toast.success(`${successCount} convites enviados com sucesso`);
      onSuccess();
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} convites falharam`);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setEntries([]);
      setProgress(0);
      onOpenChange(false);
    }
  };

  const getStatusBadge = (entry: BulkInviteEntry) => {
    switch (entry.status) {
      case "valid":
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">Válido</Badge>;
      case "invalid":
        return <Badge variant="destructive">{entry.error}</Badge>;
      case "duplicate":
        return <Badge variant="secondary">{entry.error}</Badge>;
      case "existing":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-500/20">{entry.error}</Badge>;
      case "sent":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">Enviado</Badge>;
      case "error":
        return <Badge variant="destructive">{entry.error}</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Convites em Lote
          </DialogTitle>
          <DialogDescription>
            Importe um arquivo CSV com emails e perfis para enviar múltiplos convites.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Company Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa</label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Area */}
          {entries.length === 0 ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
                ${!selectedCompanyId ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-primary/50"}
              `}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
                disabled={!selectedCompanyId}
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  {isDragging ? "Solte o arquivo aqui" : "Arraste um arquivo CSV ou clique para selecionar"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Formato: email,role (admin/editor/viewer)
                </p>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} type="button">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar modelo CSV
                </Button>
              </label>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="flex gap-3 flex-wrap">
                <Badge variant="outline">
                  Total: {stats.total}
                </Badge>
                {stats.valid > 0 && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                    <Check className="h-3 w-3 mr-1" />
                    Válidos: {stats.valid}
                  </Badge>
                )}
                {stats.invalid > 0 && (
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    Inválidos: {stats.invalid}
                  </Badge>
                )}
                {stats.duplicate > 0 && (
                  <Badge variant="secondary">
                    Duplicados: {stats.duplicate}
                  </Badge>
                )}
                {stats.existing > 0 && (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Já convidados: {stats.existing}
                  </Badge>
                )}
                {stats.sent > 0 && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">
                    Enviados: {stats.sent}
                  </Badge>
                )}
              </div>

              {/* Progress */}
              {isSending && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Enviando convites...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Entries Table */}
              <ScrollArea className="h-[300px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {entries.map((entry) => (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="border-b"
                        >
                          <TableCell className="font-medium">{entry.email}</TableCell>
                          <TableCell>
                            <Select
                              value={entry.role}
                              onValueChange={(v) => handleRoleChange(entry.id, v as "admin" | "editor" | "viewer")}
                              disabled={entry.status !== "valid" || isSending}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{getStatusBadge(entry)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveEntry(entry.id)}
                              disabled={isSending}
                              aria-label="Remover convite"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Cancelar
          </Button>
          {entries.length > 0 && (
            <Button
              onClick={handleSendInvitations}
              disabled={isSending || stats.valid === 0 || !selectedCompanyId}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar {stats.valid} convite{stats.valid !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
