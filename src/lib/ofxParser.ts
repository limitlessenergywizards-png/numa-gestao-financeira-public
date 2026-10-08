/**
 * OFX Parser - Parse OFX/OFC bank statement files
 * Supports Brazilian banks (SGML-based OFX format)
 */

export interface OFXTransaction {
  fitid: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  memo?: string;
  checkNum?: string;
}

export interface OFXParseResult {
  success: boolean;
  bankId?: string;
  bankName?: string;
  orgName?: string;
  accountId?: string;
  accountType?: string;
  startDate?: Date;
  endDate?: Date;
  transactions: OFXTransaction[];
  balance?: number;
  balanceDate?: Date;
  errors: string[];
}

// Bank ID to name mapping for Brazilian banks
const bankIdMap: Record<string, string> = {
  '001': 'Banco do Brasil',
  '033': 'Santander',
  '104': 'Caixa',
  '237': 'Bradesco',
  '341': 'Itaú',
  '260': 'Nubank',
  '077': 'Inter',
  '208': 'BTG Pactual',
  '756': 'Sicoob',
  '748': 'Sicredi',
  '422': 'Safra',
  '212': 'Banco Original',
  '655': 'Neon',
  '380': 'PicPay',
  '323': 'Mercado Pago',
  '290': 'PagSeguro',
  '197': 'Stone',
  '102': 'XP Investimentos',
  '746': 'Modal',
  '536': 'Neon',
  '735': 'Neon',
  '637': 'Sofisa',
  '336': 'C6 Bank',
  '253': 'Bexs',
  '389': 'Mercantil do Brasil',
  '041': 'Banrisul',
  '070': 'BRB',
  '085': 'AILOS',
  '136': 'Unicred',
  '084': 'Uniprime',
};

/**
 * Detect bank name from OFX bank ID or organization name
 */
export function detectBankFromOFX(bankId?: string, orgName?: string): string | null {
  if (bankId && bankIdMap[bankId]) {
    return bankIdMap[bankId];
  }

  // Try to match from org name
  if (orgName) {
    const normalizedOrg = orgName.toLowerCase();
    if (normalizedOrg.includes('itau') || normalizedOrg.includes('itaú')) return 'Itaú';
    if (normalizedOrg.includes('bradesco')) return 'Bradesco';
    if (normalizedOrg.includes('santander')) return 'Santander';
    if (normalizedOrg.includes('brasil') || normalizedOrg.includes('bb')) return 'Banco do Brasil';
    if (normalizedOrg.includes('caixa') || normalizedOrg.includes('cef')) return 'Caixa';
    if (normalizedOrg.includes('nubank') || normalizedOrg.includes('nu pagamentos')) return 'Nubank';
    if (normalizedOrg.includes('inter')) return 'Inter';
    if (normalizedOrg.includes('btg')) return 'BTG Pactual';
    if (normalizedOrg.includes('sicoob')) return 'Sicoob';
    if (normalizedOrg.includes('sicredi')) return 'Sicredi';
    if (normalizedOrg.includes('c6')) return 'C6 Bank';
    if (normalizedOrg.includes('safra')) return 'Safra';
    if (normalizedOrg.includes('original')) return 'Banco Original';
    if (normalizedOrg.includes('neon')) return 'Neon';
    if (normalizedOrg.includes('picpay')) return 'PicPay';
    if (normalizedOrg.includes('mercado')) return 'Mercado Pago';
    if (normalizedOrg.includes('pag') && normalizedOrg.includes('seguro')) return 'PagSeguro';
    if (normalizedOrg.includes('stone')) return 'Stone';
    if (normalizedOrg.includes('xp')) return 'XP Investimentos';
    if (normalizedOrg.includes('modal')) return 'Modal';
    if (normalizedOrg.includes('next')) return 'Next';
    if (normalizedOrg.includes('will')) return 'Will Bank';
    if (normalizedOrg.includes('ame')) return 'Ame';
  }

  return null;
}

/**
 * Parse OFX content and extract transactions
 */
export function parseOFX(content: string): OFXParseResult {
  const result: OFXParseResult = {
    success: false,
    transactions: [],
    errors: [],
  };

  try {
    // Remove BOM if present
    let data = content.replace(/^\uFEFF/, '');

    // Handle both SGML and XML formats
    // Remove headers (everything before <OFX>)
    const ofxStart = data.indexOf('<OFX>');
    if (ofxStart === -1) {
      result.errors.push('Arquivo OFX inválido: tag <OFX> não encontrada');
      return result;
    }
    data = data.substring(ofxStart);

    // Extract bank info
    result.bankId = extractTag(data, 'BANKID');
    result.accountId = extractTag(data, 'ACCTID');
    result.accountType = extractTag(data, 'ACCTTYPE');

    // Extract organization name for bank detection
    result.orgName = extractTag(data, 'ORG');

    // Detect bank name
    result.bankName = detectBankFromOFX(result.bankId, result.orgName);

    // Extract statement dates
    const startDateStr = extractTag(data, 'DTSTART');
    const endDateStr = extractTag(data, 'DTEND');
    if (startDateStr) result.startDate = parseOFXDate(startDateStr);
    if (endDateStr) result.endDate = parseOFXDate(endDateStr);

    // Extract balance
    const balanceStr = extractTag(data, 'BALAMT');
    const balanceDateStr = extractTag(data, 'DTASOF');
    if (balanceStr) result.balance = parseFloat(balanceStr);
    if (balanceDateStr) result.balanceDate = parseOFXDate(balanceDateStr);

    // Extract transactions
    const transactions = extractTransactions(data);

    // Clean descriptions based on bank
    if (result.bankName) {
      result.transactions = transactions.map(t => ({
        ...t,
        description: cleanDescription(t.description, result.bankName!)
      }));
    } else {
      result.transactions = transactions;
    }

    result.success = transactions.length > 0 || !hasTransactionBlock(data);

    if (!result.success && transactions.length === 0) {
      result.errors.push('Nenhuma transação encontrada no arquivo');
    }

  } catch (error) {
    result.errors.push(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }

  return result;
}

/**
 * Check if the OFX has a transaction block
 */
function hasTransactionBlock(data: string): boolean {
  return data.includes('<STMTTRN>') || data.includes('<BANKTRANLIST>');
}

/**
 * Extract a single tag value from OFX content
 */
function extractTag(data: string, tagName: string): string | undefined {
  // Try SGML format: <TAG>value
  const sgmlRegex = new RegExp(`<${tagName}>([^<\\r\\n]+)`, 'i');
  const sgmlMatch = data.match(sgmlRegex);
  if (sgmlMatch) return sgmlMatch[1].trim();

  // Try XML format: <TAG>value</TAG>
  const xmlRegex = new RegExp(`<${tagName}>([^<]+)</${tagName}>`, 'i');
  const xmlMatch = data.match(xmlRegex);
  if (xmlMatch) return xmlMatch[1].trim();

  return undefined;
}

/**
 * Extract all transactions from OFX content
 */
function extractTransactions(data: string): OFXTransaction[] {
  const transactions: OFXTransaction[] = [];

  // Find all STMTTRN blocks
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|<\/STMTTRN>|$)/gi;
  let match;

  while ((match = stmtTrnRegex.exec(data)) !== null) {
    const block = match[1];

    const trnType = extractTag(block, 'TRNTYPE');
    const dateStr = extractTag(block, 'DTPOSTED');
    const amountStr = extractTag(block, 'TRNAMT');
    const fitid = extractTag(block, 'FITID');
    const memo = extractTag(block, 'MEMO') || extractTag(block, 'NAME');
    const checkNum = extractTag(block, 'CHECKNUM');

    if (dateStr && amountStr && fitid) {
      const amount = parseFloat(amountStr.replace(',', '.'));
      const date = parseOFXDate(dateStr);

      if (date && !isNaN(amount)) {
        transactions.push({
          fitid,
          date,
          description: memo || trnType || 'Sem descrição',
          amount: Math.abs(amount),
          type: amount >= 0 ? 'credit' : 'debit',
          memo,
          checkNum,
        });
      }
    }
  }

  return transactions;
}

/**
 * Parse OFX date format (YYYYMMDD or YYYYMMDDHHMMSS)
 */
function parseOFXDate(dateStr: string): Date {
  // Remove timezone info if present [timezone]
  const cleanDate = dateStr.split('[')[0].trim();

  const year = parseInt(cleanDate.substring(0, 4), 10);
  const month = parseInt(cleanDate.substring(4, 6), 10) - 1;
  const day = parseInt(cleanDate.substring(6, 8), 10);

  let hours = 0, minutes = 0, seconds = 0;
  if (cleanDate.length >= 14) {
    hours = parseInt(cleanDate.substring(8, 10), 10);
    minutes = parseInt(cleanDate.substring(10, 12), 10);
    seconds = parseInt(cleanDate.substring(12, 14), 10);
  }

  return new Date(year, month, day, hours, minutes, seconds);
}

/**
 * Validate if a file is an OFX file
 */
export function isValidOFXFile(file: File): boolean {
  const validExtensions = ['.ofx', '.ofc', '.qfx'];
  const fileName = file.name.toLowerCase();
  return validExtensions.some(ext => fileName.endsWith(ext));
}


/**
 * Clean description based on bank patterns
 * Currently supports Nubank
 */
export function cleanDescription(description: string, bankName?: string): string {
  if (!description) return '';

  // Normalize string to avoid encoding issues and case sensitivity
  const normalizedDesc = description.trim();

  if (bankName === 'Nubank') {
    // Nubank specific patterns

    // Pix sent/received
    // Ex: Transferência enviada pelo Pix - Nome - CPF - Banco...
    const pixPattern = /Transferência (?:enviada|recebida|Recebida)(?: pelo Pix)? - (.*?) -/i;
    const pixMatch = normalizedDesc.match(pixPattern);
    if (pixMatch && pixMatch[1]) return pixMatch[1].trim();

    // Debit purchase
    // Ex: Compra no débito - Estabelecimento
    const debitPattern = /Compra no débito - (.*)/i;
    const debitMatch = normalizedDesc.match(debitPattern);
    if (debitMatch && debitMatch[1]) return debitMatch[1].trim();

    // Card payments? (need sample, but usually "Pagamento de fatura")
  }

  return normalizedDesc;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Falha ao ler arquivo'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    // Try reading as windows-1252 first (common for Brazilian banks)
    reader.readAsText(file, 'windows-1252');
  });
}
