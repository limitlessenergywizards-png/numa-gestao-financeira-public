/**
 * DRE (Demonstração do Resultado do Exercício) specific types.
 * Used for income statement calculations and data processing.
 */

import type { TransactionType } from '@/types/common';

// ============================================
// BASE CHART ACCOUNT RELATION
// ============================================

export interface ChartAccountRelation {
  id: string;
  name: string;
  code: string;
  type: 'receita' | 'despesa' | 'ativo' | 'passivo' | 'patrimonio';
  dre_category: string | null;
}

// ============================================
// DRE DATA ITEMS
// ============================================

/**
 * Transaction item with chart account relation for DRE calculations.
 */
export interface DRETransactionItem {
  id: string;
  amount: number;
  type: TransactionType;
  transaction_date: string;
  description: string;
  chart_account_id: string | null;
  chart_of_accounts: ChartAccountRelation | null;
}

/**
 * Receivable item for DRE revenue calculations.
 */
export interface DREReceivableItem {
  id: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  due_date: string;
  description: string;
  chart_account_id: string | null;
  chart_of_accounts: ChartAccountRelation | null;
}

/**
 * Payable item for DRE expense/cost calculations.
 */
export interface DREPayableItem {
  id: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  due_date: string;
  description: string;
  chart_account_id: string | null;
  chart_of_accounts: ChartAccountRelation | null;
}

/**
 * Generic item that can be grouped by category.
 */
export interface DREGroupableItem {
  total_amount?: number;
  amount?: number;
  paid_amount?: number;
  chart_of_accounts: {
    id: string;
    name: string;
    code: string;
    dre_category?: string | null;
  } | null;
}

// ============================================
// DRE CATEGORY STRUCTURES
// ============================================

/**
 * Grouped data by DRE category.
 */
export interface DRECategoryGroup {
  category: string;
  categoryLabel: string;
  total: number;
  items: DRECategoryItem[];
}

/**
 * Individual item within a DRE category.
 */
export interface DRECategoryItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  percentage: number;
}

// ============================================
// DRE LINE ITEMS
// ============================================

/**
 * Standard DRE line structure.
 */
export interface DRELineItem {
  id: string;
  label: string;
  value: number;
  percentage: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
  indent?: number;
  children?: DRELineItem[];
}

/**
 * DRE section (e.g., Revenue, Expenses, etc.)
 */
export interface DRESection {
  id: string;
  title: string;
  lines: DRELineItem[];
  total: number;
  totalLabel: string;
}

// ============================================
// DRE CALCULATION RESULTS
// ============================================

/**
 * Complete DRE calculation result.
 */
export interface DRECalculation {
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  custos: number;
  lucroBruto: number;
  despesasOperacionais: number;
  despesasAdministrativas: number;
  despesasComerciais: number;
  resultadoOperacional: number;
  resultadoFinanceiro: number;
  resultadoAntesIR: number;
  impostos: number;
  lucroLiquido: number;
}

/**
 * DRE margins and percentages.
 */
export interface DREMargins {
  margemBruta: number;
  margemOperacional: number;
  margemLiquida: number;
  margemEbitda: number;
}

/**
 * DRE comparison between periods.
 */
export interface DREComparison {
  current: DRECalculation;
  previous: DRECalculation;
  variations: {
    [K in keyof DRECalculation]: {
      absolute: number;
      percentage: number;
    };
  };
}

// ============================================
// DRE BUDGET TYPES
// ============================================

/**
 * Budget entry for DRE planning.
 */
export interface DREBudgetEntry {
  id: string;
  categoryCode: string;
  categoryName: string;
  periodYear: number;
  periodMonth: number;
  budgetedValue: number;
  actualValue?: number;
  variance?: number;
  variancePercentage?: number;
}

/**
 * Budget vs Actual comparison.
 */
export interface DREBudgetComparison {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'under' | 'on-track' | 'over';
}

// ============================================
// DRE EVOLUTION/TREND TYPES
// ============================================

/**
 * Monthly DRE data point for charts.
 */
export interface DREMonthlyPoint {
  month: string;
  monthLabel: string;
  receitaLiquida: number;
  custos: number;
  lucroBruto: number;
  despesas: number;
  lucroLiquido: number;
}

/**
 * Year-over-year comparison data.
 */
export interface DREYearComparison {
  year: number;
  months: DREMonthlyPoint[];
  totals: DRECalculation;
}
