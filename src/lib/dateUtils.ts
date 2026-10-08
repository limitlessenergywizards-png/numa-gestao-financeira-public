/**
 * Date utility functions for financial calculations
 * Centralized to avoid duplication across components
 */

import { differenceInDays, isAfter, isBefore, isToday, startOfDay, startOfToday, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PayableStatus, ReceivableStatus } from '@/types';

/**
 * Calculate the number of days overdue for a financial record.
 * Returns 0 if the record is paid, canceled, or not yet due.
 * 
 * @param dueDate - The due date in ISO string format (YYYY-MM-DD)
 * @param status - The current status of the payable/receivable
 * @returns Number of days overdue, or 0 if not overdue
 * 
 * @example
 * getOverdueDays('2024-01-15', 'pendente') // Returns days since Jan 15
 * getOverdueDays('2024-01-15', 'pago')     // Returns 0 (already paid)
 */
export function getOverdueDays(
  dueDate: string,
  status: PayableStatus | ReceivableStatus
): number {
  if (status === 'pago' || status === 'cancelado') return 0;
  
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  
  return isAfter(today, due) ? differenceInDays(today, due) : 0;
}

/**
 * Check if a financial record is overdue
 */
export function isOverdue(
  dueDate: string,
  status: PayableStatus | ReceivableStatus
): boolean {
  return getOverdueDays(dueDate, status) > 0;
}

/**
 * Format a date string for display in Brazilian format
 */
export function formatDateBR(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
}

/**
 * Format a date string for display with day name
 */
export function formatDateWithWeekday(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

/**
 * Format a month/year for display
 */
export function formatMonthYear(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "MMMM 'de' yyyy", { locale: ptBR });
}

// ============================================
// DUE STATUS UTILITIES
// ============================================

export type DueStatus = 'overdue' | 'due_today' | 'due_soon' | 'future';

export interface DueStatusInfo {
  status: DueStatus;
  daysInfo: string;
  daysCount: number;
}

/**
 * Get due status information for a given date.
 * Centralizes logic that was duplicated across components.
 * 
 * @param dueDate - The due date as Date or ISO string
 * @returns Object with status, human-readable daysInfo, and daysCount
 * 
 * @example
 * getDueStatus('2024-01-10') 
 * // { status: 'overdue', daysInfo: '5 dias em atraso', daysCount: -5 }
 */
export function getDueStatus(dueDate: Date | string): DueStatusInfo {
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  const today = startOfToday();
  const daysCount = differenceInDays(due, today);
  
  if (isBefore(due, today)) {
    return {
      status: 'overdue',
      daysInfo: `${Math.abs(daysCount)} dias em atraso`,
      daysCount,
    };
  }
  
  if (isToday(due)) {
    return {
      status: 'due_today',
      daysInfo: 'vence hoje',
      daysCount: 0,
    };
  }
  
  if (daysCount <= 7) {
    return {
      status: 'due_soon',
      daysInfo: `vence em ${daysCount} dias`,
      daysCount,
    };
  }
  
  return {
    status: 'future',
    daysInfo: `vence em ${daysCount} dias`,
    daysCount,
  };
}
