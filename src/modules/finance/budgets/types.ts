export type PeriodType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';
export type TargetType = 'category' | 'chart_account';

export interface Budget {
    id: string;
    company_id: string;
    target_type: TargetType;
    category_code: string;
    category_name: string;
    amount: number;
    period_type: PeriodType;
    start_date: string; // ISO date format YYYY-MM-DD
    end_date: string; // ISO date format YYYY-MM-DD
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export type CreateBudgetPayload = Omit<Budget, 'id' | 'created_at' | 'updated_at'>;
export type UpdateBudgetPayload = Partial<CreateBudgetPayload>;

export interface BudgetWithRealized extends Budget {
    realized_amount: number;
    progress_percentage: number;
    variance_amount: number;
}
