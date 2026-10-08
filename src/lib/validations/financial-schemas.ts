/**
 * Zod schemas para validacao de formularios financeiros
 *
 * Schemas basicos para validacao client-side dos formularios
 * de transacoes, contas a pagar/receber, contas bancarias e clientes.
 */

import { z } from 'zod';
import { toast } from 'sonner';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Valida que uma string de moeda brasileira (ex: "1.500,00") representa valor > 0 */
const currencyStringPositive = z
  .string()
  .min(1, 'Valor e obrigatorio')
  .refine(
    (val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length > 0 && parseInt(digits, 10) > 0;
    },
    { message: 'Valor deve ser maior que zero' }
  );

const requiredString = (fieldName: string) =>
  z.string().min(1, `${fieldName} e obrigatorio`);

// ─── Transaction Schema ─────────────────────────────────────────────────────

export const transactionSchema = z.object({
  description: requiredString('Descricao'),
  amount: currencyStringPositive,
  bank_account_id: requiredString('Conta bancaria'),
  transaction_date: requiredString('Data da transacao'),
  type: z.enum(['entrada', 'saida'], { message: 'Tipo invalido' }),
});

// ─── Account (Payable / Receivable) Schema ──────────────────────────────────

export const accountFormSchema = z.object({
  description: requiredString('Descricao'),
  total_amount: currencyStringPositive,
  due_date: requiredString('Data de vencimento'),
});

/** Variante para contas a receber - exige cliente */
export const receivableFormSchema = accountFormSchema.extend({
  entity_id: requiredString('Cliente'),
});

/** Variante para contas a pagar - fornecedor obrigatorio exceto pagamento de divida */
export const payableFormSchema = accountFormSchema;

// ─── Bank Account Schema ────────────────────────────────────────────────────

export const bankAccountSchema = z.object({
  name: requiredString('Nome da conta'),
  account_type: z.enum(['corrente', 'poupanca', 'investimento', 'caixa'], {
    message: 'Tipo de conta invalido',
  }),
});

// ─── Quick Add Client Schema ────────────────────────────────────────────────

export const quickAddClientSchema = z.object({
  name: requiredString('Nome'),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || z.string().email().safeParse(val).success,
      { message: 'Email invalido' }
    ),
});

// ─── Validate Helper ────────────────────────────────────────────────────────

/**
 * Valida dados contra um schema Zod e mostra toast com o primeiro erro.
 * Retorna true se valido, false se invalido.
 */
export function validateWithToast<T>(
  schema: z.ZodType<T>,
  data: unknown
): data is T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    toast.error(firstError?.message || 'Dados invalidos');
    return false;
  }
  return true;
}
