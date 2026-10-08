import { describe, it, expect } from 'vitest';
import { transactionRulesService, type TransactionRule } from '../transactionRules';

function makeRule(overrides: Partial<TransactionRule> = {}): TransactionRule {
  return {
    id: '1',
    company_id: 'c1',
    keyword: 'pagamento',
    description_match_type: 'contains',
    category_id: 'cat1',
    supplier_id: null,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  };
}

describe('matchRule()', () => {
  it('contains match → returns the rule', () => {
    const rules = [makeRule({ keyword: 'energia', description_match_type: 'contains' })];
    const result = transactionRulesService.matchRule('Conta de energia elétrica', rules);
    expect(result).not.toBeNull();
    expect(result!.keyword).toBe('energia');
  });

  it('exact match → returns the rule', () => {
    const rules = [makeRule({ keyword: 'aluguel mensal', description_match_type: 'exact' })];
    expect(transactionRulesService.matchRule('aluguel mensal', rules)).not.toBeNull();
  });

  it('exact match → partial does not match', () => {
    const rules = [makeRule({ keyword: 'aluguel', description_match_type: 'exact' })];
    expect(transactionRulesService.matchRule('aluguel mensal', rules)).toBeNull();
  });

  it('starts_with match', () => {
    const rules = [makeRule({ keyword: 'pix recebido', description_match_type: 'starts_with' })];
    expect(transactionRulesService.matchRule('PIX Recebido - João', rules)).not.toBeNull();
  });

  it('starts_with → middle match does not work', () => {
    const rules = [makeRule({ keyword: 'recebido', description_match_type: 'starts_with' })];
    expect(transactionRulesService.matchRule('PIX Recebido - João', rules)).toBeNull();
  });

  it('case insensitive matching', () => {
    const rules = [makeRule({ keyword: 'ENERGIA', description_match_type: 'contains' })];
    expect(transactionRulesService.matchRule('conta de energia', rules)).not.toBeNull();
  });

  it('empty description → null', () => {
    const rules = [makeRule()];
    expect(transactionRulesService.matchRule('', rules)).toBeNull();
  });

  it('no matching rules → null', () => {
    const rules = [makeRule({ keyword: 'xyz', description_match_type: 'contains' })];
    expect(transactionRulesService.matchRule('abc def', rules)).toBeNull();
  });

  it('empty rules array → null', () => {
    expect(transactionRulesService.matchRule('something', [])).toBeNull();
  });

  it('exact match has priority over contains', () => {
    const rules = [
      makeRule({ id: '1', keyword: 'aluguel', description_match_type: 'contains', category_id: 'cat_contains' }),
      makeRule({ id: '2', keyword: 'aluguel', description_match_type: 'exact', category_id: 'cat_exact' }),
    ];
    const result = transactionRulesService.matchRule('aluguel', rules);
    expect(result!.category_id).toBe('cat_exact');
  });

  it('starts_with has priority over contains', () => {
    const rules = [
      makeRule({ id: '1', keyword: 'pix', description_match_type: 'contains', category_id: 'cat_contains' }),
      makeRule({ id: '2', keyword: 'pix', description_match_type: 'starts_with', category_id: 'cat_starts' }),
    ];
    const result = transactionRulesService.matchRule('pix recebido', rules);
    expect(result!.category_id).toBe('cat_starts');
  });

  it('returns first matching rule when multiple match', () => {
    const rules = [
      makeRule({ id: '1', keyword: 'conta', description_match_type: 'contains', category_id: 'cat1' }),
      makeRule({ id: '2', keyword: 'energia', description_match_type: 'contains', category_id: 'cat2' }),
    ];
    const result = transactionRulesService.matchRule('conta de energia', rules);
    expect(result).not.toBeNull();
  });

  it('handles rules with default match type (contains)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rules = [makeRule({ keyword: 'teste', description_match_type: 'contains' as any })];
    expect(transactionRulesService.matchRule('um teste aqui', rules)).not.toBeNull();
  });
});
