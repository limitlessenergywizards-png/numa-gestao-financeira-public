'use client';

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";

export interface CostCenter {
  id: string;
  company_id: string;
  name: string;
  code: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCostCenterData {
  name: string;
  code: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface UpdateCostCenterData {
  name?: string;
  code?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export function useCostCenters() {
  const { currentCompany } = useCompany();
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCostCenters = useCallback(async () => {
    if (!currentCompany?.id) {
      setCostCenters([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("cost_centers")
        .select("id, company_id, name, code, description, color, is_active, created_at, updated_at")
        .eq("company_id", currentCompany.id)
        .order("code", { ascending: true });

      if (error) throw error;
      setCostCenters(data || []);
    } catch (error) {
      console.error("Error fetching cost centers:", error);
      toast.error("Erro ao carregar centros de custo");
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    fetchCostCenters();
  }, [fetchCostCenters]);

  const createCostCenter = async (data: CreateCostCenterData): Promise<CostCenter | null> => {
    if (!currentCompany?.id) {
      toast.error("Nenhuma empresa selecionada");
      return null;
    }

    try {
      const { data: newCostCenter, error } = await supabase
        .from("cost_centers")
        .insert({
          company_id: currentCompany.id,
          name: data.name,
          code: data.code,
          description: data.description || null,
          color: data.color || "#C5A059",
          is_active: data.is_active ?? true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("Código já existe para esta empresa");
        } else {
          throw error;
        }
        return null;
      }

      toast.success("Centro de custo criado com sucesso");
      await fetchCostCenters();
      return newCostCenter;
    } catch (error) {
      console.error("Error creating cost center:", error);
      toast.error("Erro ao criar centro de custo");
      return null;
    }
  };

  const updateCostCenter = async (id: string, data: UpdateCostCenterData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("cost_centers")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", currentCompany!.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("Código já existe para esta empresa");
        } else {
          throw error;
        }
        return false;
      }

      toast.success("Centro de custo atualizado");
      await fetchCostCenters();
      return true;
    } catch (error) {
      console.error("Error updating cost center:", error);
      toast.error("Erro ao atualizar centro de custo");
      return false;
    }
  };

  const deleteCostCenter = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("cost_centers")
        .update({ is_active: false })
        .eq("id", id)
        .eq("company_id", currentCompany!.id);

      if (error) throw error;

      toast.success("Centro de custo excluído");
      await fetchCostCenters();
      return true;
    } catch (error) {
      console.error("Error deleting cost center:", error);
      toast.error("Erro ao excluir centro de custo");
      return false;
    }
  };

  const activeCostCenters = costCenters.filter((cc) => cc.is_active);

  return {
    costCenters,
    activeCostCenters,
    isLoading,
    createCostCenter,
    updateCostCenter,
    deleteCostCenter,
    refetch: fetchCostCenters,
  };
}
