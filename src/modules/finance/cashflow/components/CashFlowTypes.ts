export interface DetailedTransaction {
  id: string;
  date: string;
  description: string;
  category: string | null;
  categoryCode: string | null;
  type: 'entrada' | 'saida';
  amount: number;
  source: 'transaction' | 'receivable_payment' | 'payable_payment' | 'projected_receivable' | 'projected_payable';
  isProjected: boolean;
}

export interface DailyDetail {
  date: string;
  transactions: DetailedTransaction[];
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

export interface WeeklyData {
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  saldoInicial: number;
  entradas: number;
  saidas: number;
  saldoFinal: number;
  days: DailyDetail[];
}

export interface MonthlyCategory {
  code: string;
  name: string;
  total: number;
  transactions: DetailedTransaction[];
}

export interface MonthlyData {
  saldoInicial: number;
  entradas: number;
  saidas: number;
  saldoOperacional: number;
  saldoFinal: number;
  entradasByCategory: MonthlyCategory[];
  saidasByCategory: MonthlyCategory[];
}

export interface BankAccount {
  id: string;
  name: string;
  current_balance: number;
  initial_balance: number;
}

// Matrix view types
export interface MatrixWeekColumn {
  weekNumber: number;
  weekLabel: string;
  dateRange: string;
  startDate: string;
  endDate: string;
}

export interface MatrixCategoryData {
  code: string;
  name: string;
  values: Record<number, number>;
  total: number;
}

export interface MatrixGroupData {
  groupName: string;
  type: 'entrada' | 'saida';
  categories: MatrixCategoryData[];
  totals: Record<number, number>;
  grandTotal: number;
}
