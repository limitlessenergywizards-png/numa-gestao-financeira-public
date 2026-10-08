import { describe, it, expect } from 'vitest';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_COLORS,
  TRANSACTION_TYPE_LABELS,
  BANK_ACCOUNT_TYPE_LABELS,
  DRE_CATEGORY_LABELS,
  DATE_FORMATS,
  PAGINATION_DEFAULTS,
  QUICK_FILTER_LABELS,
  STATUS_TAB_LABELS,
  DATE_TYPE_LABELS,
  ROLE_LABELS,
  CHART_ACCOUNT_TYPE_LABELS,
  CHART_ACCOUNT_TYPE_COLORS,
  AUDIT_FIELD_LABELS,
  PAYMENT_METHOD_WITH_ICONS,
  AUTH_LOADING_TIMEOUT_MS,
} from '../constants';

describe('STATUS_LABELS', () => {
  it('has all 4 statuses', () => {
    expect(STATUS_LABELS.pendente).toBe('Pendente');
    expect(STATUS_LABELS.parcial).toBe('Parcial');
    expect(STATUS_LABELS.pago).toBe('Pago');
    expect(STATUS_LABELS.cancelado).toBe('Cancelado');
  });
});

describe('STATUS_COLORS', () => {
  it('has matching keys with STATUS_LABELS', () => {
    expect(Object.keys(STATUS_COLORS).sort()).toEqual(Object.keys(STATUS_LABELS).sort());
  });

  it('each value contains CSS classes', () => {
    Object.values(STATUS_COLORS).forEach(v => {
      expect(v).toContain('bg-');
      expect(v).toContain('text-');
    });
  });
});

describe('PAYMENT_METHOD_LABELS', () => {
  it('has 8 payment methods', () => {
    expect(Object.keys(PAYMENT_METHOD_LABELS)).toHaveLength(8);
  });

  it('includes pix, cartao, boleto', () => {
    expect(PAYMENT_METHOD_LABELS.pix).toBe('PIX');
    expect(PAYMENT_METHOD_LABELS.cartao).toBe('Cartão');
    expect(PAYMENT_METHOD_LABELS.boleto).toBe('Boleto');
  });
});

describe('PAYMENT_METHOD_COLORS', () => {
  it('has matching keys with PAYMENT_METHOD_LABELS', () => {
    expect(Object.keys(PAYMENT_METHOD_COLORS).sort()).toEqual(Object.keys(PAYMENT_METHOD_LABELS).sort());
  });
});

describe('TRANSACTION_TYPE_LABELS', () => {
  it('has entrada and saida', () => {
    expect(TRANSACTION_TYPE_LABELS.entrada).toBe('Entrada');
    expect(TRANSACTION_TYPE_LABELS.saida).toBe('Saída');
  });
});

describe('BANK_ACCOUNT_TYPE_LABELS', () => {
  it('has 4 account types', () => {
    expect(BANK_ACCOUNT_TYPE_LABELS.corrente).toBe('Conta Corrente');
    expect(BANK_ACCOUNT_TYPE_LABELS.poupanca).toBe('Poupança');
    expect(BANK_ACCOUNT_TYPE_LABELS.investimento).toBe('Investimento');
    expect(BANK_ACCOUNT_TYPE_LABELS.caixa).toBe('Caixa');
  });
});

describe('DRE_CATEGORY_LABELS', () => {
  it('has 13 DRE categories', () => {
    expect(Object.keys(DRE_CATEGORY_LABELS)).toHaveLength(13);
  });

  it('starts with receita_bruta and ends with lucro_liquido', () => {
    expect(DRE_CATEGORY_LABELS.receita_bruta).toBe('Receita Bruta');
    expect(DRE_CATEGORY_LABELS.lucro_liquido).toBe('Lucro Líquido');
  });
});

describe('DATE_FORMATS', () => {
  it('has display, api, and monthYear formats', () => {
    expect(DATE_FORMATS.display).toBe('dd/MM/yyyy');
    expect(DATE_FORMATS.api).toBe('yyyy-MM-dd');
    expect(DATE_FORMATS.monthYear).toBe('MMMM yyyy');
  });
});

describe('PAGINATION_DEFAULTS', () => {
  it('default page size is 50', () => {
    expect(PAGINATION_DEFAULTS.pageSize).toBe(50);
  });

  it('page size options are sorted ascending', () => {
    const opts = [...PAGINATION_DEFAULTS.pageSizeOptions];
    expect(opts).toEqual(opts.sort((a, b) => a - b));
  });
});

describe('QUICK_FILTER_LABELS', () => {
  it('has today, week, month', () => {
    expect(QUICK_FILTER_LABELS.today).toBe('Hoje');
    expect(QUICK_FILTER_LABELS.week).toBe('Esta Semana');
    expect(QUICK_FILTER_LABELS.month).toBe('Este Mês');
  });
});

describe('STATUS_TAB_LABELS', () => {
  it('has open, paid, overdue', () => {
    expect(STATUS_TAB_LABELS.open).toBe('Em Aberto');
    expect(STATUS_TAB_LABELS.paid).toBe('Pagos');
    expect(STATUS_TAB_LABELS.overdue).toBe('Vencidos');
  });
});

describe('DATE_TYPE_LABELS', () => {
  it('has due, issue, payment', () => {
    expect(DATE_TYPE_LABELS.due).toBe('Vencimento');
    expect(DATE_TYPE_LABELS.issue).toBe('Emissão');
    expect(DATE_TYPE_LABELS.payment).toBe('Pagamento');
  });
});

describe('ROLE_LABELS', () => {
  it('has admin, editor, viewer', () => {
    expect(ROLE_LABELS.admin).toBe('Administrador');
    expect(ROLE_LABELS.editor).toBe('Gerente');
    expect(ROLE_LABELS.viewer).toBe('Visualizador');
  });
});

describe('CHART_ACCOUNT_TYPE_LABELS', () => {
  it('has receita, despesa, custo', () => {
    expect(CHART_ACCOUNT_TYPE_LABELS.receita).toBe('Receita');
    expect(CHART_ACCOUNT_TYPE_LABELS.despesa).toBe('Despesa');
    expect(CHART_ACCOUNT_TYPE_LABELS.custo).toBe('Custo');
  });
});

describe('CHART_ACCOUNT_TYPE_COLORS', () => {
  it('has matching keys with CHART_ACCOUNT_TYPE_LABELS', () => {
    expect(Object.keys(CHART_ACCOUNT_TYPE_COLORS).sort()).toEqual(
      Object.keys(CHART_ACCOUNT_TYPE_LABELS).sort()
    );
  });
});

describe('AUDIT_FIELD_LABELS', () => {
  it('has common transaction fields', () => {
    expect(AUDIT_FIELD_LABELS.amount).toBe('Valor');
    expect(AUDIT_FIELD_LABELS.description).toBe('Descrição');
    expect(AUDIT_FIELD_LABELS.type).toBe('Tipo');
  });
});

describe('PAYMENT_METHOD_WITH_ICONS', () => {
  it('each entry has label and icon', () => {
    Object.values(PAYMENT_METHOD_WITH_ICONS).forEach(v => {
      expect(v.label).toBeTruthy();
      expect(v.icon).toBeTruthy();
    });
  });

  it('has 6 methods including cartao_debito and cartao_credito', () => {
    expect(Object.keys(PAYMENT_METHOD_WITH_ICONS)).toHaveLength(6);
    expect(PAYMENT_METHOD_WITH_ICONS.cartao_debito.label).toBe('Débito');
    expect(PAYMENT_METHOD_WITH_ICONS.cartao_credito.label).toBe('Crédito');
  });
});

describe('AUTH_LOADING_TIMEOUT_MS', () => {
  it('is 8000ms', () => {
    expect(AUTH_LOADING_TIMEOUT_MS).toBe(8000);
  });
});
