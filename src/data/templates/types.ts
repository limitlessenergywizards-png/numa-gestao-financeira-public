import type { Database } from "@/integrations/supabase/types";

export type AccountEntryType = Database["public"]["Enums"]["account_entry_type"];

export type AccountNature = "devedora" | "credora";

export interface TemplateAccount {
  code: string;
  name: string;
  type: AccountEntryType;
  nature: AccountNature;
  level: number;
  parentCode: string | null;
  isAnalytical: boolean;
  dreCategory: string | null;
}

export interface TemplateDREMapping {
  dreLineId: string;
  dreLineName: string;
  accountCodes: string[];
  operation: "sum" | "subtract" | "calculated";
  displayOrder: number;
}

export interface TemplateDefinition {
  name: string;
  description: string;
  segment: string;
  isDefault: boolean;
  accounts: TemplateAccount[];
  dreMapping: TemplateDREMapping[];
}
