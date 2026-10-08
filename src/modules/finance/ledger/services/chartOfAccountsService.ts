import { supabase } from "@/integrations/supabase/client";
import { TEMPLATES, getTemplate, getDefaultTemplate } from "@/data/templates";
import type { TemplateAccount, TemplateDefinition } from "@/data/templates";
import type { Database } from "@/integrations/supabase/types";

type AccountEntryType = Database["public"]["Enums"]["account_entry_type"];

interface ChartAccountInsert {
  id: string;
  company_id: string;
  code: string;
  name: string;
  type: AccountEntryType;
  nature: string;
  is_analytical: boolean;
  dre_category: string | null;
  parent_id: string | null;
  is_active: boolean;
}

/**
 * Seeds the chart of accounts for a company using a specific template.
 * @param companyId - The company to seed accounts for
 * @param templateKey - The template key (e.g. 'padrao', 'servicos', 'saas'). Defaults to 'padrao'.
 */
export async function seedChartOfAccounts(
  companyId: string,
  templateKey: string = "padrao"
): Promise<void> {
  const template = getTemplate(templateKey) ?? getDefaultTemplate();
  const templateAccounts = template.accounts;

  const accounts: ChartAccountInsert[] = [];
  const codeToIdMap = new Map<string, string>();

  // Generate IDs and build the flat list
  for (const item of templateAccounts) {
    const id = crypto.randomUUID();
    codeToIdMap.set(item.code, id);

    accounts.push({
      id,
      company_id: companyId,
      code: item.code,
      name: item.name,
      type: item.type,
      nature: item.nature,
      is_analytical: item.isAnalytical,
      dre_category: item.dreCategory,
      parent_id: item.parentCode ? codeToIdMap.get(item.parentCode) || null : null,
      is_active: true,
    });
  }

  // Insert in two passes to handle parent_id FK:
  // 1st pass: accounts with no parent (parent_id = null)
  // 2nd pass: accounts with a parent
  const rootAccounts = accounts.filter(a => a.parent_id === null);
  const childAccounts = accounts.filter(a => a.parent_id !== null);

  const batchSize = 50;

  // Pass 1: root accounts (no FK dependency)
  for (let i = 0; i < rootAccounts.length; i += batchSize) {
    const batch = rootAccounts.slice(i, i + batchSize);
    const { error } = await supabase
      .from("chart_of_accounts")
      .upsert(batch, { onConflict: "company_id,code" });
    if (error) {
      console.error("Error seeding chart of accounts (roots):", error);
      throw error;
    }
  }

  // Pass 2: child accounts (depend on parents)
  for (let i = 0; i < childAccounts.length; i += batchSize) {
    const batch = childAccounts.slice(i, i + batchSize);
    const { error } = await supabase
      .from("chart_of_accounts")
      .upsert(batch, { onConflict: "company_id,code" });
    if (error) {
      console.error("Error seeding chart of accounts (children):", error);
      throw error;
    }
  }
}

/**
 * Seeds template definitions into Supabase tables if they don't already exist.
 * This populates chart_account_templates, chart_account_template_items and
 * chart_account_template_dre_mapping.
 */
export async function seedTemplatesIfNeeded(): Promise<void> {
  // Check if system templates already exist
  const { count, error: countErr } = await supabase
    .from("chart_account_templates")
    .select("*", { count: "exact", head: true })
    .eq("is_system", true);

  if (countErr) throw countErr;
  if ((count || 0) > 0) return; // Already seeded

  for (const [key, tmpl] of Object.entries(TEMPLATES)) {
    // 1. Insert the template header
    const { data: inserted, error: tErr } = await supabase
      .from("chart_account_templates")
      .insert({
        name: tmpl.name,
        description: tmpl.description,
        segment: tmpl.segment,
        is_default: tmpl.isDefault,
        is_system: true,
      })
      .select("id")
      .single();

    if (tErr) throw tErr;
    const templateId = inserted.id;

    // 2. Insert template items in batches
    const items = tmpl.accounts.map((acct, idx) => ({
      template_id: templateId,
      code: acct.code,
      name: acct.name,
      type: acct.type,
      nature: acct.nature,
      level: acct.level,
      parent_code: acct.parentCode,
      is_analytical: acct.isAnalytical,
      dre_category: acct.dreCategory,
      display_order: idx,
    }));

    const batchSize = 50;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const { error } = await supabase
        .from("chart_account_template_items")
        .insert(batch);
      if (error) throw error;
    }

    // 3. Insert DRE mapping
    if (tmpl.dreMapping.length > 0) {
      const mappings = tmpl.dreMapping.map((m) => ({
        template_id: templateId,
        dre_line_id: m.dreLineId,
        dre_line_name: m.dreLineName,
        account_codes: m.accountCodes,
        operation: m.operation,
        display_order: m.displayOrder,
      }));

      const { error } = await supabase
        .from("chart_account_template_dre_mapping")
        .insert(mappings);
      if (error) throw error;
    }
  }
}

/**
 * Checks if a company already has chart of accounts configured
 */
export async function hasChartOfAccounts(companyId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("chart_of_accounts")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (error) {
    console.error("Error checking chart of accounts:", error);
    return false;
  }

  return (count || 0) > 0;
}

/**
 * Deletes all chart of accounts for a company (use with caution)
 */
export async function clearChartOfAccounts(companyId: string): Promise<void> {
  const { error } = await supabase
    .from("chart_of_accounts")
    .update({ is_active: false })
    .eq("company_id", companyId);

  if (error) {
    console.error("Error clearing chart of accounts:", error);
    throw error;
  }
}
