'use client';

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { exportToCSV, exportToJSON } from "@/lib/adminCsvParser";
import { format } from "date-fns";
import type { AdminAuditLog } from "@/modules/admin/hooks/useAdminData";
import type { AuditLogFilters } from "./AuditLogFilters";

interface AuditLogExportProps {
  logs: AdminAuditLog[];
  filters: AuditLogFilters;
}

export function AuditLogExport({ logs, filters }: AuditLogExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const prepareExportData = () => {
    return logs.map((log) => ({
      id: log.id,
      data_hora: log.created_at ? format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss") : "",
      usuario: log.user_name || "Sistema",
      acao: log.action,
      entidade: log.table_name,
      empresa: log.company_name || "",
      registro_id: log.record_id || "",
      dados_anteriores: log.old_data ? JSON.stringify(log.old_data) : "",
      dados_novos: log.new_data ? JSON.stringify(log.new_data) : "",
    }));
  };

  const getExportMetadata = () => {
    const metadata: Record<string, string> = {
      exportado_em: format(new Date(), "dd/MM/yyyy HH:mm:ss"),
      total_registros: logs.length.toString(),
    };

    if (filters.dateFrom) {
      metadata.filtro_data_inicio = format(filters.dateFrom, "dd/MM/yyyy");
    }
    if (filters.dateTo) {
      metadata.filtro_data_fim = format(filters.dateTo, "dd/MM/yyyy");
    }
    if (filters.userId) {
      const user = logs.find((l) => l.user_id === filters.userId);
      metadata.filtro_usuario = user?.user_name || filters.userId;
    }
    if (filters.entities.length > 0) {
      metadata.filtro_entidades = filters.entities.join(", ");
    }
    if (filters.actions.length > 0) {
      metadata.filtro_acoes = filters.actions.join(", ");
    }

    return metadata;
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const data = prepareExportData();
      const filename = `audit_logs_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
      exportToCSV(data, filename);
      toast.success(`${logs.length} logs exportados para CSV`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const data = prepareExportData();
      const metadata = getExportMetadata();
      const exportPayload = {
        metadata,
        data,
      };
      const filename = `audit_logs_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`;
      exportToJSON(exportPayload, filename);
      toast.success(`${logs.length} logs exportados para JSON`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar JSON");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isExporting || logs.length === 0}>
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="mr-2 h-4 w-4" />
          Exportar JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
