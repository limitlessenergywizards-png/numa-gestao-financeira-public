/**
 * Centralized formatting utilities for the application.
 * Use these functions for tooltips, exports, and other non-React contexts.
 */

export interface FormatCurrencyOptions {
  symbol?: string;
  decimals?: number;
  showSign?: boolean;
  compact?: boolean;
}

/**
 * Formats a number as currency string.
 * 
 * @example
 * formatCurrency(1500.00)                      // "R$ 1.500,00"
 * formatCurrency(1500000, { compact: true })   // "R$ 1,5M"
 * formatCurrency(-350.50, { showSign: true })  // "-R$ 350,50"
 */
export function formatCurrency(
  value: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    symbol = "R$",
    decimals = 2,
    showSign = false,
    compact = false,
  } = options;

  const isNegative = value < 0;
  const absValue = Math.abs(value);

  let formatted: string;

  if (compact && absValue >= 1000) {
    if (absValue >= 1_000_000_000) {
      formatted = `${(absValue / 1_000_000_000).toFixed(1)}B`;
    } else if (absValue >= 1_000_000) {
      formatted = `${(absValue / 1_000_000).toFixed(1)}M`;
    } else {
      formatted = `${(absValue / 1_000).toFixed(1)}K`;
    }
  } else {
    formatted = absValue.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  // Build final string
  let result = "";

  if (isNegative) {
    result = "-";
  } else if (showSign && value > 0) {
    result = "+";
  }

  result += `${symbol} ${formatted}`;

  return result;
}

/**
 * Shorthand for simple currency formatting.
 * 
 * @example
 * currency(1500.00)        // "R$ 1.500,00"
 * currency(1500.00, "$")   // "$ 1.500,00"
 */
export const currency = (value: number, symbol = "R$") =>
  formatCurrency(value, { symbol });

/**
 * Format currency in compact notation for space-constrained areas.
 * 
 * @example
 * currencyCompact(1500000)  // "R$ 1,5M"
 * currencyCompact(25000)    // "R$ 25,0K"
 */
export const currencyCompact = (value: number, symbol = "R$") =>
  formatCurrency(value, { symbol, compact: true });

/**
 * Format a percentage value.
 * 
 * @example
 * formatPercent(0.42)       // "42,0%"
 * formatPercent(0.156, 2)   // "15,60%"
 */
export function formatPercent(value: number, decimals = 1): string {
  const percent = value * 100;
  return `${percent.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/**
 * Format a number with locale-specific separators.
 * 
 * @example
 * formatNumber(1500)     // "1.500"
 * formatNumber(1500, 2)  // "1.500,00"
 */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ============================================
// SCORE FORMATTING
// ============================================

export type ScoreLevel = 'excellent' | 'good' | 'regular' | 'critical';

/**
 * Determines the score level based on numeric value.
 * 
 * @example
 * getScoreLevel(85) // 'excellent'
 * getScoreLevel(65) // 'good'
 * getScoreLevel(45) // 'regular'
 * getScoreLevel(30) // 'critical'
 */
export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'regular';
  return 'critical';
}

export const SCORE_LABELS: Record<ScoreLevel, string> = {
  excellent: 'Excelente',
  good: 'Bom',
  regular: 'Regular',
  critical: 'Crítico',
};

export const SCORE_COLORS: Record<ScoreLevel, [number, number, number]> = {
  excellent: [16, 185, 129],   // green
  good: [212, 175, 55],        // gold
  regular: [245, 158, 11],     // amber
  critical: [239, 68, 68],     // red
};

/**
 * Returns the localized label for a score value.
 * 
 * @example
 * getScoreLabel(85) // 'Excelente'
 */
export function getScoreLabel(score: number): string {
  return SCORE_LABELS[getScoreLevel(score)];
}

/**
 * Returns the RGB color tuple for a score value.
 * 
 * @example
 * getScoreColor(85) // [16, 185, 129]
 */
export function getScoreColor(score: number): [number, number, number] {
  return SCORE_COLORS[getScoreLevel(score)];
}

// ============================================
// MARGIN COLOR UTILITIES
// ============================================

export type MarginType = 'bruta' | 'ebitda' | 'liquida' | 'operacional';
export type MarginLevel = 'critical' | 'warning' | 'healthy';

const MARGIN_THRESHOLDS: Record<MarginType, { warning: number; healthy: number }> = {
  bruta: { warning: 0, healthy: 20 },
  ebitda: { warning: 0, healthy: 10 },
  liquida: { warning: 0, healthy: 10 },
  operacional: { warning: 0, healthy: 10 },
};

/**
 * Determines margin performance level based on type-specific thresholds.
 * 
 * @example
 * getMarginLevel(25, 'bruta')   // 'healthy'
 * getMarginLevel(15, 'bruta')   // 'warning'
 * getMarginLevel(-5, 'bruta')   // 'critical'
 */
export function getMarginLevel(value: number, type: MarginType): MarginLevel {
  const thresholds = MARGIN_THRESHOLDS[type];
  if (value < thresholds.warning) return 'critical';
  if (value < thresholds.healthy) return 'warning';
  return 'healthy';
}

export const MARGIN_COLORS: Record<MarginLevel, 'rose' | 'amber' | 'emerald'> = {
  critical: 'rose',
  warning: 'amber',
  healthy: 'emerald',
};

export const MARGIN_TEXT_CLASSES: Record<MarginLevel, string> = {
  critical: 'text-destructive',
  warning: 'text-warning',
  healthy: 'text-success',
};

export const MARGIN_GRADIENT_CLASSES: Record<MarginLevel, string> = {
  critical: 'bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 border-rose-400/30',
  warning: 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 border-amber-400/30',
  healthy: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 border-emerald-400/30',
};

// ============================================
// SMART PERCENTAGE FORMATTING
// ============================================

/**
 * Formats a number as a percentage string, omitting the decimal
 * when it ends in .0 (e.g. 0.0% → 0%, 19.4% → 19,4%).
 *
 * @example
 * formatPct(0)      // "0%"
 * formatPct(19.4)   // "19,4%"
 * formatPct(25.0)   // "25%"
 * formatPct(-3.7)   // "-3,7%"
 */
export function formatPct(value: number): string {
  if (Number.isInteger(value) || value % 1 === 0) {
    return `${Math.round(value)}%`;
  }
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}
