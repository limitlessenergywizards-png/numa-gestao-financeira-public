import { describe, it, expect } from 'vitest';
import { TABLES, RPC, EDGE_FUNCTIONS } from '../api-endpoints';

describe('TABLES', () => {
  it('has core tables', () => {
    expect(TABLES.COMPANIES).toBe('companies');
    expect(TABLES.USER_COMPANIES).toBe('user_companies');
  });

  it('has finance tables', () => {
    expect(TABLES.TRANSACTIONS).toBe('transactions');
    expect(TABLES.BANK_ACCOUNTS).toBe('bank_accounts');
    expect(TABLES.RECEIVABLES).toBe('receivables');
    expect(TABLES.PAYABLES).toBe('payables');
    expect(TABLES.DEBTS).toBe('debts');
  });

  it('has CRM tables', () => {
    expect(TABLES.CUSTOMERS).toBe('customers');
    expect(TABLES.SUPPLIERS).toBe('suppliers');
  });

  it('has IAM tables', () => {
    expect(TABLES.USER_INVITATIONS).toBe('user_invitations');
  });

  it('has onboarding tables', () => {
    expect(TABLES.ONBOARDING_PROGRESS).toBe('onboarding_progress');
    expect(TABLES.USER_ACHIEVEMENTS).toBe('user_achievements');
  });

  it('has template tables', () => {
    expect(TABLES.CHART_ACCOUNT_TEMPLATES).toBe('chart_account_templates');
    expect(TABLES.CHART_ACCOUNT_TEMPLATE_ITEMS).toBe('chart_account_template_items');
  });

  it('has audit table', () => {
    expect(TABLES.AUDIT_LOG).toBe('audit_log');
  });

  it('all values are non-empty strings', () => {
    Object.values(TABLES).forEach(v => {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
    });
  });

  it('no duplicate table names', () => {
    const values = Object.values(TABLES);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('RPC', () => {
  it('has financial totals RPC', () => {
    expect(RPC.GET_FINANCIAL_TOTALS).toBe('get_financial_totals');
  });

  it('has forecast conversion RPC', () => {
    expect(RPC.CONVERT_FORECAST_TO_ACTUAL).toBe('convert_forecast_to_actual');
  });

  it('has user context RPC', () => {
    expect(RPC.GET_USER_CONTEXT).toBe('get_user_context');
  });

  it('all values are non-empty strings', () => {
    Object.values(RPC).forEach(v => {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
    });
  });
});

describe('EDGE_FUNCTIONS', () => {
  it('has AI analysis functions', () => {
    expect(EDGE_FUNCTIONS.ANALYZE_DRE).toBe('analyze-dre');
    expect(EDGE_FUNCTIONS.AI_CHAT).toBe('ai-chat');
    expect(EDGE_FUNCTIONS.AI_OCR_PROXY).toBe('ai-ocr-proxy');
  });

  it('has subscription functions', () => {
    expect(EDGE_FUNCTIONS.CHECK_SUBSCRIPTION).toBe('check-subscription');
    expect(EDGE_FUNCTIONS.CREATE_CHECKOUT_SESSION).toBe('create-checkout-session');
    expect(EDGE_FUNCTIONS.CREATE_PORTAL_SESSION).toBe('create-portal-session');
  });

  it('has admin functions', () => {
    expect(EDGE_FUNCTIONS.ADMIN_GLOBAL_DATA).toBe('admin-global-data');
    expect(EDGE_FUNCTIONS.ADMIN_IMPERSONATE).toBe('admin-impersonate');
  });

  it('all values are non-empty strings', () => {
    Object.values(EDGE_FUNCTIONS).forEach(v => {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
    });
  });

  it('no duplicate function names', () => {
    const values = Object.values(EDGE_FUNCTIONS);
    expect(new Set(values).size).toBe(values.length);
  });

  it('edge function names use kebab-case', () => {
    Object.values(EDGE_FUNCTIONS).forEach(v => {
      expect(v).toMatch(/^[a-z][a-z0-9-]*$/);
    });
  });
});
