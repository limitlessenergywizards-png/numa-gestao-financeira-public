import { describe, it, expect } from 'vitest';
import { getBrazilianHolidays, isBrazilianHoliday } from '../brazilianHolidays';

describe('getBrazilianHolidays()', () => {
  const holidays2026 = getBrazilianHolidays(2026);

  it('returns 12 holidays (9 fixed + 3 movable)', () => {
    expect(holidays2026).toHaveLength(12);
  });

  it('each holiday has date and name', () => {
    holidays2026.forEach(h => {
      expect(h.date).toBeInstanceOf(Date);
      expect(typeof h.name).toBe('string');
      expect(h.name.length).toBeGreaterThan(0);
    });
  });

  // Fixed holidays
  it('includes Confraternização Universal (Jan 1)', () => {
    const h = holidays2026.find(h => h.name === 'Confraternização Universal');
    expect(h).toBeDefined();
    expect(h!.date.getMonth()).toBe(0);
    expect(h!.date.getDate()).toBe(1);
  });

  it('includes Tiradentes (Apr 21)', () => {
    const h = holidays2026.find(h => h.name === 'Tiradentes');
    expect(h).toBeDefined();
    expect(h!.date.getMonth()).toBe(3);
    expect(h!.date.getDate()).toBe(21);
  });

  it('includes Natal (Dec 25)', () => {
    const h = holidays2026.find(h => h.name === 'Natal');
    expect(h).toBeDefined();
    expect(h!.date.getMonth()).toBe(11);
    expect(h!.date.getDate()).toBe(25);
  });

  it('includes Dia da Consciência Negra (Nov 20)', () => {
    const h = holidays2026.find(h => h.name === 'Dia da Consciência Negra');
    expect(h).toBeDefined();
    expect(h!.date.getMonth()).toBe(10);
    expect(h!.date.getDate()).toBe(20);
  });

  // Easter 2026 = April 5
  it('Easter-based: Carnaval is Easter - 47 days (Feb 17, 2026)', () => {
    const h = holidays2026.find(h => h.name === 'Carnaval');
    expect(h).toBeDefined();
    expect(h!.date.getMonth()).toBe(1); // February
    expect(h!.date.getDate()).toBe(17);
  });

  it('Easter-based: Sexta-feira Santa is Easter - 2 days (Apr 3, 2026)', () => {
    const h = holidays2026.find(h => h.name === 'Sexta-feira Santa');
    expect(h).toBeDefined();
    expect(h!.date.getMonth()).toBe(3); // April
    expect(h!.date.getDate()).toBe(3);
  });

  it('Easter-based: Corpus Christi is Easter + 60 days (Jun 4, 2026)', () => {
    const h = holidays2026.find(h => h.name === 'Corpus Christi');
    expect(h).toBeDefined();
    expect(h!.date.getMonth()).toBe(5); // June
    expect(h!.date.getDate()).toBe(4);
  });
});

describe('Easter algorithm — cross-year verification', () => {
  // Known Easter dates for verification
  const knownEasters: [number, number, number][] = [
    [2024, 2, 31], // March 31, 2024
    [2025, 3, 20], // April 20, 2025
    [2026, 3, 5],  // April 5, 2026
    [2027, 2, 28], // March 28, 2027
    [2028, 3, 16], // April 16, 2028
  ];

  knownEasters.forEach(([year, month, day]) => {
    it(`Easter ${year} → Sexta-feira Santa on ${month + 1}/${day - 2}`, () => {
      const holidays = getBrazilianHolidays(year);
      const goodFriday = holidays.find(h => h.name === 'Sexta-feira Santa')!;
      // Good Friday = Easter - 2, so Easter = Good Friday + 2
      const easterDate = new Date(goodFriday.date);
      easterDate.setDate(easterDate.getDate() + 2);
      expect(easterDate.getMonth()).toBe(month);
      expect(easterDate.getDate()).toBe(day);
    });
  });
});

describe('isBrazilianHoliday()', () => {
  it('Jan 1 is a holiday', () => {
    expect(isBrazilianHoliday(new Date(2026, 0, 1))).toBe(true);
  });

  it('Dec 25 is a holiday', () => {
    expect(isBrazilianHoliday(new Date(2026, 11, 25))).toBe(true);
  });

  it('random weekday (Jul 15) is not a holiday', () => {
    expect(isBrazilianHoliday(new Date(2026, 6, 15))).toBe(false);
  });

  it('Carnaval 2026 (Feb 17) is a holiday', () => {
    expect(isBrazilianHoliday(new Date(2026, 1, 17))).toBe(true);
  });

  it('day after Carnaval (Feb 18) is not a holiday', () => {
    expect(isBrazilianHoliday(new Date(2026, 1, 18))).toBe(false);
  });
});
