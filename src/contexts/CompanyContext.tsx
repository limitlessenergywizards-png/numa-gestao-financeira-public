'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { CompanyAssociation } from "@/hooks/useUserContext";
import { setCache, CACHE_KEYS, TTL } from "@/lib/sessionCache";

export interface Company {
  id: string;
  name: string;
  trading_name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  logo_url: string | null;
  currency: string;
  currency_symbol: string;
  is_headquarters: boolean;
  parent_company_id: string | null;
  created_by: string | null;
}

interface CompanyContextType {
  companies: Company[];
  currentCompany: Company | null;
  currentCompanyRole: 'admin' | 'editor' | 'viewer' | null;
  isCompanyAdmin: boolean;
  isLoading: boolean;
  setCurrentCompany: (company: Company) => void;
  refreshCompanies: () => Promise<void>;
}

// Split context types
interface CompanyStateContextType {
  companies: Company[];
  currentCompany: Company | null;
  currentCompanyRole: 'admin' | 'editor' | 'viewer' | null;
  isCompanyAdmin: boolean;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);
const CompanyStateContext = createContext<CompanyStateContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, companies: companyAssociations, defaultCompanyId, isLoading: authLoading, refreshUserContext } = useAuth();
  const queryClient = useQueryClient();

  // Derive the current company role from associations
  const currentCompanyAssociations = companyAssociations;
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);

  // FIX: Usar ref para rastrear empresa sem causar re-render
  const currentCompanyIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  // Transform company associations to companies array - memoizado
  const companies = useMemo(() =>
    companyAssociations.map(assoc => assoc.company),
    [companyAssociations]
  );

  // FIX: Removido currentCompany das dependencias para evitar loop infinito
  useEffect(() => {
    if (!user) {
      setCurrentCompanyState(null);
      currentCompanyIdRef.current = null;
      hasInitializedRef.current = false;
      return;
    }

    if (companies.length === 0) {
      setCurrentCompanyState(null);
      currentCompanyIdRef.current = null;
      return;
    }

    // Se ja temos uma empresa valida selecionada, manter
    const currentId = currentCompanyIdRef.current;
    if (currentId && companies.some(c => c.id === currentId)) {
      // Empresa ainda existe na lista, nao precisa mudar
      // Mas se o state nao esta sincronizado, sincronizar
      if (!hasInitializedRef.current) {
        const existingCompany = companies.find(c => c.id === currentId);
        if (existingCompany) {
          setCurrentCompanyState(existingCompany);
          hasInitializedRef.current = true;
        }
      }
      return;
    }

    // Selecionar empresa default ou primeira disponivel
    const defaultCompany = companies.find(c => c.id === defaultCompanyId);
    const selected = defaultCompany || companies[0] || null;

    setCurrentCompanyState(selected);
    currentCompanyIdRef.current = selected?.id || null;
    hasInitializedRef.current = true;
  }, [user, companies, defaultCompanyId]); // FIX: Removido currentCompany

  // FIX: Sincronizar ref quando empresa e alterada manualmente
  // Also remove old company's cached queries to prevent stale data display
  const setCurrentCompany = useCallback((company: Company) => {
    const previousCompanyId = currentCompanyIdRef.current;

    setCurrentCompanyState(company);
    currentCompanyIdRef.current = company.id;

    // Persist for optimistic prefetch on next page load
    setCache(CACHE_KEYS.LAST_COMPANY_ID, company.id, TTL.COMPANIES);

    // Remove old company's financial data from cache to free memory
    if (previousCompanyId && previousCompanyId !== company.id) {
      queryClient.removeQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key.some(
            (segment) => segment === previousCompanyId ||
              (typeof segment === 'object' && segment !== null && 'companyId' in segment && (segment as Record<string, unknown>).companyId === previousCompanyId)
          );
        },
      });
    }
  }, [queryClient]);

  const refreshCompanies = useCallback(async () => {
    await refreshUserContext();
  }, [refreshUserContext]);

  // Derive company role based on current company
  const currentCompanyRole = useMemo(() => {
    if (!currentCompany) return null;
    const assoc = currentCompanyAssociations.find(a => a.company_id === currentCompany.id);
    return (assoc?.role as 'admin' | 'editor' | 'viewer') || null;
  }, [currentCompany, currentCompanyAssociations]);

  // Owner (created_by) is always treated as admin
  const isCompanyAdmin = currentCompanyRole === 'admin' ||
    (currentCompany?.created_by != null && currentCompany.created_by === user?.id);

  const stateValue = useMemo(() => ({
    companies, currentCompany, currentCompanyRole, isCompanyAdmin, isLoading: authLoading,
  }), [companies, currentCompany, currentCompanyRole, isCompanyAdmin, authLoading]);

  const contextValue = useMemo(() => ({
    ...stateValue, setCurrentCompany, refreshCompanies,
  }), [stateValue, setCurrentCompany, refreshCompanies]);

  return (
    <CompanyContext.Provider value={contextValue}>
      <CompanyStateContext.Provider value={stateValue}>
        {children}
      </CompanyStateContext.Provider>
    </CompanyContext.Provider>
  );
}

/**
 * @deprecated Prefer `useCompanyState()` for read-only access or `useCompanyActions()` for mutations.
 * This combined hook causes re-renders on both state and action changes.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}

// Split hooks for optimized consumption
// eslint-disable-next-line react-refresh/only-export-components
export function useCompanyState() {
  const context = useContext(CompanyStateContext);
  if (context === undefined) {
    throw new Error("useCompanyState must be used within a CompanyProvider");
  }
  return context;
}

// Derived actions-only hook (backwards compatible — derives from CompanyContext)
// eslint-disable-next-line react-refresh/only-export-components
export function useCompanyActions() {
  const { setCurrentCompany, refreshCompanies } = useCompany();
  return { setCurrentCompany, refreshCompanies };
}
