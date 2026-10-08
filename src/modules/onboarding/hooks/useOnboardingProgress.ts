 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useCompany } from "@/contexts/CompanyContext";
 import { useAuth } from "@/contexts/AuthContext";
 
 export interface OnboardingProgress {
   id: string;
   company_id: string;
   user_id: string;
   step_empresa: boolean;
   step_contas_bancarias: boolean;
   step_categorias: boolean;
   step_primeiro_lancamento: boolean;
   segment: string | null;
   started_at: string;
   completed_at: string | null;
   skipped_at: string | null;
   created_at: string;
   updated_at: string;
 }
 
 type OnboardingStep = 
   | "step_empresa" 
   | "step_contas_bancarias" 
   | "step_categorias" 
   | "step_primeiro_lancamento";
 
 export function useOnboardingProgress() {
   const { currentCompany } = useCompany();
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const queryKey = ["onboarding-progress", currentCompany?.id, user?.id];
 
   const { data: progress, isLoading } = useQuery({
     queryKey,
     queryFn: async () => {
       if (!currentCompany?.id || !user?.id) return null;
       
       const { data, error } = await supabase
         .from("onboarding_progress")
         .select("id, company_id, user_id, step_empresa, step_contas_bancarias, step_categorias, step_primeiro_lancamento, segment, started_at, completed_at, skipped_at, created_at, updated_at")
         .eq("company_id", currentCompany.id)
         .eq("user_id", user.id)
         .maybeSingle();
 
       if (error) throw error;
       return data as OnboardingProgress | null;
     },
     enabled: !!currentCompany?.id && !!user?.id,
     staleTime: 1000 * 60 * 5, // 5 minutes
   });
 
   const updateStepMutation = useMutation({
     mutationFn: async ({ step, value }: { step: OnboardingStep; value: boolean }) => {
       if (!currentCompany?.id || !user?.id) throw new Error("No company or user");
 
       const { data, error } = await supabase
         .from("onboarding_progress")
         .upsert(
           {
             company_id: currentCompany.id,
             user_id: user.id,
             [step]: value,
             updated_at: new Date().toISOString(),
           },
           { onConflict: "company_id,user_id" }
         )
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey });
     },
   });
 
   const markCompleteMutation = useMutation({
     mutationFn: async () => {
       if (!currentCompany?.id || !user?.id) throw new Error("No company or user");
 
       const { data, error } = await supabase
         .from("onboarding_progress")
         .upsert(
           {
             company_id: currentCompany.id,
             user_id: user.id,
             step_empresa: true,
             step_contas_bancarias: true,
             step_categorias: true,
             step_primeiro_lancamento: true,
             completed_at: new Date().toISOString(),
             updated_at: new Date().toISOString(),
           },
           { onConflict: "company_id,user_id" }
         )
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey });
     },
   });
 
   const markSkippedMutation = useMutation({
     mutationFn: async () => {
       if (!currentCompany?.id || !user?.id) throw new Error("No company or user");
 
       const { data, error } = await supabase
         .from("onboarding_progress")
         .upsert(
           {
             company_id: currentCompany.id,
             user_id: user.id,
             skipped_at: new Date().toISOString(),
             updated_at: new Date().toISOString(),
           },
           { onConflict: "company_id,user_id" }
         )
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey });
     },
   });
 
   const initializeProgressMutation = useMutation({
     mutationFn: async (segment?: string) => {
       if (!currentCompany?.id || !user?.id) throw new Error("No company or user");
 
       const { data, error } = await supabase
         .from("onboarding_progress")
         .upsert(
           {
             company_id: currentCompany.id,
             user_id: user.id,
             segment: segment || null,
             step_empresa: true, // Step 1 is complete when they reach the wizard
             started_at: new Date().toISOString(),
             updated_at: new Date().toISOString(),
           },
           { onConflict: "company_id,user_id" }
         )
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey });
     },
   });
 
   const completedSteps = [
     progress?.step_empresa,
     progress?.step_contas_bancarias,
     progress?.step_categorias,
     progress?.step_primeiro_lancamento,
   ].filter(Boolean).length;
 
   const isComplete = progress?.step_empresa &&
     progress?.step_contas_bancarias &&
     progress?.step_categorias &&
     progress?.step_primeiro_lancamento;
 
   const wasSkipped = !!progress?.skipped_at;
 
   return {
     progress,
     isLoading,
     isComplete,
     wasSkipped,
     completedSteps,
     totalSteps: 4,
     percentage: (completedSteps / 4) * 100,
     updateStep: updateStepMutation.mutate,
     markComplete: markCompleteMutation.mutate,
     markSkipped: markSkippedMutation.mutate,
     initializeProgress: initializeProgressMutation.mutate,
     isUpdating: updateStepMutation.isPending || 
       markCompleteMutation.isPending || 
       markSkippedMutation.isPending ||
       initializeProgressMutation.isPending,
   };
 }