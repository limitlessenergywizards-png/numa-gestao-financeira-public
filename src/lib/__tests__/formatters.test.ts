import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  currency,
  currencyCompact,
  formatPercent,
  formatNumber,
  getScoreLevel,
  getScoreLabel,
  getScoreColor,
  getMarginLevel,
  formatPct,
  SCORE_LABELS,
  SCORE_COLORS,
} from '../formatters';

describe('formatCurrency()', () => {
  it('formats positive value: 1500 → "R$ 1.500,00"', () => {
    expect(formatCurrency(1500)).toBe('R$ 1.500,00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });

  it('formats negative value', () => {
    const result = formatCurrency(-350.5);
    expect(result).toContain('-');
    expect(result).toContain('350,50');
  });

  it('showSign adds + for positive', () => {
    const result = formatCurrency(1500, { showSign: true });
    expect(result).toMatch(/^\+/);
  });

  it('showSign: zero shows no sign', () => {
    const result = formatCurrency(0, { showSign: true });
    expect(result).not.toMatch(/^[+-]/);
  });

  it('compact: 1,500,000 → contains M', () => {
    const result = formatCurrency(1_500_000, { compact: true });
    expect(result).toContain('1.5M');
  });

  it('compact: 25,000 → contains K', () => {
    const result = formatCurrency(25_000, { compact: true });
    expect(result).toContain('25.0K');
  });

  it('compact: 2,500,000,000 → contains B', () => {
    const result = formatCurrency(2_500_000_000, { compact: true });
    expect(result).toContain('2.5B');
  });

  it('compact: below 1000 formats normally', () => {
    const result = formatCurrency(500, { compact: true });
    expect(result).toContain('500,00');
  });

  it('custom symbol', () => {
    expect(formatCurrency(100, { symbol: '$' })).toContain('$');
    expect(formatCurrency(100, { symbol: '$' })).not.toContain('R$');
  });

  it('custom decimals: 0 places', () => {
    const result = formatCurrency(100.99, { decimals: 0 });
    expect(result).toBe('R$ 101');
  });
});

describe('currency() — shorthand', () => {
  it('equivalent to formatCurrency with default symbol', () => {
    expect(currency(1500)).toBe(formatCurrency(1500));
  });

  it('custom symbol passthrough', () => {
    expect(currency(100, '$')).toContain('$');
  });
});

describe('currencyCompact()', () => {
  it('formats with compact notation', () => {
    expect(currencyCompact(1_500_000)).toContain('M');
  });

  it('custom symbol', () => {
    expect(currencyCompact(1_500_000, '$')).toContain('$');
  });
});

describe('formatPercent()', () => {
  it('0.42 → "42,0%"', () => {
    expect(formatPercent(0.42)).toBe('42,0%');
  });

  it('0.156 with 2 decimals → "15,60%"', () => {
    expect(formatPercent(0.156, 2)).toBe('15,60%');
  });

  it('0 → "0,0%"', () => {
    expect(formatPercent(0)).toBe('0,0%');
  });

  it('1 → "100,0%"', () => {
    expect(formatPercent(1)).toBe('100,0%');
  });
});

describe('formatNumber()', () => {
  it('1500 → "1.500"', () => {
    expect(formatNumber(1500)).toBe('1.500');
  });

  it('1500 with 2 decimals → "1.500,00"', () => {
    expect(formatNumber(1500, 2)).toBe('1.500,00');
  });

  it('0 → "0"', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('getScoreLevel()', () => {
  it('80+ → excellent', () => {
    expect(getScoreLevel(80)).toBe('excellent');
    expect(getScoreLevel(100)).toBe('excellent');
  });

  it('60-79 → good', () => {
    expect(getScoreLevel(60)).toBe('good');
    expect(getScoreLevel(79)).toBe('good');
  });

  it('40-59 → regular', () => {
    expect(getScoreLevel(40)).toBe('regular');
    expect(getScoreLevel(59)).toBe('regular');
  });

  it('<40 → critical', () => {
    expect(getScoreLevel(39)).toBe('critical');
    expect(getScoreLevel(0)).toBe('critical');
  });
});

describe('getScoreLabel()', () => {
  it('returns correct Portuguese labels', () => {
    expect(getScoreLabel(85)).toBe('Excelente');
    expect(getScoreLabel(65)).toBe('Bom');
    expect(getScoreLabel(45)).toBe('Regular');
    expect(getScoreLabel(30)).toBe('Crítico');
  });
});

describe('getScoreColor()', () => {
  it('returns correct RGB tuples', () => {
    expect(getScoreColor(85)).toEqual(SCORE_COLORS.excellent);
    expect(getScoreColor(65)).toEqual(SCORE_COLORS.good);
    expect(getScoreColor(45)).toEqual(SCORE_COLORS.regular);
    expect(getScoreColor(30)).toEqual(SCORE_COLORS.critical);
  });
});

describe('getMarginLevel()', () => {
  describe('bruta (warning: 0, healthy: 20)', () => {
    it('25 → healthy', () => {
      expect(getMarginLevel(25, 'bruta')).toBe('healthy');
    });

    it('15 → warning', () => {
      expect(getMarginLevel(15, 'bruta')).toBe('warning');
    });

    it('-5 → critical', () => {
      expect(getMarginLevel(-5, 'bruta')).toBe('critical');
    });

    it('0 → warning (at boundary)', () => {
      expect(getMarginLevel(0, 'bruta')).toBe('warning');
    });

    it('20 → healthy (at boundary)', () => {
      expect(getMarginLevel(20, 'bruta')).toBe('healthy');
    });
  });

  describe('ebitda (warning: 0, healthy: 10)', () => {
    it('15 → healthy', () => {
      expect(getMarginLevel(15, 'ebitda')).toBe('healthy');
    });

    it('5 → warning', () => {
      expect(getMarginLevel(5, 'ebitda')).toBe('warning');
    });

    it('-1 → critical', () => {
      expect(getMarginLevel(-1, 'ebitda')).toBe('critical');
    });
  });

  describe('liquida (warning: 0, healthy: 10)', () => {
    it('12 → healthy', () => {
      expect(getMarginLevel(12, 'liquida')).toBe('healthy');
    });

    it('3 → warning', () => {
      expect(getMarginLevel(3, 'liquida')).toBe('warning');
    });
  });

  describe('operacional (warning: 0, healthy: 10)', () => {
    it('10 → healthy (at boundary)', () => {
      expect(getMarginLevel(10, 'operacional')).toBe('healthy');
    });

    it('0 → warning (at boundary)', () => {
      expect(getMarginLevel(0, 'operacional')).toBe('warning');
    });
  });
});

describe('formatPct()', () => {
  it('0 → "0%"', () => {
    expect(formatPct(0)).toBe('0%');
  });

  it('19.4 → "19,4%"', () => {
    expect(formatPct(19.4)).toBe('19,4%');
  });

  it('25.0 → "25%"', () => {
    expect(formatPct(25.0)).toBe('25%');
  });

  it('-3.7 → "-3,7%"', () => {
    expect(formatPct(-3.7)).toBe('-3,7%');
  });

  it('integer 50 → "50%"', () => {
    expect(formatPct(50)).toBe('50%');
  });
});
