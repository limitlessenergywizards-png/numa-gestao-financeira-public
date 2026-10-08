import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Debt, debtCalculationEngine } from "../services/debtCalculationEngine";

export function useCreditorsQuery() {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ["creditors", currentCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .eq("company_id", currentCompany?.id)
        .eq("is_active", true)
        .in("category", [
          "banco",
          "cartao_credito",
          "financeira",
          "governo",
          "socio",
          "cliente",
          "outro",
        ])
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany?.id,
  });
}

interface DebtPayload {
  company_id: string;
  name: string;
  description: string;
  creditor_name: string;
  debt_type: string;
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  interest_period: string;
  interest_type: string;
  total_installments: number | null;
  installment_amount: number | null;
  contract_date: string;
  first_due_date: string;
  due_day: number;
}

export async function upsertDebt(
  payload: DebtPayload,
  existingDebt: Debt | null
): Promise<any> {
  if (existingDebt) {
    const { data, error } = await supabase
      .from("debts")
      .update(payload)
      .eq("id", existingDebt.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("debts")
      .insert({
        ...payload,
        paid_amount: 0,
        paid_installments: 0,
        status: "active",
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function getOrCreateSupplier(
  companyId: string,
  creditorName: string
): Promise<string> {
  const { data: existingSupplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("company_id", companyId)
    .ilike("name", creditorName)
    .maybeSingle();

  if (existingSupplier) return existingSupplier.id;

  const { data: newSupplier, error } = await supabase
    .from("suppliers")
    .insert({
      company_id: companyId,
      name: creditorName,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw error;
  return newSupplier.id;
}

export async function generatePayablesForDebt(
  companyId: string,
  debtData: any,
  supplierId: string,
  totalInstallments: string | null
) {
  const schedule = debtCalculationEngine.calculatePaymentSchedule(
    debtData as unknown as Debt
  );

  const payablesToInsert = schedule.map((installment) => ({
    company_id: companyId,
    description: `${debtData.name} - Parcela ${installment.installment_number}/${totalInstallments || "?"}`,
    supplier_id: supplierId,
    total_amount: installment.total,
    paid_amount: 0,
    due_date: format(installment.due_date, "yyyy-MM-dd"),
    issue_date: format(new Date(), "yyyy-MM-dd"),
    status: "pendente",
    debt_id: debtData.id,
    is_debt_payment: true,
    installment_number: installment.installment_number,
    total_installments: totalInstallments ? parseInt(totalInstallments) : null,
  }));

  if (payablesToInsert.length === 0) return;

  const { data: createdPayables, error: payablesError } = await supabase
    .from("payables")
    .insert(payablesToInsert as any)
    .select(
      "id, company_id, supplier_id, description, total_amount, due_date, document_number, notes, is_debt_payment"
    );

  if (payablesError) {
    console.error("Error creating payables:", payablesError);
    toast.error("Dívida atualizada, mas houve erro ao gerar contas a pagar.");
    return;
  }

  if (createdPayables && createdPayables.length > 0) {
    const { data: defaultBank } = await supabase
      .from("bank_accounts")
      .select("id")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name")
      .limit(1)
      .single();

    if (defaultBank) {
      const forecastTransactions = createdPayables.map((p) => ({
        company_id: p.company_id,
        bank_account_id: defaultBank.id,
        supplier_id: p.supplier_id,
        type: "saida" as const,
        amount: p.total_amount,
        description: p.description,
        transaction_date: p.due_date,
        document_number: p.document_number,
        notes: p.notes,
        nature: "previsao",
        forecast_type: "estimativa",
        forecast_basis: `payable:${p.id}`,
        is_debt_payment: p.is_debt_payment || false,
      }));

      const { error: txError } = await supabase
        .from("transactions")
        .insert(forecastTransactions);

      if (txError) {
        console.error("Error creating forecast transactions:", txError);
      }
    }
  }
}

export async function addCreditor(
  companyId: string,
  creditor: {
    name: string;
    document: string;
    category: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    notes: string;
    is_active: boolean;
  }
): Promise<string> {
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      company_id: companyId,
      name: creditor.name.trim(),
      document: creditor.document,
      category: creditor.category,
      email: creditor.email,
      phone: creditor.phone,
      address: creditor.address,
      city: creditor.city,
      state: creditor.state,
      zip_code: creditor.zip_code,
      notes: creditor.notes,
      is_active: creditor.is_active,
    })
    .select("name")
    .single();

  if (error) throw error;
  return data.name;
}
