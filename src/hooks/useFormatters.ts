'use client';

/**
 * useFormatters Hook
 * 
 * Hook otimizado para formatação de moeda e data.
 * Usa cache de Intl.NumberFormat para evitar recriação.
 */

import { useMemo } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Cache global de formatters (Intl.NumberFormat é pesado para criar)
const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(key: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  if (!formatterCache.has(key)) {
    formatterCache.set(key, new Intl.NumberFormat('pt-BR', options));
  }
  return formatterCache.get(key)!;
}

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  return getFormatter(`currency-${currency}`, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getNumberFormatter(decimals: number): Intl.NumberFormat {
  return getFormatter(`number-${decimals}`, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getPercentFormatter(decimals: number): Intl.NumberFormat {
  return getFormatter(`percent-${decimals}`, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getCompactFormatter(): Intl.NumberFormat {
  return getFormatter('compact', {
    notation: 'compact',
    compactDisplay: 'short',
  });
}

export interface Formatters {
  formatCurrency: (value: number) => string;
  formatNumber: (value: number, decimals?: number) => string;
  formatPercent: (value: number) => string;
  formatCompact: (value: number) => string;
  formatDate: (date: Date | string, pattern?: string) => string;
  formatDateShort: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
  formatRelative: (date: Date | string) => string;
  currency: string;
  currencySymbol: string;
}

export function useFormatters(): Formatters {
  const { currentCompany } = useCompany();
  
  const currency = currentCompany?.currency || 'BRL';
  const currencySymbol = currentCompany?.currency_symbol || 'R$';
  
  const formatters = useMemo(() => {
    const currencyFormatter = getCurrencyFormatter(currency);
    
    return {
      formatCurrency: (value: number): string => {
        return currencyFormatter.format(value);
      },
      
      formatNumber: (value: number, decimals: number = 2): string => {
        return getNumberFormatter(decimals).format(value);
      },
      
      formatPercent: (value: number): string => {
        return getPercentFormatter(1).format(value);
      },

      formatCompact: (value: number): string => {
        return getCompactFormatter().format(value);
      },
      
      formatDate: (date: Date | string, pattern: string = 'dd/MM/yyyy'): string => {
        try {
          const d = typeof date === 'string' ? new Date(date) : date;
          return format(d, pattern, { locale: ptBR });
        } catch {
          return '-';
        }
      },
      
      formatDateShort: (date: Date | string): string => {
        try {
          const d = typeof date === 'string' ? new Date(date) : date;
          return format(d, 'dd/MM/yy');
        } catch {
          return '-';
        }
      },
      
      formatDateTime: (date: Date | string): string => {
        try {
          const d = typeof date === 'string' ? new Date(date) : date;
          return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } catch {
          return '-';
        }
      },
      
      formatRelative: (date: Date | string): string => {
        try {
          const d = typeof date === 'string' ? new Date(date) : date;
          return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
        } catch {
          return '-';
        }
      },
      
      currency,
      currencySymbol,
    };
  }, [currency, currencySymbol]);
  
  return formatters;
}

// Funções standalone
export function formatCurrencyStandalone(value: number, currency: string = 'BRL'): string {
  return getCurrencyFormatter(currency).format(value);
}

export function formatNumberStandalone(value: number, decimals: number = 2): string {
  return getNumberFormatter(decimals).format(value);
}

export function formatDateStandalone(date: Date | string, pattern: string = 'dd/MM/yyyy'): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, pattern, { locale: ptBR });
  } catch {
    return '-';
  }
}

export function formatCompactStandalone(value: number): string {
  return getCompactFormatter().format(value);
}

export default useFormatters;
