'use client';

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { exportToPdf, PdfExportOptions } from "@/lib/exportPdf";
import { exportToExcel, ExcelExportOptions } from "@/lib/exportExcel";

interface ExportButtonProps {
  data: any[];
  columns: { key: string; header: string }[];
  filename: string;
  title: string;
  subtitle?: string;
}

export function ExportButton({ data, columns, filename, title, subtitle }: ExportButtonProps) {
  const { t } = useLanguage();

  const handleExportPdf = async () => {
    toast.info(t("export.generating"));
    try {
      const options: PdfExportOptions = {
        data,
        columns,
        filename: `${filename}.pdf`,
        title,
        subtitle,
      };
      await exportToPdf(options);
      toast.success(t("export.success"));
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error(t("export.error"));
    }
  };

  const handleExportExcel = async () => {
    toast.info(t("export.generating"));
    try {
      const options: ExcelExportOptions = {
        data,
        columns,
        filename: `${filename}.xlsx`,
        sheetName: title,
      };
      await exportToExcel(options);
      toast.success(t("export.success"));
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error(t("export.error"));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          {t("common.export")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4 text-destructive" />
          {t("export.pdf")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
          <FileSpreadsheet className="mr-2 h-4 w-4 text-success" />
          {t("export.excel")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
