import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  money,
  moneyAdd,
  moneySub,
  moneyMul,
  moneyDiv,
  moneyRound,
  moneyToNumber,
  moneyFormat,
  moneyFormatPlain,
  parseCurrencyToDecimal,
  parseCurrencyValueSafe,
  moneyIsPositive,
  moneyIsZero,
  moneyGte,
  moneyMax0,
  moneyPercent,
} from '../money';

// Helper: exact Decimal string comparison
const d = (val: Decimal) => val.toString();

describe('money() — safe Decimal constructor', () => {
  it('creates Decimal from number', () => {
    expect(d(money(100))).toBe('100');
  });

  it('creates Decimal from string', () => {
    expect(d(money('1500.50'))).toBe('1500.5'); // Decimal.toString() drops trailing zeros
  });

  it('creates Decimal from another Decimal (passthrough)', () => {
    const dec = new Decimal('42.99');
    expect(d(money(dec))).toBe('42.99');
  });

  it('returns 0 for empty string', () => {
    expect(d(money(''))).toBe('0');
  });

  it('returns 0 for null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(d(money(null as any))).toBe('0');
  });

  it('returns 0 for undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(d(money(undefined as any))).toBe('0');
  });

  it('returns 0 for invalid string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(d(money('abc' as any))).toBe('0');
  });

  it('handles very large numbers', () => {
    expect(d(money('999999999999.99'))).toBe('999999999999.99');
  });

  it('handles negative values', () => {
    expect(d(money(-500))).toBe('-500');
  });
});

describe('moneyAdd() — precision-safe addition', () => {
  it('adds 0.1 + 0.2 = 0.3 exactly (IEEE 754 classic failure)', () => {
    expect(d(moneyAdd(0.1, 0.2))).toBe('0.3');
  });

  it('adds multiple values (variadic)', () => {
    expect(d(moneyAdd(100, 200, 300))).toBe('600');
  });

  it('handles mixed types', () => {
    expect(d(moneyAdd('100.50', 200, new Decimal('300.25')))).toBe('600.75');
  });

  it('single value returns itself', () => {
    expect(d(moneyAdd(42))).toBe('42');
  });

  it('adding zero is identity', () => {
    expect(d(moneyAdd(100, 0))).toBe('100');
  });

  it('handles no arguments (returns 0)', () => {
    expect(d(moneyAdd())).toBe('0');
  });
});

describe('moneySub() — precision-safe subtraction', () => {
  it('1000 - 999.99 = 0.01 exactly', () => {
    expect(d(moneySub(1000, 999.99))).toBe('0.01');
  });

  it('handles negative result', () => {
    expect(d(moneySub(100, 200))).toBe('-100');
  });

  it('subtracting zero is identity', () => {
    expect(d(moneySub(500, 0))).toBe('500');
  });
});

describe('moneyMul() — multiplication', () => {
  it('calculates 15% tax: 100 * 0.15 = 15', () => {
    expect(d(moneyMul(100, 0.15))).toBe('15');
  });

  it('33.33 * 3 = 99.99', () => {
    expect(d(moneyMul(33.33, 3))).toBe('99.99');
  });

  it('multiplying by zero returns zero', () => {
    expect(d(moneyMul(1000, 0))).toBe('0');
  });

  it('multiplying by one is identity', () => {
    expect(d(moneyMul(42.50, 1))).toBe('42.5');
  });
});

describe('moneyDiv() — division with zero-safe guard', () => {
  it('divides correctly', () => {
    expect(d(moneyDiv(1000, 4))).toBe('250');
  });

  it('division by zero returns Decimal(0)', () => {
    expect(d(moneyDiv(100, 0))).toBe('0');
  });

  it('handles exact thirds', () => {
    // Decimal.js preserves full precision, not truncated like Number
    const result = moneyDiv(100, 3);
    expect(result.toDecimalPlaces(10).toString()).toBe('33.3333333333');
  });
});

describe('moneyRound() — Banker\'s Rounding (ROUND_HALF_EVEN)', () => {
  // Note: moneyRound defaults to 2 decimal places.
  // Banker's rounding only triggers when there are MORE digits than `places`.
  // Decimal.toString() drops trailing zeros.

  it('2.5 with 0 places rounds to 2 (rounds to even)', () => {
    expect(d(moneyRound(2.5, 0))).toBe('2');
  });

  it('3.5 with 0 places rounds to 4 (rounds to even)', () => {
    expect(d(moneyRound(3.5, 0))).toBe('4');
  });

  it('2.555 rounds to 2.56 (3rd digit triggers rounding)', () => {
    expect(d(moneyRound(2.555))).toBe('2.56');
  });

  it('2.545 rounds to 2.54 (Banker\'s rounds to even)', () => {
    expect(d(moneyRound(2.545))).toBe('2.54');
  });

  it('2.55 with 2 places stays 2.55 (already at 2 decimal places)', () => {
    expect(d(moneyRound(2.55))).toBe('2.55');
  });

  it('custom places: 1.2345 with 3 places', () => {
    expect(d(moneyRound(1.2345, 3))).toBe('1.234');
  });

  it('defaults to 2 decimal places: 100.999 → 101', () => {
    expect(d(moneyRound(100.999))).toBe('101');
  });

  it('rounds negative values: -2.5 with 0 places → -2', () => {
    expect(d(moneyRound(-2.5, 0))).toBe('-2');
  });
});

describe('moneyToNumber() — safe Decimal-to-Number conversion', () => {
  it('rounds before converting', () => {
    expect(moneyToNumber(100.999)).toBe(101);
  });

  it('respects custom places', () => {
    expect(moneyToNumber(1.2345, 3)).toBe(1.234);
  });

  it('returns a JS number type', () => {
    expect(typeof moneyToNumber(100)).toBe('number');
  });

  it('converts zero correctly', () => {
    expect(moneyToNumber(0)).toBe(0);
  });
});

describe('moneyFormat() — pt-BR currency formatting', () => {
  it('formats positive value', () => {
    const result = moneyFormat(1500.5);
    // Handle both regular space and non-breaking space (U+00A0)
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s?1\.500,50/);
  });

  it('formats zero', () => {
    const result = moneyFormat(0);
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s?0,00/);
  });

  it('formats negative value', () => {
    const result = moneyFormat(-350.5);
    expect(result).toContain('350,50');
    expect(result).toContain('-');
  });

  it('formats large number with thousands separators', () => {
    const result = moneyFormat(1000000);
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s?1\.000\.000,00/);
  });
});

describe('moneyFormatPlain() — pt-BR number without R$ prefix', () => {
  it('formats without R$ prefix', () => {
    const result = moneyFormatPlain(1500.5);
    expect(result).toBe('1.500,50');
  });

  it('does not contain R$', () => {
    const result = moneyFormatPlain(100);
    expect(result).not.toContain('R$');
    expect(result).toBe('100,00');
  });
});

describe('parseCurrencyToDecimal() — pt-BR string parsing', () => {
  it('parses "1.500,00" (pt-BR format)', () => {
    expect(d(parseCurrencyToDecimal('1.500,00'))).toBe('1500');
  });

  it('parses "R$ 1.500,00" (with symbol)', () => {
    expect(d(parseCurrencyToDecimal('R$ 1.500,00'))).toBe('1500');
  });

  it('parses "1500.00" (US format, no comma)', () => {
    expect(d(parseCurrencyToDecimal('1500.00'))).toBe('1500');
  });

  it('parses "1500,50" (comma as decimal)', () => {
    expect(d(parseCurrencyToDecimal('1500,50'))).toBe('1500.5');
  });

  it('returns 0 for empty string', () => {
    expect(d(parseCurrencyToDecimal(''))).toBe('0');
  });

  it('returns 0 for non-string input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(d(parseCurrencyToDecimal(null as any))).toBe('0');
  });

  it('returns 0 for garbage string', () => {
    expect(d(parseCurrencyToDecimal('abc'))).toBe('0');
  });

  it('parses negative pt-BR value', () => {
    expect(d(parseCurrencyToDecimal('-1.500,50'))).toBe('-1500.5');
  });
});

describe('parseCurrencyValueSafe() — drop-in replacement returning number', () => {
  it('parses and returns number', () => {
    expect(parseCurrencyValueSafe('R$ 1.500,50')).toBe(1500.5);
  });

  it('rounds to 2 places', () => {
    expect(parseCurrencyValueSafe('1.234,567')).toBe(1234.57);
  });

  it('returns 0 for empty', () => {
    expect(parseCurrencyValueSafe('')).toBe(0);
  });
});

describe('comparison helpers', () => {
  describe('moneyIsPositive()', () => {
    it('returns true for positive', () => {
      expect(moneyIsPositive(100)).toBe(true);
    });

    it('returns false for zero', () => {
      expect(moneyIsPositive(0)).toBe(false);
    });

    it('returns false for negative', () => {
      expect(moneyIsPositive(-1)).toBe(false);
    });
  });

  describe('moneyIsZero()', () => {
    it('returns true for zero', () => {
      expect(moneyIsZero(0)).toBe(true);
    });

    it('returns false for non-zero', () => {
      expect(moneyIsZero(0.001)).toBe(false);
    });

    it('returns true for string "0"', () => {
      expect(moneyIsZero('0')).toBe(true);
    });
  });

  describe('moneyGte()', () => {
    it('100 >= 50 is true', () => {
      expect(moneyGte(100, 50)).toBe(true);
    });

    it('50 >= 100 is false', () => {
      expect(moneyGte(50, 100)).toBe(false);
    });

    it('100 >= 100 is true (equal)', () => {
      expect(moneyGte(100, 100)).toBe(true);
    });
  });

  describe('moneyMax0()', () => {
    it('clamps negative to 0', () => {
      expect(d(moneyMax0(-500))).toBe('0');
    });

    it('preserves positive', () => {
      expect(d(moneyMax0(500))).toBe('500');
    });

    it('returns 0 for zero', () => {
      expect(d(moneyMax0(0))).toBe('0');
    });
  });
});

describe('moneyPercent() — percentage calculation', () => {
  it('250/1000 = 25%', () => {
    expect(moneyPercent(250, 1000)).toBe(25);
  });

  it('0/1000 = 0%', () => {
    expect(moneyPercent(0, 1000)).toBe(0);
  });

  it('division by zero total returns 0', () => {
    expect(moneyPercent(100, 0)).toBe(0);
  });

  it('custom places: 333/1000 with 2 places', () => {
    expect(moneyPercent(333, 1000, 2)).toBe(33.3);
  });

  it('100% case', () => {
    expect(moneyPercent(1000, 1000)).toBe(100);
  });

  it('handles Decimal inputs', () => {
    expect(moneyPercent(new Decimal(50), new Decimal(200))).toBe(25);
  });
});
