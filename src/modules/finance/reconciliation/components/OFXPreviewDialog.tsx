'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OFXParseResult, OFXTransaction } from '@/lib/ofxParser';
import { FileText, Calendar, AlertCircle, Building2, FileUp, AlertTriangle, ShieldCheck, Edit2, Check } from 'lucide-react';
import { BankLogo } from '@/components/ui/bank-logo';
import { formatCurrency } from '@/lib/formatters';
import { Input } from '@/components/ui/input';

interface OFXPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parseResult: OFXParseResult | null;
  onConfirm: (result: OFXParseResult) => void;
  isImporting: boolean;
  filename?: string;
}

export function OFXPreviewDialog({
  open,
  onOpenChange,
  parseResult,
  onConfirm,
  isImporting,
  filename,
}: OFXPreviewDialogProps) {
  const [editableResult, setEditableResult] = useState<OFXParseResult | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ date: string; description: string; amount: string }>({ date: '', description: '', amount: '' });

  // Reset editable state when dialog opens with a new parse result
  useEffect(() => {
    if (open && parseResult) {
      // Deep copy to not mutate the original until confirmed
      setEditableResult(JSON.parse(JSON.stringify(parseResult)));
      // Need to restore Date objects since JSON stringify kills them
      setEditableResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          startDate: prev.startDate ? new Date(prev.startDate) : undefined,
          endDate: prev.endDate ? new Date(prev.endDate) : undefined,
          transactions: prev.transactions.map(t => ({
            ...t,
            date: new Date(t.date)
          }))
        };
      });
    } else if (!open) {
      setEditingId(null);
    }
  }, [open, parseResult]);

  if (!editableResult) return null;

  const format$ = (value: number) => formatCurrency(value);
  const isPDF = filename?.toLowerCase().endsWith('.pdf');
  const isCSV = filename?.toLowerCase().endsWith('.csv');
  const isXLSX = filename?.toLowerCase().endsWith('.xlsx');

  const totalCredits = editableResult.transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = editableResult.transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalCredits - totalDebits;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importar Extrato Bancário
          </DialogTitle>
          <DialogDescription>
            Revise e corrija as transações antes de confirmar a importação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* PDF Warning Banner */}
          {isPDF && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Importação via PDF — Verifique os dados com atenção
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                  A leitura de PDF é frágil e pode não capturar todas as transações corretamente.
                  Alterações no layout do Nubank podem afetar a precisão. Para maior confiabilidade, prefira CSV ou OFX.
                </p>
              </div>
            </div>
          )}

          {/* File and Bank Info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border">
            {editableResult.bankName ? (
              <BankLogo bankName={editableResult.bankName} size="lg" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium truncate">{filename || 'arquivo'}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase">
                  {isPDF ? 'PDF' : isCSV ? 'CSV' : isXLSX ? 'EXCEL' : 'OFX'}
                </Badge>
              </div>
              {editableResult.bankName && (
                <p className="text-sm text-muted-foreground">
                  {editableResult.bankName}
                  {editableResult.accountId && ` • Conta: ${editableResult.accountId}`}
                </p>
              )}
              {(editableResult.startDate || editableResult.endDate) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {editableResult.startDate && format(new Date(editableResult.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                    {editableResult.endDate && ` a ${format(new Date(editableResult.endDate), 'dd/MM/yyyy', { locale: ptBR })}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Transações</p>
              <p className="text-lg font-semibold">{editableResult.transactions.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Créditos</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                {format$(totalCredits)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-600 dark:text-red-400">Débitos</p>
              <p className="font-semibold text-red-600 dark:text-red-400">
                {format$(totalDebits)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${netBalance >= 0 ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
              <p className={`text-xs ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                Saldo
              </p>
              <p className={`font-semibold ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {format$(netBalance)}
              </p>
            </div>
          </div>

          {/* Errors */}
          {editableResult.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-600 dark:text-amber-400">
                {editableResult.errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            </div>
          )}

          {/* Transactions preview & Edit */}
          <ScrollArea className="h-[350px] rounded-lg border">
            <div className="p-2">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left p-2 font-medium w-[120px]">Data</th>
                    <th className="text-left p-2 font-medium">Descrição</th>
                    <th className="text-right p-2 font-medium w-[150px]">Valor</th>
                    <th className="w-[80px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {editableResult.transactions.slice(0, 100).map((tx, index) => {
                    const isEditing = editingId === tx.fitid;

                    const handleSave = () => {
                      if (!editingId) return;
                      setEditableResult(prev => {
                        if (!prev) return prev;
                        const newTx = prev.transactions.map(t => {
                          if (t.fitid === editingId) {
                            const parsedAmount = parseFloat(editForm.amount.replace(',', '.'));
                            const parsedDate = parse(editForm.date, 'yyyy-MM-dd', new Date());

                            return {
                              ...t,
                              date: isNaN(parsedDate.getTime()) ? t.date : parsedDate,
                              description: editForm.description || t.description,
                              amount: isNaN(parsedAmount) ? t.amount : parsedAmount,
                              type: (!isNaN(parsedAmount) ? parsedAmount : t.amount) >= 0 ? 'credit' as const : 'debit' as const
                            };
                          }
                          return t;
                        });
                        return { ...prev, transactions: newTx };
                      });
                      setEditingId(null);
                    };

                    return (
                      <tr key={tx.fitid || index} className="border-b last:border-0 hover:bg-muted/50 group">
                        <td className="p-2 whitespace-nowrap text-muted-foreground">
                          {isEditing ? (
                            <Input
                              type="date"
                              className="h-8 text-xs"
                              value={editForm.date}
                              onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                            />
                          ) : (
                            format(new Date(tx.date), 'dd/MM/yyyy', { locale: ptBR })
                          )}
                        </td>
                        <td className="p-2">
                          {isEditing ? (
                            <Input
                              type="text"
                              className="h-8 text-xs"
                              value={editForm.description}
                              onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                          ) : (
                            <span className="line-clamp-1">{tx.description}</span>
                          )}
                        </td>
                        <td className="p-2 text-right whitespace-nowrap">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              className="h-8 text-xs text-right"
                              value={editForm.amount}
                              onChange={e => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                            />
                          ) : (
                            <Badge variant={tx.type === 'credit' ? 'success' : 'danger'}>
                              {tx.type === 'credit' ? '+' : '-'}
                              {format$(tx.amount)}
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          {isEditing ? (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={handleSave}>
                              <Check className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setEditingId(tx.fitid);
                                setEditForm({
                                  date: format(new Date(tx.date), 'yyyy-MM-dd'),
                                  description: tx.description,
                                  amount: String(tx.amount)
                                });
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {editableResult.transactions.length > 100 && (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-muted-foreground text-xs">
                        + {editableResult.transactions.length - 100} transações adicionais
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(editableResult)}
            disabled={isImporting || editableResult.transactions.length === 0}
            className="gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            {isImporting ? 'Importando...' : `Confirmar e Importar ${editableResult.transactions.length} transações`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
