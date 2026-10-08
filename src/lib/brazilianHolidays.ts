/**
 * Brazilian national holidays calculator.
 * Includes fixed holidays and movable holidays (Easter-based).
 */

/**
 * Calculate Easter Sunday for a given year using the Anonymous Gregorian algorithm.
 */
function calculateEaster(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
}

/**
 * Add days to a date (pure, no mutation).
 */
function addDaysToDate(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Get all Brazilian national holidays for a given year.
 * Returns an array of { date, name } objects.
 */
export function getBrazilianHolidays(year: number): { date: Date; name: string }[] {
    const easter = calculateEaster(year);

    return [
        // Fixed holidays
        { date: new Date(year, 0, 1), name: "Confraternização Universal" },
        { date: new Date(year, 3, 21), name: "Tiradentes" },
        { date: new Date(year, 4, 1), name: "Dia do Trabalho" },
        { date: new Date(year, 8, 7), name: "Independência do Brasil" },
        { date: new Date(year, 9, 12), name: "Nossa Senhora Aparecida" },
        { date: new Date(year, 10, 2), name: "Finados" },
        { date: new Date(year, 10, 15), name: "Proclamação da República" },
        { date: new Date(year, 10, 20), name: "Dia da Consciência Negra" },
        { date: new Date(year, 11, 25), name: "Natal" },

        // Movable holidays (Easter-based)
        { date: addDaysToDate(easter, -47), name: "Carnaval" }, // Terça de Carnaval
        { date: addDaysToDate(easter, -2), name: "Sexta-feira Santa" },
        { date: addDaysToDate(easter, 60), name: "Corpus Christi" },
    ];
}

/**
 * Check if a given date is a Brazilian national holiday.
 */
export function isBrazilianHoliday(date: Date): boolean {
    const year = date.getFullYear();
    const holidays = getBrazilianHolidays(year);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    return holidays.some(h => {
        const hStr = `${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, '0')}-${String(h.date.getDate()).padStart(2, '0')}`;
        return hStr === dateStr;
    });
}
