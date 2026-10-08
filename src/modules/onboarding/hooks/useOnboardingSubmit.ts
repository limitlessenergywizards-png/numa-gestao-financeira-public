'use client';

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { toast } from "sonner";

// Use the SSR-compatible browser client (cookie-based auth, same as AuthContext)
const supabase = createClient();
import { getErrorMessage, getEdgeFunctionErrorMessage } from "@/lib/errorUtils";
import { invokeEdgeFunction } from "@/lib/supabase/edge-functions";
import { EDGE_FUNCTIONS } from "@/lib/api-endpoints";

interface OnboardingFormData {
  name: string;
  trading_name: string;
  document: string;
  email: string;
  phone: string;
  mobile_phone: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  logo_file: File | null;
  segment: string;
}

interface BankAccountData {
  id: string;
  name: string;
  bank_name: string;
  initial_balance: string;
}

interface CategoryData {
  id: string;
  name: string;
  color: string;
  type: "receita" | "despesa";
}

interface InviteEntry {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
}

interface TransactionData {
  type: "entrada" | "saida";
  amount: string;
  description: string;
  category_name: string;
  bank_account_name: string;
  date: string;
}

export async function uploadOnboardingLogo(
  userId: string,
  logoFile: File
): Promise<string | null> {
  const fileExt = logoFile.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("company_logos")
    .upload(fileName, logoFile);

  if (uploadError) return null;

  const { data: urlData } = supabase.storage
    .from("company_logos")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

export async function createOnboardingCompany(
  userId: string,
  formData: OnboardingFormData,
  logoUrl: string | null
) {
  const { data: company, error } = await supabase
    .from("companies")
    .insert({
      name: formData.name,
      trading_name: formData.trading_name || null,
      document: formData.document.replace(/\D/g, "") || null,
      email: formData.email || null,
      phone: formData.phone || null,
      mobile_phone: formData.mobile_phone || null,
      address: formData.address || null,
      number: formData.number || null,
      complement: formData.complement || null,
      neighborhood: formData.neighborhood || null,
      city: formData.city || null,
      state: formData.state || null,
      zip_code: formData.zip_code.replace(/\D/g, "") || null,
      logo_url: logoUrl,
      is_headquarters: true,
      created_by: userId,
      segment: formData.segment,
    })
    .select()
    .single();

  if (error) throw error;
  return company;
}

export async function associateUserAsAdmin(userId: string, companyId: string) {
  const { error } = await supabase.from("user_companies").insert({
    user_id: userId,
    company_id: companyId,
    is_default: true,
    role: "admin",
  });

  if (error) throw error;
}

export async function createBankAccounts(
  companyId: string,
  accounts: BankAccountData[]
): Promise<Map<string, string>> {
  const bankAccountMap = new Map<string, string>();

  const validAccounts = accounts.filter(
    (a) => a.name.trim().length > 0 && a.bank_name.length > 0
  );

  for (const account of validAccounts) {
    const balance = parseFloat(
      account.initial_balance.replace(/\./g, "").replace(",", ".")
    );
    const { data: bankData, error: bankError } = await supabase
      .from("bank_accounts")
      .insert({
        company_id: companyId,
        name: account.name,
        bank_name: account.bank_name,
        initial_balance: balance,
        current_balance: balance,
      })
      .select()
      .single();

    if (bankError) {
      console.error("Error creating bank account:", bankError);
    } else {
      bankAccountMap.set(account.name, bankData.id);
    }
  }

  return bankAccountMap;
}

export async function createOnboardingCategories(
  companyId: string,
  categories: CategoryData[]
): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>();

  for (const cat of categories) {
    const { data: catData, error: catError } = await supabase
      .from("categories")
      .insert({
        company_id: companyId,
        name: cat.name,
        color: cat.color,
        type: cat.type === "receita" ? "receita" : "despesa",
        icon: "tag",
      })
      .select()
      .single();

    if (catError) {
      console.error("Error creating category:", catError);
    } else {
      categoryMap.set(cat.name, catData.id);
    }
  }

  return categoryMap;
}

export async function createFirstTransaction(
  companyId: string,
  transactionData: TransactionData,
  bankAccountMap: Map<string, string>,
  categoryMap: Map<string, string>
) {
  const txAmount = parseFloat(
    transactionData.amount.replace(/\./g, "").replace(",", ".")
  );

  const realBankId = bankAccountMap.get(transactionData.bank_account_name);
  const realCategoryId = categoryMap.get(transactionData.category_name);

  if (txAmount > 0 && realBankId && realCategoryId) {
    const { error: txError } = await supabase.from("transactions").insert({
      company_id: companyId,
      bank_account_id: realBankId,
      category_id: realCategoryId,
      type: transactionData.type,
      amount: txAmount,
      description: transactionData.description,
      transaction_date: transactionData.date,
    });

    if (txError) {
      console.error("Error creating transaction:", txError);
      toast.error("Erro ao criar transação inicial, mas a empresa foi criada.");
    }
  }
}

export async function sendOnboardingInvitations(
  companyId: string,
  userId: string,
  invites: InviteEntry[],
  companyName: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", userId)
    .single();

  const inviterName = profile?.full_name || "Um administrador";

  for (const invite of invites) {
    try {
      const token = crypto.randomUUID();

      const { error: insertError } = await supabase
        .from("user_invitations")
        .insert({
          company_id: companyId,
          email: invite.email,
          role: invite.role,
          invited_by: userId,
          token,
        });

      if (insertError) {
        console.error("Error creating invitation:", insertError);
        continue;
      }

      try {
        const { error } = await invokeEdgeFunction(EDGE_FUNCTIONS.SEND_INVITATION_EMAIL, {
          body: {
            email: invite.email,
            inviterName,
            companyName,
            role: invite.role,
            token,
          },
        });
        if (error) {
          const msg = await getEdgeFunctionErrorMessage(error);
          console.error("Error sending invite email:", msg);
        }
      } catch (emailErr) {
        console.error("Error sending invite email:", emailErr);
      }
    } catch (inviteErr) {
      console.error("Error processing invitation:", inviteErr);
    }
  }
}

export async function createOnboardingProgressRecord(
  companyId: string,
  userId: string,
  skippedSteps: number[],
  segment: string,
  skipLastStep: boolean
) {
  const { error } = await supabase.from("onboarding_progress").insert({
    company_id: companyId,
    user_id: userId,
    step_empresa: true,
    step_contas_bancarias: !skippedSteps.includes(3),
    step_categorias: !skippedSteps.includes(5),
    step_primeiro_lancamento: !skippedSteps.includes(6) && !skipLastStep,
    segment,
    completed_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error creating onboarding progress:", error);
  }
}

interface SubmitOnboardingParams {
  userId: string;
  userEmail: string | undefined;
  formData: OnboardingFormData;
  bankAccounts: BankAccountData[];
  chartTemplateChoice: string;
  categories: CategoryData[];
  transactionData: TransactionData;
  invites: InviteEntry[];
  skippedSteps: number[];
  skipLastStep: boolean;
  seedChartFn: (companyId: string, templateKey: string) => Promise<void>;
}

export function useOnboardingSubmit() {
  const [isLoading, setIsLoading] = useState(false);

  const submitOnboarding = async (params: SubmitOnboardingParams) => {
    const {
      userId,
      userEmail,
      formData,
      bankAccounts,
      chartTemplateChoice,
      categories,
      transactionData,
      invites,
      skippedSteps,
      skipLastStep,
      seedChartFn,
    } = params;

    setIsLoading(true);
    try {
      // Ensure fresh auth token before critical RPC call
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("Session refresh failed:", refreshError);
      }

      // Upload logo
      let logoUrl: string | null = null;
      if (formData.logo_file) {
        logoUrl = await uploadOnboardingLogo(userId, formData.logo_file);
      }

      // Atomic RPC: creates company + user_companies association in one transaction
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_company_and_associate', {
        p_name: formData.name,
        p_trading_name: formData.trading_name || null,
        p_document: formData.document.replace(/\D/g, "") || null,
        p_email: formData.email || null,
        p_phone: formData.phone || null,
        p_mobile_phone: formData.mobile_phone || null,
        p_address: formData.address || null,
        p_number: formData.number || null,
        p_complement: formData.complement || null,
        p_neighborhood: formData.neighborhood || null,
        p_city: formData.city || null,
        p_state: formData.state || null,
        p_zip_code: formData.zip_code.replace(/\D/g, "") || null,
        p_logo_url: logoUrl,
        p_is_headquarters: true,
        p_segment: formData.segment,
        p_is_default: true,
      });

      console.log('[ONBOARDING] RPC result:', JSON.stringify(rpcResult));
      console.log('[ONBOARDING] RPC error:', rpcError);
      if (rpcError) throw rpcError;
      if (!rpcResult) throw new Error('RPC returned null - company was not created');
      const company = rpcResult as { id: string; name: string; created_by: string };
      console.log('[ONBOARDING] Company created:', company.id, company.name);

      // Maps for cross-referencing
      let bankAccountMap = new Map<string, string>();
      let categoryMap = new Map<string, string>();

      // Create bank accounts
      if (!skippedSteps.includes(3)) {
        bankAccountMap = await createBankAccounts(company.id, bankAccounts);
      }

      // Seed chart of accounts
      if (!skippedSteps.includes(4) && chartTemplateChoice !== "empty") {
        try {
          // Use the selected template key directly (now users can choose between all available templates)
          const templateKey = chartTemplateChoice || "padrao";
          await seedChartFn(company.id, templateKey);
        } catch (chartError) {
          console.error("Error seeding chart of accounts:", chartError);
          toast.error("Erro ao criar plano de contas, mas a empresa foi criada.");
        }
      }

      // Create categories
      if (!skippedSteps.includes(5)) {
        categoryMap = await createOnboardingCategories(company.id, categories);
      }

      // Create first transaction
      if (!skippedSteps.includes(6) && !skipLastStep) {
        await createFirstTransaction(
          company.id,
          transactionData,
          bankAccountMap,
          categoryMap
        );
      }

      // Send invitations
      if (!skippedSteps.includes(7) && invites.length > 0) {
        const companyName = formData.trading_name || formData.name;
        await sendOnboardingInvitations(
          company.id,
          userId,
          invites,
          companyName
        );
      }

      // Create progress record
      await createOnboardingProgressRecord(
        company.id,
        userId,
        skippedSteps,
        formData.segment,
        skipLastStep
      );

      toast.success("Configuração concluída com sucesso!");
      return true;
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { submitOnboarding, isLoading };
}
