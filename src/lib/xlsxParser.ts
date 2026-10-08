import { OFXParseResult, OFXTransaction } from './ofxParser';
import { parse, isValid, format } from 'date-fns';
import { aiOcr } from '@/modules/finance/ocr/services/aiOcr';

/**
 * OPTIMIZATION: Dynamic import of xlsx (~700KB).
 * Before: Static import loaded xlsx into reconciliation module chunk eagerly.
 * After:  Loaded on-demand only when parseXLSX is actually called.
 */
async function loadXLSX() {
  const XLSX = await import('xlsx');
  return XLSX;
}

/**
 * Common column names found in Brazilian bank statements
 */
const DATE_COLUMNS = ['data', 'date', 'data lancamento', 'data do lancamento', 'dia'];
const DESC_COLUMNS = ['descricao', 'historico', 'lancamento', 'detalhe', 'descrição', 'histórico', 'lançamento'];
const VAL_COLUMNS = ['valor', 'value', 'quantia', 'importancia', 'importância'];
const DOC_COLUMNS = ['documento', 'numero', 'doc', 'nr. doc', 'nº doc', 'número'];

/**
 * Tries to parse different date formats found in Excel
 */
function attemptDateParsing(value: any): Date | null {
    if (!value) return null;

    // If it's already a JS Date (from XLSX cell format 'd')
    if (value instanceof Date) {
        if (isValid(value)) return value;
    }

    // If it's an Excel serial date number
    if (typeof value === 'number') {
        // Excel dates are days since 1899-12-30 (for Windows 1900 date system)
        const date = new Date((value - 25569) * 86400 * 1000);
        // Add timezone offset to prevent shifting day backwards
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        if (isValid(date)) return date;
    }

    // If it's a string, try common Brazilian formats
    if (typeof value === 'string') {
        const cleanStr = value.trim();
        const formats = [
            'dd/MM/yyyy',
            'd/M/yyyy',
            'yyyy-MM-dd',
            'dd/MM/yy',
            'dd-MM-yyyy'
        ];

        for (const fmt of formats) {
            const parsed = parse(cleanStr, fmt, new Date());
            if (isValid(parsed) && parsed.getFullYear() > 2000) {
                return parsed;
            }
        }
    }

    return null;
}

/**
 * Tries to convert a generic value (could be string with R$ or pt-BR commas) into a number
 */
function attemptAmountParsing(value: any): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    if (typeof value === 'string') {
        // Remove R$, spaces, thousand separators (dots), and replace decimal comma with dot
        let cleanVal = value.replace(/R\$\s*/gi, '').trim();

        // Check if it's Brazilian format (1.234,56) vs US format (1,234.56)
        if (cleanVal.includes(',') && cleanVal.includes('.')) {
            if (cleanVal.indexOf(',') > cleanVal.indexOf('.')) {
                // Brazilian format: remove dots, change comma to dot
                cleanVal = cleanVal.replace(/\./g, '').replace(',', '.');
            } else {
                // US format: remove commas
                cleanVal = cleanVal.replace(/,/g, '');
            }
        } else if (cleanVal.includes(',')) {
            // Only commas (e.g. 1234,56)
            cleanVal = cleanVal.replace(',', '.');
        }

        const parsed = parseFloat(cleanVal);
        if (!isNaN(parsed)) return parsed;
    }

    return 0;
}

export async function parseXLSX(file: File): Promise<OFXParseResult> {
    const XLSX = await loadXLSX();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });

                // Assume the first sheet has the statement
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON array of arrays to have raw access
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

                if (!jsonData || jsonData.length === 0) {
                    throw new Error("Planilha vazia ou em formato não reconhecido.");
                }

                let headerRowIndex = -1;
                let dateColIdx = -1;
                let descColIdx = -1;
                let valColIdx = -1;
                let docColIdx = -1;

                // Find the header row by searching for common keywords
                for (let r = 0; r < Math.min(jsonData.length, 20); r++) {
                    const row = jsonData[r];
                    if (!row || row.length === 0) continue;

                    let foundDate = -1;
                    let foundVal = -1;

                    for (let c = 0; c < row.length; c++) {
                        const cellVal = String(row[c] || '').toLowerCase().trim();
                        if (DATE_COLUMNS.includes(cellVal)) foundDate = c;
                        if (VAL_COLUMNS.includes(cellVal)) foundVal = c;
                        if (DESC_COLUMNS.includes(cellVal)) descColIdx = c;
                        if (DOC_COLUMNS.includes(cellVal)) docColIdx = c;
                    }

                    // Let's assume a row is a header if it has at least 'Date' and 'Value'
                    if (foundDate !== -1 && foundVal !== -1) {
                        headerRowIndex = r;
                        dateColIdx = foundDate;
                        valColIdx = foundVal;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    throw new Error("Não foi possível identificar as colunas 'Data' e 'Valor' na planilha Excel.");
                }

                const transactions: OFXTransaction[] = [];
                const errors: string[] = [];

                // Parse rows below the header
                for (let r = headerRowIndex + 1; r < jsonData.length; r++) {
                    const row = jsonData[r];
                    if (!row || row.length === 0) continue;

                    // If the date column is completely empty, it might be an empty row or a footer row
                    if (row[dateColIdx] === null || row[dateColIdx] === undefined || row[dateColIdx] === '') continue;

                    const date = attemptDateParsing(row[dateColIdx]);
                    const amount = attemptAmountParsing(row[valColIdx]);

                    if (!date) {
                        // Might be a trailing text row or summary row
                        continue;
                    }

                    // Fallback missing descriptions
                    let description = descColIdx !== -1 && row[descColIdx] ? String(row[descColIdx]).trim() : 'Lançamento sem descrição';
                    const documentNumber = docColIdx !== -1 && row[docColIdx] ? String(row[docColIdx]).trim() : undefined;

                    // Some banks have "Débito" and "Crédito" columns separated. Let's see if we only found one Value column
                    // or if amount is 0, we might need to look for a Credit column if VAL_COLUMNS matched "débito"
                    // For now, assume a single column with positive/negative or C/D indicator.
                    // Because we only found one valColIdx, we trust `amount`.

                    if (amount === 0) {
                        // Skip zero-value transactions found in headers/footers
                        continue;
                    }

                    // Build fitid (unique ID) based on date + amount + description length to avoid collisons
                    const dateStr = format(date, 'yyyyMMdd');
                    const absAmount = Math.abs(amount * 100);
                    const fitid = `${dateStr}-${absAmount}-${description.length}-${r}`;

                    transactions.push({
                        fitid: fitid,
                        date: date,
                        amount: amount,
                        type: amount >= 0 ? 'credit' : 'debit',
                        description: description
                    });
                }

                if (transactions.length === 0) {
                    throw new Error("Nenhuma transação válida encontrada nativamente.");
                }

                // Sort by date ascending
                transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

                const result: OFXParseResult = {
                    bankName: "Importação Excel",
                    accountId: "",
                    transactions,
                    startDate: transactions.length > 0 ? transactions[0].date : undefined,
                    endDate: transactions.length > 0 ? transactions[transactions.length - 1].date : undefined,
                    errors,
                    success: true
                };

                resolve(result);

            } catch (err: any) {
                // FALLBACK: Use AI to extract transactions if native logic fails
                try {
                    if (process.env.NODE_ENV !== 'production') console.log("Native XLSX parsing failed, trying AI fallback...", err.message);
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: false, cellText: false });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });

                    // Take up to 150 rows to avoid token explosion
                    const slicedData = jsonData.slice(0, 150);
                    // Convert to text blocks
                    const textLines = slicedData
                        .map(row => row.filter(cell => cell !== null && cell !== undefined && cell !== '').join(' | '))
                        .filter(line => line.length > 0)
                        .join('\n');

                    if (textLines.length < 10) {
                        throw new Error("Planilha parece estar vazia.");
                    }

                    let extractedData = null;
                    let aiSuccess = false;

                    // 1. Try Gemini
                    if (aiOcr.isGeminiConfigured()) {
                        try {
                            extractedData = await aiOcr.extractTransactionsFromTextGemini(textLines);
                            aiSuccess = true;
                        } catch (e) { console.error("Gemini fallback failed", e); }
                    }

                    // 2. Try OpenAI
                    if (!aiSuccess && aiOcr.isOpenAIConfigured()) {
                        try {
                            extractedData = await aiOcr.extractTransactionsFromTextOpenAI(textLines);
                            aiSuccess = true;
                        } catch (e) { console.error("OpenAI fallback failed", e); }
                    }

                    if (!aiSuccess || !extractedData || !Array.isArray(extractedData) || extractedData.length === 0) {
                        throw new Error(`Erro ao ler Excel: Formato não reconhecido e IA falhou. Certifique-se de que a planilha possui as colunas Data, Descrição e Valor.`);
                    }

                    // Map AI ExtractedOcrData to OFXTransaction
                    const transactions: OFXTransaction[] = extractedData.map((item, index) => {
                        const parsedDate = parse(item.dueDate || '', 'yyyy-MM-dd', new Date());
                        const amountStr = String(item.amount || '0').replace(',', '.');
                        let parsedAmount = parseFloat(amountStr);
                        if (isNaN(parsedAmount)) parsedAmount = 0;

                        const dateStr = format(parsedDate, 'yyyyMMdd');
                        const absAmount = Math.abs(parsedAmount * 100);
                        const desc = item.description || 'Lançamento via IA';
                        const fitid = `${dateStr}-${absAmount}-${desc.length}-${index}-AI`;

                        return {
                            fitid: fitid,
                            date: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
                            amount: parsedAmount,
                            type: parsedAmount >= 0 ? 'credit' : 'debit',
                            description: desc
                        };
                    });

                    // Sort by date ascending
                    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

                    resolve({
                        bankName: "Excel (Análise IA)",
                        accountId: "",
                        transactions,
                        startDate: transactions.length > 0 ? transactions[0].date : undefined,
                        endDate: transactions.length > 0 ? transactions[transactions.length - 1].date : undefined,
                        errors: ["Esta planilha estava fora do padrão, os dados foram extraídos via Inteligência Artificial. Revise-os atentamente."],
                        success: true
                    });

                } catch (fallbackErr: any) {
                    reject(new Error(fallbackErr.message || "Erro ao carregar e analisar a planilha."));
                }
            }
        };

        reader.onerror = () => {
            reject(new Error("Erro ao carregar o arquivo"));
        };

        reader.readAsArrayBuffer(file);
    });
}
