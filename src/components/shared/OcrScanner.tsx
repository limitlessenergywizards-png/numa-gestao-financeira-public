'use client';

import { useState, useRef, ChangeEvent, DragEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Scan, Upload, X, FileText, Loader2, Image, File, Check, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useOcr, OcrData } from "@/modules/finance/ocr/hooks/useOcr";
import { getAcceptedFileTypes, getHumanReadableFileTypes, detectFileType, FileType } from "@/modules/finance/ocr/services/documentProcessors";

export type OcrResult = OcrData;

interface OcrScannerProps {
  onResult: (data: OcrResult, file: File) => void;
  onError?: (error: string) => void;
  className?: string;
}

// Get icon component based on file type
const getFileTypeIconComponent = (fileType: FileType) => {
  switch (fileType) {
    case 'pdf':
      return <FileText className="h-6 w-6 text-red-500" />;
    case 'docx':
      return <File className="h-6 w-6 text-blue-500" />;
    case 'image':
      return <Image className="h-6 w-6 text-emerald-500" />;
    default:
      return <File className="h-6 w-6 text-muted-foreground" />;
  }
};

export function OcrScanner({ onResult, onError, className }: OcrScannerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<FileType | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [extractedData, setExtractedData] = useState<OcrResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { processFile, isProcessing, progress, progressMessage, error } = useOcr();

  // Clean up ObjectURL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleFileSelect = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      onError?.('Arquivo muito grande. O tamanho máximo é 10 MB.');
      return;
    }

    const fileType = detectFileType(file);

    if (fileType === 'unknown') {
      onError?.('Tipo de arquivo não suportado. Use PNG, JPG, PDF ou DOCX.');
      return;
    }

    setSelectedFile(file);
    setSelectedFileType(fileType);

    // Create preview for images
    if (fileType === 'image') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    try {
      const result = await processFile(file);
      // Wait for user to review the data instead of calling onResult immediately
      setExtractedData(result);
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    }
  };

  const handleConfirm = () => {
    if (extractedData && selectedFile) {
      onResult(extractedData, selectedFile);
      // We don't clear the form here, we let the parent close the modal/unmount us
    }
  };

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setSelectedFileType(null);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const acceptedTypes = getAcceptedFileTypes();
  const humanReadableTypes = getHumanReadableFileTypes();

  return (
    <Card className={cn(
      "overflow-hidden transition-[border-color] duration-300",
      (!selectedFile && !isProcessing) ? "border-dashed" : "",
      className
    )}>
      {extractedData && (
        <CardHeader className="bg-primary/5 pb-4 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Revisão de Dados Extraídos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            A Inteligência Artificial preencheu os campos abaixo. Revise e faça as correções necessárias antes de confirmar.
          </p>
        </CardHeader>
      )}
      <CardContent className="p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
        />

        {!selectedFile && !isProcessing && (
          <div
            className={cn(
              "flex flex-col items-center justify-center py-6 cursor-pointer rounded-lg transition-colors",
              isDragOver
                ? "bg-primary/10 border-2 border-dashed border-primary"
                : "hover:bg-muted/50"
            )}
            onClick={triggerFileSelect}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full mb-3">
              <Scan className="h-6 w-6 text-primary" />
            </div>
            <p className="font-medium text-sm">Escanear Documento</p>
            <p className="text-xs text-muted-foreground mt-1 text-center max-w-[250px]">
              Arraste ou clique para enviar (máx. 10 MB)
            </p>
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {humanReadableTypes.map((type, i) => (
                <span key={i} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {type}
                </span>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3">
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium mb-2">
              {progressMessage || 'Processando...'}
            </p>
            <div className="w-full max-w-xs">
              <Progress value={progress} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{progress}% concluído</p>
            {selectedFile && (
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                {selectedFileType && getFileTypeIconComponent(selectedFileType)}
                <span>{selectedFile.name}</span>
              </div>
            )}
          </div>
        )}

        {selectedFile && !isProcessing && extractedData && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Preview Side */}
              <div className="w-full md:w-1/3 flex flex-col items-center gap-2 bg-muted/30 p-4 rounded-xl border">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-md shadow-sm bg-white dark:bg-black/50"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 p-6 h-48 bg-muted rounded-md w-full">
                    {selectedFileType && getFileTypeIconComponent(selectedFileType)}
                    <span className="text-sm font-medium text-center truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between w-full mt-2">
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={selectedFile.name}>
                    {selectedFile.name}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                    <RefreshCw className="h-3 w-3 mr-1" /> Trocar
                  </Button>
                </div>
              </div>

              {/* Form Side */}
              <div className="w-full md:w-2/3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ocr-amount">Valor (R$)</Label>
                    <Input
                      id="ocr-amount"
                      type="number"
                      step="0.01"
                      value={extractedData.amount !== undefined && extractedData.amount !== null ? String(extractedData.amount) : ''}
                      onChange={(e) => setExtractedData({ ...extractedData, amount: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ocr-date">Vencimento / Emissão</Label>
                    <Input
                      id="ocr-date"
                      type="date"
                      value={extractedData.dueDate || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, dueDate: e.target.value || undefined })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ocr-desc">Descrição / Fornecedor</Label>
                  <Input
                    id="ocr-desc"
                    value={extractedData.description || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                    placeholder="Nome da loja, fornecedor, serviço..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ocr-doc">Nº do Documento</Label>
                    <Input
                      id="ocr-doc"
                      value={extractedData.documentNumber || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, documentNumber: e.target.value })}
                      placeholder="Nº da nota"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ocr-type">Tipo de Documento</Label>
                    <Input
                      id="ocr-type"
                      value={extractedData.documentType || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, documentType: e.target.value })}
                      placeholder="Nota Fiscal, Recibo..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClear}>
                Cancelar e Tentar Novamente
              </Button>
              <Button onClick={handleConfirm} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Check className="h-4 w-4" />
                Confirmar e Preencher
              </Button>
            </div>
          </div>
        )}

        {error && !isProcessing && (
          <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-destructive/5 border-destructive/20 mt-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
              <X className="h-5 w-5 text-destructive" />
            </div>
            <p className="font-medium text-destructive mb-1">Ops! Problema na leitura</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={handleClear} className="w-full max-w-[200px]">
              Tentar com outra imagem
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
