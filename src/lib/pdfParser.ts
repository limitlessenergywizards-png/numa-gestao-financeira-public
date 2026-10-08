/**
 * PDF Parser - Parse Nubank PDF bank statement files
 * Uses pdfjs-dist for client-side text extraction
 */

import { OFXTransaction, OFXParseResult, cleanDescription } from './ofxParser';

/**
 * Validate a PDF file by extension
 */
export function isValidPDFFile(file: File): boolean {
    const name = file.name.toLowerCase();
    return name.endsWith('.pdf');
}

/**
 * Read a File as ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse a date string in DD/MM/YYYY format
 */
function parseBRDate(dateStr: string): Date | null {
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    return new Date(year, month, day);
}

/**
 * Parse a Brazilian currency value (e.g. "1.234,56" or "-1.234,56" or "R$ 1.234,56")
 */
function parseBRCurrency(value: string): number | null {
    // Remove R$, spaces, and non-breaking spaces
    let cleaned = value.replace(/R\$\s*/g, '').replace(/\s/g, '').trim();

    // Handle negative sign
    const isNegative = cleaned.startsWith('-') || cleaned.startsWith('−');
    if (isNegative) cleaned = cleaned.substring(1);

    // Brazilian format: 1.234,56 -> 1234.56
    // Remove thousand separators (dots), replace decimal comma with dot
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');

    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;

    return isNegative ? -num : num;
}

/**
 * Extract text from PDF using pdfjs-dist
 */
async function extractTextFromPDF(file: File): Promise<string[]> {
    // Dynamic import to avoid bundling issues
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
        pages.push(pageText);
    }

    return pages;
}

/**
 * Try to parse transaction lines from extracted PDF text.
 * Nubank PDF typically has lines like:
 *   DD/MM/YYYY  Description  R$ XX,XX  or  -R$ XX,XX
 *   DD/MM/YYYY  Description  XX,XX
 * 
 * This is a best-effort parser since PDFs have no structured format.
 */
function parseTransactionLines(fullText: string): OFXTransaction[] {
    const transactions: OFXTransaction[] = [];

    // Match date followed by text and a value
    // Common patterns in Nubank PDF:
    // DD/MM/YYYY [description text] [negative sign?] [R$?] [value]
    const linePattern = /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?\s*R?\$?\s*[\d.,]+)\s*$/gm;

    // Also try a simpler pattern: date, description, value on separate concepts
    const simplePattern = /(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+(-?[\d]+[.,][\d]{2})\b/g;

    // Try the more specific pattern first
    let match;
    const usedFitids = new Set<string>();

    // Use the simplePattern
    while ((match = simplePattern.exec(fullText)) !== null) {
        const dateStr = match[1];
        const description = match[2].trim();
        const valueStr = match[3];

        const date = parseBRDate(dateStr);
        if (!date) continue;

        const rawAmount = parseBRCurrency(valueStr);
        if (rawAmount === null || rawAmount === 0) continue;

        // Skip obviously non-transaction matches (like page numbers, headers)
        if (description.length < 3) continue;
        if (/^(página|page|saldo|total)/i.test(description)) continue;

        const isCredit = rawAmount > 0;
        const amount = Math.abs(rawAmount);

        // Generate a fitid from date + amount + description hash
        let fitid = `pdf-${dateStr}-${valueStr}-${description.substring(0, 10)}`;
        let counter = 0;
        while (usedFitids.has(fitid)) {
            counter++;
            fitid = `pdf-${dateStr}-${valueStr}-${description.substring(0, 10)}-${counter}`;
        }
        usedFitids.add(fitid);

        const cleanedDescription = cleanDescription(description, 'Nubank');

        transactions.push({
            fitid,
            date,
            description: cleanedDescription,
            amount,
            type: isCredit ? 'credit' : 'debit',
            memo: description,
        });
    }

    return transactions;
}

/**
 * Parse a PDF file into OFXParseResult
 */
export async function parsePDF(file: File): Promise<OFXParseResult> {
    try {
        const pages = await extractTextFromPDF(file);
        const fullText = pages.join('\n');

        const transactions = parseTransactionLines(fullText);

        if (transactions.length === 0) {
            return {
                success: false,
                transactions: [],
                errors: ['Não foi possível extrair transações do PDF. Tente usar o formato CSV ou OFX.'],
            };
        }

        // Sort by date
        transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

        const minDate = transactions[0]?.date;
        const maxDate = transactions[transactions.length - 1]?.date;

        return {
            success: true,
            bankName: 'Nubank',
            bankId: '260',
            orgName: 'Nubank',
            accountType: 'CHECKING',
            startDate: minDate,
            endDate: maxDate,
            transactions,
            errors: transactions.length < 10
                ? ['⚠️ Poucas transações encontradas. O formato PDF pode não capturar todas. Prefira CSV ou OFX.']
                : [],
        };
    } catch (error: any) {
        return {
            success: false,
            transactions: [],
            errors: [`Erro ao processar PDF: ${error.message}`],
        };
    }
}
