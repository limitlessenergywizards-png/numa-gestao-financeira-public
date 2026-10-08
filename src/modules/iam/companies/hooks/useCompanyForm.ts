'use client';

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { toast } from "sonner";

// Use the SSR-compatible browser client (cookie-based auth, same as AuthContext)
const supabase = createClient();
import { getErrorMessage } from "@/lib/errorUtils";
import { seedChartOfAccounts } from "@/modules/finance/ledger/services/chartOfAccountsService";

interface CompanyFormData {
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
  currency: string;
  tax_regime: string;
  is_headquarters: boolean;
  logo_url: string | null;
}

interface Company {
  id: string;
  name: string;
}

export async function uploadCompanyLogo(
  companyId: string,
  logoFile: File,
  existingLogoUrl: string | null
): Promise<string | null> {
  try {
    const fileExt = logoFile.name.split(".").pop();
    const fileName = `logo.${fileExt}`;
    const filePath = `${companyId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("company_logos")
      .upload(filePath, logoFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("company_logos")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    if (signedUrlError) throw signedUrlError;

    return signedUrlData?.signedUrl || null;
  } catch (error) {
    console.error("Error uploading logo:", error);
    return existingLogoUrl;
  }
}

export async function updateCompany(
  companyId: string,
  data: Record<string, unknown>
) {
  // IRON GATE: Verify user belongs to this company before update
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("user_companies")
    .select("id")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!membership) throw new Error("Not found");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("companies").update(data as any).eq("id", companyId);

  if (error) throw error;
}

export async function createCompany(
  data: Record<string, unknown>
): Promise<{ id: string; [key: string]: unknown }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newCompany, error } = await supabase.from("companies").insert(data as any).select().single();

  if (error) throw error;
  return newCompany as { id: string; [key: string]: unknown };
}

export async function associateUserWithCompany(
  userId: string,
  companyId: string,
  isDefault: boolean
) {
  const { error } = await supabase.from("user_companies").insert({
    user_id: userId,
    company_id: companyId,
    is_default: isDefault,
    role: "admin",
  });

  if (error) throw error;
}

export function useCompanySubmit() {
  const [isLoading, setIsLoading] = useState(false);

  const submitCompany = async (
    formData: CompanyFormData,
    currencySymbol: string,
    userId: string,
    existingCompany: Company | null,
    logoFile: File | null,
    companiesCount: number,
    refreshCompanies: () => Promise<void>
  ) => {
    if (!formData.name.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return false;
    }

    setIsLoading(true);
    try {
      if (existingCompany) {
        let logoUrl = formData.logo_url;
        if (logoFile) {
          logoUrl = await uploadCompanyLogo(existingCompany.id, logoFile, formData.logo_url);
        }

        await updateCompany(existingCompany.id, {
          name: formData.name.trim(),
          trading_name: formData.trading_name.trim() || null,
          document: formData.document.trim() || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          mobile_phone: formData.mobile_phone.trim() || null,
          address: formData.address.trim() || null,
          number: formData.number.trim() || null,
          complement: formData.complement.trim() || null,
          neighborhood: formData.neighborhood.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          zip_code: formData.zip_code.trim() || null,
          currency: formData.currency,
          currency_symbol: currencySymbol,
          tax_regime: formData.tax_regime,
          is_headquarters: formData.is_headquarters,
          logo_url: logoUrl,
        });

        toast.success("Empresa atualizada com sucesso!");
      } else {
        // Ensure fresh auth token before critical RPC call
        await supabase.auth.refreshSession();

        // Atomic RPC: creates company + user_companies association in one transaction
        const { data: rpcResult, error: rpcError } = await supabase.rpc('create_company_and_associate', {
          p_name: formData.name.trim(),
          p_trading_name: formData.trading_name.trim() || null,
          p_document: formData.document.trim() || null,
          p_email: formData.email.trim() || null,
          p_phone: formData.phone.trim() || null,
          p_mobile_phone: formData.mobile_phone.trim() || null,
          p_address: formData.address.trim() || null,
          p_number: formData.number.trim() || null,
          p_complement: formData.complement.trim() || null,
          p_neighborhood: formData.neighborhood.trim() || null,
          p_city: formData.city.trim() || null,
          p_state: formData.state.trim() || null,
          p_zip_code: formData.zip_code.trim() || null,
          p_currency: formData.currency,
          p_currency_symbol: currencySymbol,
          p_tax_regime: formData.tax_regime,
          p_is_headquarters: formData.is_headquarters,
          p_is_default: companiesCount === 0,
        });

        if (rpcError) throw rpcError;
        const newCompany = rpcResult as { id: string; name: string; created_by: string };

        // Logo upload AFTER association exists (storage + UPDATE RLS will pass)
        if (logoFile && newCompany) {
          const logoUrl = await uploadCompanyLogo(newCompany.id, logoFile, null);
          if (logoUrl) {
            await updateCompany(newCompany.id, { logo_url: logoUrl });
          }
        }

        // Auto-seed default chart of accounts for new companies
        try {
          await seedChartOfAccounts(newCompany.id, "padrao");
        } catch (chartError) {
          console.error("Error seeding chart of accounts:", chartError);
          toast.error("Empresa criada, mas houve erro ao criar o plano de contas. Aplique um template manualmente.");
        }

        toast.success("Empresa cadastrada com sucesso!");
      }

      await refreshCompanies();
      return true;
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { submitCompany, isLoading };
}
