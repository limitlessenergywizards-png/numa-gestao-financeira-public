'use client';

import { useState, useMemo } from "react";
import { FileText, FileSpreadsheet, Download, Copy, Check, Building2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DetailedTransaction } from "./CashFlowTypes";
import { exportToSped, downloadSpedFile, SpedExportOptions, SpedTransaction, SpedAccount, SpedBalance } from "@/modules/finance/ledger/services/exportSped";
import { exportToTotvs, downloadTotvsFile, TotvsExportOptions, TotvsTransaction } from "@/modules/finance/ledger/services/exportTotvs";
import { maskCNPJ, isValidCNPJ } from "@/lib/masks";

interface ExportAccountingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: DetailedTransaction[];
  period: { startDate: string; endDate: string };
  chartOfAccounts: { code: string; name: string; type: string }[];
}

export function ExportAccountingDialog({
  open,
  onOpenChange,
  transactions,
  period,
  chartOfAccounts
}: ExportAccountingDialogProps) {
  const [activeTab, setActiveTab] = useState<'sped' | 'totvs' | 'csv'>('sped');
  const [copied, setCopied] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  
  // Company data
  const [companyData, setCompanyData] = useState({
    cnpj: '',
    name: '',
    fantasyName: '',
    stateRegistration: '',
    cityRegistration: '',
    uf: 'SP',
    city: '',
    address: '',
    number: '',
    neighborhood: '',
    zipCode: '',
    branch: '01'
  });

  // TOTVS format
  const [totvsFormat, setTotvsFormat] = useState<'ct2' | 'ct5' | 'csv' | 'protheus'>('csv');

  // Handle CNPJ change with validation
  const handleCnpjChange = (value: string) => {
    const formatted = maskCNPJ(value);
    setCompanyData(prev => ({ ...prev, cnpj: formatted }));
    
    const cleaned = value.replace(/[^\d]/g, '');
    if (cleaned.length === 14) {
      if (!isValidCNPJ(cleaned)) {
        setCnpjError('CNPJ inválido - dígito verificador incorreto');
      } else {
        setCnpjError(null);
      }
    } else if (cleaned.length > 0 && cleaned.length < 14) {
      setCnpjError(null); // Don't show error while typing
    } else {
      setCnpjError(null);
    }
  };

  // Convert transactions to SPED format
  const spedTransactions: SpedTransaction[] = useMemo(() => {
    return transactions.map(tx => ({
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      accountCode: tx.categoryCode || 'SEM_CAT',
      accountName: tx.category || 'Sem Categoria',
      counterpartCode: tx.type === 'entrada' ? '1.1.01' : '2.1.01', // Default cash account
      documentNumber: undefined
    }));
  }, [transactions]);

  // Convert chart of accounts to SPED format
  const spedAccounts: SpedAccount[] = useMemo(() => {
    return chartOfAccounts.map(acc => ({
      code: acc.code,
      name: acc.name,
      type: 'A' as const,
      nature: acc.type === 'receita' ? 'C' as const : 'D' as const,
      level: acc.code.split('.').length,
      parentCode: undefined
    }));
  }, [chartOfAccounts]);

  // Calculate balances
  const spedBalances: SpedBalance[] = useMemo(() => {
    const balanceMap: Record<string, { debits: number; credits: number }> = {};
    
    spedTransactions.forEach(tx => {
      if (!balanceMap[tx.accountCode]) {
        balanceMap[tx.accountCode] = { debits: 0, credits: 0 };
      }
      if (tx.type === 'saida') {
        balanceMap[tx.accountCode].debits += tx.amount;
      } else {
        balanceMap[tx.accountCode].credits += tx.amount;
      }
    });

    return Object.entries(balanceMap).map(([code, { debits, credits }]) => ({
      accountCode: code,
      initialBalance: 0,
      debits,
      credits,
      finalBalance: credits - debits
    }));
  }, [spedTransactions]);

  // Convert transactions to TOTVS format
  const totvsTransactions: TotvsTransaction[] = useMemo(() => {
    return transactions.map(tx => ({
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      accountCode: tx.categoryCode || 'SEM_CAT',
      accountName: tx.category || 'Sem Categoria',
      counterpartCode: tx.type === 'entrada' ? '1.1.01' : '2.1.01',
      costCenter: undefined,
      documentNumber: undefined,
      batch: undefined,
      subsidiary: companyData.branch
    }));
  }, [transactions, companyData.branch]);

  // Generate preview content
  const previewContent = useMemo(() => {
    if (!companyData.cnpj || !companyData.name) {
      return '# Preencha os dados da empresa para visualizar o preview';
    }

    if (activeTab === 'sped') {
      const options: SpedExportOptions = {
        company: {
          cnpj: companyData.cnpj,
          name: companyData.name,
          fantasyName: companyData.fantasyName,
          stateRegistration: companyData.stateRegistration,
          cityRegistration: companyData.cityRegistration,
          uf: companyData.uf,
          city: companyData.city,
          address: companyData.address,
          number: companyData.number,
          neighborhood: companyData.neighborhood,
          zipCode: companyData.zipCode
        },
        period,
        transactions: spedTransactions,
        chartOfAccounts: spedAccounts,
        balances: spedBalances
      };
      return exportToSped(options);
    } else {
      const options: TotvsExportOptions = {
        format: activeTab === 'csv' ? 'csv' : totvsFormat,
        company: {
          code: companyData.cnpj.replace(/[^\d]/g, '').substring(0, 8) || '00000001',
          name: companyData.name,
          branch: companyData.branch,
          cnpj: companyData.cnpj
        },
        period,
        transactions: totvsTransactions
      };
      return exportToTotvs(options);
    }
  }, [activeTab, companyData, period, spedTransactions, spedAccounts, spedBalances, totvsTransactions, totvsFormat]);

  const handleDownload = () => {
    if (!companyData.cnpj || !companyData.name) {
      toast.error('Preencha CNPJ e Razão Social');
      return;
    }
    
    // Validate CNPJ before download
    const cleanedCnpj = companyData.cnpj.replace(/[^\d]/g, '');
    if (cleanedCnpj.length === 14 && !isValidCNPJ(cleanedCnpj)) {
      toast.error('CNPJ inválido - verifique o dígito verificador');
      return;
    }

    const content = previewContent;
    
    if (activeTab === 'sped') {
      const filename = `SPED_ECD_${companyData.cnpj.replace(/[^\d]/g, '')}_${period.startDate.replace(/-/g, '')}.txt`;
      downloadSpedFile(content, filename);
      toast.success('Arquivo SPED ECD gerado com sucesso!');
    } else {
      const format = activeTab === 'csv' ? 'csv' : totvsFormat;
      const companyCode = companyData.cnpj.replace(/[^\d]/g, '').substring(0, 8) || '00000001';
      downloadTotvsFile(content, format, companyCode);
      toast.success(`Arquivo TOTVS ${format.toUpperCase()} gerado com sucesso!`);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Conteúdo copiado para a área de transferência');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar para Contabilidade
          </DialogTitle>
          <DialogDescription>
            Gere arquivos nos formatos SPED ECD, TOTVS Protheus ou CSV contábil
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sped" className="gap-2">
              <FileText className="h-4 w-4" />
              SPED ECD
            </TabsTrigger>
            <TabsTrigger value="totvs" className="gap-2">
              <Building2 className="h-4 w-4" />
              TOTVS
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              CSV Contábil
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full max-h-[60vh]">
              <div className="space-y-4 p-1">
                {/* Company Data Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="sm:col-span-2 flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Dados da Empresa</span>
                    <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="cnpj" className="text-xs">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0001-00"
                      value={companyData.cnpj}
                      onChange={(e) => handleCnpjChange(e.target.value)}
                      className={cn("h-8 text-sm", cnpjError && "border-destructive focus-visible:ring-destructive")}
                      maxLength={18}
                    />
                    {cnpjError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {cnpjError}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs">Razão Social *</Label>
                    <Input
                      id="name"
                      placeholder="Empresa LTDA"
                      value={companyData.name}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="fantasyName" className="text-xs">Nome Fantasia</Label>
                    <Input
                      id="fantasyName"
                      placeholder="Nome Fantasia"
                      value={companyData.fantasyName}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, fantasyName: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="stateRegistration" className="text-xs">Inscrição Estadual</Label>
                    <Input
                      id="stateRegistration"
                      placeholder="000.000.000.000"
                      value={companyData.stateRegistration}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, stateRegistration: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="uf" className="text-xs">UF</Label>
                    <Select value={companyData.uf} onValueChange={(v) => setCompanyData(prev => ({ ...prev, uf: v }))}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs">Cidade</Label>
                    <Input
                      id="city"
                      placeholder="São Paulo"
                      value={companyData.city}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>

                  {activeTab === 'totvs' && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="branch" className="text-xs">Filial</Label>
                        <Input
                          id="branch"
                          placeholder="01"
                          value={companyData.branch}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, branch: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="totvsFormat" className="text-xs">Formato TOTVS</Label>
                        <Select value={totvsFormat} onValueChange={(v: typeof totvsFormat) => setTotvsFormat(v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">CSV Universal</SelectItem>
                            <SelectItem value="ct2">CT2 - Lançamentos</SelectItem>
                            <SelectItem value="ct5">CT5 - Rateio</SelectItem>
                            <SelectItem value="protheus">TXT Protheus</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>

                {/* Period Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Período: <strong>{period.startDate}</strong> a <strong>{period.endDate}</strong></span>
                  <span>•</span>
                  <span>Lançamentos: <strong>{transactions.length}</strong></span>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Preview do arquivo</Label>
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5" onClick={handleCopy}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                  <div className="relative">
                    <pre className="p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto max-h-[200px] whitespace-pre-wrap">
                      {previewContent.substring(0, 2000)}
                      {previewContent.length > 2000 && '\n\n... (arquivo truncado para preview)'}
                    </pre>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar Arquivo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
