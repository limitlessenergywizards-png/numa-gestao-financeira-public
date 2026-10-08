'use client';

import { useState, useCallback } from 'react';
import { useReconciliation } from "./hooks/useReconciliation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, CheckCircle2, Wand2, Upload, Building2, FileArchive, FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { parseOFX, readFileAsText, OFXParseResult } from '@/lib/ofxParser';
import { parseCSV } from '@/lib/csvParser';
import { parsePDF } from '@/lib/pdfParser';
import { parseXLSX } from '@/lib/xlsxParser';
import { parseZipWithEmails, ZipParseResult } from '@/lib/zipEmailParser';
import { toast } from 'sonner';
import {
  ReconciliationHeader,
  OFXImportDropzone,
  OFXPreviewDialog,
  ZIPImportDropzone,
  ZIPPreviewDialog,
  SystemTransactionsList,
  BankStatementsList,
  ReconciliationStats,
} from './components';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function Reconciliation() {
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [importOpen, setImportOpen] = useState(true);
  // OFX state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [parseResult, setParseResult] = useState<OFXParseResult | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // ZIP state
  const [zipPreviewOpen, setZipPreviewOpen] = useState(false);
  const [zipParseResult, setZipParseResult] = useState<ZipParseResult | null>(null);
  const [pendingZipFile, setPendingZipFile] = useState<File | null>(null);
  const [isProcessingZip, setIsProcessingZip] = useState(false);

  const {
    systemTransactions,
    bankStatements,
    stats,
    suggestedMatches,
    selectedTransactionIds,
    setSelectedTransactionIds,
    showOnlyPending,
    setShowOnlyPending,
    isLoading,
    isImporting,
    isReconciling,
    importOFX,
    importZIP,
    reconcileSelected,
    reconcilePair,
    unreconcile,
    autoReconcile,
    ruleMatches,
    isImportingZip,
  } = useReconciliation(selectedBankId, selectedPeriod);

  // Handle file selection - detect format and parse accordingly
  const handleOFXFileSelect = useCallback(async (file: File) => {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const ACCEPTED_EXTENSIONS = ['ofx', 'ofc', 'qfx', 'csv', 'pdf', 'xlsx', 'xls'];
      if (!ACCEPTED_EXTENSIONS.includes(ext ?? '')) {
        toast.error('Formato não suportado. Use OFX, CSV, PDF ou Excel.');
        return;
      }
      let result: OFXParseResult;

      if (ext === 'csv') {
        const content = await readFileAsText(file);
        result = parseCSV(content);
      } else if (ext === 'pdf') {
        toast.warning('Atenção: A leitura de PDF pode não capturar todas as transações corretamente. Alterações no layout do Nubank podem afetá-la. Prefira usar CSV ou OFX para maior confiabilidade.', {
          duration: 8000,
        });
        result = await parsePDF(file);
      } else if (ext === 'xlsx' || ext === 'xls') {
        result = await parseXLSX(file);
      } else {
        // Default: OFX/OFC/QFX
        const content = await readFileAsText(file);
        result = parseOFX(content);
      }

      if (result.errors.length > 0) {
        toast.warning(`Atenção: ${result.errors.join(', ')}`, { duration: 6000 });
      }

      if (result.transactions.length === 0) {
        toast.error('Nenhuma transação encontrada no arquivo. Verifique se o formato é compatível.');
        return;
      }

      setParseResult(result);
      setPendingFile(file);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(`Erro ao ler arquivo: ${error instanceof Error ? error.message : 'Formato não reconhecido'}`);
    }
  }, []);

  // Handle ZIP file selection
  const handleZIPFileSelect = useCallback(async (file: File) => {
    setIsProcessingZip(true);
    try {
      const result = await parseZipWithEmails(file);
      setZipParseResult(result);
      setPendingZipFile(file);
      setZipPreviewOpen(true);
    } catch (error) {
      console.error('Error parsing ZIP:', error);
      toast.error(`Erro ao processar ZIP: ${error instanceof Error ? error.message : 'Formato não reconhecido'}`);
    } finally {
      setIsProcessingZip(false);
    }
  }, []);

  // Confirm OFX import
  const handleConfirmImport = useCallback(async (updatedResult: OFXParseResult) => {
    if (pendingFile && updatedResult) {
      await importOFX(pendingFile, updatedResult);
      setPreviewOpen(false);
      setPendingFile(null);
      setParseResult(null);
      setImportOpen(false);
    }
  }, [pendingFile, importOFX]);

  // Confirm ZIP import - persist email transactions to bank_statements
  const handleConfirmZIPImport = useCallback(async () => {
    if (pendingZipFile && zipParseResult) {
      await importZIP(pendingZipFile, zipParseResult);
    }
    setZipPreviewOpen(false);
    setPendingZipFile(null);
    setImportOpen(false);
  }, [pendingZipFile, zipParseResult, importZIP]);

  // Handle auto reconcile
  const handleAutoReconcile = useCallback(async () => {
    await autoReconcile();
  }, [autoReconcile]);

  return (
    <>
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <PageHeader
          title="Conciliação Bancária"
          description="Compare transações do sistema com o extrato bancário"
        />

        {/* Filters */}
        <ReconciliationHeader
          selectedBankId={selectedBankId}
          onBankChange={setSelectedBankId}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Stats Cards */}
        {selectedBankId && <ReconciliationStats stats={stats} />}

        {/* Empty State when no bank selected */}
        {!selectedBankId && (
          <EmptyState
            icon={Building2}
            title="Selecione uma conta bancária"
            description="Escolha uma conta bancária acima para iniciar a conciliação"
          />
        )}

        {selectedBankId && (
          <>
            {/* Import Section */}
            <Collapsible open={importOpen} onOpenChange={setImportOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 glass-card rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-[#C5A059]" />
                    <span className="font-semibold text-sm">Importar Extrato</span>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    importOpen && "rotate-180"
                  )} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="glass-card rounded-xl p-4">
                  <Tabs defaultValue="ofx" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="ofx" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Extrato Bancário
                      </TabsTrigger>
                      <TabsTrigger value="zip" className="gap-2">
                        <FileArchive className="h-4 w-4" />
                        Emails (ZIP)
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="ofx">
                      <OFXImportDropzone
                        onFileSelect={handleOFXFileSelect}
                        isImporting={isImporting}
                      />
                    </TabsContent>
                    <TabsContent value="zip">
                      <ZIPImportDropzone
                        onFileSelect={handleZIPFileSelect}
                        isImporting={isProcessingZip}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 glass-card rounded-xl">
              <label
                htmlFor="pending-only"
                className={cn(
                  "inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors select-none",
                  showOnlyPending
                    ? "bg-[#C5A059]/10 border border-[#C5A059]/30"
                    : "bg-muted/40 border border-transparent hover:bg-muted/60"
                )}
              >
                <Switch
                  id="pending-only"
                  checked={showOnlyPending}
                  onCheckedChange={setShowOnlyPending}
                />
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  showOnlyPending ? "text-[#C5A059]" : "text-muted-foreground"
                )}>
                  Apenas pendentes
                </span>
              </label>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoReconcile}
                  disabled={suggestedMatches.length === 0 || isReconciling}
                  className="gap-2 h-9"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Conciliar Auto</span>
                  <span className="sm:hidden">Auto</span>
                  {suggestedMatches.length > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#C5A059]/20 text-[#C5A059]">
                      {suggestedMatches.length}
                    </span>
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={reconcileSelected}
                  disabled={selectedTransactionIds.length === 0 || isReconciling}
                  className="gap-2 h-9"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Conciliar Selecionados</span>
                  <span className="sm:hidden">Conciliar</span>
                  {selectedTransactionIds.length > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary-foreground/20">
                      {selectedTransactionIds.length}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: '500px' }}>
              {/* System Transactions - 60% */}
              <div className="lg:col-span-3">
                <SystemTransactionsList
                  transactions={systemTransactions}
                  selectedIds={selectedTransactionIds}
                  onSelectionChange={setSelectedTransactionIds}
                  suggestedMatches={suggestedMatches}
                  onReconcilePair={reconcilePair}
                  onUnreconcile={unreconcile}
                  searchQuery={searchQuery}
                />
              </div>

              {/* Bank Statements - 40% */}
              <div className="lg:col-span-2">
                <BankStatementsList
                  statements={bankStatements}
                  suggestedMatches={suggestedMatches}
                  ruleMatches={ruleMatches}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          </>
        )}

        {/* OFX Preview Dialog */}
        <OFXPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          parseResult={parseResult}
          onConfirm={handleConfirmImport}
          isImporting={isImporting}
          filename={pendingFile?.name}
        />

        {/* ZIP Preview Dialog */}
        <ZIPPreviewDialog
          open={zipPreviewOpen}
          onOpenChange={setZipPreviewOpen}
          parseResult={zipParseResult}
          onConfirm={handleConfirmZIPImport}
          isImporting={isProcessingZip || isImportingZip}
          filename={pendingZipFile?.name}
        />
      </div>
    </>
  );
}
