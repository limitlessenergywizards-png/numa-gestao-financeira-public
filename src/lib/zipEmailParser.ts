/**
 * ZIP Email Parser - Parse ZIP files containing EML bank statement emails
 * Extracts transaction data from Nubank and other Brazilian bank email statements
 */

import JSZip from 'jszip';
import type { ReadedEmlJson } from 'eml-parse-js';

export interface ParsedEmailTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category?: string;
}

export interface ParsedEmailStatement {
  bankName: string;
  periodStart?: Date;
  periodEnd?: Date;
  transactions: ParsedEmailTransaction[];
  totalCredits: number;
  totalDebits: number;
  balance?: number;
}

export interface ZipParseResult {
  success: boolean;
  emailCount: number;
  statements: ParsedEmailStatement[];
  allTransactions: ParsedEmailTransaction[];
  errors: string[];
}

/**
 * Check if file is a valid ZIP file
 */
export function isValidZipFile(file: File): boolean {
  const validExtensions = ['.zip'];
  const fileName = file.name.toLowerCase();
  return validExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Check if file is a valid EML file
 */
export function isValidEmlFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.eml');
}

/**
 * Parse a ZIP file containing EML files
 */
export async function parseZipWithEmails(file: File): Promise<ZipParseResult> {
  const result: ZipParseResult = {
    success: false,
    emailCount: 0,
    statements: [],
    allTransactions: [],
    errors: [],
  };

  try {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);
    
    const emlFiles: string[] = [];
    
    // Find all EML files in the ZIP
    content.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir && isValidEmlFile(relativePath)) {
        emlFiles.push(relativePath);
      }
    });

    if (emlFiles.length === 0) {
      result.errors.push('Nenhum arquivo .eml encontrado no ZIP');
      return result;
    }

    result.emailCount = emlFiles.length;

    // Process each EML file
    for (const emlPath of emlFiles) {
      try {
        const emlContent = await content.file(emlPath)?.async('string');
        if (emlContent) {
          const statement = await parseEmlContent(emlContent);
          if (statement) {
            result.statements.push(statement);
            result.allTransactions.push(...statement.transactions);
          }
        }
      } catch (error) {
        result.errors.push(`Erro ao processar ${emlPath}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    // Sort all transactions by date
    result.allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    result.success = result.statements.length > 0;

  } catch (error) {
    result.errors.push(`Erro ao abrir arquivo ZIP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }

  return result;
}

/**
 * Parse EML content and extract transactions
 */
async function parseEmlContent(emlContent: string): Promise<ParsedEmailStatement | null> {
  const { readEml } = await import('eml-parse-js');
  return new Promise((resolve) => {
    readEml(emlContent, (error, data) => {
      if (error || !data) {
        resolve(null);
        return;
      }

      const statement = extractTransactionsFromEmail(data);
      resolve(statement);
    });
  });
}

/**
 * Extract transactions from parsed email data
 */
function extractTransactionsFromEmail(data: ReadedEmlJson): ParsedEmailStatement | null {
  const subject = data.subject || '';
  const htmlContent = data.html || '';
  const textContent = data.text || '';
  
  // Detect bank from subject or content
  const bankName = detectBankFromEmail(subject, htmlContent);
  if (!bankName) return null;

  // Extract transactions based on bank type
  let transactions: ParsedEmailTransaction[] = [];
  
  if (bankName === 'Nubank') {
    transactions = extractNubankTransactions(htmlContent || textContent);
  } else {
    transactions = extractGenericTransactions(htmlContent || textContent);
  }

  if (transactions.length === 0) return null;

  // Calculate totals
  const totalCredits = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDebits = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  // Extract period from transactions
  const dates = transactions.map(t => t.date).sort((a, b) => a.getTime() - b.getTime());
  
  return {
    bankName,
    periodStart: dates[0],
    periodEnd: dates[dates.length - 1],
    transactions,
    totalCredits,
    totalDebits,
    balance: totalCredits - totalDebits,
  };
}

/**
 * Detect bank from email content
 */
function detectBankFromEmail(subject: string, content: string): string | null {
  const combined = (subject + ' ' + content).toLowerCase();
  
  if (combined.includes('nubank') || combined.includes('nu pagamentos') || combined.includes('extrato_da_sua_conta_do_nubank')) {
    return 'Nubank';
  }
  if (combined.includes('itau') || combined.includes('itaú')) {
    return 'Itaú';
  }
  if (combined.includes('bradesco')) {
    return 'Bradesco';
  }
  if (combined.includes('santander')) {
    return 'Santander';
  }
  if (combined.includes('banco do brasil') || combined.includes('bb.com.br')) {
    return 'Banco do Brasil';
  }
  if (combined.includes('caixa') || combined.includes('cef')) {
    return 'Caixa';
  }
  if (combined.includes('inter')) {
    return 'Inter';
  }
  if (combined.includes('c6 bank') || combined.includes('c6bank')) {
    return 'C6 Bank';
  }
  
  return null;
}

/**
 * Extract transactions from Nubank email format
 */
function extractNubankTransactions(content: string): ParsedEmailTransaction[] {
  const transactions: ParsedEmailTransaction[] = [];
  
  // Clean HTML tags for text processing
  const cleanText = content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

  // Nubank transaction patterns
  // Pattern 1: Date + Description + Amount (R$ X.XXX,XX)
  const transactionPattern = /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+([^R$]+?)\s+R\$\s*([\d.,]+)/gi;
  
  let match;
  while ((match = transactionPattern.exec(cleanText)) !== null) {
    const dateStr = match[1];
    const description = match[2].trim();
    const amountStr = match[3].trim();
    
    const date = parseBrazilianDate(dateStr);
    const amount = parseBrazilianAmount(amountStr);
    
    if (date && amount > 0 && description.length > 2) {
      // Determine type based on common keywords
      const isCredit = isLikelyCredit(description);
      
      transactions.push({
        date,
        description: cleanDescription(description),
        amount,
        type: isCredit ? 'credit' : 'debit',
        category: categorizeTransaction(description),
      });
    }
  }

  // Pattern 2: Try alternative patterns for Nubank statements
  if (transactions.length === 0) {
    // Alternative: Look for table-like structures
    const altPattern = /(\d{2}\/\d{2})\s+(.+?)\s+([-+]?\s*R\$\s*[\d.,]+)/gi;
    while ((match = altPattern.exec(cleanText)) !== null) {
      const dateStr = match[1];
      const description = match[2].trim();
      const amountStr = match[3].trim();
      
      const date = parseBrazilianDate(dateStr);
      const amount = parseBrazilianAmount(amountStr);
      const isNegative = amountStr.includes('-');
      
      if (date && amount > 0 && description.length > 2) {
        transactions.push({
          date,
          description: cleanDescription(description),
          amount,
          type: isNegative ? 'debit' : 'credit',
          category: categorizeTransaction(description),
        });
      }
    }
  }

  return transactions;
}

/**
 * Extract transactions from generic email format
 */
function extractGenericTransactions(content: string): ParsedEmailTransaction[] {
  const transactions: ParsedEmailTransaction[] = [];
  
  // Clean HTML
  const cleanText = content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

  // Generic pattern: Date + Description + Amount
  const patterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+([^R$]+?)\s+R\$\s*([\d.,]+)/gi,
    /(\d{1,2}\/\d{1,2})\s+([^R$]+?)\s+R\$\s*([\d.,]+)/gi,
    /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d.,]+,\d{2})/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(cleanText)) !== null) {
      const dateStr = match[1];
      const description = match[2].trim();
      const amountStr = match[3].trim();
      
      const date = parseBrazilianDate(dateStr);
      const amount = parseBrazilianAmount(amountStr);
      
      if (date && amount > 0 && description.length > 2) {
        const isCredit = isLikelyCredit(description);
        
        transactions.push({
          date,
          description: cleanDescription(description),
          amount,
          type: isCredit ? 'credit' : 'debit',
          category: categorizeTransaction(description),
        });
      }
    }
    
    if (transactions.length > 0) break;
  }

  return transactions;
}

/**
 * Parse Brazilian date format (DD/MM or DD/MM/YYYY)
 */
function parseBrazilianDate(dateStr: string): Date | null {
  try {
    const parts = dateStr.split('/').map(p => parseInt(p, 10));
    
    if (parts.length === 2) {
      // DD/MM format - assume current year
      const [day, month] = parts;
      const year = new Date().getFullYear();
      return new Date(year, month - 1, day);
    } else if (parts.length === 3) {
      // DD/MM/YYYY or DD/MM/YY
      let [day, month, year] = parts;
      if (year < 100) year += 2000;
      return new Date(year, month - 1, day);
    }
  } catch {
    return null;
  }
  
  return null;
}

/**
 * Parse Brazilian currency amount
 */
function parseBrazilianAmount(amountStr: string): number {
  try {
    // Remove R$ and spaces
    let clean = amountStr.replace(/R\$\s*/gi, '').replace(/\s/g, '').trim();
    
    // Handle negative sign and remove it
    clean = clean.replace(/-/g, '');
    
    // Brazilian format: 1.234,56
    // Remove thousand separators (.)
    clean = clean.replace(/\./g, '');
    // Replace decimal separator (,) with (.)
    clean = clean.replace(',', '.');
    
    const amount = parseFloat(clean);
    return isNaN(amount) ? 0 : Math.abs(amount);
  } catch {
    return 0;
  }
}

/**
 * Determine if transaction is likely a credit
 */
function isLikelyCredit(description: string): boolean {
  const lower = description.toLowerCase();
  const creditKeywords = [
    'transferencia recebida', 'pix recebido', 'deposito', 'estorno',
    'reembolso', 'cashback', 'rendimento', 'dividendo', 'salario',
    'ted recebida', 'doc recebido', 'credito', 'recebido',
  ];
  
  return creditKeywords.some(kw => lower.includes(kw));
}

/**
 * Clean transaction description
 */
function cleanDescription(description: string): string {
  return description
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .substring(0, 200);
}

/**
 * Categorize transaction based on description
 */
function categorizeTransaction(description: string): string {
  const lower = description.toLowerCase();
  
  // Food & Dining
  if (/restaurante|lanchonete|padaria|pizzaria|ifood|uber eats|rappi|mercado|supermercado/i.test(lower)) {
    return 'Alimentação';
  }
  
  // Transport
  if (/uber|99|taxi|cabify|combustivel|posto|estacionamento|pedagio/i.test(lower)) {
    return 'Transporte';
  }
  
  // Bills
  if (/energia|luz|agua|gas|internet|telefone|celular|conta/i.test(lower)) {
    return 'Contas';
  }
  
  // Entertainment
  if (/netflix|spotify|cinema|teatro|show|lazer|entretenimento/i.test(lower)) {
    return 'Lazer';
  }
  
  // Health
  if (/farmacia|drogaria|hospital|clinica|medico|saude|consulta/i.test(lower)) {
    return 'Saúde';
  }
  
  // Shopping
  if (/shopping|loja|magazine|amazon|mercado livre|compra/i.test(lower)) {
    return 'Compras';
  }
  
  // Transfers
  if (/pix|transferencia|ted|doc/i.test(lower)) {
    return 'Transferências';
  }
  
  return 'Outros';
}

/**
 * Aggregate transactions by month for chart data
 */
export function aggregateByMonth(transactions: ParsedEmailTransaction[]): {
  month: string;
  receitas: number;
  despesas: number;
}[] {
  const monthlyData: Record<string, { receitas: number; despesas: number }> = {};
  
  for (const t of transactions) {
    const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { receitas: 0, despesas: 0 };
    }
    
    if (t.type === 'credit') {
      monthlyData[monthKey].receitas += t.amount;
    } else {
      monthlyData[monthKey].despesas += t.amount;
    }
  }
  
  // Sort by month and convert to array
  const sortedKeys = Object.keys(monthlyData).sort();
  
  return sortedKeys.map(key => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return {
      month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      receitas: Math.round(monthlyData[key].receitas * 100) / 100,
      despesas: Math.round(monthlyData[key].despesas * 100) / 100,
    };
  });
}

/**
 * Aggregate transactions by category for pie chart
 */
export function aggregateByCategory(transactions: ParsedEmailTransaction[]): {
  name: string;
  value: number;
  type: 'credit' | 'debit';
}[] {
  const categoryData: Record<string, { credit: number; debit: number }> = {};
  
  for (const t of transactions) {
    const category = t.category || 'Outros';
    
    if (!categoryData[category]) {
      categoryData[category] = { credit: 0, debit: 0 };
    }
    
    if (t.type === 'credit') {
      categoryData[category].credit += t.amount;
    } else {
      categoryData[category].debit += t.amount;
    }
  }
  
  const result: { name: string; value: number; type: 'credit' | 'debit' }[] = [];
  
  for (const [name, data] of Object.entries(categoryData)) {
    if (data.credit > 0) {
      result.push({ name, value: Math.round(data.credit * 100) / 100, type: 'credit' });
    }
    if (data.debit > 0) {
      result.push({ name, value: Math.round(data.debit * 100) / 100, type: 'debit' });
    }
  }
  
  return result.sort((a, b) => b.value - a.value);
}
