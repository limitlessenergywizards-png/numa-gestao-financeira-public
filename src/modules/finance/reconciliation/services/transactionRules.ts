import { supabase } from "@/integrations/supabase/client";

export interface TransactionRule {
    id: string;
    company_id: string;
    keyword: string;
    description_match_type: 'contains' | 'exact' | 'starts_with';
    category_id: string;
    supplier_id?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateRuleDTO {
    company_id: string;
    keyword: string;
    description_match_type?: 'contains' | 'exact' | 'starts_with';
    category_id: string;
    supplier_id?: string | null;
}

export const transactionRulesService = {
    /**
     * Fetch all active rules for a company
     */
    async fetchRules(companyId: string): Promise<TransactionRule[]> {
        const { data, error } = await supabase
            .from('transaction_rules')
            .select('id, company_id, keyword, description_match_type, category_id, supplier_id, is_active, created_at, updated_at')
            .eq('company_id', companyId)
            .eq('is_active', true);

        if (error) throw error;
        return (data ?? []) as unknown as TransactionRule[];
    },

    /**
     * Create a new rule
     */
    async createRule(rule: CreateRuleDTO): Promise<TransactionRule> {
        const { data, error } = await supabase
            .from('transaction_rules')
            .insert(rule)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as TransactionRule;
    },

    /**
     * Soft delete a rule (deactivate instead of hard delete)
     */
    async deleteRule(id: string, companyId: string): Promise<void> {
        const { error } = await supabase
            .from('transaction_rules')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('company_id', companyId);

        if (error) throw error;
    },

    /**
     * Match a description against a list of rules
     * Returns the first matching rule or null
     */
    matchRule(description: string, rules: TransactionRule[]): TransactionRule | null {
        if (!description) return null;
        const normalizedDesc = description.toLowerCase();

        // Sort rules by specificity (exact match first, then starts_with, then contains)
        // This sorting should be done once ideally, but here for safety
        const sortedRules = [...rules].sort((a, b) => {
            const priority: Record<string, number> = { exact: 1, starts_with: 2, contains: 3 };
            return (priority[a.description_match_type] ?? 3) - (priority[b.description_match_type] ?? 3);
        });

        for (const rule of sortedRules) {
            const keyword = rule.keyword.toLowerCase();

            switch (rule.description_match_type) {
                case 'exact':
                    if (normalizedDesc === keyword) return rule;
                    break;
                case 'starts_with':
                    if (normalizedDesc.startsWith(keyword)) return rule;
                    break;
                case 'contains':
                default:
                    if (normalizedDesc.includes(keyword)) return rule;
                    break;
            }
        }

        return null;
    }
};
