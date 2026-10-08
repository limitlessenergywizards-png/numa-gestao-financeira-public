import { describe, it, expect } from 'vitest';
import {
  detectBankFromOFX,
  parseOFX,
  cleanDescription,
  isValidOFXFile,
} from '../ofxParser';

// ================================================================
// detectBankFromOFX()
// ================================================================
describe('detectBankFromOFX()', () => {
  it('maps bank ID 001 → Banco do Brasil', () => {
    expect(detectBankFromOFX('001')).toBe('Banco do Brasil');
  });

  it('maps bank ID 341 → Itaú', () => {
    expect(detectBankFromOFX('341')).toBe('Itaú');
  });

  it('maps bank ID 260 → Nubank', () => {
    expect(detectBankFromOFX('260')).toBe('Nubank');
  });

  it('maps bank ID 237 → Bradesco', () => {
    expect(detectBankFromOFX('237')).toBe('Bradesco');
  });

  it('maps bank ID 336 → C6 Bank', () => {
    expect(detectBankFromOFX('336')).toBe('C6 Bank');
  });

  it('unknown bank ID → null', () => {
    expect(detectBankFromOFX('999')).toBeNull();
  });

  it('no arguments → null', () => {
    expect(detectBankFromOFX()).toBeNull();
  });

  // Org name fallback
  it('orgName "Itaú Unibanco" → Itaú', () => {
    expect(detectBankFromOFX(undefined, 'Itaú Unibanco')).toBe('Itaú');
  });

  it('orgName "itau" (lowercase) → Itaú', () => {
    expect(detectBankFromOFX(undefined, 'itau')).toBe('Itaú');
  });

  it('orgName "BRADESCO S.A." → Bradesco', () => {
    expect(detectBankFromOFX(undefined, 'BRADESCO S.A.')).toBe('Bradesco');
  });

  it('orgName "Nu Pagamentos" → Nubank', () => {
    expect(detectBankFromOFX(undefined, 'Nu Pagamentos')).toBe('Nubank');
  });

  it('orgName "Caixa Econômica" → Caixa', () => {
    expect(detectBankFromOFX(undefined, 'Caixa Econômica')).toBe('Caixa');
  });

  it('orgName "CEF" → Caixa', () => {
    expect(detectBankFromOFX(undefined, 'CEF')).toBe('Caixa');
  });

  it('orgName "BB" → Banco do Brasil', () => {
    expect(detectBankFromOFX(undefined, 'BB')).toBe('Banco do Brasil');
  });

  it('orgName "C6 Bank" → C6 Bank', () => {
    expect(detectBankFromOFX(undefined, 'C6 Bank')).toBe('C6 Bank');
  });

  it('orgName "PagSeguro" → PagSeguro', () => {
    expect(detectBankFromOFX(undefined, 'PagSeguro S.A.')).toBe('PagSeguro');
  });

  it('bank ID takes precedence over orgName', () => {
    expect(detectBankFromOFX('341', 'Bradesco')).toBe('Itaú');
  });

  it('unknown orgName → null', () => {
    expect(detectBankFromOFX(undefined, 'Unknown Bank')).toBeNull();
  });
});

// ================================================================
// cleanDescription()
// ================================================================
describe('cleanDescription()', () => {
  it('empty description → empty string', () => {
    expect(cleanDescription('')).toBe('');
  });

  it('non-Nubank bank → returns trimmed original', () => {
    expect(cleanDescription('  Compra  ', 'Itaú')).toBe('Compra');
  });

  it('no bank → returns trimmed original', () => {
    expect(cleanDescription('  Pagamento  ')).toBe('Pagamento');
  });

  // Nubank Pix patterns
  it('Nubank: Pix enviado → extracts recipient name', () => {
    const desc = 'Transferência enviada pelo Pix - João Silva - CPF 123 - Banco Inter';
    expect(cleanDescription(desc, 'Nubank')).toBe('João Silva');
  });

  it('Nubank: Pix recebida → extracts sender name', () => {
    const desc = 'Transferência Recebida pelo Pix - Maria Santos - CPF 456 - Nubank';
    expect(cleanDescription(desc, 'Nubank')).toBe('Maria Santos');
  });

  it('Nubank: Pix recebida (lowercase) → extracts name', () => {
    const desc = 'Transferência recebida pelo Pix - Carlos Lima - CPF';
    expect(cleanDescription(desc, 'Nubank')).toBe('Carlos Lima');
  });

  // Nubank debit patterns
  it('Nubank: debit purchase → extracts establishment name', () => {
    const desc = 'Compra no débito - Supermercado Extra';
    expect(cleanDescription(desc, 'Nubank')).toBe('Supermercado Extra');
  });

  // Non-matching Nubank descriptions
  it('Nubank: unrecognized pattern → returns trimmed original', () => {
    const desc = 'Pagamento de fatura';
    expect(cleanDescription(desc, 'Nubank')).toBe('Pagamento de fatura');
  });
});

// ================================================================
// parseOFX()
// ================================================================
describe('parseOFX()', () => {
  const minimalOFX = `
OFXHEADER:100
<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS><CODE>0</CODE></STATUS>
<FI><ORG>Nubank</ORG><FID>260</FID></FI>
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKACCTFROM>
<BANKID>260</BANKID>
<ACCTID>123456</ACCTID>
<ACCTTYPE>CHECKING</ACCTTYPE>
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260101</DTSTART>
<DTEND>20260131</DTEND>
<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20260115</DTPOSTED>
<TRNAMT>-150.50</TRNAMT>
<FITID>TX001</FITID>
<MEMO>Compra no débito - Restaurante</MEMO>
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT</TRNTYPE>
<DTPOSTED>20260120</DTPOSTED>
<TRNAMT>3000.00</TRNAMT>
<FITID>TX002</FITID>
<MEMO>Transferência recebida pelo Pix - Empresa ABC - CNPJ</MEMO>
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>5000.00</BALAMT>
<DTASOF>20260131</DTASOF>
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

  it('parses valid OFX with 2 transactions', () => {
    const result = parseOFX(minimalOFX);
    expect(result.success).toBe(true);
    expect(result.transactions).toHaveLength(2);
  });

  it('extracts bank info', () => {
    const result = parseOFX(minimalOFX);
    expect(result.bankId).toBe('260');
    expect(result.bankName).toBe('Nubank');
    expect(result.accountId).toBe('123456');
    expect(result.accountType).toBe('CHECKING');
  });

  it('extracts statement dates', () => {
    const result = parseOFX(minimalOFX);
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
    expect(result.startDate!.getMonth()).toBe(0); // January
    expect(result.endDate!.getMonth()).toBe(0); // January
  });

  it('extracts balance', () => {
    const result = parseOFX(minimalOFX);
    expect(result.balance).toBe(5000.00);
    expect(result.balanceDate).toBeInstanceOf(Date);
  });

  it('debit transaction: amount positive, type debit', () => {
    const result = parseOFX(minimalOFX);
    const debit = result.transactions.find(t => t.fitid === 'TX001')!;
    expect(debit.amount).toBe(150.50);
    expect(debit.type).toBe('debit');
  });

  it('credit transaction: amount positive, type credit', () => {
    const result = parseOFX(minimalOFX);
    const credit = result.transactions.find(t => t.fitid === 'TX002')!;
    expect(credit.amount).toBe(3000.00);
    expect(credit.type).toBe('credit');
  });

  it('cleans descriptions for detected bank (Nubank)', () => {
    const result = parseOFX(minimalOFX);
    const debit = result.transactions.find(t => t.fitid === 'TX001')!;
    expect(debit.description).toBe('Restaurante');

    const credit = result.transactions.find(t => t.fitid === 'TX002')!;
    expect(credit.description).toBe('Empresa ABC');
  });

  it('missing <OFX> tag → error', () => {
    const result = parseOFX('some random content');
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Arquivo OFX inválido: tag <OFX> não encontrada');
  });

  it('BOM is stripped', () => {
    const result = parseOFX('\uFEFF' + minimalOFX);
    expect(result.success).toBe(true);
  });

  it('empty transaction block → no transactions', () => {
    const emptyOFX = `<OFX><BANKTRANLIST></BANKTRANLIST></OFX>`;
    const result = parseOFX(emptyOFX);
    expect(result.transactions).toHaveLength(0);
  });
});

// ================================================================
// isValidOFXFile()
// ================================================================
describe('isValidOFXFile()', () => {
  function makeFile(name: string): File {
    return new File([''], name);
  }

  it('.ofx → valid', () => {
    expect(isValidOFXFile(makeFile('extrato.ofx'))).toBe(true);
  });

  it('.OFX (uppercase) → valid', () => {
    expect(isValidOFXFile(makeFile('extrato.OFX'))).toBe(true);
  });

  it('.ofc → valid', () => {
    expect(isValidOFXFile(makeFile('extrato.ofc'))).toBe(true);
  });

  it('.qfx → valid', () => {
    expect(isValidOFXFile(makeFile('extrato.qfx'))).toBe(true);
  });

  it('.csv → invalid', () => {
    expect(isValidOFXFile(makeFile('extrato.csv'))).toBe(false);
  });

  it('.pdf → invalid', () => {
    expect(isValidOFXFile(makeFile('extrato.pdf'))).toBe(false);
  });
});
