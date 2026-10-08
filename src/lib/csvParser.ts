/**
 * CSV Parser - Parse Nubank CSV bank statement files
 * Format: Data,Valor,Identificador,Descrição
 */

import { OFXTransaction, OFXParseResult, cleanDescription } from './ofxParser';

/**
 * Parse a single CSV line handling quoted fields (descriptions may contain commas)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse a date string in DD/MM/YYYY format
 */
function parseBRDate(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  return new Date(year, month, day);
}

/**
 * Detect if the content is a valid Nubank CSV
 */
export function isNubankCSV(content: string): boolean {
  const firstLine = content.split('\n')[0]?.trim();
  if (!firstLine) return false;

  // Check for Nubank CSV header
  const normalized = firstLine.toLowerCase().replace(/\s/g, '');
  return normalized.includes('data,valor,identificador,descri');
}

/**
 * Validate a CSV file by extension
 */
export function isValidCSVFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.csv');
}

/**
 * Parse Nubank CSV content into the same OFXParseResult format
 */
export function parseCSV(content: string): OFXParseResult {
  const errors: string[] = [];
  const transactions: OFXTransaction[] = [];

  const lines = content.split('\n').filter(l => l.trim().length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      transactions: [],
      errors: ['Arquivo CSV vazio ou sem transações'],
    };
  }

  // Validate header
  const header = lines[0].toLowerCase();
  if (!header.includes('data') || !header.includes('valor')) {
    return {
      success: false,
      transactions: [],
      errors: ['Formato CSV não reconhecido. Esperado: Data,Valor,Identificador,Descrição'],
    };
  }

  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  // Parse each data line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    if (fields.length < 4) {
      errors.push(`Linha ${i + 1}: formato inválido (${fields.length} campos, esperado 4)`);
      continue;
    }

    const [dateStr, valorStr, identificador, descricao] = fields;

    // Parse date
    const date = parseBRDate(dateStr);
    if (!date) {
      errors.push(`Linha ${i + 1}: data inválida "${dateStr}"`);
      continue;
    }

    // Parse amount
    const rawAmount = parseFloat(valorStr.replace(',', '.'));
    if (isNaN(rawAmount)) {
      errors.push(`Linha ${i + 1}: valor inválido "${valorStr}"`);
      continue;
    }

    // Determine type based on sign
    const isCredit = rawAmount > 0;
    const amount = Math.abs(rawAmount);

    // Apply Nubank description cleaning
    const cleanedDescription = cleanDescription(descricao, 'Nubank');

    const transaction: OFXTransaction = {
      fitid: identificador || `csv-${dateStr}-${i}`,
      date,
      description: cleanedDescription,
      amount,
      type: isCredit ? 'credit' : 'debit',
      memo: descricao, // Keep original description as memo
    };

    transactions.push(transaction);

    // Track date range
    if (!minDate || date < minDate) minDate = date;
    if (!maxDate || date > maxDate) maxDate = date;
  }

  return {
    success: transactions.length > 0,
    bankId: '260',
    bankName: 'Nubank',
    orgName: 'Nubank',
    accountType: 'CHECKING',
    startDate: minDate || undefined,
    endDate: maxDate || undefined,
    transactions,
    errors,
  };
}
