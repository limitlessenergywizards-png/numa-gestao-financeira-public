'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { exportToPdf } from '@/lib/exportPdf';
import { exportToExcelMultiSheet } from '@/lib/exportExcel';
import type { DetailedTransaction, WeeklyData, MonthlyData } from '../components/CashFlowTypes';

// ============================================
// TYPES
// ============================================

interface ExportOptions {
  transactions: DetailedTransaction[];
  weeklyData: WeeklyData[];
  monthlyData: MonthlyData;
  companyName: string;
  currencySymbol: string;
  startDate: string;
  endDate: string;
  totals: {
    entradas: number;
    saidas: number;
    saldo: number;
  };
  formatCurrency: (value: number) => string;
}

interface UseCashFlowExportReturn {
  exportPdf: () => Promise<void>;
  exportExcel: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

export function useCashFlowExport(options: ExportOptions): UseCashFlowExportReturn {
  const {
    transactions,
    weeklyData,
    monthlyData,
    companyName,
    startDate,
    endDate,
    totals,
    formatCurrency,
  } = options;

  const exportPdf = useCallback(async () => {
    const toastId = toast.loading('Gerando PDF...');
    
    try {
      const exportData = transactions.map(tx => ({
        date: format(parseISO(tx.date), 'dd/MM/yyyy'),
        description: tx.description,
        category: tx.categoryCode ? `${tx.categoryCode} - ${tx.category}` : '-',
        entrada: tx.type === 'entrada' ? tx.amount : 0,
        saida: tx.type === 'saida' ? tx.amount : 0,
        projected: tx.isProjected ? 'Sim' : 'Não',
      }));

      await exportToPdf({
        data: exportData,
        columns: [
          { key: 'date', header: 'Data' },
          { key: 'description', header: 'Descrição' },
          { key: 'category', header: 'Categoria' },
          { key: 'entrada', header: 'Entrada' },
          { key: 'saida', header: 'Saída' },
          { key: 'projected', header: 'Projetado' },
        ],
        filename: `fluxo-caixa-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        title: `Fluxo de Caixa - ${companyName}`,
        subtitle: `Período: ${format(parseISO(startDate), 'dd/MM/yyyy')} a ${format(parseISO(endDate), 'dd/MM/yyyy')}`,
        orientation: 'landscape',
        summary: [
          { label: 'Total Entradas', value: formatCurrency(totals.entradas), color: 'green' },
          { label: 'Total Saídas', value: formatCurrency(totals.saidas), color: 'red' },
          { label: 'Saldo do Período', value: formatCurrency(totals.saldo) },
        ],
      });
      
      toast.dismiss(toastId);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Erro ao gerar PDF');
      console.error('Export PDF error:', error);
    }
  }, [transactions, companyName, startDate, endDate, totals, formatCurrency]);

  const exportExcel = useCallback(async () => {
    const toastId = toast.loading('Gerando Excel...');

    try {
      // Sheet 1: Daily detailed
      const dailyExport = transactions.map(tx => ({
        data: format(parseISO(tx.date), 'dd/MM/yyyy'),
        descricao: tx.description,
        categoria: tx.categoryCode ? `${tx.categoryCode} - ${tx.category}` : '-',
        entrada: tx.type === 'entrada' ? tx.amount : 0,
        saida: tx.type === 'saida' ? tx.amount : 0,
        tipo: tx.isProjected ? 'Projetado' : 'Realizado',
      }));

      // Sheet 2: Weekly summary
      const weeklyExport = weeklyData.map(w => ({
        semana: w.weekLabel,
        periodo: `${format(parseISO(w.startDate), 'dd/MM')} - ${format(parseISO(w.endDate), 'dd/MM')}`,
        saldo_inicial: w.saldoInicial,
        entradas: w.entradas,
        saidas: w.saidas,
        saldo_final: w.saldoFinal,
      }));

      // Sheet 3: Monthly category summary
      const categoryExport = [
        ...monthlyData.entradasByCategory.map(c => ({
          tipo: 'Entrada',
          codigo: c.code,
          categoria: c.name,
          total: c.total,
        })),
        ...monthlyData.saidasByCategory.map(c => ({
          tipo: 'Saída',
          codigo: c.code,
          categoria: c.name,
          total: c.total,
        })),
      ];

      await exportToExcelMultiSheet({
        sheets: [
          {
            name: 'Fluxo Diário',
            data: dailyExport,
            columns: [
              { key: 'data', header: 'Data' },
              { key: 'descricao', header: 'Descrição' },
              { key: 'categoria', header: 'Categoria' },
              { key: 'entrada', header: 'Entrada' },
              { key: 'saida', header: 'Saída' },
              { key: 'tipo', header: 'Tipo' },
            ],
          },
          {
            name: 'Resumo Semanal',
            data: weeklyExport,
            columns: [
              { key: 'semana', header: 'Semana' },
              { key: 'periodo', header: 'Período' },
              { key: 'saldo_inicial', header: 'Saldo Inicial' },
              { key: 'entradas', header: 'Entradas' },
              { key: 'saidas', header: 'Saídas' },
              { key: 'saldo_final', header: 'Saldo Final' },
            ],
          },
          {
            name: 'Resumo por Categoria',
            data: categoryExport,
            columns: [
              { key: 'tipo', header: 'Tipo' },
              { key: 'codigo', header: 'Código' },
              { key: 'categoria', header: 'Categoria' },
              { key: 'total', header: 'Total' },
            ],
          },
        ],
        filename: `fluxo-caixa-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      });

      toast.dismiss(toastId);
      toast.success('Excel gerado com sucesso!');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Erro ao gerar Excel');
      console.error('Export Excel error:', error);
    }
  }, [transactions, weeklyData, monthlyData]);

  return { exportPdf, exportExcel };
}
