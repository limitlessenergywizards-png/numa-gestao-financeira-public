'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { format, addDays, startOfToday } from "date-fns";
import { getDueStatus } from "@/lib/dateUtils";
import { MAIN_ROUTES } from "@/lib/routes";

export interface Notification {
  id: string;
  type: "overdue" | "due_today" | "due_soon" | "budget_warning" | "budget_critical";
  category: "receivable" | "payable" | "budget";
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  read: boolean;
  link: string;
  entityId: string;
}

export interface BudgetNotification {
  id: string;
  type: "budget_warning" | "budget_critical";
  category: "budget";
  categoryCode: string;
  categoryName: string;
  budgeted: number;
  actual: number;
  variancePercent: number;
  message: string;
  read: boolean;
  link: string;
}

interface NotificationContextType {
  notifications: Notification[];
  budgetNotifications: BudgetNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { currentCompany } = useCompany();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [budgetNotifications, setBudgetNotifications] = useState<BudgetNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("readNotifications");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const fetchBudgetAlerts = useCallback(async () => {
    if (!currentCompany) {
      setBudgetNotifications([]);
      return;
    }

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const { data: budgetData } = await supabase
        .from("dre_budget")
        .select("id, company_id, period_year, period_month, category_code, category_name, budgeted_value, created_by, created_at, updated_at")
        .eq("company_id", currentCompany.id)
        .eq("period_year", year)
        .eq("period_month", month);

      if (!budgetData || budgetData.length === 0) {
        setBudgetNotifications([]);
        return;
      }

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);

      const { data: transactions } = await supabase
        .from("transactions")
        .select(`
          amount, type,
          chart_account:chart_of_accounts(dre_category)
        `)
        .eq("company_id", currentCompany.id)
        .gte("transaction_date", startOfMonth.toISOString().split("T")[0])
        .lte("transaction_date", endOfMonth.toISOString().split("T")[0]);

      const actualsByCategory: Record<string, number> = {};

      interface TransactionWithChartAccount {
        amount: number;
        type: string;
        chart_account: { dre_category: string | null } | null;
      }

      (transactions as TransactionWithChartAccount[] | null)?.forEach((tx) => {
        const category = tx.chart_account?.dre_category || "uncategorized";
        if (!actualsByCategory[category]) {
          actualsByCategory[category] = 0;
        }
        actualsByCategory[category] += tx.type === "entrada" ? tx.amount : -tx.amount;
      });

      const alerts: BudgetNotification[] = [];
      const categoryActuals: Record<string, number> = {
        "3.1": actualsByCategory["receita"] || 0,
        "4.1": Math.abs(actualsByCategory["custo"] || 0),
        "4.2": Math.abs(actualsByCategory["despesa"] || 0),
      };

      budgetData.forEach((budget) => {
        const actual = categoryActuals[budget.category_code] || 0;
        const budgeted = budget.budgeted_value;

        if (budgeted === 0) return;

        const variance = actual - budgeted;
        const variancePercent = (variance / budgeted) * 100;
        const isExpense = budget.category_code.startsWith("4");

        const isBadVariance = isExpense ? variancePercent > 0 : variancePercent < 0;
        const absVariance = Math.abs(variancePercent);

        if (isBadVariance && absVariance >= 10) {
          const type: "budget_warning" | "budget_critical" = absVariance >= 20 ? "budget_critical" : "budget_warning";
          const direction = isExpense
            ? (variancePercent > 0 ? "acima" : "abaixo")
            : (variancePercent < 0 ? "abaixo" : "acima");

          const alertId = `budget-${budget.category_code}-${year}-${month}`;
          alerts.push({
            id: alertId,
            type,
            category: "budget",
            categoryCode: budget.category_code,
            categoryName: budget.category_name,
            budgeted,
            actual,
            variancePercent,
            message: `${budget.category_name} está ${absVariance.toFixed(1)}% ${direction} do orçado`,
            read: false,
            link: `${MAIN_ROUTES.DRE}?tab=orcamento`,
          });
        }
      });

      setBudgetNotifications(alerts);
    } catch (error) {
      console.error("Error fetching budget alerts:", error);
    }
  }, [currentCompany]);

  const fetchNotifications = useCallback(async () => {
    if (!currentCompany) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    const today = startOfToday();
    const sevenDaysFromNow = addDays(today, 7);

    try {
      const { data: receivables } = await supabase
        .from("receivables")
        .select("id, description, total_amount, paid_amount, due_date, customers(name)")
        .eq("company_id", currentCompany.id)
        .eq("is_deleted", false)
        .in("status", ["pendente", "parcial"])
        .lte("due_date", format(sevenDaysFromNow, "yyyy-MM-dd"))
        .order("due_date", { ascending: true });

      const { data: payables } = await supabase
        .from("payables")
        .select("id, description, total_amount, paid_amount, due_date, suppliers(name)")
        .eq("company_id", currentCompany.id)
        .eq("is_deleted", false)
        .in("status", ["pendente", "parcial"])
        .lte("due_date", format(sevenDaysFromNow, "yyyy-MM-dd"))
        .order("due_date", { ascending: true });

      const newNotifications: Notification[] = [];

      interface ReceivableNotificationItem {
        id: string;
        description: string;
        total_amount: number;
        paid_amount: number;
        due_date: string;
        customers: { name: string } | null;
      }

      (receivables as ReceivableNotificationItem[] | null)?.forEach((item) => {
        const remaining = item.total_amount - item.paid_amount;
        const { status, daysInfo } = getDueStatus(item.due_date);

        if (status === 'future') return;

        newNotifications.push({
          id: `receivable-${item.id}`,
          type: status,
          category: "receivable",
          title: item.customers?.name || item.description,
          description: `R$ ${remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ${daysInfo}`,
          amount: remaining,
          dueDate: item.due_date,
          read: readNotifications.has(`receivable-${item.id}`),
          link: "/contas-receber",
          entityId: item.id,
        });
      });

      interface PayableNotificationItem {
        id: string;
        description: string;
        total_amount: number;
        paid_amount: number;
        due_date: string;
        suppliers: { name: string } | null;
      }

      (payables as PayableNotificationItem[] | null)?.forEach((item) => {
        const remaining = item.total_amount - item.paid_amount;
        const { status, daysInfo } = getDueStatus(item.due_date);

        if (status === 'future') return;

        newNotifications.push({
          id: `payable-${item.id}`,
          type: status,
          category: "payable",
          title: item.suppliers?.name || item.description,
          description: `R$ ${remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ${daysInfo}`,
          amount: remaining,
          dueDate: item.due_date,
          read: readNotifications.has(`payable-${item.id}`),
          link: "/financeiro/contas-pagar",
          entityId: item.id,
        });
      });

      newNotifications.sort((a, b) => {
        const typeOrder = { overdue: 0, due_today: 1, due_soon: 2 };
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setNotifications(newNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany]); // Removed readNotifications to avoid unnecessary refetches

  const fetchAllNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Fetch notifications when company changes
  useEffect(() => {
    fetchAllNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany?.id]); // Only re-fetch when company changes

  // Fetch budget alerts independently - only when company changes
  useEffect(() => {
    if (currentCompany?.id) {
      fetchBudgetAlerts();
    }
  }, [currentCompany?.id, fetchBudgetAlerts]);

  useEffect(() => {
    localStorage.setItem("readNotifications", JSON.stringify([...readNotifications]));
  }, [readNotifications]);

  // Sync read status for budget notifications without refetching data
  useEffect(() => {
    setBudgetNotifications((prev) =>
      prev.map((alert) => ({
        ...alert,
        read: readNotifications.has(alert.id),
      }))
    );
  }, [readNotifications]);

  const markAsRead = useCallback((id: string) => {
    setReadNotifications((prev) => new Set([...prev, id]));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setBudgetNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const ids = prev.map((n) => n.id);
      setReadNotifications((prevRead) => new Set([...prevRead, ...ids]));
      return prev.map((n) => ({ ...n, read: true }));
    });
    setBudgetNotifications((prev) => {
      const ids = prev.map((n) => n.id);
      setReadNotifications((prevRead) => new Set([...prevRead, ...ids]));
      return prev.map((n) => ({ ...n, read: true }));
    });
  }, []);

  const unreadCount = useMemo(() =>
    notifications.filter((n) => !n.read).length +
    budgetNotifications.filter((n) => !n.read).length,
    [notifications, budgetNotifications]
  );

  const contextValue = useMemo(() => ({
    notifications,
    budgetNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchAllNotifications,
    isLoading,
  }), [notifications, budgetNotifications, unreadCount, markAsRead, markAllAsRead, fetchAllNotifications, isLoading]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Primary hook
// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

// Derived hooks for backwards compatibility
// eslint-disable-next-line react-refresh/only-export-components
export function useNotificationData() {
  const { notifications, budgetNotifications } = useNotifications();
  return { notifications, budgetNotifications };
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotificationActions() {
  const { markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  return { markAsRead, markAllAsRead, refreshNotifications };
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotificationCount() {
  const { unreadCount, isLoading } = useNotifications();
  return { unreadCount, isLoading };
}
