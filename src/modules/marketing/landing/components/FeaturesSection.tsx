'use client';

import { useRef } from "react";
import { motion } from "framer-motion";
import { ChessPieceSVG, type ChessPiece, chessGradients } from "./ChessPieceSVG";
import { EnhancedGlassmorphismCard } from "./EnhancedGlassmorphismCard";
import { useMousePosition } from "@/hooks/useParallax";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePrefersReducedMotion } from "@/hooks/useLazyVisible";

import { LucideIcon } from "lucide-react";

export interface FeatureItem {
  piece?: ChessPiece;
  icon?: LucideIcon;
  title: string;
  description: string;
  benefit: string;
  gradientColors?: [string, string];
}

// eslint-disable-next-line react-refresh/only-export-components
export const defaultFeatures: FeatureItem[] = [
  {
    piece: "rook",  // Torre = vigilância, proteção, controle sólido
    title: "Painel de Inadimplência",
    description: "Veja em segundos quem está devendo, há quanto tempo, e quanto impacta seu caixa.",
    benefit: "Redução média de 40% na inadimplência",
    gradientColors: chessGradients.goldBronze,
  },
  {
    piece: "bishop",  // Bispo = alcance diagonal, movimento estratégico, comunicação
    title: "Alertas Automáticos de Cobrança",
    description: "O sistema envia lembretes antes do vencimento e escala a cobrança automaticamente.",
    benefit: "Menos 5h/semana em cobrança manual",
    gradientColors: chessGradients.goldBronze,
  },
  {
    piece: "queen",  // Rainha = visão completa, poder máximo, análise abrangente
    title: "DRE com Margem por Cliente",
    description: "Descubra quais clientes dão lucro e quais estão te dando prejuízo.",
    benefit: "Identifique onde cortar custos",
    gradientColors: chessGradients.goldBronze,
  },
  {
    piece: "knight",  // Cavalo = movimento único, previsão não-linear, antecipação
    title: "Projeção Real vs Otimista",
    description: "Baseado no histórico de pagamento, veja o cenário realista, não a fantasia.",
    benefit: "Planejamento com pés no chão",
    gradientColors: chessGradients.goldBronze,
  },
  {
    piece: "pawn",  // Peão = atenção aos detalhes, base da operação, precisão
    title: "Detecção de Divergências",
    description: "O sistema encontra diferenças entre extrato e lançamentos automaticamente.",
    benefit: "Zero erros de conciliação",
    gradientColors: chessGradients.goldBronze,
  },
  {
    piece: "king",  // Rei = comando central, visão do grupo, proteção do reino
    title: "Alerta Cruzado Multi-Empresa",
    description: "Um cliente devedor em uma empresa? Alerta em todas as suas empresas.",
    benefit: "Proteção total do grupo",
    gradientColors: chessGradients.goldBronze,
  },
];

interface FeaturesSectionProps {
  features?: FeatureItem[];
  title?: React.ReactNode;
  subtitle?: string;
}

export function FeaturesSection({
  features = defaultFeatures,
  title,
  subtitle
}: FeaturesSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const mousePosition = useMousePosition();
  const shouldReduceMotion = isMobile || prefersReducedMotion;

  return (
    <section id="features" className="py-24 md:py-32 lg:py-40 relative overflow-hidden bg-dark-surface" ref={containerRef}>
      {/* Glass orb backgrounds */}
      <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-metallic-500/10 rounded-full blur-[150px] pointer-events-none animate-breathe" />
      <div className="absolute bottom-[10%] right-[15%] w-[350px] h-[350px] bg-metallic-400/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Spotlight effect following mouse - desktop only */}
      {!isMobile && (
        <div
          className="absolute pointer-events-none opacity-30 transition-opacity duration-300"
          style={{
            left: mousePosition.x - 400,
            top: mousePosition.y - 400,
            width: 800,
            height: 800,
            background: "radial-gradient(circle, hsl(var(--metallic-green-400) / 0.2) 0%, transparent 60%)",
          }}
        />
      )}

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-base/50 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:px-12 relative z-10">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.5 }}
          className="text-center mb-12 lg:mb-20"
        >
          <span className="text-metallic-300 font-montserrat font-semibold uppercase tracking-wider text-sm">
            Funcionalidades
          </span>
          {title || (
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-montserrat font-bold text-metallic-50 mt-4 mb-4 lg:mb-6">
              Tudo que você precisa.<br className="hidden sm:block" />
              <span className="text-metallic-300">Sem o que você não quer.</span>
            </h2>
          )}
          <p className="text-metallic-100/60 text-lg lg:text-xl max-w-2xl lg:max-w-3xl mx-auto">
            {subtitle || "Ferramentas práticas que resolvem problemas reais do seu dia a dia"}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              feature={feature}
              index={index}
              reduceMotion={shouldReduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  feature: FeatureItem;
  index: number;
  reduceMotion?: boolean;
}

function FeatureCard({ feature, index, reduceMotion = false }: FeatureCardProps) {
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduceMotion ? 0.2 : 0.5, delay: reduceMotion ? 0 : index * 0.08 }}
      className="group"
    >
      <EnhancedGlassmorphismCard
        variant="elevated"
        specularReflection={true}
        mouseTracking={!reduceMotion}
        glowOnHover={true}
        breathe={false}
        className="h-full p-5 md:p-6 lg:p-8 xl:p-10"
        whileHover={reduceMotion ? undefined : { y: -6 }}
        transition={{ duration: 0.3 }}
      >
        {/* Chess piece icon with glass container */}
        <div className="relative w-16 h-20 md:w-20 md:h-24 lg:w-24 lg:h-28 xl:w-28 xl:h-32 rounded-xl lg:rounded-2xl mb-4 lg:mb-6 xl:mb-8 overflow-visible group-hover:scale-105 transition-transform duration-300">
          {/* Glass background */}
          <div className="absolute inset-x-0 top-0 bottom-4 bg-dark-surface/80 backdrop-blur-xl border border-metallic-600/30 rounded-xl lg:rounded-2xl group-hover:border-metallic-400/50 transition-colors" />

          {/* Glow effect on hover */}
          <div className="absolute inset-x-0 top-0 bottom-4 bg-metallic-400/0 group-hover:bg-metallic-400/10 transition-colors duration-300 rounded-xl lg:rounded-2xl" />

          {/* Pulsing glow behind icon */}
          <div className="absolute inset-x-0 top-0 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 bg-metallic-400/20 blur-xl rounded-full scale-150" />
          </div>

          <motion.div
            whileHover={reduceMotion ? undefined : { rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full h-full flex items-center justify-center pt-2"
          >
            {feature.piece && (
              <ChessPieceSVG
                piece={feature.piece}
                gradientColors={feature.gradientColors || chessGradients.goldBronze}
                className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16"
                showLabel={true}
              />
            )}
            {feature.icon && !feature.piece && (
              <feature.icon
                className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 text-metallic-300"
              />
            )}
          </motion.div>
        </div>

        {/* Content */}
        <h3 className="text-lg md:text-xl lg:text-2xl font-montserrat font-bold text-metallic-50 mb-2 lg:mb-3 group-hover:text-metallic-200 transition-colors">
          {feature.title}
        </h3>
        <p className="text-metallic-100/60 text-sm lg:text-base leading-relaxed mb-4 lg:mb-6">
          {feature.description}
        </p>

        {/* Benefit highlight with glass pill */}
        <div className="mt-auto pt-4 lg:pt-6 border-t border-metallic-600/20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-metallic-500/10 backdrop-blur-sm border border-metallic-600/20 group-hover:border-metallic-400/40 group-hover:bg-metallic-500/15 transition-colors">
            <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-metallic-400 group-hover:shadow-[0_0_8px_rgba(107,166,115,0.5)] transition-shadow" />
            <span className="text-metallic-300 text-sm lg:text-base font-medium">
              {feature.benefit}
            </span>
          </div>
        </div>

        {/* Bottom glow line on hover */}
        <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-metallic-400/0 group-hover:via-metallic-400/50 to-transparent transition-opacity duration-500" />
      </EnhancedGlassmorphismCard>
    </motion.div>
  );
}
