
import {
  Shield,
  TrendingUp,
  PieChart,
  Clock,
  Award,
  Briefcase,
  Stethoscope,
  Building2,
  Scale,
  Landmark,
  LucideIcon
} from "lucide-react";

export type LandingSegment = 'medicos' | 'advogados' | 'arquitetos' | 'engenheiros' | 'default';

export interface PainPoint {
  icon: string;
  title: string;
  description: string;
}

export interface Argument {
  stat: string;
  description: string;
}

export interface FeatureItem {
  icon?: LucideIcon;
  piece?: unknown; // To avoid circular dependency with ChessPiece
  title: string;
  description: string;
  benefit: string;
  gradientColors?: [string, string];
}

export interface TestimonialItem {
  name: string; // Maps to author
  role: string;
  content: string; // Maps to quote
  avatar: string;
  company?: string;
  rating?: number;
  metric?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface MockupKPI {
  label: string;
  value: string;
  trend: string;
}

export interface MockupLabels {
  kpi1: MockupKPI;
  kpi2: MockupKPI;
  kpi3: MockupKPI;
}

export interface LandingVariantConfig {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    cta: string;
  };
  features?: FeatureItem[];
  testimonials?: TestimonialItem[];
  faqs?: FAQItem[];
  // For segmented pages that might use specific fields
  icon?: LucideIcon;
  painPoints?: string[];
}

export const LANDING_VARIANTS: {
  luxury: LandingVariantConfig;
  segments: Record<LandingSegment, LandingVariantConfig>;
} = {
  luxury: {
    hero: {
      badge: "Exclusividade Financeira",
      title: "Domine suas finanças com elegância estratégica.",
      subtitle: "Uma plataforma feita para quem não aceita menos que a excelência. Controle total, design impecável e insights poderosos.",
      cta: "Solicitar Acesso Exclusivo",
    },
    features: [
      {
        icon: Shield,
        title: "Segurança de Nível Bancário",
        description: "Seus dados protegidos com a mais alta tecnologia de criptografia.",
        benefit: "Proteção total"
      },
      {
        icon: TrendingUp,
        title: "Crescimento Exponencial",
        description: "Ferramentas desenhadas para alavancar seu patrimônio.",
        benefit: "Mais rentabilidade"
      },
      {
        icon: Award,
        title: "Experiência Premium",
        description: "Navegação fluida, suporte prioritário e design sofisticado.",
        benefit: "Suporte VIP"
      }
    ],
    testimonials: [
      {
        name: "Dr. Ricardo Alencar",
        role: "Cirurgião Plástico",
        content: "O Numa elevou a gestão da minha clínica a um novo patamar de sofisticação e clareza.",
        avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150&h=150"
      },
      {
        name: "Renata Vasconcellos",
        role: "Sócia de Escritório de Advocacia",
        content: "Finalmente um sistema financeiro que entende a complexidade do mundo jurídico com simplicidade.",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150"
      }
    ]
  },
  segments: {
    medicos: {
      icon: Stethoscope,
      hero: {
        badge: "Para Médicos e Clínicas",
        title: "Cuide dos seus pacientes. Deixe as finanças com o Numa.",
        subtitle: "Gestão financeira simplificada para quem vive entre plantões e consultórios. Organização automática de receitas e despesas médicas.",
        cta: "Começar Agora",
      },
      painPoints: [
        "Controle de múltiplos plantões",
        "Gestão de recebíveis de convênios",
        "Separação PF x PJ"
      ],
      features: [
        {
          icon: Stethoscope,
          title: "Gestão de Plantões",
          description: "Organize seus recebimentos por hospital, clínica ou plantão. Saiba exatamente quanto tem a receber de cada fonte.",
          benefit: "Previsibilidade de caixa"
        },
        {
          icon: Shield,
          title: "Separação PF e PJ",
          description: "Mantenha suas despesas pessoais e profissionais separadas, facilitando a contabilidade e evitando problemas fiscais.",
          benefit: "Segurança fiscal"
        },
        {
          icon: TrendingUp,
          title: "Relatórios Médicos",
          description: "Visualize a rentabilidade por tipo de procedimento ou convênio. Identifique o que realmente traz retorno para sua clínica.",
          benefit: "Decisões estratégicas"
        }
      ],
      testimonials: [
        {
          name: "Dra. Ana Clara",
          role: "Cardiologista",
          content: "Organizar os recebimentos de diferentes convênios era um pesadelo. Com o Numa, tenho clareza total do que entra e sai.",
          avatar: "AC",
          company: "Clínica Coração",
          rating: 5,
          metric: "Economia de 10h/mês"
        },
        {
          name: "Dr. Lucas Martins",
          role: "Anestesiologista",
          content: "A gestão de múltiplos plantões ficou incrivelmente simples. Consigo prever meu faturamento mensal com precisão.",
          avatar: "LM",
          company: "Autônomo",
          rating: 5,
          metric: "Zero inadimplência"
        }
      ],
      faqs: [
        {
          question: "O Numa serve para quem é autônomo e PJ?",
          answer: "Sim! Você pode gerenciar suas finanças pessoais (PF) e da sua empresa (PJ) em um único lugar, mantendo tudo organizado e separado."
        },
        {
          question: "Consigo controlar recebimentos de convênios?",
          answer: "Com certeza. Você pode categorizar seus recebimentos por convênio e acompanhar o status de cada pagamento, evitando glosas e atrasos."
        },
        {
          question: "É possível emitir o Carnê-Leão?",
          answer: "O Numa facilita a organização para o Carnê-Leão, permitindo exportar relatórios detalhados para seu contador."
        }
      ]
    },
    advogados: {
      icon: Scale,
      hero: {
        badge: "Para Advogados e Escritórios",
        title: "Honorários e despesas processuais sob controle total.",
        subtitle: "O sistema financeiro ideal para escritórios de advocacia que buscam organização, compliance e previsibilidade de caixa.",
        cta: "Otimizar meu Escritório",
      },
      painPoints: [
        "Acompanhamento de honorários sucumbenciais",
        "Rateio de despesas entre sócios",
        "Fluxo de caixa de longo prazo"
      ]
    },
    arquitetos: {
      icon: Building2,
      hero: {
        badge: "Para Arquitetos e Designers",
        title: "Construa um futuro financeiro sólido para seu escritório.",
        subtitle: "Gerencie projetos, orçamentos e fluxo de caixa com a mesma precisão dos seus projetos arquitetônicos.",
        cta: "Ver Planos para Arquitetos",
      },
      painPoints: [
        "Gestão de custos por projeto",
        "Previsibilidade de recebimentos parcelados",
        "Organização de despesas reembolsáveis"
      ]
    },
    engenheiros: {
      icon: Briefcase,
      hero: {
        badge: "Para Engenheiros",
        title: "Engenharia financeira aplicada ao seu negócio.",
        subtitle: "Ferramentas precisas para calcular custos, margens e garantir a rentabilidade de cada obra ou projeto.",
        cta: "Calcular Rentabilidade",
      },
      painPoints: [
        "Orçamentação precisa de obras",
        "Controle de fluxo de caixa de projetos longos",
        "Gestão de compras e fornecedores"
      ]
    },
    default: {
      icon: PieChart,
      hero: {
        badge: "Gestão Inteligente",
        title: "O controle financeiro que sua empresa merece.",
        subtitle: "Simplifique sua gestão, aumente seus lucros e tenha tranquilidade para focar no que realmente importa: seu negócio.",
        cta: "Começar Grátis",
      },
      painPoints: [
        "Fim das planilhas complexas",
        "Clareza total do fluxo de caixa",
        "Previsibilidade financeira"
      ]
    }
  }
};

export function isValidSegment(segment: string): segment is LandingSegment {
  return ['medicos', 'advogados', 'arquitetos', 'engenheiros'].includes(segment);
}