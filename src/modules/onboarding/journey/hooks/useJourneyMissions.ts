'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { addDays, endOfDay, isAfter } from 'date-fns';

interface Mission {
  id: string;
  mission_type: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  reward_xp: number;
  status: string;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const MISSION_TEMPLATES = [
  // Daily missions
  {
    type: 'register_transactions',
    title: 'Registrar Transações',
    description: 'Registre transações hoje para manter seu fluxo atualizado',
    target: 3,
    xp: 15,
    frequency: 'daily'
  },
  {
    type: 'check_receivables',
    title: 'Verificar Recebíveis',
    description: 'Confira seus títulos a receber pendentes',
    target: 1,
    xp: 10,
    frequency: 'daily'
  },
  {
    type: 'check_payables',
    title: 'Verificar Pagamentos',
    description: 'Revise seus títulos a pagar do período',
    target: 1,
    xp: 10,
    frequency: 'daily'
  },
  {
    type: 'view_cashflow',
    title: 'Consultar Fluxo de Caixa',
    description: 'Analise seu fluxo de caixa para tomar melhores decisões',
    target: 1,
    xp: 10,
    frequency: 'daily'
  },
  {
    type: 'view_dre',
    title: 'Analisar DRE',
    description: 'Consulte seu demonstrativo de resultados',
    target: 1,
    xp: 15,
    frequency: 'daily'
  },
  {
    type: 'export_report',
    title: 'Exportar Relatório',
    description: 'Exporte um relatório para análise externa',
    target: 1,
    xp: 20,
    frequency: 'daily'
  },
  // Weekly missions
  {
    type: 'week_positive_balance',
    title: 'Semana Positiva',
    description: 'Mantenha saldo positivo durante toda a semana',
    target: 7,
    xp: 50,
    frequency: 'weekly'
  },
  {
    type: 'collect_receivables',
    title: 'Cobrar Pendências',
    description: 'Receba pagamentos de 3 títulos pendentes',
    target: 3,
    xp: 30,
    frequency: 'weekly'
  },
  {
    type: 'reduce_expenses',
    title: 'Economizar 5%',
    description: 'Reduza suas despesas em 5% esta semana',
    target: 1,
    xp: 75,
    frequency: 'weekly'
  },
  // Exploration missions
  {
    type: 'view_journey',
    title: 'Revisar Jornada',
    description: 'Visite sua página de Jornada para acompanhar seu progresso',
    target: 1,
    xp: 10,
    frequency: 'daily'
  },
  {
    type: 'complete_profile',
    title: 'Completar Perfil',
    description: 'Preencha todas as informações do seu perfil',
    target: 1,
    xp: 25,
    frequency: 'once'
  },
  {
    type: 'use_ocr',
    title: 'Escanear Documento',
    description: 'Use o scanner OCR para digitalizar um documento',
    target: 1,
    xp: 20,
    frequency: 'daily'
  },
  {
    type: 'add_customer',
    title: 'Cadastrar Cliente',
    description: 'Adicione um novo cliente ao sistema',
    target: 1,
    xp: 15,
    frequency: 'daily'
  },
  {
    type: 'add_supplier',
    title: 'Cadastrar Fornecedor',
    description: 'Adicione um novo fornecedor ao sistema',
    target: 1,
    xp: 15,
    frequency: 'daily'
  },
  {
    type: 'pay_early',
    title: 'Pagamento Antecipado',
    description: 'Pague um título antes do vencimento',
    target: 1,
    xp: 25,
    frequency: 'daily'
  }
];

export function useJourneyMissions() {
  const { user } = useAuth();
  const { currentCompany: selectedCompany } = useCompany();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    if (!user?.id || !selectedCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch active missions
      const { data, error } = await supabase
        .from('daily_missions')
        .select('id, user_id, company_id, mission_type, title, description, target_value, current_value, reward_xp, status, expires_at, completed_at, created_at')
        .eq('user_id', user.id)
        .eq('company_id', selectedCompany.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check for expired missions and update them
      const now = new Date();
      const activeMissions: Mission[] = [];
      
      for (const mission of data || []) {
        if (mission.expires_at && isAfter(now, new Date(mission.expires_at))) {
          // Mark as expired
          await supabase
            .from('daily_missions')
            .update({ status: 'expired' })
            .eq('id', mission.id)
            .eq('user_id', user.id)
            .eq('company_id', selectedCompany!.id);
        } else {
          activeMissions.push(mission);
        }
      }

      setMissions(activeMissions);

      // Generate new missions if needed
      if (activeMissions.length < 3) {
        await generateDailyMissions(3 - activeMissions.length);
      }

    } catch (err) {
      console.error('Error fetching missions:', err);
      setError('Erro ao carregar missões');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedCompany?.id]);

  const generateDailyMissions = async (count: number) => {
    if (!user?.id || !selectedCompany?.id) return;

    try {
      // Get existing mission types to avoid duplicates
      const { data: existingMissions } = await supabase
        .from('daily_missions')
        .select('mission_type')
        .eq('user_id', user.id)
        .eq('company_id', selectedCompany.id)
        .eq('status', 'active');

      const existingTypes = new Set(existingMissions?.map(m => m.mission_type) || []);
      
      // Filter available templates (prefer daily missions)
      const dailyTemplates = MISSION_TEMPLATES.filter(
        t => !existingTypes.has(t.type) && t.frequency === 'daily'
      );
      const weeklyTemplates = MISSION_TEMPLATES.filter(
        t => !existingTypes.has(t.type) && t.frequency === 'weekly'
      );
      
      // Prioritize daily missions, then weekly
      const availableTemplates = [...dailyTemplates, ...weeklyTemplates];
      
      // Shuffle and pick random missions
      const shuffled = availableTemplates.sort(() => Math.random() - 0.5);
      const selectedTemplates = shuffled.slice(0, Math.min(count, shuffled.length));

      const tomorrow = endOfDay(addDays(new Date(), 1));

      const newMissions = selectedTemplates.map(template => ({
        user_id: user.id,
        company_id: selectedCompany.id,
        mission_type: template.type,
        title: template.title,
        description: template.description,
        target_value: template.target,
        current_value: 0,
        reward_xp: template.xp,
        status: 'active',
        expires_at: template.frequency === 'weekly' 
          ? endOfDay(addDays(new Date(), 7)).toISOString()
          : tomorrow.toISOString()
      }));

      if (newMissions.length > 0) {
        const { data, error } = await supabase
          .from('daily_missions')
          .insert(newMissions)
          .select();

        if (error) throw error;

        setMissions(prev => [...prev, ...(data || [])]);
      }

    } catch (err) {
      console.error('Error generating missions:', err);
    }
  };

  const updateMissionProgress = async (missionType: string, increment: number = 1) => {
    if (!user?.id || !selectedCompany?.id) return;

    try {
      // Find active mission of this type
      const mission = missions.find(m => m.mission_type === missionType && m.status === 'active');
      if (!mission) return;

      const newValue = Math.min(mission.current_value + increment, mission.target_value);
      const isCompleted = newValue >= mission.target_value;

      // Update mission
      await supabase
        .from('daily_missions')
        .update({
          current_value: newValue,
          status: isCompleted ? 'completed' : 'active',
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', mission.id)
        .eq('user_id', user.id)
        .eq('company_id', selectedCompany!.id);

      // If completed, add milestone
      if (isCompleted) {
        await supabase.from('journey_milestones').insert({
          user_id: user.id,
          company_id: selectedCompany.id,
          milestone_type: 'mission_complete',
          title: `Missão Completa: ${mission.title}`,
          description: mission.description,
          icon: '✅',
          xp_earned: mission.reward_xp
        });

        // Update user XP
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_xp')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ total_xp: (profile.total_xp || 0) + mission.reward_xp })
            .eq('user_id', user.id);
        }
      }

      // Update local state
      setMissions(prev => prev.map(m => {
        if (m.id === mission.id) {
          return {
            ...m,
            current_value: newValue,
            status: isCompleted ? 'completed' : 'active',
            completed_at: isCompleted ? new Date().toISOString() : null
          };
        }
        return m;
      }).filter(m => m.status === 'active'));

      return { completed: isCompleted, xpEarned: isCompleted ? mission.reward_xp : 0 };

    } catch (err) {
      console.error('Error updating mission:', err);
    }
  };

  const completeMission = async (missionId: string) => {
    if (!user?.id) return;

    try {
      const mission = missions.find(m => m.id === missionId);
      if (!mission) return;

      await supabase
        .from('daily_missions')
        .update({
          status: 'completed',
          current_value: mission.target_value,
          completed_at: new Date().toISOString()
        })
        .eq('id', missionId)
        .eq('user_id', user!.id)
        .eq('company_id', selectedCompany!.id);

      // Add milestone
      await supabase.from('journey_milestones').insert({
        user_id: user.id,
        company_id: selectedCompany?.id,
        milestone_type: 'mission_complete',
        title: `Missão Completa: ${mission.title}`,
        description: mission.description,
        icon: '✅',
        xp_earned: mission.reward_xp
      });

      // Update user XP
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_xp: (profile.total_xp || 0) + mission.reward_xp })
          .eq('user_id', user.id);
      }

      setMissions(prev => prev.filter(m => m.id !== missionId));

      return mission.reward_xp;

    } catch (err) {
      console.error('Error completing mission:', err);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  return {
    missions,
    loading,
    error,
    updateMissionProgress,
    completeMission,
    refetch: fetchMissions
  };
}
