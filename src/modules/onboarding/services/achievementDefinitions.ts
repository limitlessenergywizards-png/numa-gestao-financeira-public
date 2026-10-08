export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'discipline' | 'growth' | 'consistency' | 'mastery' | 'special';
  xpReward: number;
  condition: {
    type: string;
    value: number;
    period?: 'day' | 'week' | 'month' | 'all_time';
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  // ===== DISCIPLINA =====
  {
    id: 'first_step',
    name: 'Primeiro Passo',
    description: 'Complete o quiz de descoberta do seu arquétipo',
    icon: '🎯',
    category: 'special',
    xpReward: 50,
    condition: { type: 'quiz_completed', value: 1 }
  },
  {
    id: 'guardian_punctual',
    name: 'Guardião Pontual',
    description: '30 dias consecutivos sem atrasos em pagamentos',
    icon: '⏰',
    category: 'discipline',
    xpReward: 200,
    condition: { type: 'days_without_late', value: 30 }
  },
  {
    id: 'zero_default',
    name: 'Zero Inadimplência',
    description: 'Um mês inteiro sem nenhum título em atraso',
    icon: '✨',
    category: 'discipline',
    xpReward: 150,
    condition: { type: 'month_no_late', value: 1 }
  },
  {
    id: 'perfect_week',
    name: 'Semana Perfeita',
    description: '7 dias consecutivos com fluxo positivo',
    icon: '🌟',
    category: 'discipline',
    xpReward: 100,
    condition: { type: 'positive_flow_days', value: 7 }
  },
  {
    id: 'early_payer',
    name: 'Mestre da Pontualidade',
    description: 'Pague 50 títulos antes do vencimento',
    icon: '🏃',
    category: 'discipline',
    xpReward: 175,
    condition: { type: 'early_payments', value: 50 }
  },
  {
    id: 'documentation_master',
    name: 'Fiscal Rigoroso',
    description: 'Mantenha documentação completa por 30 dias',
    icon: '📝',
    category: 'discipline',
    xpReward: 125,
    condition: { type: 'documented_days', value: 30 }
  },

  // ===== CRESCIMENTO =====
  {
    id: 'revenue_growth',
    name: 'Crescimento Constante',
    description: 'Aumente sua receita por 3 meses consecutivos',
    icon: '📈',
    category: 'growth',
    xpReward: 250,
    condition: { type: 'revenue_growth_months', value: 3 }
  },
  {
    id: 'expense_reducer',
    name: 'Mestre da Economia',
    description: 'Reduza despesas em 10% comparado ao mês anterior',
    icon: '💰',
    category: 'growth',
    xpReward: 150,
    condition: { type: 'expense_reduction_percent', value: 10 }
  },
  {
    id: 'first_million',
    name: 'Primeiro Milhão',
    description: 'Processe R$1.000.000 em transações (total)',
    icon: '💎',
    category: 'growth',
    xpReward: 500,
    condition: { type: 'total_transaction_value', value: 1000000 }
  },
  {
    id: 'golden_quarter',
    name: 'Trimestre de Ouro',
    description: '3 meses consecutivos com lucro',
    icon: '🏆',
    category: 'growth',
    xpReward: 300,
    condition: { type: 'profit_months', value: 3 }
  },
  {
    id: 'scaler',
    name: 'Escalador',
    description: 'Dobre seu faturamento em 6 meses',
    icon: '🚀',
    category: 'growth',
    xpReward: 400,
    condition: { type: 'revenue_doubled', value: 6, period: 'month' }
  },

  // ===== CONSISTÊNCIA =====
  {
    id: 'balance_master',
    name: 'Mestre do Balanço',
    description: 'Mantenha fluxo positivo por 3 meses consecutivos',
    icon: '⚖️',
    category: 'consistency',
    xpReward: 300,
    condition: { type: 'positive_flow_months', value: 3 }
  },
  {
    id: 'daily_warrior',
    name: 'Guerreiro Diário',
    description: 'Acesse o sistema por 30 dias consecutivos',
    icon: '🔥',
    category: 'consistency',
    xpReward: 100,
    condition: { type: 'consecutive_logins', value: 30 }
  },
  {
    id: 'weekly_warrior',
    name: 'Maratonista Semanal',
    description: 'Acesse todos os dias por 7 semanas',
    icon: '🏅',
    category: 'consistency',
    xpReward: 200,
    condition: { type: 'consecutive_logins', value: 49 }
  },
  {
    id: 'transaction_tracker',
    name: 'Rastreador Fiel',
    description: 'Registre 100 transações',
    icon: '📊',
    category: 'consistency',
    xpReward: 75,
    condition: { type: 'total_transactions', value: 100 }
  },
  {
    id: 'transaction_master',
    name: 'Registro Impecável',
    description: 'Registre 500 transações',
    icon: '📚',
    category: 'consistency',
    xpReward: 200,
    condition: { type: 'total_transactions', value: 500 }
  },
  {
    id: 'veteran',
    name: 'Veterano',
    description: 'Use o sistema por 90 dias',
    icon: '🎖️',
    category: 'consistency',
    xpReward: 150,
    condition: { type: 'account_age_days', value: 90 }
  },

  // ===== MAESTRIA =====
  {
    id: 'diversifier',
    name: 'Diversificador',
    description: 'Utilize 5 ou mais categorias de receita',
    icon: '🌈',
    category: 'mastery',
    xpReward: 100,
    condition: { type: 'revenue_categories', value: 5 }
  },
  {
    id: 'visionary',
    name: 'Visionário',
    description: 'Faça 10 projeções de fluxo de caixa',
    icon: '🔮',
    category: 'mastery',
    xpReward: 125,
    condition: { type: 'projections_made', value: 10 }
  },
  {
    id: 'report_master',
    name: 'Mestre dos Relatórios',
    description: 'Gere 20 relatórios diferentes',
    icon: '📋',
    category: 'mastery',
    xpReward: 100,
    condition: { type: 'reports_generated', value: 20 }
  },
  {
    id: 'report_expert',
    name: 'Exportador Pro',
    description: 'Exporte 50 relatórios',
    icon: '📤',
    category: 'mastery',
    xpReward: 150,
    condition: { type: 'reports_generated', value: 50 }
  },
  {
    id: 'dre_analyst',
    name: 'Analista Expert',
    description: 'Consulte o DRE 30 vezes',
    icon: '📉',
    category: 'mastery',
    xpReward: 125,
    condition: { type: 'dre_views', value: 30 }
  },
  {
    id: 'cashflow_master',
    name: 'Mestre do Fluxo',
    description: 'Consulte o fluxo de caixa 50 vezes',
    icon: '💹',
    category: 'mastery',
    xpReward: 125,
    condition: { type: 'cashflow_views', value: 50 }
  },

  // ===== ESPECIAIS =====
  {
    id: 'first_insight',
    name: 'Primeiro Insight',
    description: 'Receba sua primeira análise de IA',
    icon: '🤖',
    category: 'special',
    xpReward: 30,
    condition: { type: 'ai_insights', value: 1 }
  },
  {
    id: 'explorer_complete',
    name: 'Explorador Completo',
    description: 'Visite todas as páginas do sistema',
    icon: '🗺️',
    category: 'special',
    xpReward: 50,
    condition: { type: 'pages_visited', value: 10 }
  },
  {
    id: 'level_5',
    name: 'Especialista Financeiro',
    description: 'Alcance o nível 5 na sua jornada',
    icon: '⭐',
    category: 'special',
    xpReward: 0,
    condition: { type: 'level_reached', value: 5 }
  },
  {
    id: 'level_10',
    name: 'Guardião Supremo',
    description: 'Alcance o nível máximo: 10',
    icon: '👑',
    category: 'special',
    xpReward: 500,
    condition: { type: 'level_reached', value: 10 }
  },
  {
    id: 'first_month',
    name: 'Primeira Lua',
    description: 'Complete seu primeiro mês usando o sistema',
    icon: '🌙',
    category: 'special',
    xpReward: 50,
    condition: { type: 'account_age_days', value: 30 }
  },
  {
    id: 'mission_streak_3',
    name: 'Missões em Série',
    description: 'Complete 3 missões no mesmo dia',
    icon: '🎯',
    category: 'special',
    xpReward: 40,
    condition: { type: 'daily_missions_completed', value: 3, period: 'day' }
  },
  {
    id: 'mission_master',
    name: 'Mestre das Missões',
    description: 'Complete 50 missões',
    icon: '🏹',
    category: 'special',
    xpReward: 150,
    condition: { type: 'total_missions_completed', value: 50 }
  }
];

export const GUARDIAN_LEVELS = [
  { level: 1, title: 'Aprendiz Financeiro', xpRequired: 0 },
  { level: 2, title: 'Iniciado', xpRequired: 100 },
  { level: 3, title: 'Praticante', xpRequired: 300 },
  { level: 4, title: 'Adepto', xpRequired: 600 },
  { level: 5, title: 'Especialista', xpRequired: 1000 },
  { level: 6, title: 'Expert', xpRequired: 1500 },
  { level: 7, title: 'Mestre', xpRequired: 2500 },
  { level: 8, title: 'Grão-Mestre', xpRequired: 4000 },
  { level: 9, title: 'Lenda', xpRequired: 6000 },
  { level: 10, title: 'Guardião Supremo', xpRequired: 10000 }
];

export function getLevelFromXP(xp: number): { level: number; title: string; progress: number; nextLevelXP: number } {
  let currentLevel = GUARDIAN_LEVELS[0];
  let nextLevel = GUARDIAN_LEVELS[1];
  
  for (let i = GUARDIAN_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= GUARDIAN_LEVELS[i].xpRequired) {
      currentLevel = GUARDIAN_LEVELS[i];
      nextLevel = GUARDIAN_LEVELS[i + 1] || GUARDIAN_LEVELS[i];
      break;
    }
  }
  
  const xpInCurrentLevel = xp - currentLevel.xpRequired;
  const xpNeededForNext = nextLevel.xpRequired - currentLevel.xpRequired;
  const progress = xpNeededForNext > 0 ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;
  
  return {
    level: currentLevel.level,
    title: currentLevel.title,
    progress: Math.min(progress, 100),
    nextLevelXP: nextLevel.xpRequired
  };
}
