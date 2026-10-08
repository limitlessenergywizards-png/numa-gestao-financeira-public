'use client';

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseXMLFile, XMLParseResult, XMLEntry, AccountMapping } from "@/lib/xmlParser";

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: "receita" | "despesa" | "custo";
}

interface ImportData {
  companyId: string;
  period: { year: number; month: number };
  entries: Array<{
    xmlEntry: XMLEntry;
    chartAccountId: string;
  }>;
}

interface UseXMLImportReturn {
  parseXML: (file: File) => Promise<XMLParseResult>;
  fetchChartAccounts: (companyId: string) => Promise<ChartAccount[]>;
  suggestMappings: (entries: XMLEntry[], accounts: ChartAccount[]) => AccountMapping[];
  importToDatabase: (data: ImportData) => Promise<boolean>;
  isProcessing: boolean;
  progress: number;
  parseResult: XMLParseResult | null;
  chartAccounts: ChartAccount[];
  mappings: AccountMapping[];
  setMappings: React.Dispatch<React.SetStateAction<AccountMapping[]>>;
  reset: () => void;
}

export function useXMLImport(): UseXMLImportReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parseResult, setParseResult] = useState<XMLParseResult | null>(null);
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const [mappings, setMappings] = useState<AccountMapping[]>([]);

  const parseXML = useCallback(async (file: File): Promise<XMLParseResult> => {
    setIsProcessing(true);
    setProgress(10);

    try {
      const result = await parseXMLFile(file);
      setProgress(50);
      setParseResult(result);
      setProgress(100);
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const fetchChartAccounts = useCallback(async (companyId: string): Promise<ChartAccount[]> => {
    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("id, code, name, type")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("code");

      if (error) throw error;

      const accounts = (data || []).map((acc) => ({
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type as "receita" | "despesa" | "custo",
      }));

      setChartAccounts(accounts);
      return accounts;
    } catch (error) {
      console.error("Error fetching chart of accounts:", error);
      toast.error("Erro ao carregar plano de contas");
      return [];
    }
  }, []);

  const suggestMappings = useCallback(
    (entries: XMLEntry[], accounts: ChartAccount[]): AccountMapping[] => {
      return entries.map((entry) => {
        // Try to find matching account by type and name similarity
        const typeMatches = accounts.filter((acc) => acc.type === entry.type);

        // Try exact code match first
        let bestMatch = typeMatches.find(
          (acc) => acc.code === entry.code || acc.code.startsWith(entry.code)
        );

        // If no exact match, try name similarity
        if (!bestMatch && entry.suggestedAccount) {
          const suggestedLower = entry.suggestedAccount.toLowerCase();
          bestMatch = typeMatches.find((acc) =>
            acc.name.toLowerCase().includes(suggestedLower) ||
            suggestedLower.includes(acc.name.toLowerCase())
          );
        }

        // If still no match, try description keywords
        if (!bestMatch) {
          const descLower = entry.description.toLowerCase();
          bestMatch = typeMatches.find((acc) => {
            const nameLower = acc.name.toLowerCase();
            return (
              nameLower.includes(descLower) ||
              descLower.includes(nameLower) ||
              // Common keywords
              (descLower.includes("venda") && nameLower.includes("venda")) ||
              (descLower.includes("serviço") && nameLower.includes("serviço")) ||
              (descLower.includes("custo") && nameLower.includes("custo")) ||
              (descLower.includes("despesa") && nameLower.includes("despesa")) ||
              (descLower.includes("salário") && nameLower.includes("pessoal")) ||
              (descLower.includes("aluguel") && nameLower.includes("aluguel"))
            );
          });
        }

        // Fallback to first account of same type
        if (!bestMatch && typeMatches.length > 0) {
          bestMatch = typeMatches[0];
        }

        return {
          xmlCode: entry.code,
          chartAccountId: bestMatch?.id || "",
          chartAccountName: bestMatch?.name || "Não mapeado",
        };
      });
    },
    []
  );

  const importToDatabase = useCallback(
    async (data: ImportData): Promise<boolean> => {
      setIsProcessing(true);
      setProgress(0);

      try {
        const totalEntries = data.entries.length;
        let processed = 0;
        let errors = 0;

        for (const entry of data.entries) {
          if (!entry.chartAccountId) {
            processed++;
            setProgress(Math.round((processed / totalEntries) * 100));
            continue;
          }

          // Create transaction for each entry
          const isRevenue = entry.xmlEntry.type === "receita";

          // For receivables (revenue)
          if (isRevenue) {
            // Get or create a generic customer
            const { data: customers, error: fetchError } = await supabase
              .from("customers")
              .select("id")
              .eq("company_id", data.companyId)
              .eq("name", "Cliente Importação XML")
              .limit(1);

            if (fetchError) throw fetchError;

            let customerId = customers?.[0]?.id;

            if (!customerId) {
              const { data: newCustomer, error: customerError } = await supabase
                .from("customers")
                .insert({
                  company_id: data.companyId,
                  name: "Cliente Importação XML",
                  notes: "Cliente criado automaticamente para importação de XML",
                })
                .select("id")
                .single();

              if (customerError) throw customerError;
              customerId = newCustomer?.id;
            }

            if (customerId) {
              const { error: receivableError } = await supabase.from("receivables").insert({
                company_id: data.companyId,
                customer_id: customerId,
                chart_account_id: entry.chartAccountId,
                description: entry.xmlEntry.description,
                total_amount: entry.xmlEntry.value,
                due_date: `${data.period.year}-${String(data.period.month).padStart(2, "0")}-15`,
                issue_date: `${data.period.year}-${String(data.period.month).padStart(2, "0")}-01`,
                status: "pago",
                paid_amount: entry.xmlEntry.value,
              });

              if (receivableError) {
                console.error("Erro ao inserir receivable:", receivableError);
                errors++;
              }
            }
          } else {
            // For payables (costs/expenses)
            // Get or create a generic supplier
            const { data: suppliers, error: fetchError } = await supabase
              .from("suppliers")
              .select("id")
              .eq("company_id", data.companyId)
              .eq("name", "Fornecedor Importação XML")
              .limit(1);

            if (fetchError) throw fetchError;

            let supplierId = suppliers?.[0]?.id;

            if (!supplierId) {
              const { data: newSupplier, error: supplierError } = await supabase
                .from("suppliers")
                .insert({
                  company_id: data.companyId,
                  name: "Fornecedor Importação XML",
                  notes: "Fornecedor criado automaticamente para importação de XML",
                })
                .select("id")
                .single();

              if (supplierError) throw supplierError;
              supplierId = newSupplier?.id;
            }

            if (supplierId) {
              const { error: payableError } = await supabase.from("payables").insert({
                company_id: data.companyId,
                supplier_id: supplierId,
                chart_account_id: entry.chartAccountId,
                description: entry.xmlEntry.description,
                total_amount: entry.xmlEntry.value,
                due_date: `${data.period.year}-${String(data.period.month).padStart(2, "0")}-15`,
                issue_date: `${data.period.year}-${String(data.period.month).padStart(2, "0")}-01`,
                status: "pago",
                paid_amount: entry.xmlEntry.value,
              });

              if (payableError) {
                console.error("Erro ao inserir payable:", payableError);
                errors++;
              }
            }
          }

          processed++;
          setProgress(Math.round((processed / totalEntries) * 100));
        }

        const imported = totalEntries - errors;
        if (errors === 0) {
          toast.success(`${totalEntries} lançamentos importados com sucesso!`);
        } else if (imported > 0) {
          toast.warning(`${imported} de ${totalEntries} lançamentos importados. ${errors} falharam.`);
        } else {
          toast.error(`Nenhum lançamento foi importado. Verifique suas permissões.`);
          return false;
        }
        return true;
      } catch (error) {
        console.error("Error importing data:", error);
        toast.error("Erro ao importar dados");
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setParseResult(null);
    setChartAccounts([]);
    setMappings([]);
    setProgress(0);
    setIsProcessing(false);
  }, []);

  return {
    parseXML,
    fetchChartAccounts,
    suggestMappings,
    importToDatabase,
    isProcessing,
    progress,
    parseResult,
    chartAccounts,
    mappings,
    setMappings,
    reset,
  };
}
