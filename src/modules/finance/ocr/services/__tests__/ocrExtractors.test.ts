import { describe, it, expect } from 'vitest';
import {
  extractAmount,
  extractDate,
  extractDocumentNumber,
  extractDescription,
  detectDocumentType,
  extractDataFromText,
} from '../ocrExtractors';

// ================================================================
// extractAmount()
// ================================================================
describe('extractAmount()', () => {
  it('R$ 1.500,00 → 1500.00', () => {
    expect(extractAmount('Total: R$ 1.500,00')).toBe('1500.00');
  });

  it('R$ 50,00 → 50.00', () => {
    expect(extractAmount('Valor: R$ 50,00')).toBe('50.00');
  });

  it('valor: 250,50 → 250.50', () => {
    expect(extractAmount('valor: 250,50')).toBe('250.50');
  });

  it('R$99,99 (no space) → 99.99', () => {
    expect(extractAmount('R$99,99')).toBe('99.99');
  });

  it('Brazilian format without R$: 1.200,00 → 1200.00', () => {
    expect(extractAmount('pagamento de 1.200,00 reais')).toBe('1200.00');
  });

  it('amount > 10M → ignored', () => {
    expect(extractAmount('R$ 99.999.999,00')).toBeUndefined();
  });

  it('no amount → undefined', () => {
    expect(extractAmount('sem valores aqui')).toBeUndefined();
  });

  it('vlr format → extracted', () => {
    expect(extractAmount('vlr: 350,00')).toBe('350.00');
  });
});

// ================================================================
// extractDate()
// ================================================================
describe('extractDate()', () => {
  it('vencimento: DD/MM/YYYY → ISO format', () => {
    expect(extractDate('vencimento: 15/03/2026')).toBe('2026-03-15');
  });

  it('data venc: DD/MM/YYYY → ISO', () => {
    expect(extractDate('data venc: 01/06/2026')).toBe('2026-06-01');
  });

  it('DD/MM/YYYY standalone → ISO', () => {
    expect(extractDate('emissão em 20/12/2025')).toBe('2025-12-20');
  });

  it('DD-MM-YYYY separator → ISO', () => {
    expect(extractDate('data: 05-01-2026')).toBe('2026-01-05');
  });

  it('2-digit year (DD/MM/YY) → adds 2000', () => {
    expect(extractDate('venc: 10/05/26')).toBe('2026-05-10');
  });

  it('invalid day (32) → undefined', () => {
    expect(extractDate('32/01/2026')).toBeUndefined();
  });

  it('invalid month (13) → undefined', () => {
    expect(extractDate('15/13/2026')).toBeUndefined();
  });

  it('year out of range (1985) → undefined', () => {
    expect(extractDate('15/03/1985')).toBeUndefined();
  });

  it('no date → undefined', () => {
    expect(extractDate('sem data aqui')).toBeUndefined();
  });
});

// ================================================================
// extractDocumentNumber()
// ================================================================
describe('extractDocumentNumber()', () => {
  it('nota fiscal nº 12345 → 12345', () => {
    expect(extractDocumentNumber('nota fiscal nº 12345')).toBe('12345');
  });

  it('NF 67890 → 67890', () => {
    expect(extractDocumentNumber('NF 67890')).toBe('67890');
  });

  it('documento: 999 → 999', () => {
    expect(extractDocumentNumber('documento: 999')).toBe('999');
  });

  it('44-digit access key → full key', () => {
    const key = '12345678901234567890123456789012345678901234';
    expect(extractDocumentNumber(`chave: ${key}`)).toBe(key);
  });

  it('standalone 44-digit key → extracted', () => {
    const key = '12345678901234567890123456789012345678901234';
    expect(extractDocumentNumber(`dados ${key} aqui`)).toBe(key);
  });

  it('no document number → undefined', () => {
    expect(extractDocumentNumber('sem número')).toBeUndefined();
  });
});

// ================================================================
// extractDescription()
// ================================================================
describe('extractDescription()', () => {
  it('descrição: text → extracts text', () => {
    const result = extractDescription('descrição: Pagamento de aluguel mensal');
    expect(result).toContain('Pagamento de aluguel');
  });

  it('referente: text → extracts text', () => {
    const result = extractDescription('referente: Serviço de consultoria');
    expect(result).toContain('consultoria');
  });

  it('no label → falls back to first meaningful line', () => {
    const text = 'short\nThis is a longer description line for testing\nAnother line';
    const result = extractDescription(text);
    expect(result).toContain('longer description');
  });

  it('truncates at 100 characters', () => {
    const longText = 'descrição: ' + 'A'.repeat(200);
    const result = extractDescription(longText);
    expect(result!.length).toBeLessThanOrEqual(100);
  });

  it('no meaningful content → undefined', () => {
    expect(extractDescription('ab\ncd\nef')).toBeUndefined();
  });
});

// ================================================================
// detectDocumentType()
// ================================================================
describe('detectDocumentType()', () => {
  it('NOTA FISCAL → Nota Fiscal', () => {
    expect(detectDocumentType('NOTA FISCAL ELETRÔNICA')).toBe('Nota Fiscal');
  });

  it('CUPOM FISCAL → Cupom Fiscal', () => {
    expect(detectDocumentType('CUPOM FISCAL ELETRÔNICO SAT')).toBe('Cupom Fiscal');
  });

  it('BOLETO → Boleto', () => {
    expect(detectDocumentType('BOLETO BANCÁRIO')).toBe('Boleto');
  });

  it('COMPROVANTE PIX → Comprovante PIX', () => {
    expect(detectDocumentType('COMPROVANTE PIX enviado')).toBe('Comprovante PIX');
  });

  it('CONTA/FATURA → Conta/Fatura', () => {
    expect(detectDocumentType('DEMONSTRATIVO DE FATURA')).toBe('Conta/Fatura');
  });

  it('RECIBO → Recibo', () => {
    expect(detectDocumentType('RECIBO DE PAGAMENTO')).toBe('Recibo');
  });

  it('unknown text → Documento', () => {
    expect(detectDocumentType('algum texto genérico')).toBe('Documento');
  });
});

// ================================================================
// extractDataFromText() — integration
// ================================================================
describe('extractDataFromText()', () => {
  it('extracts all fields from a complete document', () => {
    const text = `
NOTA FISCAL ELETRÔNICA
NF nº 12345
Vencimento: 15/03/2026
Valor Total: R$ 1.500,00
Descrição: Serviço de consultoria empresarial
    `;
    const result = extractDataFromText(text);

    expect(result.documentType).toBe('Nota Fiscal');
    expect(result.amount).toBe('1500.00');
    expect(result.dueDate).toBe('2026-03-15');
    expect(result.documentNumber).toBe('12345');
    expect(result.description).toBeDefined();
    expect(result.rawText).toBe(text);
  });

  it('handles empty text', () => {
    const result = extractDataFromText('');
    expect(result.amount).toBeUndefined();
    expect(result.dueDate).toBeUndefined();
    expect(result.documentType).toBe('Documento');
    expect(result.rawText).toBe('');
  });
});
