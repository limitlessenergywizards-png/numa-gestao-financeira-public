/**
 * Money Utilities — Precision-safe monetary arithmetic
 * 
 * ALL monetary calculations in the system MUST use these utilities
 * instead of native JavaScript number arithmetic.
 * 
 * Uses Decimal.js with Banker's Rounding (ROUND_HALF_EVEN)
 * to prevent floating-point errors in financial calculations.
 * 
 * @module money
 */

import Decimal from 'decimal.js';

// Configure Decimal.js globally for financial precision
Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_EVEN, // Banker's Rounding (eliminates bias)
});

// ============================================
// CORE MONETARY TYPE
// ============================================

/**
 * Creates a Decimal from any monetary input.
 * Use this instead of Number() or parseFloat() for any financial value.
 */
export function money(value: string | number | Decimal): Decimal {
    if (value === '' || value === null || value === undefined) {
        return new Decimal(0);
    }
    try {
        return new Decimal(value);
    } catch {
        return new Decimal(0);
    }
}

// ============================================
// ARITHMETIC (precision-safe)
// ============================================

/** Adds two or more monetary values with exact precision */
export function moneyAdd(...values: (string | number | Decimal)[]): Decimal {
    return values.reduce<Decimal>((acc, val) => acc.plus(money(val)), new Decimal(0));
}

/** Subtracts b from a: a - b */
export function moneySub(a: string | number | Decimal, b: string | number | Decimal): Decimal {
    return money(a).minus(money(b));
}

/** Multiplies a monetary value by a factor (e.g. tax rate, quantity) */
export function moneyMul(a: string | number | Decimal, b: string | number | Decimal): Decimal {
    return money(a).times(money(b));
}

/** Divides a monetary value by a divisor */
export function moneyDiv(a: string | number | Decimal, b: string | number | Decimal): Decimal {
    const divisor = money(b);
    if (divisor.isZero()) return new Decimal(0);
    return money(a).dividedBy(divisor);
}

// ============================================
// ROUNDING & CONVERSION
// ============================================

/**
 * Rounds a Decimal to 2 decimal places using Banker's Rounding.
 * Use this before storing or displaying monetary values.
 */
export function moneyRound(value: string | number | Decimal, places: number = 2): Decimal {
    return money(value).toDecimalPlaces(places, Decimal.ROUND_HALF_EVEN);
}

/**
 * Converts a Decimal to a plain JS number (for Supabase payloads, chart libraries, etc.)
 * ALWAYS round before converting to avoid sending 0.30000000000000004 to the DB.
 */
export function moneyToNumber(value: string | number | Decimal, places: number = 2): number {
    return moneyRound(value, places).toNumber();
}

/**
 * Formats a monetary Decimal as a pt-BR currency string.
 * Example: 1500.50 → "R$ 1.500,50"
 */
export function moneyFormat(value: string | number | Decimal): string {
    return moneyRound(value).toNumber().toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

/**
 * Formats a monetary Decimal as a plain pt-BR number string (no R$ prefix).
 * Example: 1500.50 → "1.500,50"
 */
export function moneyFormatPlain(value: string | number | Decimal): string {
    return moneyRound(value).toNumber().toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// ============================================
// PARSING (replaces parseFloat-based logic)
// ============================================

/**
 * Parses a Brazilian currency string into a precision-safe Decimal.
 * Handles formats: "1.500,00", "R$ 1.500,00", "1500.00", "1500,50"
 * 
 * This replaces the old parseCurrencyValue that used parseFloat.
 */
export function parseCurrencyToDecimal(value: string): Decimal {
    if (!value || typeof value !== 'string') return new Decimal(0);

    // Remove R$, spaces, and currency symbols
    let cleaned = value.replace(/[R$\s]/g, '').trim();

    if (cleaned === '') return new Decimal(0);

    // Detect format: if there's a comma, it's likely pt-BR format
    // "1.500,00" → remove dots (thousands), replace comma with dot
    if (cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    // If no comma, it's already in standard format: "1500.00"

    try {
        const result = new Decimal(cleaned);
        return result.isNaN() ? new Decimal(0) : result;
    } catch {
        return new Decimal(0);
    }
}

/**
 * Parses a Brazilian currency string and returns a plain number.
 * This is a DROP-IN REPLACEMENT for the old parseCurrencyValue.
 * 
 * The difference: this parses through Decimal first, rounds to 2 places,
 * and only THEN converts to number — eliminating floating-point drift.
 */
export function parseCurrencyValueSafe(value: string): number {
    return moneyToNumber(parseCurrencyToDecimal(value));
}

// ============================================
// COMPARISON HELPERS
// ============================================

/** Checks if a monetary value is positive (> 0) */
export function moneyIsPositive(value: string | number | Decimal): boolean {
    return money(value).greaterThan(0);
}

/** Checks if a monetary value is zero */
export function moneyIsZero(value: string | number | Decimal): boolean {
    return money(value).isZero();
}

/** Checks if a >= b (monetary comparison) */
export function moneyGte(a: string | number | Decimal, b: string | number | Decimal): boolean {
    return money(a).greaterThanOrEqualTo(money(b));
}

/** Returns the maximum of zero and the given value (clamp to non-negative) */
export function moneyMax0(value: string | number | Decimal): Decimal {
    const val = money(value);
    return val.greaterThan(0) ? val : new Decimal(0);
}

// ============================================
// PERCENTAGE HELPERS (for DRE, margins, etc.)
// ============================================

/**
 * Calculates what percentage `part` is of `total`.
 * Returns 0 if total is 0. Result is rounded to `places` decimal places.
 */
export function moneyPercent(
    part: string | number | Decimal,
    total: string | number | Decimal,
    places: number = 1
): number {
    const t = money(total);
    if (t.isZero()) return 0;
    return money(part).dividedBy(t).times(100).toDecimalPlaces(places, Decimal.ROUND_HALF_EVEN).toNumber();
}
