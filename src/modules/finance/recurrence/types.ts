import { Database } from "@/integrations/supabase/types";

export type RecurrenceFrequency = Database["public"]["Enums"]["recurrence_frequency"];
export type RecurrenceStatus = Database["public"]["Enums"]["recurrence_status"];
export type TransactionType = Database["public"]["Enums"]["transaction_type"];

export interface RecurrenceTemplate {
    id: string;
    company_id: string;
    name: string;
    amount: number;
    type: TransactionType;
    category_id: string;
    bank_account_id: string | null;
    frequency: RecurrenceFrequency;
    start_date: string;
    end_date: string | null;
    day_of_month: number;
    last_generated_date: string | null;
    status: RecurrenceStatus;
    created_at: string;
    updated_at: string;
    category?: {
        name: string;
    };
    bank_account?: {
        name: string;
    };
}

export interface RecurrenceFormData {
    name: string;
    amount: number;
    type: TransactionType;
    category_id: string;
    bank_account_id: string;
    frequency: RecurrenceFrequency;
    start_date: Date | undefined;
    end_date: Date | undefined;
    day_of_month: string;
    status: RecurrenceStatus;
}

export const emptyRecurrenceForm: RecurrenceFormData = {
    name: "",
    amount: 0,
    type: "saida",
    category_id: "",
    bank_account_id: "",
    frequency: "monthly",
    start_date: undefined,
    end_date: undefined,
    day_of_month: "",
    status: "active",
};
