'use client';

import { useState, useCallback } from 'react';
import { Upload, FileArchive, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isValidZipFile } from '@/lib/zipEmailParser';
import { toast } from 'sonner';

interface ZIPImportDropzoneProps {
  onFileSelect: (file: File) => void;
  isImporting: boolean;
}

export function ZIPImportDropzone({ 
  onFileSelect, 
  isImporting,
}: ZIPImportDropzoneProps) {
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
      if (isValidZipFile(file)) {
        onFileSelect(file);
      } else {
        toast.error('Formato inválido. Use arquivos .zip contendo emails (.eml)');
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isValidZipFile(file)) {
        onFileSelect(file);
      } else {
        toast.error('Formato inválido. Use arquivos .zip contendo emails (.eml)');
      }
    }
    // Reset input
    e.target.value = '';
  }, [onFileSelect]);

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
          <p className="text-muted-foreground">Processando arquivos...</p>
        </>
      ) : (
        <>
          <div className="p-4 rounded-full bg-gradient-to-br from-[#C5A059]/10 to-[#E8D5A8]/10">
            <FileArchive className="h-8 w-8 text-[#C5A059]" />
          </div>
          <div>
            <p className="font-medium">
              Arraste o arquivo ZIP com emails de extrato
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ou clique para selecionar
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>Suporta emails do Nubank e outros bancos brasileiros</span>
          </div>
          <input
            type="file"
            accept=".zip"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button variant="outline" size="sm" className="gap-2 mt-2">
            <Upload className="h-4 w-4" />
            Selecionar Arquivo ZIP
          </Button>
        </>
      )}
    </div>
  );
}
