import { format, parseISO } from 'date-fns';

export interface TotvsCompany {
  code: string;
  name: string;
  branch?: string;
  cnpj?: string;
}

export interface TotvsTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
  accountCode: string;
  accountName: string;
  counterpartCode?: string;
  costCenter?: string;
  documentNumber?: string;
  batch?: string;
  subsidiary?: string;
}

export interface TotvsExportOptions {
  format: 'ct2' | 'ct5' | 'csv' | 'protheus';
  company: TotvsCompany;
  period: {
    startDate: string;
    endDate: string;
  };
  transactions: TotvsTransaction[];
}

function formatDate(dateStr: string, format: 'ct2' | 'csv' | 'protheus' = 'csv'): string {
  try {
    const date = parseISO(dateStr);
    if (format === 'protheus') {
      return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function formatValue(value: number, decimals: number = 2): string {
  return Math.abs(value).toFixed(decimals);
}

function formatValueProtheus(value: number): string {
  // Protheus uses 2 decimal places without separator
  return Math.abs(value * 100).toFixed(0).padStart(15, '0');
}

// CT2 Format - TOTVS Protheus Lançamentos Contábeis
function exportToCT2(options: TotvsExportOptions): string {
  const { company, transactions } = options;
  const lines: string[] = [];

  // Header
  lines.push(`CT2|${company.code}|${company.branch || '01'}|LANÇAMENTOS CONTÁBEIS|`);

  transactions.forEach((tx, index) => {
    const lineNum = String(index + 1).padStart(6, '0');
    const dc = tx.type === 'entrada' ? 'C' : 'D'; // Crédito/Débito
    const counterDc = tx.type === 'entrada' ? 'D' : 'C';
    
    // Main entry
    lines.push([
      'CT2',
      company.code,
      company.branch || '01',
      formatDate(tx.date, 'ct2'),
      lineNum,
      '01', // Sub-line
      tx.accountCode,
      tx.counterpartCode || '',
      formatValue(tx.amount),
      dc,
      tx.description.substring(0, 40),
      tx.documentNumber || '',
      tx.costCenter || '',
      tx.batch || ''
    ].join('|') + '|');
  });

  // Footer
  lines.push(`CT2|${company.code}|${company.branch || '01'}|FIM|${transactions.length}|`);

  return lines.join('\r\n');
}

// CT5 Format - TOTVS Protheus Rateio Contábil
function exportToCT5(options: TotvsExportOptions): string {
  const { company, transactions } = options;
  const lines: string[] = [];

  lines.push(`CT5|${company.code}|${company.branch || '01'}|RATEIO CONTABIL|`);

  transactions.forEach((tx, index) => {
    const lineNum = String(index + 1).padStart(6, '0');
    const dc = tx.type === 'entrada' ? 'C' : 'D';
    
    lines.push([
      'CT5',
      company.code,
      company.branch || '01',
      tx.date,
      lineNum,
      tx.accountCode,
      formatValue(tx.amount),
      dc,
      tx.costCenter || '',
      '100.00', // Percentage
      tx.description.substring(0, 40)
    ].join('|') + '|');
  });

  lines.push(`CT5|${company.code}|${company.branch || '01'}|FIM|${transactions.length}|`);

  return lines.join('\r\n');
}

// CSV Format - Universal accounting import
function exportToCSV(options: TotvsExportOptions): string {
  const { company, period, transactions } = options;
  const lines: string[] = [];

  // Header with metadata
  lines.push('# Exportação Contábil TOTVS');
  lines.push(`# Empresa: ${company.name} (${company.code})`);
  lines.push(`# Período: ${period.startDate} a ${period.endDate}`);
  lines.push(`# Gerado em: ${new Date().toISOString()}`);
  lines.push('');
  
  // CSV Header
  lines.push('DATA;CONTA_DEBITO;CONTA_CREDITO;VALOR;HISTORICO;DOCUMENTO;CENTRO_CUSTO;FILIAL');

  transactions.forEach(tx => {
    const debitAccount = tx.type === 'saida' ? tx.accountCode : (tx.counterpartCode || '');
    const creditAccount = tx.type === 'entrada' ? tx.accountCode : (tx.counterpartCode || '');
    
    lines.push([
      tx.date,
      debitAccount,
      creditAccount,
      formatValue(tx.amount).replace('.', ','),
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.documentNumber || '',
      tx.costCenter || '',
      tx.subsidiary || company.branch || '01'
    ].join(';'));
  });

  return lines.join('\r\n');
}

// Protheus TXT Format - Fixed width fields
function exportToProtheusTXT(options: TotvsExportOptions): string {
  const { company, transactions } = options;
  const lines: string[] = [];

  transactions.forEach((tx, index) => {
    const lineNum = String(index + 1).padStart(6, '0');
    const dc = tx.type === 'entrada' ? '2' : '1'; // 1=Débito, 2=Crédito
    
    // Fixed width format: Date(8) + Account(20) + DC(1) + Value(15) + Hist(40) + Doc(20)
    const line = [
      formatDate(tx.date, 'protheus').padEnd(8, ' '),
      tx.accountCode.padEnd(20, ' '),
      dc,
      formatValueProtheus(tx.amount),
      tx.description.substring(0, 40).padEnd(40, ' '),
      (tx.documentNumber || '').padEnd(20, ' '),
      (company.branch || '01').padEnd(4, ' '),
      lineNum
    ].join('');
    
    lines.push(line);
    
    // Counterpart entry
    if (tx.counterpartCode) {
      const counterDc = tx.type === 'entrada' ? '1' : '2';
      const counterLine = [
        formatDate(tx.date, 'protheus').padEnd(8, ' '),
        tx.counterpartCode.padEnd(20, ' '),
        counterDc,
        formatValueProtheus(tx.amount),
        ('CP-' + tx.description).substring(0, 40).padEnd(40, ' '),
        (tx.documentNumber || '').padEnd(20, ' '),
        (company.branch || '01').padEnd(4, ' '),
        lineNum
      ].join('');
      
      lines.push(counterLine);
    }
  });

  return lines.join('\r\n');
}

export function exportToTotvs(options: TotvsExportOptions): string {
  switch (options.format) {
    case 'ct2':
      return exportToCT2(options);
    case 'ct5':
      return exportToCT5(options);
    case 'protheus':
      return exportToProtheusTXT(options);
    case 'csv':
    default:
      return exportToCSV(options);
  }
}

export function downloadTotvsFile(
  content: string, 
  format: TotvsExportOptions['format'],
  companyCode: string
): void {
  const extensions: Record<string, string> = {
    ct2: 'txt',
    ct5: 'txt',
    protheus: 'txt',
    csv: 'csv'
  };
  
  const ext = extensions[format] || 'txt';
  const filename = `TOTVS_${format.toUpperCase()}_${companyCode}_${format === 'csv' ? 'export' : 'lancamentos'}.${ext}`;
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper to generate summary report
export function generateTotvsReport(options: TotvsExportOptions): {
  totalDebits: number;
  totalCredits: number;
  transactionCount: number;
  accountSummary: Record<string, { debits: number; credits: number }>;
} {
  const accountSummary: Record<string, { debits: number; credits: number }> = {};
  let totalDebits = 0;
  let totalCredits = 0;

  options.transactions.forEach(tx => {
    if (!accountSummary[tx.accountCode]) {
      accountSummary[tx.accountCode] = { debits: 0, credits: 0 };
    }
    
    if (tx.type === 'saida') {
      accountSummary[tx.accountCode].debits += tx.amount;
      totalDebits += tx.amount;
    } else {
      accountSummary[tx.accountCode].credits += tx.amount;
      totalCredits += tx.amount;
    }
  });

  return {
    totalDebits,
    totalCredits,
    transactionCount: options.transactions.length,
    accountSummary
  };
}
