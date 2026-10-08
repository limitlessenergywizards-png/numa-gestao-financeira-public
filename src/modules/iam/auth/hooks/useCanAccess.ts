'use client';

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Role = 'admin' | 'editor' | 'viewer';

/**
 * Hook for component-level role checks.
 * Use to conditionally render buttons, menus, or actions based on user role.
 *
 * @example
 * const { canAccess, isAdmin } = useCanAccess(['admin', 'editor']);
 * {canAccess && <Button onClick={handleDelete}>Excluir</Button>}
 */
export function useCanAccess(roles: Role[]) {
  const { hasRole, isLoading, isAdmin } = useAuth();

  return useMemo(() => ({
    canAccess: isAdmin || roles.some((role) => hasRole(role)),
    isAdmin,
    isLoading,
  }), [hasRole, isAdmin, isLoading, roles]);
}
