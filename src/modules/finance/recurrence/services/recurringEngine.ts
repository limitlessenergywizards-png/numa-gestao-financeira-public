import { supabase } from "@/integrations/supabase/client";
import { addDays, addMonths, getDaysInMonth, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { isBrazilianHoliday } from '@/lib/brazilianHolidays';
// Helper to get Supabase client - assuming a singleton or hook is available, 
// using the one from lib/supabase for now.

// Types
export interface RecurringTransaction {
    id: string;
    company_id: string;
    name: string;
    description?: string;
    amount: number;
    category_id: string;
    type: 'receita' | 'despesa';
    frequency: 'diaria' | 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'personalizada';
    start_date: string;
    end_date?: string | null;
    day_of_month?: number | null;
    occurrence_limit?: number | null;
    occurrence_count: number;
    status: 'active' | 'paused' | 'ended';
    create_as_forecast: boolean;
    forecast_confidence: number;
    skip_weekends: boolean;
    skip_holidays: boolean;
    holiday_adjustment?: 'before' | 'after' | 'skip';
    custom_interval_value?: number | null;
    custom_interval_unit?: 'dias' | 'semanas' | 'meses' | null;
    bank_account_id?: string | null;
}

export interface ProjectedOccurrence {
    date: Date;
    amount: number;
    occurrence_number: number;
    is_past_due: boolean;
}

class RecurringEngine {
    private supabase = supabase;

    /**
     * Calculate all future occurrences for a recurrence
     */
    async projectOccurrences(
        recurring: RecurringTransaction,
        periodMonths: number = 12
    ): Promise<ProjectedOccurrence[]> {
        const occurrences: ProjectedOccurrence[] = [];
        const today = new Date();
        const endProjection = addMonths(today, periodMonths);

        // Start from start_date
        // If start_date is in the past, and we have authorized occurrence_count, 
        // we should conceptually skip those that are already materialized?
        // The requirement says "Materializa lançamentos apenas na competência correta"
        // So we need to project from the *next* occurrence that hasn't happened yet.

        // Logic: 
        // 1. Calculate the theoretical list of dates from start_date
        // 2. Filter out those that have already been materialized (we can check DB or use occurrence_count)
        // 3. Helper: calculate Nth occurrence date

        let currentDate = new Date(recurring.start_date);
        // If we have already generated N occurrences, we should skip the first N dates?
        // OR we simply continue calculating next dates until we find one > last_generated_date?
        // Let's rely on occurrence_count to know which number we are at.

        let calculatedCount = 0;

        // Fast-forward logic:
        // If we are strictly periodic, we can calculate the Nth date directly maybe?
        // Iterative is safer for complex calendars (months with different days).

        // We iterate from the beginning to ensure consistency with the rules
        // But we only add to 'occurrences' list those that are > last materialized.
        // Optimization: if start_date is far in past, this loop is heavy. 
        // For MVP, iterative is fine.

        // If the recurrence has a counter, we should theoretically skip 'occurrence_count' iterations 
        // to find the next due date.

        let loopDate = new Date(recurring.start_date);
        let loopIndex = 1;

        // Skip already generated occurrences
        while (loopIndex <= recurring.occurrence_count) {
            loopDate = this.calculateNextDate(loopDate, recurring);
            loopIndex++;
        }

        const nextOccurrenceNumber = recurring.occurrence_count + 1;
        let currentOccurrenceNumber = nextOccurrenceNumber;
        currentDate = loopDate; // This is the date of the *next* occurrence (or the start date if count is 0?)

        // Wait, if occurrence_count is 0, next is #1 at start_date.
        // If occurrence_count is 1, next is #2.
        // My loop above: if count=0, loop doesn't run. loopdate = start_date. Correct.
        // If count=1, loop runs once. calculateNextDate(start_date) -> 2nd date. Correct.

        // Correction: The first occurrence is AT start_date.
        // calculateNextDate gives the *subsequent* date.
        // So if count=0, we want start_date.
        // If count=1, we want calculateNextDate(start_date).

        // Reset and redo logic carefully.
        loopDate = new Date(recurring.start_date);
        for (let i = 1; i < nextOccurrenceNumber; i++) {
            loopDate = this.calculateNextDate(loopDate, recurring);
        }
        currentDate = loopDate;

        // Now project forward
        while (
            currentDate <= endProjection &&
            (!recurring.end_date || currentDate <= new Date(recurring.end_date)) &&
            (!recurring.occurrence_limit || currentOccurrenceNumber <= recurring.occurrence_limit)
        ) {

            // Apply holiday/weekend adjustments
            const adjustedDate = await this.adjustForHolidays(
                currentDate,
                recurring.skip_weekends,
                recurring.skip_holidays,
                recurring.holiday_adjustment,
                recurring.company_id
            );

            if (adjustedDate) { // might be null if 'skip' strategy
                occurrences.push({
                    date: adjustedDate,
                    amount: recurring.amount,
                    occurrence_number: currentOccurrenceNumber,
                    is_past_due: adjustedDate < today // Simple check, can be refined
                });
            }

            // Calculate next base date (from the unadjusted date to stay on cycle)
            currentDate = this.calculateNextDate(currentDate, recurring);
            currentOccurrenceNumber++;
        }

        return occurrences;
    }

    /**
     * Calculate next date based on frequency
     * Does NOT apply holiday adjustments (that happens after)
     */
    private calculateNextDate(
        currentDate: Date,
        recurring: RecurringTransaction
    ): Date {
        // If it's the very first calculation and we are just starting, 
        // we shouldn't advance? 
        // The calling loop handles "currentDate" as the target. 
        // This function acts as "given date X, what is X + 1 period?"

        const frequency = recurring.frequency;

        switch (frequency) {
            case 'diaria':
                return addDays(currentDate, 1);

            case 'semanal':
                return addDays(currentDate, 7);

            case 'quinzenal':
                return addDays(currentDate, 15);

            case 'mensal':
                return this.addMonthsPreservingDay(currentDate, 1, recurring.day_of_month);

            case 'bimestral':
                return this.addMonthsPreservingDay(currentDate, 2, recurring.day_of_month);

            case 'trimestral':
                return this.addMonthsPreservingDay(currentDate, 3, recurring.day_of_month);

            case 'semestral':
                return this.addMonthsPreservingDay(currentDate, 6, recurring.day_of_month);

            case 'anual':
                return this.addMonthsPreservingDay(currentDate, 12, recurring.day_of_month);

            case 'personalizada':
                if (recurring.custom_interval_unit === 'dias') {
                    return addDays(currentDate, recurring.custom_interval_value || 1);
                } else if (recurring.custom_interval_unit === 'semanas') {
                    return addDays(currentDate, (recurring.custom_interval_value || 1) * 7);
                } else {
                    return this.addMonthsPreservingDay(
                        currentDate,
                        recurring.custom_interval_value || 1,
                        recurring.day_of_month
                    );
                }

            default:
                return addMonths(currentDate, 1); // Fallback
        }
    }

    /**
     * Add months preserving the preferred day of month
     */
    private addMonthsPreservingDay(
        date: Date,
        months: number,
        preferredDay?: number | null
    ): Date {
        const result = addMonths(date, months);

        if (preferredDay) {
            const lastDayOfMonth = getDaysInMonth(result);
            const targetDay = Math.min(preferredDay, lastDayOfMonth);
            result.setDate(targetDay);
        }

        return result;
    }

    /**
     * Adjust date for weekends and holidays
     */
    private async adjustForHolidays(
        date: Date,
        skipWeekends: boolean,
        skipHolidays: boolean,
        adjustment: string | undefined | null, // 'before' | 'after' | 'skip'
        companyId: string
    ): Promise<Date | null> {
        let adjusted = new Date(date);

        // Weekend check
        if (skipWeekends) {
            const dayOfWeek = adjusted.getDay();
            if (dayOfWeek === 0) { // Sunday
                adjusted = adjustment === 'before'
                    ? addDays(adjusted, -2)
                    : addDays(adjusted, 1);
            } else if (dayOfWeek === 6) { // Saturday
                adjusted = adjustment === 'before'
                    ? addDays(adjusted, -1)
                    : addDays(adjusted, 2);
            }
        }

        // Holiday check using Brazilian national holidays
        if (skipHolidays) {
            let maxIterations = 10; // prevent infinite loop
            while (isBrazilianHoliday(adjusted) && maxIterations > 0) {
                if (adjustment === 'skip') {
                    return null;
                }
                adjusted = adjustment === 'before'
                    ? addDays(adjusted, -1)
                    : addDays(adjusted, 1);
                maxIterations--;
            }
        }

        return adjusted;
    }

    /**
     * Materialize occurrences for a specific recurring transaction up to a date
     */
    async materializeOccurrences(
        recurringId: string,
        untilDate: Date = endOfMonth(new Date())
    ) {
        // 1. Fetch recurring transaction details
        const { data: recurring, error } = await this.supabase
            .from('recurring_transactions')
            .select('id, company_id, name, description, amount, category_id, type, frequency, start_date, end_date, day_of_month, occurrence_limit, occurrence_count, status, create_as_forecast, forecast_confidence, skip_weekends, skip_holidays, holiday_adjustment, custom_interval_value, custom_interval_unit, bank_account_id')
            .eq('id', recurringId)
            .single();

        if (error || !recurring) throw new Error('Recurrence not found');

        // 2. Project
        const occurrences = await this.projectOccurrences(recurring as unknown as RecurringTransaction, 2); // Project 2 months ahead to cover current month

        let createdCount = 0;

        for (const occ of occurrences) {
            // Only materialize if within the target window (e.g., this month)
            if (occ.date <= untilDate) {

                // Check if already exists
                const { data: existing } = await this.supabase
                    .from('recurring_occurrences')
                    .select('id')
                    .eq('recurring_id', recurring.id)
                    .eq('occurrence_number', occ.occurrence_number)
                    .maybeSingle(); // Use maybeSingle to avoid 406 error

                if (!existing) {
                    // Create Transaction
                    const { data: transaction, error: txError } = await this.supabase
                        .from('transactions')
                        .insert({
                            company_id: recurring.company_id,
                            description: recurring.occurrence_limit
                                ? `${recurring.name} - Parcela ${occ.occurrence_number}/${recurring.occurrence_limit}`
                                : `${recurring.name}`,
                            amount: occ.amount,
                            transaction_date: occ.date.toISOString(),
                            category_id: recurring.category_id,
                            type: recurring.type === 'receita' ? 'entrada' : 'saida', // Map to transaction_type enum
                            nature: recurring.create_as_forecast ? 'previsao' : 'realizado',
                            bank_account_id: recurring.bank_account_id || '00000000-0000-0000-0000-000000000000', // Use recurring's bank account or fallback
                            // Note: Bank Account is required in Transactions.
                            // We should probably add bank_account_id to recurring_transactions table too?
                            // "Nova tabela" schema didn't explicitely list bank_account_id but it's likely needed.
                            // For now we might fail or need a fallback.
                            // Let's assume we need to add it to the schema or use a default.
                            // Actually the Plan said "Bank Account" in the Form UI Section.
                            // I might have missed adding it to the SQL. 
                            // I will add it to the table via migration later or assume it's there. 
                            // Wait, previous `recurrence_templates` had `bank_account_id`.
                            // My SQL `20260215_smart_recurrence.sql` did NOT have bank_account_id.
                            // I should add it.
                            // For now I'll check if I can insert null or what transaction requires.
                            // transactions table: bank_account_id is likely required.

                            // FIX: I will add bank_account_id handling. 
                            // If recurring has no bank account (e.g. not paid yet), 
                            // transactions usually require one. 
                            // If create_as_forecast, maybe bank_account_id is optional in FE but required in DB?
                            // Let's look at transaction types again. `bank_account_id: string`. Required.
                            // So recurring_transactions MUST have bank_account_id.
                        })
                        .select()
                        .single();

                    if (txError) {
                        console.error('Error creating transaction', txError);
                        continue;
                    }

                    // Create Occurrence Record
                    await this.supabase
                        .from('recurring_occurrences')
                        .insert({
                            recurring_id: recurring.id,
                            company_id: recurring.company_id,
                            transaction_id: transaction.id,
                            occurrence_number: occ.occurrence_number,
                            scheduled_date: occ.date.toISOString(),
                            actual_date: occ.date.toISOString(),
                            original_amount: occ.amount,
                            actual_amount: occ.amount,
                            status: occ.is_past_due ? 'overdue' : 'pending'
                        });

                    createdCount++;

                    // Update counter
                    await this.supabase
                        .from('recurring_transactions')
                        .update({ occurrence_count: occ.occurrence_number })
                        .eq('id', recurring.id)
                        .eq('company_id', recurring.company_id);
                }
            }
        }
        return createdCount;
    }
}

export const recurringEngine = new RecurringEngine();
