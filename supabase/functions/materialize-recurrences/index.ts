import { addDays, addMonths, getDaysInMonth } from 'https://esm.sh/date-fns@2.30.0'
import { getCorsHeaders } from '../_shared/cors.ts'
import { createLogger } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'
import { successResponse, errorResponse } from '../_shared/responses.ts'

const log = createLogger("MATERIALIZE-RECURRENCES");

interface RecurringTransaction {
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

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // IRON GATE: Scheduled function — only service_role can invoke
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!token || token !== serviceRoleKey) {
        console.warn('[SECURITY] Unauthorized attempt to invoke materialize-recurrences')
        return errorResponse('Not found', 404, corsHeaders)
    }

    try {
        const supabaseClient = createAdminClient()

        log('Starting recurrence materialization...')

        const { data: recurrences, error } = await supabaseClient
            .from('recurring_transactions')
            .select('*')
            .eq('status', 'active');

        if (error) {
            throw error;
        }

        let processedCount = 0;
        const errors = [];

        // Process each recurrence
        for (const recurring of (recurrences as RecurringTransaction[])) {
            try {
                // Simple logic for now: check if due today
                // Replicating client logic: project next occurrence
                // Since we run this daily, we check if today matches a due date.
                // OR better: check if next due date <= today.

                // Determine next due date logic (simplified from client)
                // Ideally we persist "next_due_date" on the recurrence row to avoid recalculating from start every time.
                // But for MVP we can recalculate from start_date + occurrence_count * frequency (roughly).

                // Let's use the helper logic
                // We need to find the NEXT occurrence date after the last one.
                // If last_generated_date is null, start from start_date.
                // If last_generated_date is set, calculate next interval.

                // Wait, the client-side engine calculates ALL occurrences up to today.
                // We should do the same here.

                const today = new Date();
                // Set to end of today to include anything due today
                today.setHours(23, 59, 59, 999);

                // Calculate next candidate date
                let candidateDate = new Date(recurring.start_date);

                // Fast forward based on occurrence_count
                // Assuming implementation matches client side where we iterate N times
                // This is inefficient for long histories but safe for MVP.
                // Optimization: implement `calculateNextDate` properly.

                // Helper function (internal to this file)
                const calculateNextDate = (currentDate: Date, rec: RecurringTransaction): Date => {
                    const freq = rec.frequency;
                    switch (freq) {
                        case 'diaria': return addDays(currentDate, 1);
                        case 'semanal': return addDays(currentDate, 7);
                        case 'quinzenal': return addDays(currentDate, 15);
                        case 'mensal': return addMonthsPreservingDay(currentDate, 1, rec.day_of_month);
                        case 'bimestral': return addMonthsPreservingDay(currentDate, 2, rec.day_of_month);
                        case 'trimestral': return addMonthsPreservingDay(currentDate, 3, rec.day_of_month);
                        case 'semestral': return addMonthsPreservingDay(currentDate, 6, rec.day_of_month);
                        case 'anual': return addMonthsPreservingDay(currentDate, 12, rec.day_of_month);
                        case 'personalizada':
                            if (rec.custom_interval_unit === 'dias') return addDays(currentDate, rec.custom_interval_value || 1);
                            if (rec.custom_interval_unit === 'semanas') return addDays(currentDate, (rec.custom_interval_value || 1) * 7);
                            return addMonthsPreservingDay(currentDate, rec.custom_interval_value || 1, rec.day_of_month);
                        default: return addMonths(currentDate, 1);
                    }
                };

                const addMonthsPreservingDay = (date: Date, months: number, day?: number | null) => {
                    const res = addMonths(date, months);
                    if (day) {
                        const lastDay = getDaysInMonth(res);
                        res.setDate(Math.min(day, lastDay));
                    }
                    return res;
                };

                let loopDate = new Date(recurring.start_date);
                // Skip already generated
                for (let i = 0; i < recurring.occurrence_count; i++) {
                    loopDate = calculateNextDate(loopDate, recurring);
                }

                // loopDate is now the Next Due Date

                // Check if due
                if (loopDate <= today) {
                    // Check end date
                    if (recurring.end_date && loopDate > new Date(recurring.end_date)) {
                        // Should mark as ended?
                        await supabaseClient.from('recurring_transactions').update({ status: 'ended' }).eq('id', recurring.id);
                        continue;
                    }

                    // Check occurrence limit
                    if (recurring.occurrence_limit && recurring.occurrence_count >= recurring.occurrence_limit) {
                        await supabaseClient.from('recurring_transactions').update({ status: 'ended' }).eq('id', recurring.id);
                        continue;
                    }

                    // Materialize!
                    const occurrenceNumber = recurring.occurrence_count + 1;

                    // 1. Create Transaction
                    const { data: transaction, error: txError } = await supabaseClient
                        .from('transactions')
                        .insert({
                            company_id: recurring.company_id,
                            description: `${recurring.name} - Parcela ${occurrenceNumber}`,
                            amount: recurring.amount,
                            transaction_date: loopDate.toISOString(),
                            category_id: recurring.category_id,
                            type: recurring.type === 'receita' ? 'entrada' : 'saida', // Map types
                            nature: recurring.create_as_forecast ? 'previsao' : 'realizado',
                            bank_account_id: recurring.bank_account_id || '00000000-0000-0000-0000-000000000000', // Fallback necessary
                        })
                        .select()
                        .single();

                    if (txError) throw txError;

                    // 2. Create Occurrence
                    await supabaseClient
                        .from('recurring_occurrences')
                        .insert({
                            recurring_id: recurring.id,
                            transaction_id: transaction.id,
                            occurrence_number: occurrenceNumber,
                            scheduled_date: loopDate.toISOString(),
                            actual_date: loopDate.toISOString(),
                            original_amount: recurring.amount,
                            actual_amount: recurring.amount,
                            status: 'pending'
                        });

                    // 3. Update Recurrence
                    await supabaseClient
                        .from('recurring_transactions')
                        .update({
                            occurrence_count: occurrenceNumber,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', recurring.id);

                    processedCount++;
                }

            } catch (err: any) {
                log(`Error processing recurrence ${recurring.id}`, { error: err.message });
                errors.push({ id: recurring.id, error: err.message });
            }
        }

        return successResponse({
            success: true,
            processed: processedCount,
            errors: errors
        }, corsHeaders)
    } catch (error: any) {
        return errorResponse(error.message, 400, corsHeaders)
    }
})
