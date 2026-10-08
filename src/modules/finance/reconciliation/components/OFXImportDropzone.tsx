'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isValidOFXFile } from '@/lib/ofxParser';
import { isValidCSVFile } from '@/lib/csvParser';
import { isValidPDFFile } from '@/lib/pdfParser';
import { toast } from 'sonner';

function isValidBankFile(file: File): boolean {
  const isXLSX = file.name.toLowerCase().endsWith('.xlsx');
  return isValidOFXFile(file) || isValidCSVFile(file) || isValidPDFFile(file) || isXLSX;
}

interface OFXImportDropzoneProps {
  onFileSelect: (file: File) => void;
  isImporting: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function OFXImportDropzone({
  onFileSelect,
  isImporting,
  isCollapsed = false,
  onToggleCollapse,
}: OFXImportDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (isValidBankFile(file)) {
        onFileSelect(file);
      } else {
        toast.error('Formato inválido. Use arquivos .ofx, .csv ou .pdf');
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isValidBankFile(file)) {
        onFileSelect(file);
      } else {
        toast.error('Formato inválido. Use arquivos .ofx, .csv ou .pdf');
      }
    }
    // Reset input
    e.target.value = '';
  }, [onFileSelect]);

  if (isCollapsed) {
    return (
      <Button
        variant="outline"
        onClick={onToggleCollapse}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Importar Extrato
      </Button>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-8 transition-[border-color,box-shadow] duration-200",
        "flex flex-col items-center justify-center gap-4 text-center",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
        isImporting && "pointer-events-none opacity-50"
      )}
    >
      {isImporting ? (
        <>
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground">Importando extrato...</p>
        </>
      ) : (
        <>
          <div className="p-4 rounded-full bg-gradient-to-br from-[#C5A059]/10 to-[#E8D5A8]/10">
            <FileText className="h-8 w-8 text-[#C5A059]" />
          </div>
          <div>
            <p className="font-medium">
              Arraste o extrato do seu banco aqui
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ou clique para selecionar
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>Formatos aceitos: .ofx, .csv, .pdf, .xlsx</span>
          </div>
          <input
            type="file"
            accept=".ofx,.ofc,.qfx,.csv,.pdf,.xlsx"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button variant="outline" size="sm" className="gap-2 mt-2">
            <Upload className="h-4 w-4" />
            Selecionar Arquivo
          </Button>
        </>
      )}
    </div>
  );
}
