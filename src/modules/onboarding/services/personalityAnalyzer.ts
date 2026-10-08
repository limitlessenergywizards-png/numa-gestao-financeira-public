export interface ArchetypeInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  phrase: string;
  description: string;
  strengths: string[];
}

export const ARCHETYPES: Record<string, ArchetypeInfo> = {
  strategist: {
    id: 'strategist',
    name: 'O Estrategista',
    icon: '♟️',
    color: 'hsl(220, 70%, 50%)',
    gradient: 'from-blue-600 to-indigo-800',
    phrase: 'Cada movimento é calculado, cada decisão é uma vitória.',
    description: 'Você possui uma mente analítica aguçada. Antes de cada passo, você pondera as consequências. Seu domínio está no planejamento meticuloso e na antecipação de cenários.',
    strengths: ['Previsibilidade', 'Organização', 'Antecipação', 'Análise de Riscos']
  },
  explorer: {
    id: 'explorer',
    name: 'O Desbravador',
    icon: '🧭',
    color: 'hsl(25, 90%, 55%)',
    gradient: 'from-orange-500 to-amber-600',
    phrase: 'O risco calculado é o caminho para a prosperidade.',
    description: 'Você é movido pela busca constante de crescimento. Onde outros veem perigo, você enxerga oportunidade. Sua força está na ação e na capacidade de diversificar.',
    strengths: ['Ação Decisiva', 'Diversificação', 'Oportunismo', 'Coragem']
  },
  guardian: {
    id: 'guardian',
    name: 'O Guardião',
    icon: '🛡️',
    color: 'hsl(150, 60%, 45%)',
    gradient: 'from-emerald-500 to-green-700',
    phrase: 'Construir e preservar, pedra sobre pedra.',
    description: 'Você é o protetor do patrimônio. Sua sabedoria está em entender que grandes fortunas são construídas com consistência e paciência, não com pressa.',
    strengths: ['Consistência', 'Segurança', 'Estabilidade', 'Prudência']
  },
  visionary: {
    id: 'visionary',
    name: 'O Visionário',
    icon: '🔭',
    color: 'hsl(280, 70%, 55%)',
    gradient: 'from-purple-600 to-violet-800',
    phrase: 'O futuro pertence a quem o constrói hoje.',
    description: 'Seus olhos estão sempre no horizonte distante. Enquanto outros pensam no próximo mês, você planeja os próximos anos. Sua força é a visão de longo prazo.',
    strengths: ['Investimento', 'Paciência', 'Planejamento', 'Visão Sistêmica']
  },
  balancer: {
    id: 'balancer',
    name: 'O Equilibrista',
    icon: '⚖️',
    color: 'hsl(180, 60%, 45%)',
    gradient: 'from-teal-500 to-cyan-700',
    phrase: 'Na harmonia dos números, encontro a paz.',
    description: 'Você busca o equilíbrio perfeito entre entradas e saídas. Sua sabedoria está em saber que a verdadeira riqueza vem da harmonia, não do excesso.',
    strengths: ['Balanço', 'Adaptação', 'Consciência', 'Flexibilidade']
  }
};

export interface PersonalityDimension {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export const PERSONALITY_DIMENSIONS = [
  { id: 'payment_discipline', name: 'Disciplina de Pagamentos', maxScore: 100 },
  { id: 'revenue_consistency', name: 'Consistência de Receitas', maxScore: 100 },
  { id: 'expense_control', name: 'Controle de Gastos', maxScore: 100 },
  { id: 'strategic_vision', name: 'Visão Estratégica', maxScore: 100 },
  { id: 'financial_resilience', name: 'Resiliência Financeira', maxScore: 100 },
  { id: 'diversification', name: 'Diversificação', maxScore: 100 }
];

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    text: string;
    archetypes: Record<string, number>;
  }[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Quando surge uma oportunidade de investimento inesperada, você geralmente...',
    options: [
      { text: 'Analiso detalhadamente todos os riscos antes de decidir', archetypes: { strategist: 3, guardian: 1 } },
      { text: 'Avalio rapidamente e ajo se parecer promissora', archetypes: { explorer: 3, visionary: 1 } },
      { text: 'Consulto meu plano de longo prazo antes de considerar', archetypes: { visionary: 3, strategist: 1 } },
      { text: 'Verifico como isso afetaria meu equilíbrio financeiro', archetypes: { balancer: 3, guardian: 1 } }
    ]
  },
  {
    id: 'q2',
    question: 'Sua principal preocupação financeira é...',
    options: [
      { text: 'Ter um plano sólido para qualquer cenário', archetypes: { strategist: 3, guardian: 1 } },
      { text: 'Encontrar oportunidades de crescimento', archetypes: { explorer: 3, visionary: 1 } },
      { text: 'Proteger o que já conquistei', archetypes: { guardian: 3, balancer: 1 } },
      { text: 'Manter minhas contas em harmonia', archetypes: { balancer: 3, guardian: 1 } }
    ]
  },
  {
    id: 'q3',
    question: 'Quando você olha para suas finanças daqui a 5 anos, você imagina...',
    options: [
      { text: 'Cada passo calculado até lá', archetypes: { strategist: 3, visionary: 1 } },
      { text: 'Múltiplas fontes de renda diversificadas', archetypes: { explorer: 3, balancer: 1 } },
      { text: 'Um patrimônio sólido e protegido', archetypes: { guardian: 3, balancer: 1 } },
      { text: 'Uma visão grandiosa se concretizando', archetypes: { visionary: 3, explorer: 1 } }
    ]
  },
  {
    id: 'q4',
    question: 'Em momentos de crise financeira, você tende a...',
    options: [
      { text: 'Criar um plano de contingência detalhado', archetypes: { strategist: 3, guardian: 1 } },
      { text: 'Buscar novas oportunidades na adversidade', archetypes: { explorer: 3, visionary: 1 } },
      { text: 'Reduzir riscos e proteger reservas', archetypes: { guardian: 3, balancer: 1 } },
      { text: 'Reequilibrar prioridades e cortar excessos', archetypes: { balancer: 3, strategist: 1 } }
    ]
  },
  {
    id: 'q5',
    question: 'O que mais te motiva a cuidar das finanças?',
    options: [
      { text: 'O prazer de ver um plano bem executado', archetypes: { strategist: 3, visionary: 1 } },
      { text: 'A emoção de ver o patrimônio crescer', archetypes: { explorer: 3, guardian: 1 } },
      { text: 'A tranquilidade de estar seguro', archetypes: { guardian: 3, balancer: 1 } },
      { text: 'A satisfação de ver tudo em equilíbrio', archetypes: { balancer: 3, strategist: 1 } }
    ]
  },
  {
    id: 'q6',
    question: 'Se você pudesse escolher um superpoder financeiro, seria...',
    options: [
      { text: 'Prever cenários futuros com precisão', archetypes: { strategist: 3, visionary: 2 } },
      { text: 'Detectar oportunidades antes de todos', archetypes: { explorer: 3, strategist: 1 } },
      { text: 'Tornar qualquer investimento seguro', archetypes: { guardian: 3, balancer: 1 } },
      { text: 'Equilibrar qualquer situação financeira', archetypes: { balancer: 3, guardian: 1 } }
    ]
  },
  {
    id: 'q7',
    question: 'Quando você atinge uma meta financeira, você...',
    options: [
      { text: 'Já tenho a próxima meta planejada', archetypes: { strategist: 3, visionary: 1 } },
      { text: 'Celebro e busco a próxima conquista', archetypes: { explorer: 3, balancer: 1 } },
      { text: 'Reforço minhas reservas antes de mais', archetypes: { guardian: 3, strategist: 1 } },
      { text: 'Reavalia o equilíbrio geral das finanças', archetypes: { balancer: 3, visionary: 1 } }
    ]
  },
  {
    id: 'q8',
    question: 'Para você, sucesso financeiro significa...',
    options: [
      { text: 'Ter controle total sobre cada aspecto', archetypes: { strategist: 3, guardian: 1 } },
      { text: 'Crescer constantemente e explorar novos horizontes', archetypes: { explorer: 3, visionary: 2 } },
      { text: 'Ter tranquilidade e segurança para o futuro', archetypes: { guardian: 3, balancer: 1 } },
      { text: 'Viver em harmonia com suas necessidades', archetypes: { balancer: 3, visionary: 1 } }
    ]
  }
];

export function calculateArchetype(answers: { questionId: string; optionIndex: number }[]): {
  primary: string;
  scores: Record<string, number>;
} {
  const scores: Record<string, number> = {
    strategist: 0,
    explorer: 0,
    guardian: 0,
    visionary: 0,
    balancer: 0
  };

  answers.forEach(answer => {
    const question = QUIZ_QUESTIONS.find(q => q.id === answer.questionId);
    if (question && question.options[answer.optionIndex]) {
      const archetypeScores = question.options[answer.optionIndex].archetypes;
      Object.entries(archetypeScores).forEach(([archetype, score]) => {
        scores[archetype] = (scores[archetype] || 0) + score;
      });
    }
  });

  const primary = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];

  return { primary, scores };
}

export function analyzeStrengths(archetype: string): string[] {
  const archetypeInfo = ARCHETYPES[archetype];
  if (!archetypeInfo) return [];
  return archetypeInfo.strengths;
}

export function analyzeGrowthAreas(archetype: string): string[] {
  const growthMap: Record<string, string[]> = {
    strategist: ['Flexibilidade', 'Tomada de risco calculado', 'Ação rápida'],
    explorer: ['Paciência', 'Análise aprofundada', 'Reservas de segurança'],
    guardian: ['Abertura a novas oportunidades', 'Crescimento ativo', 'Diversificação'],
    visionary: ['Atenção ao presente', 'Gestão do dia-a-dia', 'Detalhes operacionais'],
    balancer: ['Metas ambiciosas', 'Investimentos de crescimento', 'Tomada de decisão rápida']
  };
  return growthMap[archetype] || [];
}
