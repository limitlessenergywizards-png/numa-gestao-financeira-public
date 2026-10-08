import { describe, it, expect } from 'vitest';
import {
  AUDIT_ACTIONS,
  ACTION_LABELS,
  ACTION_ICONS,
  ACTION_COLORS,
  FIELD_LABELS,
  getActionLabel,
  getActionIcon,
  getActionColor,
  getFieldLabel,
} from '../auditActions';

// ================================================================
// AUDIT_ACTIONS constants
// ================================================================
describe('AUDIT_ACTIONS', () => {
  it('has basic trigger actions', () => {
    expect(AUDIT_ACTIONS.INSERT).toBe('INSERT');
    expect(AUDIT_ACTIONS.UPDATE).toBe('UPDATE');
    expect(AUDIT_ACTIONS.DELETE).toBe('DELETE');
  });

  it('has semantic actions', () => {
    expect(AUDIT_ACTIONS.RECONCILED).toBe('reconciled');
    expect(AUDIT_ACTIONS.PAYMENT_RECORDED).toBe('payment_recorded');
    expect(AUDIT_ACTIONS.STATUS_CHANGED).toBe('status_changed');
    expect(AUDIT_ACTIONS.DATE_CHANGED).toBe('date_changed');
  });
});

// ================================================================
// getActionLabel()
// ================================================================
describe('getActionLabel()', () => {
  it('INSERT → Portuguese label', () => {
    expect(getActionLabel('INSERT')).toBe('criou este registro');
  });

  it('UPDATE → "alterou"', () => {
    expect(getActionLabel('UPDATE')).toBe('alterou');
  });

  it('DELETE → "excluiu este registro"', () => {
    expect(getActionLabel('DELETE')).toBe('excluiu este registro');
  });

  it('reconciled → "marcou como conciliado"', () => {
    expect(getActionLabel('reconciled')).toBe('marcou como conciliado');
  });

  it('payment_recorded → "registrou pagamento"', () => {
    expect(getActionLabel('payment_recorded')).toBe('registrou pagamento');
  });

  it('unknown action → returns the action string itself', () => {
    expect(getActionLabel('custom_action')).toBe('custom_action');
  });

  it('all ACTION_LABELS keys have a corresponding label', () => {
    for (const key of Object.keys(ACTION_LABELS)) {
      expect(getActionLabel(key)).toBeTruthy();
      expect(getActionLabel(key)).not.toBe(key); // Should return mapped label, not fallback
    }
  });
});

// ================================================================
// getActionIcon()
// ================================================================
describe('getActionIcon()', () => {
  it('INSERT → green circle', () => {
    expect(getActionIcon('INSERT')).toBe('🟢');
  });

  it('DELETE → red circle', () => {
    expect(getActionIcon('DELETE')).toBe('🔴');
  });

  it('reconciled → checkmark', () => {
    expect(getActionIcon('reconciled')).toBe('✅');
  });

  it('unknown action → default 📝', () => {
    expect(getActionIcon('unknown')).toBe('📝');
  });

  it('all ACTION_ICONS keys have icons', () => {
    for (const key of Object.keys(ACTION_ICONS)) {
      expect(getActionIcon(key)).toBeTruthy();
    }
  });
});

// ================================================================
// getActionColor()
// ================================================================
describe('getActionColor()', () => {
  it('INSERT → success color', () => {
    expect(getActionColor('INSERT')).toContain('success');
  });

  it('UPDATE → blue color', () => {
    expect(getActionColor('UPDATE')).toContain('blue');
  });

  it('DELETE → destructive color', () => {
    expect(getActionColor('DELETE')).toContain('destructive');
  });

  it('unknown action → muted fallback', () => {
    expect(getActionColor('unknown')).toContain('muted');
  });

  it('all ACTION_COLORS keys have colors', () => {
    for (const key of Object.keys(ACTION_COLORS)) {
      expect(getActionColor(key)).toBeTruthy();
    }
  });
});

// ================================================================
// getFieldLabel()
// ================================================================
describe('getFieldLabel()', () => {
  it('amount → "Valor"', () => {
    expect(getFieldLabel('amount')).toBe('Valor');
  });

  it('description → "Descrição"', () => {
    expect(getFieldLabel('description')).toBe('Descrição');
  });

  it('due_date → "Data de Vencimento"', () => {
    expect(getFieldLabel('due_date')).toBe('Data de Vencimento');
  });

  it('status → "Status"', () => {
    expect(getFieldLabel('status')).toBe('Status');
  });

  it('reconciled → "Conciliado"', () => {
    expect(getFieldLabel('reconciled')).toBe('Conciliado');
  });

  it('unknown field → returns field name itself', () => {
    expect(getFieldLabel('custom_field')).toBe('custom_field');
  });

  it('all FIELD_LABELS keys return Portuguese labels', () => {
    for (const [key, label] of Object.entries(FIELD_LABELS)) {
      expect(getFieldLabel(key)).toBe(label);
    }
  });
});
