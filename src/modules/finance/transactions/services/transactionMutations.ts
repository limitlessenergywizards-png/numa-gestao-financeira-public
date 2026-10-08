/**
 * Transaction Mutation Services
 *
 * Complex business-logic operations that combine multiple DB calls:
 * recurring transactions, payable/receivable sync, debt payments,
 * forecast conversion, and cascade soft-deletes.
 */

import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, getDay, addDays } from 'date-fns';
import { parseCurrencyValue } from '@/lib/masks';
import { moneyMax0, moneySub, moneyAdd, moneyToNumber } from '@/lib/money';
import { recurringEngine } from '@/modules/finance/recurrence/services/recurringEngine';
import type { TransactionFormData } from '../hooks/useTransactionsActions';
import type { RecurrenceConfig } from '../components/RecurrenceSelector';

// ============================================
// RECURRING TRANSACTIONS
// ============================================

const FREQ_MAP: Record<string, string> = {
  daily: 'diaria',
  weekly: 'semanal',
  biweekly: 'quinzenal',
  monthly: 'mensal',
  quarterly: 'trimestral',
  semiannual: 'semestral',
  yearly: 'anual',
  custom: 'personalizada',
};

export async function createRecurringTransactions(
  companyId: string,
  formData: TransactionFormData,
  parsedAmount: number
): Promise<void> {
  const rc = formData.recurrenceConfig!;
  const baseDate = parseISO(formData.transaction_date);
  const startDates: Date[] = [];

  if (rc.frequency === 'weekly' && rc.specificDays && rc.specificDays.length > 0) {
    rc.specificDays.forEach((day) => {
      const currentDay = getDay(baseDate);
      const diff = (day - currentDay + 7) % 7;
      startDates.push(addDays(baseDate, diff));
    });
  } else {
    startDates.push(baseDate);
  }

  for (const startDate of startDates) {
    const recurringPayload = {
      company_id: companyId,
      name: formData.description,
      amount: parsedAmount,
      category_id: formData.category_id || null,
      bank_account_id: formData.bank_account_id || null,
      type: formData.type === 'entrada' ? 'receita' : 'despesa',
      frequency: FREQ_MAP[rc.frequency] || 'mensal',
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: rc.endDate ? format(rc.endDate, 'yyyy-MM-dd') : null,
      day_of_month: rc.dayOfMonth,
      occurrence_limit: rc.occurrenceLimit,
      occurrence_count: 0,
      status: 'active',
      create_as_forecast: formData.nature === 'previsao',
      forecast_confidence: formData.forecast_confidence,
      skip_weekends: false,
      skip_holidays: false,
      custom_interval_value: rc.interval,
      custom_interval_unit: null,
    };

    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert(recurringPayload)
      .select()
      .single();

    if (error) throw error;
    await recurringEngine.materializeOccurrences(data.id);
  }
}

// ============================================
// STANDARD TRANSACTION INSERT
// ============================================

const FULL_TX_SELECT = `
  *,
  bank_account:bank_accounts(name),
  chart_account:chart_of_accounts(name, code),
  category:categories(name),
  customer:customers(name),
  supplier:suppliers(name)
`;

export async function insertStandardTransaction(
  companyId: string,
  formData: TransactionFormData,
  parsedAmount: number
) {
  const payload = {
    company_id: companyId,
    bank_account_id: formData.bank_account_id,
    chart_account_id: formData.chart_account_id || null,
    category_id: formData.category_id || null,
    customer_id: formData.customer_id || null,
    supplier_id: formData.supplier_id || null,
    type: formData.type,
    amount: parsedAmount,
    description: formData.description,
    transaction_date: formData.transaction_date,
    payment_method: formData.payment_method,
    document_number: formData.document_number || null,
    notes: formData.notes || null,
    nature: formData.nature,
    forecast_type:
      formData.nature === 'previsao' && formData.forecast_type
        ? formData.forecast_type
        : null,
    forecast_confidence:
      formData.nature === 'previsao' ? formData.forecast_confidence : null,
    forecast_basis: formData.forecast_basis || null,
    forecast_notes:
      formData.nature === 'previsao' && formData.forecast_notes
        ? formData.forecast_notes
        : null,
    recurrence: formData.recurrence || null,
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select(FULL_TX_SELECT)
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// PAYABLE / RECEIVABLE PRE-CREATE HELPERS
// (used by Realizado+linked flow — payable/receivable created BEFORE transaction
// so that transaction.forecast_basis is set on INSERT and the trigger
// update_bank_balance_on_transaction skips it. Saldo is updated only by
// handle_payment_changes when the payment_record is inserted, avoiding
// the duplicate-credit bug.)
// ============================================

type PaymentMethod = 'dinheiro' | 'pix' | 'transferencia' | 'boleto' | 'cartao' | 'cartao_debito' | 'cartao_credito' | 'cheque';

export async function createPayableForRealized(
  companyId: string,
  formData: TransactionFormData,
  parsedAmount: number
): Promise<string> {
  const { data, error } = await supabase
    .from('payables')
    .insert({
      company_id: companyId,
      supplier_id: formData.supplier_id || null,
      chart_account_id: formData.chart_account_id || null,
      category_id: formData.category_id || null,
      description: formData.description,
      document_number: formData.document_number || null,
      due_date: formData.transaction_date,
      issue_date: formData.transaction_date,
      total_amount: parsedAmount,
      paid_amount: 0,
      status: 'pendente' as const,
      notes: formData.notes || null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Falha ao criar Conta a Pagar: ${error?.message || 'Erro desconhecido'}`);
  }
  return data.id;
}

export async function createReceivableForRealized(
  companyId: string,
  formData: TransactionFormData,
  parsedAmount: number
): Promise<string> {
  const { data, error } = await supabase
    .from('receivables')
    .insert({
      company_id: companyId,
      customer_id: formData.customer_id || null,
      chart_account_id: formData.chart_account_id || null,
      category_id: formData.category_id || null,
      description: formData.description,
      document_number: formData.document_number || null,
      due_date: formData.transaction_date,
      issue_date: formData.transaction_date,
      total_amount: parsedAmount,
      paid_amount: 0,
      status: 'pendente' as const,
      notes: formData.notes || null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Falha ao criar Conta a Receber: ${error?.message || 'Erro desconhecido'}`);
  }
  return data.id;
}

interface PaymentRecordParams {
  companyId: string;
  bankAccountId: string | null;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  payableId?: string;
  receivableId?: string;
  notes?: string;
}

export async function insertPaymentRecordForLinked(params: PaymentRecordParams): Promise<void> {
  const { companyId, bankAccountId, amount, paymentDate, paymentMethod, payableId, receivableId, notes } = params;
  const { error } = await supabase.from('payment_records').insert({
    payable_id: payableId ?? null,
    receivable_id: receivableId ?? null,
    company_id: companyId,
    bank_account_id: bankAccountId,
    amount,
    payment_date: paymentDate,
    payment_method: ((paymentMethod || 'transferencia') as PaymentMethod),
    notes: notes ?? 'Baixa automática (sincronizada a partir da transação)',
  });
  if (error) {
    throw new Error(`Falha ao registrar baixa: ${error.message}`);
  }
}

// ============================================
// PAYABLE / RECEIVABLE SYNC (Create) — legacy flow for "previsao"
// (kept as-is for transactions created as previsao with linked supplier/customer
// — these don't generate a payment_record and don't suffer from the duplicate bug)
// ============================================

interface SyncParams {
  companyId: string;
  transactionId: string;
  formData: TransactionFormData;
  parsedAmount: number;
  userId?: string;
}

export async function syncNewTransactionToPayable(params: SyncParams): Promise<void> {
  const { companyId, transactionId, formData, parsedAmount, userId } = params;

  const payableData = {
    company_id: companyId,
    supplier_id: formData.supplier_id || null,
    chart_account_id: formData.chart_account_id || null,
    category_id: formData.category_id || null,
    description: formData.description,
    document_number: formData.document_number || null,
    due_date: formData.transaction_date,
    issue_date: formData.transaction_date,
    total_amount: parsedAmount,
    paid_amount: 0,
    status: 'pendente' as const,
    notes: formData.notes || null,
  };

  const result = await supabase.from('payables').insert(payableData).select('id');

  if (result.error || !result.data || result.data.length === 0) {
    await supabase
      .from('transactions')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId })
      .eq('id', transactionId)
      .eq('company_id', companyId);
    throw new Error(
      `Falha ao criar Conta a Pagar: ${result.error?.message || 'Erro desconhecido'}`
    );
  }

  const payableId = result.data[0].id;
  await supabase
    .from('transactions')
    .update({ forecast_basis: `payable:${payableId}` })
    .eq('id', transactionId)
    .eq('company_id', companyId);

  if (formData.nature === 'realizado') {
    const { error } = await supabase.from('payment_records').insert({
      payable_id: payableId,
      company_id: companyId,
      bank_account_id: formData.bank_account_id || null,
      amount: parsedAmount,
      payment_date: formData.transaction_date,
      payment_method: (formData.payment_method || 'transferencia') as 'dinheiro' | 'pix' | 'transferencia' | 'boleto' | 'cartao' | 'cartao_debito' | 'cartao_credito' | 'cheque',
      notes: 'Baixa automática (sincronizada a partir de Nova Saída)',
    });
    if (error) throw new Error(`Falha ao registrar pagamento da Conta a Pagar: ${error.message}`);
  }
}

export async function syncNewTransactionToReceivable(params: SyncParams): Promise<void> {
  const { companyId, transactionId, formData, parsedAmount, userId } = params;

  const receivableData = {
    company_id: companyId,
    customer_id: formData.customer_id || null,
    chart_account_id: formData.chart_account_id || null,
    category_id: formData.category_id || null,
    description: formData.description,
    document_number: formData.document_number || null,
    due_date: formData.transaction_date,
    issue_date: formData.transaction_date,
    total_amount: parsedAmount,
    paid_amount: 0,
    status: 'pendente' as const,
    notes: formData.notes || null,
  };

  const result = await supabase.from('receivables').insert(receivableData).select('id');

  if (result.error || !result.data || result.data.length === 0) {
    await supabase
      .from('transactions')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId })
      .eq('id', transactionId)
      .eq('company_id', companyId);
    throw new Error(
      `Falha ao criar Conta a Receber: ${result.error?.message || 'Erro desconhecido'}`
    );
  }

  const receivableId = result.data[0].id;
  await supabase
    .from('transactions')
    .update({ forecast_basis: `receivable:${receivableId}` })
    .eq('id', transactionId)
    .eq('company_id', companyId);

  if (formData.nature === 'realizado') {
    const { error } = await supabase.from('payment_records').insert({
      receivable_id: receivableId,
      company_id: companyId,
      bank_account_id: formData.bank_account_id || null,
      amount: parsedAmount,
      payment_date: formData.transaction_date,
      payment_method: (formData.payment_method || 'transferencia') as 'dinheiro' | 'pix' | 'transferencia' | 'boleto' | 'cartao' | 'cartao_debito' | 'cartao_credito' | 'cheque',
      notes: 'Baixa automática (sincronizada a partir de Nova Entrada)',
    });
    if (error)
      throw new Error(`Falha ao registrar recebimento da Conta a Receber: ${error.message}`);
  }
}

// ============================================
// DEBT PAYMENT
// ============================================

interface DebtPaymentParams {
  companyId: string;
  transactionId: string;
  debtId: string;
  parsedAmount: number;
  transactionDate: string;
}

export async function handleDebtPayment(params: DebtPaymentParams): Promise<void> {
  const { companyId, transactionId, debtId, parsedAmount, transactionDate } = params;

  const debtPaymentData = {
    debt_id: debtId,
    company_id: companyId,
    transaction_id: transactionId,
    payment_date: transactionDate,
    due_date: transactionDate,
    principal_amount: parsedAmount,
    interest_amount: 0,
    total_amount: parsedAmount,
    balance_after: 0,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: paymentError } = await supabase.from('debt_payments').insert(debtPaymentData as any);

  if (paymentError) {
    console.error('Error creating debt payment:', paymentError);
    throw new Error('Erro ao vincular pagamento à dívida.');
  }

  const { data: debtData } = await supabase
    .from('debts')
    .select('current_balance, paid_amount')
    .eq('id', debtId)
    .eq('company_id', companyId)
    .single();

  if (debtData) {
    const newBalance = moneyToNumber(moneyMax0(moneySub(debtData.current_balance, parsedAmount)));
    const newPaid = moneyToNumber(moneyAdd(debtData.paid_amount, parsedAmount));

    await supabase
      .from('debts')
      .update({
        current_balance: newBalance,
        paid_amount: newPaid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', debtId)
      .eq('company_id', companyId);
  }
}

// ============================================
// UPDATE WITH BIDIRECTIONAL SYNC
// ============================================

interface UpdateSyncParams {
  transactionId: string;
  companyId: string;
  formData: TransactionFormData;
}

export async function updateTransactionWithSync(params: UpdateSyncParams): Promise<void> {
  const { transactionId, companyId, formData } = params;

  const { data: existingTx } = await supabase
    .from('transactions')
    .select('reconciled, forecast_basis, type, nature, amount')
    .eq('id', transactionId)
    .eq('company_id', companyId)
    .single();

  if (existingTx?.reconciled) {
    throw new Error('RECONCILED');
  }

  const parsedAmount = parseCurrencyValue(formData.amount);
  const payload = {
    bank_account_id: formData.bank_account_id,
    chart_account_id: formData.chart_account_id || null,
    category_id: formData.category_id || null,
    customer_id: formData.customer_id || null,
    supplier_id: formData.supplier_id || null,
    type: formData.type,
    amount: parsedAmount,
    description: formData.description,
    transaction_date: formData.transaction_date,
    payment_method: formData.payment_method,
    document_number: formData.document_number || null,
    notes: formData.notes || null,
    recurrence: formData.recurrence || null,
    nature: formData.nature,
    forecast_type:
      formData.nature === 'previsao' ? formData.forecast_type || 'estimativa' : null,
    forecast_confidence:
      formData.nature === 'previsao' ? formData.forecast_confidence || 80 : null,
    forecast_basis: formData.nature === 'previsao' ? formData.forecast_basis : null,
    forecast_notes: formData.nature === 'previsao' ? formData.forecast_notes : null,
  };

  const { error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', transactionId)
    .eq('company_id', companyId);

  if (error) throw error;

  // Bidirectional sync to payables/receivables
  if (existingTx?.forecast_basis?.startsWith('payable:')) {
    await syncPayableOnUpdate(existingTx.forecast_basis.replace('payable:', ''), companyId, formData, existingTx, parsedAmount);
  } else if (existingTx?.forecast_basis?.startsWith('receivable:')) {
    await syncReceivableOnUpdate(existingTx.forecast_basis.replace('receivable:', ''), companyId, formData, existingTx, parsedAmount);
  }
}

async function syncPayableOnUpdate(
  payableId: string,
  companyId: string,
  formData: TransactionFormData,
  existingTx: { nature: string | null; amount: number },
  parsedAmount: number
): Promise<void> {
  await supabase
    .from('payables')
    .update({
      supplier_id: formData.supplier_id || null,
      chart_account_id: formData.chart_account_id || null,
      category_id: formData.category_id || null,
      description: formData.description,
      document_number: formData.document_number || null,
      due_date: formData.transaction_date,
      issue_date: formData.transaction_date,
      total_amount: parsedAmount,
      notes: formData.notes || null,
    })
    .eq('id', payableId)
    .eq('company_id', companyId);

  if (existingTx.nature !== 'realizado' && formData.nature === 'realizado') {
    await supabase.from('payment_records').insert({
      payable_id: payableId,
      company_id: companyId,
      bank_account_id: formData.bank_account_id || null,
      amount: parsedAmount,
      payment_date: formData.transaction_date,
      payment_method: (formData.payment_method || 'transferencia') as 'dinheiro' | 'pix' | 'transferencia' | 'boleto' | 'cartao' | 'cartao_debito' | 'cartao_credito' | 'cheque',
      notes: 'Baixa automática (sincronizada a partir da edição de transação)',
    });
  } else if (existingTx.nature === 'realizado' && formData.nature !== 'realizado') {
    await supabase
      .from('payment_records')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deletion_reason: 'Excluído pelo usuário',
      })
      .eq('payable_id', payableId);
  } else if (
    existingTx.nature === 'realizado' &&
    formData.nature === 'realizado' &&
    existingTx.amount !== parsedAmount
  ) {
    await supabase.from('payment_records').update({ amount: parsedAmount }).eq('payable_id', payableId);
  }
}

async function syncReceivableOnUpdate(
  receivableId: string,
  companyId: string,
  formData: TransactionFormData,
  existingTx: { nature: string | null; amount: number },
  parsedAmount: number
): Promise<void> {
  await supabase
    .from('receivables')
    .update({
      customer_id: formData.customer_id || null,
      chart_account_id: formData.chart_account_id || null,
      category_id: formData.category_id || null,
      description: formData.description,
      document_number: formData.document_number || null,
      due_date: formData.transaction_date,
      issue_date: formData.transaction_date,
      total_amount: parsedAmount,
      notes: formData.notes || null,
    })
    .eq('id', receivableId)
    .eq('company_id', companyId);

  if (existingTx.nature !== 'realizado' && formData.nature === 'realizado') {
    await supabase.from('payment_records').insert({
      receivable_id: receivableId,
      company_id: companyId,
      bank_account_id: formData.bank_account_id || null,
      amount: parsedAmount,
      payment_date: formData.transaction_date,
      payment_method: (formData.payment_method || 'transferencia') as 'dinheiro' | 'pix' | 'transferencia' | 'boleto' | 'cartao' | 'cartao_debito' | 'cartao_credito' | 'cheque',
      notes: 'Baixa automática (sincronizada a partir da edição de transação)',
    });
  } else if (existingTx.nature === 'realizado' && formData.nature !== 'realizado') {
    await supabase
      .from('payment_records')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deletion_reason: 'Excluído pelo usuário',
      })
      .eq('receivable_id', receivableId);
  } else if (
    existingTx.nature === 'realizado' &&
    formData.nature === 'realizado' &&
    existingTx.amount !== parsedAmount
  ) {
    await supabase.from('payment_records').update({ amount: parsedAmount }).eq('receivable_id', receivableId);
  }
}

// ============================================
// CASCADE SOFT-DELETE
// ============================================

export async function cascadeSoftDeleteTransaction(
  transactionId: string,
  companyId: string,
  userId?: string
): Promise<void> {
  const { data: existingTx } = await supabase
    .from('transactions')
    .select('forecast_basis, type')
    .eq('id', transactionId)
    .eq('company_id', companyId)
    .single();

  if (existingTx?.forecast_basis?.startsWith('payable:')) {
    const payableId = existingTx.forecast_basis.replace('payable:', '');
    await softDeleteLinkedPayable(payableId, companyId);
  } else if (existingTx?.forecast_basis?.startsWith('receivable:')) {
    const receivableId = existingTx.forecast_basis.replace('receivable:', '');
    await softDeleteLinkedReceivable(receivableId, companyId);
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq('id', transactionId)
    .eq('company_id', companyId);

  if (error) throw error;
}

export async function cascadeBulkSoftDelete(
  ids: string[],
  companyId: string,
  userId?: string
): Promise<void> {
  const { data: linkedTxs } = await supabase
    .from('transactions')
    .select('id, forecast_basis')
    .in('id', ids)
    .eq('company_id', companyId)
    .not('forecast_basis', 'is', null);

  if (linkedTxs && linkedTxs.length > 0) {
    const payableIds = linkedTxs
      .filter((t) => t.forecast_basis?.startsWith('payable:'))
      .map((t) => t.forecast_basis!.replace('payable:', ''));

    const receivableIds = linkedTxs
      .filter((t) => t.forecast_basis?.startsWith('receivable:'))
      .map((t) => t.forecast_basis!.replace('receivable:', ''));

    if (payableIds.length > 0) {
      await supabase
        .from('payment_records')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deletion_reason: 'Excluído pelo usuário' })
        .in('payable_id', payableIds)
        .eq('company_id', companyId);
      await supabase
        .from('payables')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deletion_reason: 'Excluído pelo usuário' })
        .in('id', payableIds)
        .eq('company_id', companyId);
    }
    if (receivableIds.length > 0) {
      await supabase
        .from('payment_records')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deletion_reason: 'Excluído pelo usuário' })
        .in('receivable_id', receivableIds)
        .eq('company_id', companyId);
      await supabase
        .from('receivables')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deletion_reason: 'Excluído pelo usuário' })
        .in('id', receivableIds)
        .eq('company_id', companyId);
    }
  }

  // Use optimized RPC: skips per-row triggers, recalculates bank balances in batch
  const { error } = await supabase.rpc('bulk_soft_delete_transactions', {
    p_ids: ids,
    p_company_id: companyId,
    p_user_id: userId ?? null,
  });

  if (error) throw error;
}

// ============================================
// HELPERS
// ============================================

async function softDeleteLinkedPayable(payableId: string, companyId: string): Promise<void> {
  await supabase
    .from('payment_records')
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), deletion_reason: 'Excluído pelo usuário' })
    .eq('payable_id', payableId)
    .eq('company_id', companyId);
  await supabase
    .from('payables')
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), deletion_reason: 'Excluído pelo usuário' })
    .eq('id', payableId)
    .eq('company_id', companyId);
}

async function softDeleteLinkedReceivable(receivableId: string, companyId: string): Promise<void> {
  await supabase
    .from('payment_records')
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), deletion_reason: 'Excluído pelo usuário' })
    .eq('receivable_id', receivableId)
    .eq('company_id', companyId);
  await supabase
    .from('receivables')
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), deletion_reason: 'Excluído pelo usuário' })
    .eq('id', receivableId)
    .eq('company_id', companyId);
}

// ============================================
// RPC OPERATIONS
// ============================================

export async function convertForecastRpc(
  forecastId: string,
  actualAmount: number,
  keepForecast: boolean,
  transactionDate: string,
  convertedBy: string
): Promise<{ deviation_percent: number }> {
  const { data, error } = await supabase.rpc('convert_forecast_to_actual', {
    p_forecast_id: forecastId,
    p_actual_amount: actualAmount,
    p_keep_forecast: keepForecast,
    p_transaction_date: transactionDate,
    p_converted_by: convertedBy,
  });

  if (error) throw error;
  return data as { deviation_percent: number };
}

export async function reverseTransactionRpc(
  transactionId: string,
  userId: string | undefined,
  reason: string
): Promise<string | null> {
  const rpcParams = { p_transaction_id: transactionId, p_user_id: userId || null, p_reason: reason };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.rpc('reverse_transaction' as any, rpcParams as any);

  if (error) throw error;
  return data as string | null;
}
