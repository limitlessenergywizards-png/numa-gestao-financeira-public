'use client';

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DREBudgetItem {
  id: string;
  company_id: string;
  period_year: number;
  period_month: number;
  category_code: string;
  category_name: string;
  budgeted_value: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetComparison {
  category_code: string;
  category_name: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: "on_track" | "warning" | "critical" | "positive";
}

export function useDREBudget(companyId: string | undefined, year: number, month: number) {
  const { user } = useAuth();
  const [budgetItems, setBudgetItems] = useState<DREBudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBudget = useCallback(async () => {
    if (!companyId) {
      setBudgetItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("dre_budget")
        .select("id, company_id, period_year, period_month, category_code, category_name, budgeted_value, created_by, created_at, updated_at")
        .eq("company_id", companyId)
        .eq("period_year", year)
        .eq("period_month", month)
        .order("category_code");

      if (error) throw error;
      setBudgetItems(data || []);
    } catch (error) {
      console.error("Error fetching budget:", error);
      toast.error("Erro ao carregar orçamento");
    } finally {
      setIsLoading(false);
    }
  }, [companyId, year, month]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const saveBudgetItem = async (item: Omit<DREBudgetItem, "id" | "created_at" | "updated_at">) => {
    if (!user) return;

    try {
      // Check if item already exists
      const { data: existing } = await supabase
        .from("dre_budget")
        .select("id")
        .eq("company_id", item.company_id)
        .eq("period_year", item.period_year)
        .eq("period_month", item.period_month)
        .eq("category_code", item.category_code)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("dre_budget")
          .update({ budgeted_value: item.budgeted_value })
          .eq("id", existing.id)
          .eq("company_id", item.company_id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("dre_budget")
          .insert({
            ...item,
            created_by: user.id,
          });

        if (error) throw error;
      }

      await fetchBudget();
      toast.success("Orçamento salvo com sucesso");
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Erro ao salvar orçamento");
    }
  };

  const saveBulkBudget = async (items: Omit<DREBudgetItem, "id" | "created_at" | "updated_at">[]) => {
    if (!user || items.length === 0) return;

    try {
      // Soft delete existing budget items for this period
      await supabase
        .from("dre_budget")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deletion_reason: 'Substituído por orçamento em massa',
        })
        .eq("company_id", items[0].company_id)
        .eq("period_year", items[0].period_year)
        .eq("period_month", items[0].period_month);

      // Insert all new items
      const { error } = await supabase
        .from("dre_budget")
        .insert(
          items.map((item) => ({
            ...item,
            created_by: user.id,
          }))
        );

      if (error) throw error;

      await fetchBudget();
      toast.success(`${items.length} itens de orçamento salvos`);
    } catch (error) {
      console.error("Error saving bulk budget:", error);
      toast.error("Erro ao salvar orçamento");
    }
  };

  const deleteBudgetItem = async (id: string) => {
    if (!companyId) return;
    try {
      const { error } = await supabase.from("dre_budget").update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deletion_reason: 'Excluído pelo usuário',
      }).eq("id", id).eq("company_id", companyId);
      if (error) throw error;
      await fetchBudget();
      toast.success("Item de orçamento removido");
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error("Erro ao remover orçamento");
    }
  };

  const copyFromPreviousPeriod = async (fromYear: number, fromMonth: number) => {
    if (!companyId || !user) return;

    try {
      const { data: previousBudget, error } = await supabase
        .from("dre_budget")
        .select("id, company_id, period_year, period_month, category_code, category_name, budgeted_value, created_by, created_at, updated_at")
        .eq("company_id", companyId)
        .eq("period_year", fromYear)
        .eq("period_month", fromMonth);

      if (error) throw error;

      if (!previousBudget || previousBudget.length === 0) {
        toast.error("Nenhum orçamento encontrado no período anterior");
        return;
      }

      const newItems = previousBudget.map((item) => ({
        company_id: item.company_id,
        period_year: year,
        period_month: month,
        category_code: item.category_code,
        category_name: item.category_name,
        budgeted_value: item.budgeted_value,
      }));

      await saveBulkBudget(newItems);
      toast.success(`${newItems.length} itens copiados do período anterior`);
    } catch (error) {
      console.error("Error copying budget:", error);
      toast.error("Erro ao copiar orçamento");
    }
  };

  const getBudgetForCategory = (categoryCode: string): number => {
    const item = budgetItems.find((b) => b.category_code === categoryCode);
    return item?.budgeted_value || 0;
  };

  const calculateComparison = (
    categoryCode: string,
    categoryName: string,
    actualValue: number
  ): BudgetComparison => {
    const budgeted = getBudgetForCategory(categoryCode);
    const variance = actualValue - budgeted;
    const variancePercent = budgeted !== 0 ? (variance / Math.abs(budgeted)) * 100 : 0;

    // Determine status based on variance
    let status: BudgetComparison["status"];
    const absVariancePercent = Math.abs(variancePercent);

    // For revenues, positive variance is good; for costs/expenses, negative variance is good
    const isRevenue = categoryCode.startsWith("3"); // Revenue codes typically start with 3
    const isPositive = isRevenue ? variance > 0 : variance < 0;

    if (absVariancePercent <= 5) {
      status = "on_track";
    } else if (absVariancePercent <= 15) {
      status = isPositive ? "positive" : "warning";
    } else {
      status = isPositive ? "positive" : "critical";
    }

    return {
      category_code: categoryCode,
      category_name: categoryName,
      budgeted,
      actual: actualValue,
      variance,
      variancePercent,
      status,
    };
  };

  return {
    budgetItems,
    isLoading,
    saveBudgetItem,
    saveBulkBudget,
    deleteBudgetItem,
    copyFromPreviousPeriod,
    getBudgetForCategory,
    calculateComparison,
    refreshBudget: fetchBudget,
  };
}
