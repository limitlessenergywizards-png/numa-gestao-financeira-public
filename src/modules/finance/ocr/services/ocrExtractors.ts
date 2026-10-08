// Centralized OCR data extractors for Brazilian financial documents

export interface ExtractedOcrData {
  amount?: string;
  dueDate?: string;
  description?: string;
  documentNumber?: string;
  documentType?: string;
  rawText: string;
}

// Document type patterns for Brazilian documents
export const DOCUMENT_PATTERNS = {
  notaFiscal: {
    chaveAcesso: /\d{44}/,
    numeroNf: /(?:NF-?e?|Nota\s*Fiscal|DANFE)[\s:\-nº]*(\d+)/gi,
    header: /(?:NOTA\s*FISCAL|NF-?e|DANFE)/gi,
  },
  cupomFiscal: {
    header: /(?:CUPOM\s*FISCAL|CF-?e\s*SAT|CUPOM\s*FISCAL\s*ELETR[OÔ]NICO)/gi,
    sat: /(?:SAT|CF-e)[\s:\-nº]*(\d+)/gi,
    serie: /(?:S[ÉE]RIE)[\s:\-]*(\d+)/gi,
  },
  boleto: {
    linhaDigitavel: /\d{5}\.?\d{5}\s*\d{5}\.?\d{6}\s*\d{5}\.?\d{6}\s*\d\s*\d{14}/,
    codigoBarras: /\d{47,48}/,
    header: /(?:BOLETO|FICHA\s*DE\s*COMPENSA[ÇC][ÃA]O)/gi,
  },
  pix: {
    header: /(?:PIX|COMPROVANTE\s*PIX|TRANSFER[ÊE]NCIA\s*PIX)/gi,
    idTransacao: /(?:ID|E2E|Transa[çc][ãa]o|Identifica[çc][ãa]o)[\s:\-]*([A-Z0-9]+)/gi,
    chave: /(?:Chave\s*PIX|Chave)[\s:\-]*(.+)/gi,
  },
  contaFatura: {
    header: /(?:CONTA|FATURA|DEMONSTRATIVO)/gi,
    codigoCliente: /(?:C[ÓO]DIGO\s*(?:DO\s*)?CLIENTE|MATR[ÍI]CULA)[\s:\-]*(\d+)/gi,
    referencia: /(?:REF(?:ER[ÊE]NCIA)?|M[ÊE]S\s*REF)[\s:\-]*(\d{2}\/\d{4})/gi,
  },
  recibo: {
    header: /(?:RECIBO|COMPROVANTE\s*DE\s*PAGAMENTO)/gi,
    numero: /(?:N[ÚU]MERO|N[ºO])[\s:\-]*(\d+)/gi,
  },
};

// Extract currency value from text (Brazilian format)
export const extractAmount = (text: string): string | undefined => {
  const patterns = [
    /R\$\s*([\d.,]+)/gi,
    /(?:valor|total|quantia|import[aâ]ncia|vlr|vl)[\s:]*R?\$?\s*([\d.,]+)/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = match[1]?.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(value);
      if (!isNaN(num) && num > 0 && num < 10000000) {
        return num.toFixed(2);
      }
    }
  }

  // Try to find any number that looks like currency (Brazilian format)
  const genericPattern = /(\d{1,3}(?:\.\d{3})*,\d{2})/g;
  const matches = text.matchAll(genericPattern);
  for (const match of matches) {
    const value = match[1].replace(/\./g, '').replace(',', '.');
    const num = parseFloat(value);
    if (!isNaN(num) && num > 10 && num < 10000000) {
      return num.toFixed(2);
    }
  }

  return undefined;
};

// Extract date from text (Brazilian format DD/MM/YYYY)
export const extractDate = (text: string): string | undefined => {
  const patterns = [
    /(?:vencimento|venc|data\s*venc|validade|dt\.?\s*venc)[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4})/gi,
    /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/g,
    /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2})/g,
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const dateStr = match[1];
      const parts = dateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        let day = parseInt(parts[0]);
        let month = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        
        if (year < 100) year += 2000;
        
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2030) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }
  }

  return undefined;
};

// Extract document number
export const extractDocumentNumber = (text: string): string | undefined => {
  const patterns = [
    /(?:nota\s*fiscal|nf|documento|doc|n[úu]mero|num|n[ºo])[\s:\-nº]*(\d+)/gi,
    /(?:boleto|fatura|recibo)[\s:\-nº]*(\d+)/gi,
    /(?:chave\s*de\s*acesso)[\s:\-]*(\d{44})/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      return match[1];
    }
  }

  // Try to find 44-digit access key for NF-e
  const chaveMatch = text.match(/\d{44}/);
  if (chaveMatch) {
    return chaveMatch[0];
  }

  return undefined;
};

// Extract description from text
export const extractDescription = (text: string): string | undefined => {
  const patterns = [
    /(?:descri[çc][ãa]o|referente|ref|servi[çc]o|produto|hist[óo]rico)[\s:\-]*([\w\s]+)/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      const desc = match[1].trim().substring(0, 100);
      if (desc.length > 5) return desc;
    }
  }

  // Get first meaningful line as description
  const lines = text.split('\n').filter(l => l.trim().length > 10);
  if (lines.length > 0) {
    return lines[0].trim().substring(0, 100);
  }

  return undefined;
};

// Detect document type from text
export const detectDocumentType = (text: string): string => {
  const upperText = text.toUpperCase();
  
  if (DOCUMENT_PATTERNS.notaFiscal.header.test(upperText)) {
    return 'Nota Fiscal';
  }
  if (DOCUMENT_PATTERNS.cupomFiscal.header.test(upperText)) {
    return 'Cupom Fiscal';
  }
  if (DOCUMENT_PATTERNS.boleto.header.test(upperText) || DOCUMENT_PATTERNS.boleto.linhaDigitavel.test(text)) {
    return 'Boleto';
  }
  if (DOCUMENT_PATTERNS.pix.header.test(upperText)) {
    return 'Comprovante PIX';
  }
  if (DOCUMENT_PATTERNS.contaFatura.header.test(upperText)) {
    return 'Conta/Fatura';
  }
  if (DOCUMENT_PATTERNS.recibo.header.test(upperText)) {
    return 'Recibo';
  }
  
  return 'Documento';
};

// Main extraction function
export const extractDataFromText = (text: string): ExtractedOcrData => {
  return {
    amount: extractAmount(text),
    dueDate: extractDate(text),
    description: extractDescription(text),
    documentNumber: extractDocumentNumber(text),
    documentType: detectDocumentType(text),
    rawText: text,
  };
};
