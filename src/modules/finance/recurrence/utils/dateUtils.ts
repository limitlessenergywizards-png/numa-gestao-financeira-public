import { addDays, addWeeks, addMonths, addYears, isBefore, isSameDay, parseISO, startOfDay } from "date-fns";
import { RecurrenceFrequency, RecurrenceTemplate } from "../types";

export function calculateNextDueDate(
    lastGeneratedDate: Date | null,
    startDate: Date,
    frequency: RecurrenceFrequency,
    dayOfMonth: number
): Date {
    let baseDate = lastGeneratedDate ? lastGeneratedDate : startDate;

    // If it's the first time and start date is in the future, return start date
    if (!lastGeneratedDate && isBefore(new Date(), startDate)) {
        return startDate;
    }

    // If it's the first time and start date is today/past, return start date
    // Actually, if lastGeneratedDate is null, the next due date is the startDate (or check if it passed)
    // But the logic calling this will likely loop:
    // 1. Get next due date from "last generated" (or start date - 1 period if null?)

    // Let's assume we want to find the *next* date after baseDate.
    // If lastGeneratedDate is null, the "next" date is startDate.
    if (!lastGeneratedDate) {
        return startDate;
    }

    let nextDate = new Date(baseDate);

    switch (frequency) {
        case "daily":
            nextDate = addDays(baseDate, 1);
            break;
        case "weekly":
            nextDate = addWeeks(baseDate, 1);
            break;
        case "biweekly":
            nextDate = addWeeks(baseDate, 2);
            break;
        case "monthly":
            nextDate = addMonths(baseDate, 1);
            // Adjust day of month if possible/needed, but addMonths handles days well usually.
            // However, if we want to stick to 'day_of_month', we might need to clamp.
            // But for simplicity, addMonths preserves day or clamps to last day.
            break;
        case "bimonthly":
            nextDate = addMonths(baseDate, 2);
            break;
        case "quarterly":
            nextDate = addMonths(baseDate, 3);
            break;
        case "semiannual":
            nextDate = addMonths(baseDate, 6);
            break;
        case "annual":
            nextDate = addYears(baseDate, 1);
            break;
    }

    return nextDate;
}

export function shouldGenerateTransaction(recurrence: RecurrenceTemplate): Date | null {
    const now = startOfDay(new Date());
    const startDate = startOfDay(new Date(recurrence.start_date));
    const endDate = recurrence.end_date ? startOfDay(new Date(recurrence.end_date)) : null;
    const lastGenerated = recurrence.last_generated_date ? startOfDay(new Date(recurrence.last_generated_date)) : null;

    // If status is not active, don't generate
    if (recurrence.status !== "active") return null;

    // Calculate next expected date
    const nextDueDate = calculateNextDueDate(lastGenerated, startDate, recurrence.frequency, recurrence.day_of_month);

    // If next due date is after end date, don't generate
    if (endDate && isBefore(endDate, nextDueDate)) return null;

    // If next due date is today or in the past, generate
    if (isBefore(nextDueDate, now) || isSameDay(nextDueDate, now)) {
        return nextDueDate;
    }

    return null;
}
