'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";

const supabase = createClient();
import {
  useUserContext,
  UserProfile,
  AppRole,
  CompanyAssociation,
  clearAllCaches
} from "@/hooks/useUserContext";
import { AUTH_LOADING_TIMEOUT_MS } from "@/lib/constants";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  job_title: string | null;
}

interface UserRole {
  role: "admin" | "editor" | "viewer";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  companies: CompanyAssociation[];
  defaultCompanyId: string | null;
  isLoading: boolean;
  isFromCache: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  hasRole: (role: "admin" | "editor" | "viewer") => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  refreshUserContext: () => Promise<void>;
}

interface AuthStateContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  companies: CompanyAssociation[];
  defaultCompanyId: string | null;
  isLoading: boolean;
  isAuthReady: boolean;
  isFromCache: boolean;
  hasRole: (role: "admin" | "editor" | "viewer") => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

interface AuthActionsContextType {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  hasRole: (role: "admin" | "editor" | "viewer") => boolean;
  refreshUserContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AuthStateContext = createContext<AuthStateContextType | undefined>(undefined);
const AuthActionsContext = createContext<AuthActionsContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialSession?: Session | null;
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [session, setSession] = useState<Session | null>(initialSession ?? null);
  const [isAuthLoading, setIsAuthLoading] = useState(!initialSession);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  // Use the unified user context hook
  const {
    profile: userContextProfile,
    roles: userContextRoles,
    companies,
    defaultCompanyId,
    isLoading: isContextLoading,
    isFromCache,
    refresh: refreshUserContext,
    invalidateUserCache,
  } = useUserContext(user?.id ?? null);

  // Transform profile to match existing interface (memoized to prevent cascading re-renders)
  const profile: Profile | null = useMemo(() => userContextProfile ? {
    id: userContextProfile.id,
    user_id: userContextProfile.user_id,
    full_name: userContextProfile.full_name,
    avatar_url: userContextProfile.avatar_url,
    phone: userContextProfile.phone,
    whatsapp_number: userContextProfile.whatsapp_number,
    job_title: userContextProfile.job_title,
  } : null, [userContextProfile]);

  // Transform roles to match existing interface
  const roles: UserRole[] = userContextRoles.map(role => ({ role }));

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // Always mark auth as loaded after any state change
        setIsAuthLoading(false);
      }
    );

    // Check for existing session — skip if server already provided one
    if (!initialSession) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthLoading(false);
      }).catch(() => {
        // If getSession fails, still stop loading so the page renders
        setIsAuthLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- initialSession is only used on mount
  }, []);

  // Safety timeout: if user context RPC hangs, unblock the UI after 8s
  useEffect(() => {
    if (!isAuthLoading && isContextLoading) {
      const timer = setTimeout(() => setAuthTimedOut(true), AUTH_LOADING_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }
  }, [isAuthLoading, isContextLoading]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    // Clear all caches before signing out
    clearAllCaches();

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!user) return { error: new Error("Usuário não autenticado") };

    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("user_id", user.id);

    if (!error) {
      // Invalidate cache and refresh
      invalidateUserCache();
      await refreshUserContext();
    }

    return { error };
  }, [user, invalidateUserCache, refreshUserContext]);

  const hasRole = useCallback((role: "admin" | "editor" | "viewer") => {
    // Check global user_roles first
    if (roles.some((r) => r.role === role)) return true;
    // Fallback: check company-level role from user_companies
    // (users who own/manage a company have role in user_companies but may only have 'viewer' in user_roles)
    return companies.some((c) => c.role === role);
  }, [roles, companies]);

  const isAdmin = hasRole("admin");
  // isSuperAdmin: only global user_roles, NOT company-level roles
  const isSuperAdmin = roles.some((r) => r.role === "admin");
  const isLoading = isAuthLoading || (isContextLoading && !authTimedOut);
  const isAuthReady = !isAuthLoading;

  const stateValue = useMemo(() => ({
    user, session, profile, roles, companies, defaultCompanyId, isLoading, isAuthReady, isFromCache, hasRole, isAdmin, isSuperAdmin,
  }), [user, session, profile, roles, companies, defaultCompanyId, isLoading, isAuthReady, isFromCache, hasRole, isAdmin, isSuperAdmin]);

  const actionsValue = useMemo(() => ({
    signIn, signUp, signOut, updateProfile, hasRole, refreshUserContext,
  }), [signIn, signUp, signOut, updateProfile, hasRole, refreshUserContext]);

  const combinedValue = useMemo(() => ({
    ...stateValue,
    ...actionsValue,
  }), [stateValue, actionsValue]);

  return (
    <AuthContext.Provider value={combinedValue}>
      <AuthStateContext.Provider value={stateValue}>
        <AuthActionsContext.Provider value={actionsValue}>
          {children}
        </AuthActionsContext.Provider>
      </AuthStateContext.Provider>
    </AuthContext.Provider>
  );
}

// Legacy combined hook (backwards compatible)
/**
 * @deprecated Prefer `useAuthState()` for read-only access or `useAuthActions()` for sign-out/refresh.
 * This combined hook causes re-renders on both state and action changes.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// State-only hook — reads from dedicated AuthStateContext (no re-render on action changes)
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error("useAuthState must be used within an AuthProvider");
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthActions() {
  const context = useContext(AuthActionsContext);
  if (context === undefined) {
    throw new Error("useAuthActions must be used within an AuthProvider");
  }
  return context;
}
