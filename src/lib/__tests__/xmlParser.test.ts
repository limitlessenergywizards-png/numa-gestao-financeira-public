import { describe, it, expect } from 'vitest';
import {
  parseXMLString,
  detectXMLType,
  extractPeriod,
  formatXMLCurrency,
  getXMLTypeLabel,
} from '../xmlParser';

// ================================================================
// parseXMLString()
// ================================================================
describe('parseXMLString()', () => {
  it('valid XML → Document', () => {
    const doc = parseXMLString('<root><item>test</item></root>');
    expect(doc).not.toBeNull();
    expect(doc!.documentElement.tagName).toBe('root');
  });

  it('extracts nested elements', () => {
    const doc = parseXMLString('<root><child>hello</child></root>');
    expect(doc!.querySelector('child')?.textContent).toBe('hello');
  });

  it('invalid XML → null', () => {
    const doc = parseXMLString('this is not xml at all');
    expect(doc).toBeNull();
  });

  it('empty string → null (parser error)', () => {
    const doc = parseXMLString('');
    expect(doc).toBeNull();
  });
});

// ================================================================
// detectXMLType()
// ================================================================
describe('detectXMLType()', () => {
  function makeDoc(xml: string): Document {
    return parseXMLString(xml)!;
  }

  it('NFe tag → nfe', () => {
    const doc = makeDoc('<root><NFe><infNFe></infNFe></NFe></root>');
    expect(detectXMLType(doc)).toBe('nfe');
  });

  it('nfeProc tag → nfe', () => {
    const doc = makeDoc('<nfeProc><NFe></NFe></nfeProc>');
    expect(detectXMLType(doc)).toBe('nfe');
  });

  it('ECD tag → sped', () => {
    const doc = makeDoc('<root><ECD></ECD></root>');
    expect(detectXMLType(doc)).toBe('sped');
  });

  it('root tag containing "sped" → sped', () => {
    const doc = makeDoc('<sped_contabil><registro></registro></sped_contabil>');
    expect(detectXMLType(doc)).toBe('sped');
  });

  it('balancete tag → balancete', () => {
    const doc = makeDoc('<root><balancete><conta></conta></balancete></root>');
    expect(detectXMLType(doc)).toBe('balancete');
  });

  it('Contas tag → balancete', () => {
    const doc = makeDoc('<root><Contas><item></item></Contas></root>');
    expect(detectXMLType(doc)).toBe('balancete');
  });

  it('lancamento tag → balancete', () => {
    const doc = makeDoc('<root><lancamento></lancamento></root>');
    expect(detectXMLType(doc)).toBe('balancete');
  });

  it('unknown structure → unknown', () => {
    const doc = makeDoc('<root><something>value</something></root>');
    expect(detectXMLType(doc)).toBe('unknown');
  });
});

// ================================================================
// extractPeriod()
// ================================================================
describe('extractPeriod()', () => {
  function makeDoc(xml: string): Document {
    return parseXMLString(xml)!;
  }

  it('NF-e with dhEmi → extracts year/month', () => {
    const doc = makeDoc('<root><dhEmi>2026-03-15T10:30:00-03:00</dhEmi></root>');
    const period = extractPeriod(doc, 'nfe');
    expect(period.year).toBe(2026);
    expect(period.month).toBe(3);
  });

  it('SPED with DT_INI (DD/MM/YYYY) → extracts year/month', () => {
    const doc = makeDoc('<root><DT_INI>01/06/2026</DT_INI></root>');
    const period = extractPeriod(doc, 'sped');
    expect(period.year).toBe(2026);
    expect(period.month).toBe(6);
  });

  it('generic periodo element with MM/YYYY → extracts', () => {
    const doc = makeDoc('<root><periodo>03/2026</periodo></root>');
    const period = extractPeriod(doc, 'balancete');
    expect(period.year).toBe(2026);
    expect(period.month).toBe(3);
  });

  it('no period info → defaults to current date', () => {
    const doc = makeDoc('<root><data>nothing</data></root>');
    const period = extractPeriod(doc, 'unknown');
    const now = new Date();
    expect(period.year).toBe(now.getFullYear());
    expect(period.month).toBe(now.getMonth() + 1);
  });
});

// ================================================================
// formatXMLCurrency()
// ================================================================
describe('formatXMLCurrency()', () => {
  it('formats 1500 as BRL', () => {
    const result = formatXMLCurrency(1500);
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s?1\.500,00/);
  });

  it('formats 0 as BRL', () => {
    const result = formatXMLCurrency(0);
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s?0,00/);
  });

  it('formats negative value', () => {
    const result = formatXMLCurrency(-250.50);
    expect(result).toContain('250,50');
  });
});

// ================================================================
// getXMLTypeLabel()
// ================================================================
describe('getXMLTypeLabel()', () => {
  it('nfe → Nota Fiscal Eletrônica', () => {
    expect(getXMLTypeLabel('nfe')).toContain('NF-e');
  });

  it('sped → SPED', () => {
    expect(getXMLTypeLabel('sped')).toContain('SPED');
  });

  it('balancete → Balancete', () => {
    expect(getXMLTypeLabel('balancete')).toContain('Balancete');
  });

  it('unknown → Formato Desconhecido', () => {
    expect(getXMLTypeLabel('unknown')).toContain('Desconhecido');
  });
});
