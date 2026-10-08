'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import { useFormatters } from "@/hooks/useFormatters";
import { useDebounce } from "@/hooks/useDebounce";
import { TIMING } from "@/lib/config";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";
import { 
  Scan, 
  Search, 
  Calendar, 
  FileText, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Eye, 
  Trash2, 
  Loader2,
  Plus,
  Upload
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { OcrScanner, type OcrResult } from "@/components/shared";
import { FileType } from "@/modules/finance/ocr/services/documentProcessors";

interface OcrScan {
  id: string;
  company_id: string;
  user_id: string;
  image_url: string;
  extracted_text: string;
  extracted_data: {
    amount?: string;
    dueDate?: string;
    description?: string;
    documentNumber?: string;
  };
  source_type: 'receivable' | 'payable';
  linked_record_id: string | null;
  created_at: string;
}

export default function OcrHistory() {
  const { currentCompany } = useCompany();
  const { hasRole, user } = useAuth();
  const canDelete = hasRole('admin');
  const { formatCurrency: formatCurrencyNum } = useFormatters();

  const [scans, setScans] = useState<OcrScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<OcrScan | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewScanOpen, setIsNewScanOpen] = useState(false);
  const [newScanType, setNewScanType] = useState<'receivable' | 'payable'>('receivable');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingOcrResult, setPendingOcrResult] = useState<OcrResult | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  
  // Filters
  const [searchInput, setSearchInput] = useState('');
  const searchTerm = useDebounce(searchInput, TIMING.DEBOUNCE_DELAY);
  const [filterType, setFilterType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    if (currentCompany) {
      fetchScans();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany]);

  const fetchScans = async () => {
    if (!currentCompany) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ocr_scans')
        .select('id, company_id, user_id, image_url, extracted_text, extracted_data, source_type, linked_record_id, created_at')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScans((data as OcrScan[]) || []);
    } catch (error) {
      toast.error('Erro ao carregar histórico: ' + getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (scan: OcrScan) => {
    if (!confirm('Deseja excluir este registro de OCR?')) return;

    try {
      // Delete from storage
      const fileName = scan.image_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('ocr_images').remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('ocr_scans')
        .delete()
        .eq('id', scan.id)
        .eq('company_id', currentCompany!.id);

      if (error) throw error;
      toast.success('Registro excluído com sucesso');
      fetchScans();
    } catch (error) {
      toast.error('Erro ao excluir: ' + getErrorMessage(error));
    }
  };

  const handleViewDetails = (scan: OcrScan) => {
    setSelectedScan(scan);
    setIsDetailOpen(true);
  };

  // Filter scans
  const filteredScans = useMemo(() => scans.filter(scan => {
    if (filterType !== 'all' && scan.source_type !== filterType) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (
        !scan.extracted_text.toLowerCase().includes(searchLower) &&
        !scan.extracted_data.description?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (dateFrom && new Date(scan.created_at) < dateFrom) return false;
    if (dateTo && new Date(scan.created_at) > dateTo) return false;
    return true;
  }), [scans, filterType, searchTerm, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchInput('');
    setFilterType('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const formatCurrency = useCallback((value: string | undefined) => {
    if (!value) return '-';
    return formatCurrencyNum(parseFloat(value));
  }, [formatCurrencyNum]);

  const handleOcrResult = (result: OcrResult, file: File) => {
    setPendingOcrResult(result);
    setPendingImageFile(file);
  };

  // Get file extension for display
  const getFileTypeLabel = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'PDF';
      case 'docx': return 'DOCX';
      case 'png': return 'PNG';
      case 'jpg':
      case 'jpeg': return 'JPG';
      default: return 'Arquivo';
    }
  };

  const handleSaveNewScan = async () => {
    if (!currentCompany || !user || !pendingOcrResult || !pendingImageFile) return;

    setIsSaving(true);
    try {
      // Upload image to storage
      const fileExt = pendingImageFile.name.split('.').pop();
      const fileName = `${currentCompany.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('ocr_images')
        .upload(fileName, pendingImageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('ocr_images')
        .getPublicUrl(fileName);

      // Save to database
      const { error: insertError } = await supabase
        .from('ocr_scans')
        .insert({
          company_id: currentCompany.id,
          user_id: user.id,
          image_url: urlData.publicUrl,
          extracted_text: pendingOcrResult.rawText,
          extracted_data: {
            amount: pendingOcrResult.amount,
            dueDate: pendingOcrResult.dueDate,
            description: pendingOcrResult.description,
            documentNumber: pendingOcrResult.documentNumber,
          },
          source_type: newScanType,
        });

      if (insertError) throw insertError;

      toast.success('Documento escaneado salvo com sucesso!');
      setIsNewScanOpen(false);
      setPendingOcrResult(null);
      setPendingImageFile(null);
      fetchScans();
    } catch (error) {
      toast.error('Erro ao salvar: ' + getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelNewScan = () => {
    setIsNewScanOpen(false);
    setPendingOcrResult(null);
    setPendingImageFile(null);
  };

  if (!currentCompany) {
    return (
      <AppLayout title="Histórico de OCR">
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-muted-foreground">Selecione uma empresa para continuar</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Histórico de OCR" 
      description="Documentos escaneados e dados extraídos"
      actions={
        <Sheet open={isNewScanOpen} onOpenChange={setIsNewScanOpen}>
          <SheetTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Scan
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-[500px]">
            <SheetHeader>
              <SheetTitle>Novo Scan OCR</SheetTitle>
              <SheetDescription>
                Escaneie um documento para extrair dados automaticamente
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select value={newScanType} onValueChange={(v) => setNewScanType(v as 'receivable' | 'payable')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receivable">
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                        Conta a Receber
                      </div>
                    </SelectItem>
                    <SelectItem value="payable">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-rose-600" />
                        Conta a Pagar
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <OcrScanner 
                onResult={(result, file) => {
                  handleOcrResult(result, file);
                }}
                onError={(error) => toast.error(error)}
              />

              {pendingOcrResult && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Dados Extraídos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Valor:</span>
                        <p className="font-medium">{formatCurrency(pendingOcrResult.amount)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vencimento:</span>
                        <p className="font-medium">
                          {pendingOcrResult.dueDate 
                            ? format(new Date(pendingOcrResult.dueDate), 'dd/MM/yyyy')
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                    {pendingOcrResult.description && (
                      <div>
                        <span className="text-muted-foreground">Descrição:</span>
                        <p className="font-medium truncate">{pendingOcrResult.description}</p>
                      </div>
                    )}
                    {pendingOcrResult.documentNumber && (
                      <div>
                        <span className="text-muted-foreground">Nº Documento:</span>
                        <p className="font-medium">{pendingOcrResult.documentNumber}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleCancelNewScan}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveNewScan}
                  disabled={!pendingOcrResult || isSaving}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Salvar Scan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden shadow-lg transition-[transform,box-shadow] hover:scale-[1.02] bg-gradient-to-br from-cyan-500 via-indigo-500 to-purple-600 border-cyan-400/30">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardDescription className="text-white/80 font-medium">Total de Scans</CardDescription>
              <div className="p-2 rounded-lg bg-white/20">
                <Scan className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-white">{scans.length}</div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden shadow-lg transition-[transform,box-shadow] hover:scale-[1.02] bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 border-emerald-400/30">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardDescription className="text-white/80 font-medium">Contas a Receber</CardDescription>
              <div className="p-2 rounded-lg bg-white/20">
                <ArrowDownCircle className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-white">
                {scans.filter(s => s.source_type === 'receivable').length}
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden shadow-lg transition-[transform,box-shadow] hover:scale-[1.02] bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 border-rose-400/30">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardDescription className="text-white/80 font-medium">Contas a Pagar</CardDescription>
              <div className="p-2 rounded-lg bg-white/20">
                <ArrowUpCircle className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-white">
                {scans.filter(s => s.source_type === 'payable').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="receivable">Contas a Receber</SelectItem>
                    <SelectItem value="payable">Contas a Pagar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>De</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Até</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Texto extraído..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="invisible">Ações</Label>
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scans Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredScans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Scan className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum documento escaneado encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Preview</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor Extraído</TableHead>
                    <TableHead>Data Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vinculado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell>
                        <div 
                          className="w-12 h-12 rounded-md bg-muted overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleViewDetails(scan)}
                        >
                          <img 
                            src={scan.image_url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(scan.created_at), 'dd/MM/yyyy')}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(scan.created_at), 'HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            scan.source_type === 'receivable' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }
                        >
                          {scan.source_type === 'receivable' ? 'Receber' : 'Pagar'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(scan.extracted_data.amount)}
                      </TableCell>
                      <TableCell>
                        {scan.extracted_data.dueDate 
                          ? format(new Date(scan.extracted_data.dueDate), 'dd/MM/yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {scan.extracted_data.description || '-'}
                      </TableCell>
                      <TableCell>
                        {scan.linked_record_id ? (
                          <Badge variant="secondary">
                            <FileText className="h-3 w-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Não</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(scan)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(scan)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Documento Escaneado</DialogTitle>
              <DialogDescription>
                {selectedScan && format(new Date(selectedScan.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </DialogDescription>
            </DialogHeader>
            {selectedScan && (
              <div className="grid gap-6 py-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Image Preview */}
                  <div className="space-y-2">
                    <Label>Imagem Original</Label>
                    <div className="border rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={selectedScan.image_url} 
                        alt="Documento escaneado" 
                        className="w-full h-auto max-h-[300px] object-contain"
                      />
                    </div>
                  </div>
                  
                  {/* Extracted Data */}
                  <div className="space-y-4">
                    <div>
                      <Label>Dados Extraídos</Label>
                      <Card className="mt-2">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Tipo:</span>
                            <Badge 
                              className={
                                selectedScan.source_type === 'receivable' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }
                            >
                              {selectedScan.source_type === 'receivable' ? 'Conta a Receber' : 'Conta a Pagar'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Valor:</span>
                            <span className="font-medium">{formatCurrency(selectedScan.extracted_data.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Vencimento:</span>
                            <span>{selectedScan.extracted_data.dueDate 
                              ? format(new Date(selectedScan.extracted_data.dueDate), 'dd/MM/yyyy')
                              : '-'
                            }</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Nº Documento:</span>
                            <span>{selectedScan.extracted_data.documentNumber || '-'}</span>
                          </div>
                          {selectedScan.extracted_data.description && (
                            <div>
                              <span className="text-sm text-muted-foreground">Descrição:</span>
                              <p className="text-sm mt-1">{selectedScan.extracted_data.description}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    
                    {selectedScan.linked_record_id && (
                      <div>
                        <Label>Registro Vinculado</Label>
                        <div className="mt-2 p-3 rounded-lg bg-muted flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm">
                            {selectedScan.source_type === 'receivable' ? 'Conta a Receber' : 'Conta a Pagar'} criada
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Raw Text */}
                <div className="space-y-2">
                  <Label>Texto Extraído (OCR)</Label>
                  <ScrollArea className="h-[150px] border rounded-lg p-3 bg-muted/50">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {selectedScan.extracted_text}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
