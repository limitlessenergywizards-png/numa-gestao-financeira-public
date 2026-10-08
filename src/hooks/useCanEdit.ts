import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";

/**
 * Hook que centraliza a lógica de permissão de edição.
 * Retorna true se o usuário pode editar dados financeiros da empresa atual.
 * 
 * Permite edição se:
 * - Usuário tem role 'admin' ou 'editor' (permissão global)
 * - OU usuário é o criador (dono) da empresa atual
 */
export function useCanEdit(): boolean {
  const { hasRole, user } = useAuth();
  const { currentCompany } = useCompany();

  // Permissão global por role
  const hasEditRole = hasRole('admin') || hasRole('editor');

  // Permissão por ser dono da empresa
  const isCompanyOwner = Boolean(
    user?.id && 
    currentCompany?.created_by && 
    currentCompany.created_by === user.id
  );

  return hasEditRole || isCompanyOwner;
}
