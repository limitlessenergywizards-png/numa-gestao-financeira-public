'use client';

/**
 * Persistent Filter Store (Zustand)
 *
 * Manages filter state with localStorage persistence.
 * Filters are stored per company to avoid data leakage between companies.
 *
 * Uses Zustand for:
 * - React 18 concurrent mode safety (useSyncExternalStore internally)
 * - Granular subscriptions (only affected components re-render)
 * - Clean selector-based API
 */

import { create } from 'zustand';
import { CACHE } from '@/lib/config';

// ============================================
// TYPES
// ============================================

export type AccountStatusTab = 'all' | 'open' | 'paid' | 'overdue';
export type DateFilterType = 'due' | 'issue' | 'payment';
export type DREViewMode = 'monthly' | 'quarterly' | 'yearly';
export type CashFlowViewMode = 'daily' | 'weekly' | 'monthly';

/** Accounts page filters (Payables/Receivables) */
export interface AccountFilters {
  statusTab: AccountStatusTab;
  dateType: DateFilterType;
  entityFilter: string;
  categoryFilter: string;
  costTypeFilter: string;
  searchTerm: string;
  dateFrom: string | null;  // ISO string for serialization
  dateTo: string | null;    // ISO string for serialization
}

/** Dashboard filters */
export interface DashboardFilters {
  period: string;           // e.g., '2025-02' for monthly
  bankAccountId: string;    // 'all' or specific ID
  showProjections: boolean;
}

/** DRE filters */
export interface DREFilters {
  viewMode: DREViewMode;
  year: number;
  month: number;            // 1-12
  quarter: number;          // 1-4 (when viewMode is quarterly)
  showBudget: boolean;
  showVariation: boolean;
}

/** Cash Flow filters */
export interface CashFlowFilters {
  viewMode: CashFlowViewMode;
  startDate: string | null; // ISO string
  endDate: string | null;   // ISO string
  bankAccountId: string;    // 'all' or specific ID
  showProjections: boolean;
  groupBy: 'category' | 'day' | 'none';
}

/** Transactions page filters */
export interface TransactionFilters {
  bankAccountId: string;
  categoryId: string;
  type: 'all' | 'entrada' | 'saida';
  status: 'all' | 'reconciled' | 'pending';
  searchTerm: string;
  dateFrom: string | null;
  dateTo: string | null;
}

/** All filters combined */
export interface AllFilters {
  accounts: {
    payables: AccountFilters;
    receivables: AccountFilters;
  };
  dashboard: DashboardFilters;
  dre: DREFilters;
  cashFlow: CashFlowFilters;
  transactions: TransactionFilters;
}

// ============================================
// DEFAULT VALUES
// ============================================

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export const DEFAULT_ACCOUNT_FILTERS: AccountFilters = {
  statusTab: 'all',
  dateType: 'due',
  entityFilter: 'all',
  categoryFilter: 'all',
  costTypeFilter: 'all',
  searchTerm: '',
  dateFrom: null,
  dateTo: null,
};

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  period: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
  bankAccountId: 'all',
  showProjections: true,
};

export const DEFAULT_DRE_FILTERS: DREFilters = {
  viewMode: 'monthly',
  year: currentYear,
  month: currentMonth,
  quarter: Math.ceil(currentMonth / 3),
  showBudget: true,
  showVariation: true,
};

export const DEFAULT_CASHFLOW_FILTERS: CashFlowFilters = {
  viewMode: 'daily',
  startDate: null,
  endDate: null,
  bankAccountId: 'all',
  showProjections: true,
  groupBy: 'none',
};

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = {
  bankAccountId: 'all',
  categoryId: 'all',
  type: 'all',
  status: 'all',
  searchTerm: '',
  dateFrom: null,
  dateTo: null,
};

const DEFAULT_ALL_FILTERS: AllFilters = {
  accounts: {
    payables: { ...DEFAULT_ACCOUNT_FILTERS },
    receivables: { ...DEFAULT_ACCOUNT_FILTERS },
  },
  dashboard: { ...DEFAULT_DASHBOARD_FILTERS },
  dre: { ...DEFAULT_DRE_FILTERS },
  cashFlow: { ...DEFAULT_CASHFLOW_FILTERS },
  transactions: { ...DEFAULT_TRANSACTION_FILTERS },
};

// ============================================
// STORAGE HELPERS
// ============================================

const STORAGE_KEY_PREFIX = `${CACHE.STORAGE_PREFIX}filters_`;

function getStorageKey(companyId: string): string {
  return `${STORAGE_KEY_PREFIX}${companyId}`;
}

function loadFilters(companyId: string): AllFilters {
  if (typeof window === 'undefined') return { ...DEFAULT_ALL_FILTERS };
  try {
    const stored = localStorage.getItem(getStorageKey(companyId));
    if (!stored) return { ...DEFAULT_ALL_FILTERS };

    const parsed = JSON.parse(stored) as Partial<AllFilters>;

    // Merge with defaults to handle missing fields from old versions
    return {
      accounts: {
        payables: { ...DEFAULT_ACCOUNT_FILTERS, ...parsed.accounts?.payables },
        receivables: { ...DEFAULT_ACCOUNT_FILTERS, ...parsed.accounts?.receivables },
      },
      dashboard: { ...DEFAULT_DASHBOARD_FILTERS, ...parsed.dashboard },
      dre: { ...DEFAULT_DRE_FILTERS, ...parsed.dre },
      cashFlow: { ...DEFAULT_CASHFLOW_FILTERS, ...parsed.cashFlow },
      transactions: { ...DEFAULT_TRANSACTION_FILTERS, ...parsed.transactions },
    };
  } catch (error) {
    console.warn('[filterStore] Failed to load filters:', error);
    return { ...DEFAULT_ALL_FILTERS };
  }
}

function saveFilters(companyId: string, filters: AllFilters): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(companyId), JSON.stringify(filters));
  } catch (error) {
    console.warn('[filterStore] Failed to save filters:', error);
  }
}

// ============================================
// ZUSTAND STORE
// ============================================

interface FilterStoreState {
  // Filter data (matches AllFilters shape)
  accounts: AllFilters['accounts'];
  dashboard: DashboardFilters;
  dre: DREFilters;
  cashFlow: CashFlowFilters;
  transactions: TransactionFilters;

  // Internal state
  _companyId: string | null;

  // Lifecycle actions
  initialize: (companyId: string) => void;
  reset: () => void;
  persist: () => void;

  // Account filters
  setAccountFilters: (type: 'payables' | 'receivables', updates: Partial<AccountFilters>) => void;
  getAccountFilters: (type: 'payables' | 'receivables') => AccountFilters;
  clearAccountFilters: (type: 'payables' | 'receivables') => void;

  // Dashboard filters
  setDashboardFilters: (updates: Partial<DashboardFilters>) => void;
  clearDashboardFilters: () => void;

  // DRE filters
  setDREFilters: (updates: Partial<DREFilters>) => void;
  clearDREFilters: () => void;

  // Cash flow filters
  setCashFlowFilters: (updates: Partial<CashFlowFilters>) => void;
  clearCashFlowFilters: () => void;

  // Transactions filters
  setTransactionFilters: (updates: Partial<TransactionFilters>) => void;
  clearTransactionFilters: () => void;

  // Clear all
  clearAllFilters: () => void;
}

/** Helper to extract filter data from state (excludes internal fields and actions) */
function extractFilters(state: FilterStoreState): AllFilters {
  return {
    accounts: state.accounts,
    dashboard: state.dashboard,
    dre: state.dre,
    cashFlow: state.cashFlow,
    transactions: state.transactions,
  };
}

export const useFilterStore = create<FilterStoreState>()((set, get) => ({
  // Initial state
  accounts: {
    payables: { ...DEFAULT_ACCOUNT_FILTERS },
    receivables: { ...DEFAULT_ACCOUNT_FILTERS },
  },
  dashboard: { ...DEFAULT_DASHBOARD_FILTERS },
  dre: { ...DEFAULT_DRE_FILTERS },
  cashFlow: { ...DEFAULT_CASHFLOW_FILTERS },
  transactions: { ...DEFAULT_TRANSACTION_FILTERS },
  _companyId: null,

  initialize: (companyId: string) => {
    if (get()._companyId === companyId) return;
    const loaded = loadFilters(companyId);
    set({ ...loaded, _companyId: companyId });
  },

  reset: () => {
    set({
      accounts: {
        payables: { ...DEFAULT_ACCOUNT_FILTERS },
        receivables: { ...DEFAULT_ACCOUNT_FILTERS },
      },
      dashboard: { ...DEFAULT_DASHBOARD_FILTERS },
      dre: { ...DEFAULT_DRE_FILTERS },
      cashFlow: { ...DEFAULT_CASHFLOW_FILTERS },
      transactions: { ...DEFAULT_TRANSACTION_FILTERS },
      _companyId: null,
    });
  },

  persist: () => {
    const state = get();
    if (state._companyId) {
      saveFilters(state._companyId, extractFilters(state));
    }
  },

  // ============================================
  // ACCOUNTS FILTERS
  // ============================================

  getAccountFilters: (type) => get().accounts[type],

  setAccountFilters: (type, updates) => {
    set((state) => ({
      accounts: {
        ...state.accounts,
        [type]: { ...state.accounts[type], ...updates },
      },
    }));
  },

  clearAccountFilters: (type) => {
    set((state) => ({
      accounts: {
        ...state.accounts,
        [type]: { ...DEFAULT_ACCOUNT_FILTERS },
      },
    }));
  },

  // ============================================
  // DASHBOARD FILTERS
  // ============================================

  setDashboardFilters: (updates) => {
    set((state) => ({
      dashboard: { ...state.dashboard, ...updates },
    }));
  },

  clearDashboardFilters: () => {
    set({ dashboard: { ...DEFAULT_DASHBOARD_FILTERS } });
  },

  // ============================================
  // DRE FILTERS
  // ============================================

  setDREFilters: (updates) => {
    set((state) => ({
      dre: { ...state.dre, ...updates },
    }));
  },

  clearDREFilters: () => {
    set({ dre: { ...DEFAULT_DRE_FILTERS } });
  },

  // ============================================
  // CASH FLOW FILTERS
  // ============================================

  setCashFlowFilters: (updates) => {
    set((state) => ({
      cashFlow: { ...state.cashFlow, ...updates },
    }));
  },

  clearCashFlowFilters: () => {
    set({ cashFlow: { ...DEFAULT_CASHFLOW_FILTERS } });
  },

  // ============================================
  // TRANSACTIONS FILTERS
  // ============================================

  setTransactionFilters: (updates) => {
    set((state) => ({
      transactions: { ...state.transactions, ...updates },
    }));
  },

  clearTransactionFilters: () => {
    set({ transactions: { ...DEFAULT_TRANSACTION_FILTERS } });
  },

  // ============================================
  // CLEAR ALL
  // ============================================

  clearAllFilters: () => {
    set({
      accounts: {
        payables: { ...DEFAULT_ACCOUNT_FILTERS },
        receivables: { ...DEFAULT_ACCOUNT_FILTERS },
      },
      dashboard: { ...DEFAULT_DASHBOARD_FILTERS },
      dre: { ...DEFAULT_DRE_FILTERS },
      cashFlow: { ...DEFAULT_CASHFLOW_FILTERS },
      transactions: { ...DEFAULT_TRANSACTION_FILTERS },
    });
  },
}));

// ============================================
// AUTO-SAVE: Persist to localStorage with debounce (300ms)
// Avoids excessive writes on rapid filter changes (e.g., typing in search)
// ============================================

// ============================================
// SELECTOR HOOKS: Granular subscriptions to avoid unnecessary re-renders
// Use these instead of useFilterStore() to only subscribe to what you need.
// ============================================

/** Only re-renders when payable filters change */
export const usePayablesFilters = () => useFilterStore((s) => s.accounts.payables);

/** Only re-renders when receivable filters change */
export const useReceivablesFilters = () => useFilterStore((s) => s.accounts.receivables);

/** Only re-renders when dashboard filters change */
export const useDashboardFiltersState = () => useFilterStore((s) => s.dashboard);

/** Only re-renders when DRE filters change */
export const useDREFiltersState = () => useFilterStore((s) => s.dre);

/** Only re-renders when cash flow filters change */
export const useCashFlowFiltersState = () => useFilterStore((s) => s.cashFlow);

/** Only re-renders when transaction filters change */
export const useTransactionFiltersState = () => useFilterStore((s) => s.transactions);

let _persistTimer: ReturnType<typeof setTimeout> | null = null;

useFilterStore.subscribe((state) => {
  if (state._companyId) {
    if (_persistTimer) clearTimeout(_persistTimer);
    _persistTimer = setTimeout(() => {
      saveFilters(state._companyId!, extractFilters(state));
      _persistTimer = null;
    }, 300);
  }
});
