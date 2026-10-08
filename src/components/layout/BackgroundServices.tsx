import { useRecurrenceAutomation } from "@/modules/finance/recurrence/hooks/useRecurrenceAutomation";
import { useFinancialRealtime } from "@/modules/finance/hooks/useFinancialRealtime";
import { usePermissionsRealtime } from "@/hooks/usePermissionsRealtime";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";

/**
 * DeferredServices — Non-critical background services.
 *
 * Loaded lazily AFTER the main UI paints. This prevents
 * recurrence automation and realtime subscriptions from
 * blocking the initial render of authenticated pages.
 *
 * Performance impact: Moves ~8-15 KB of hook logic + Supabase
 * subscription setup out of the critical rendering path.
 *
 * OPTIMIZATION: useFinancialRealtime covers ALL financial tables
 * (transactions, payables, receivables, bank_accounts, payment_records, orcamentos)
 * with company-scoped invalidation, providing realtime coverage app-wide.
 *
 * usePermissionsRealtime subscribes to user_companies + user_roles changes,
 * auto-invalidating the session cache when permissions are modified.
 */
export default function BackgroundServices() {
    const { currentCompany } = useCompany();
    const { user } = useAuth();

    useRecurrenceAutomation();
    useFinancialRealtime(currentCompany?.id);
    usePermissionsRealtime(user?.id ?? null);
    return null;
}
